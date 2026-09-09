import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { createApp } from '../src/app.js';

// Same real-database approach as auth.test.js — see that file's header comment.

jest.setTimeout(60000);

let mongod;
let app;
const externalUri = process.env.TEST_MONGODB_URI;

// A valid 1x1 transparent PNG, used to test real file uploads.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

async function registerAndLogin(role, email) {
  const res = await request(app).post('/api/auth/register').send({
    name: `Test ${role}`,
    email,
    password: 'password123',
    role,
  });
  return res.body.token;
}

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-key-not-for-production';
  process.env.JWT_EXPIRES_IN = '1h';

  if (externalUri) {
    await mongoose.connect(externalUri);
  } else {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  }

  app = createApp();
});

afterAll(async () => {
  // Clean up any files multer wrote to the real uploads/ dir during these tests.
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (fs.existsSync(uploadDir)) {
    for (const file of fs.readdirSync(uploadDir)) {
      if (file !== '.gitkeep') fs.unlinkSync(path.join(uploadDir, file));
    }
  }

  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

describe('POST /api/equipment', () => {
  test('seller can create a listing with a real photo upload', async () => {
    const token = await registerAndLogin('seller', 'seller1@example.com');

    const res = await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Cordless Drill')
      .field('description', 'Lightly used, works great')
      .field('category', 'Power tools')
      .field('price', '80')
      .field('listingType', 'rent')
      .attach('photo', TINY_PNG, 'drill.png');

    expect(res.status).toBe(201);
    expect(res.body.equipment.status).toBe('pending');
    expect(res.body.equipment.photoUrl).toMatch(/^\/uploads\/.+\.png$/);
    expect(res.body.equipment.seller).toBeDefined();
  });

  test('listing works without a photo too (photo is optional)', async () => {
    const token = await registerAndLogin('seller', 'seller-nophoto@example.com');

    const res = await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Folding Table')
      .field('description', 'Sturdy plastic table')
      .field('price', '20')
      .field('listingType', 'sale');

    expect(res.status).toBe(201);
    expect(res.body.equipment.photoUrl).toBeNull();
  });

  test('rejects a price above the settings cap', async () => {
    const token = await registerAndLogin('seller', 'seller2@example.com');

    const res = await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Excavator')
      .field('description', 'Way too expensive')
      .field('price', '999999')
      .field('listingType', 'sale');

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/exceeds the current listing cap/i);
  });

  test('rejects missing required fields', async () => {
    const token = await registerAndLogin('seller', 'seller3@example.com');

    const res = await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Incomplete');

    expect(res.status).toBe(400);
  });

  test('renters cannot create listings', async () => {
    const token = await registerAndLogin('renter', 'renter1@example.com');

    const res = await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Not allowed')
      .field('description', 'x')
      .field('price', '10')
      .field('listingType', 'rent');

    expect(res.status).toBe(403);
  });

  test('unauthenticated requests are rejected', async () => {
    const res = await request(app)
      .post('/api/equipment')
      .field('title', 'x')
      .field('description', 'x')
      .field('price', '10')
      .field('listingType', 'rent');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/equipment/mine', () => {
  test('returns only the logged-in seller\'s own listings, any status', async () => {
    const tokenA = await registerAndLogin('seller', 'sellerA@example.com');
    const tokenB = await registerAndLogin('seller', 'sellerB@example.com');

    await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${tokenA}`)
      .field('title', 'A1')
      .field('description', 'x')
      .field('price', '10')
      .field('listingType', 'rent');

    await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${tokenB}`)
      .field('title', 'B1')
      .field('description', 'x')
      .field('price', '10')
      .field('listingType', 'rent');

    const res = await request(app)
      .get('/api/equipment/mine')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.equipment).toHaveLength(1);
    expect(res.body.equipment[0].title).toBe('A1');
  });
});

describe('PATCH /api/equipment/:id and DELETE /api/equipment/:id', () => {
  async function createListing(token, overrides = {}) {
    const res = await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${token}`)
      .field('title', overrides.title || 'Original title')
      .field('description', overrides.description || 'Original description')
      .field('price', String(overrides.price ?? 50))
      .field('listingType', overrides.listingType || 'rent');
    return res.body.equipment;
  }

  test('seller can edit their own pending listing', async () => {
    const token = await registerAndLogin('seller', 'edit1@example.com');
    const listing = await createListing(token);

    const res = await request(app)
      .patch(`/api/equipment/${listing.id}`)
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Updated title')
      .field('price', '60');

    expect(res.status).toBe(200);
    expect(res.body.equipment.title).toBe('Updated title');
    expect(res.body.equipment.price).toBe(60);
  });

  test('a seller cannot edit another seller\'s listing', async () => {
    const tokenA = await registerAndLogin('seller', 'ownerA@example.com');
    const tokenB = await registerAndLogin('seller', 'ownerB@example.com');
    const listing = await createListing(tokenA);

    const res = await request(app)
      .patch(`/api/equipment/${listing.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .field('title', 'Hijacked');

    expect(res.status).toBe(403);
  });

  test('editing above the price cap is rejected', async () => {
    const token = await registerAndLogin('seller', 'edit2@example.com');
    const listing = await createListing(token);

    const res = await request(app)
      .patch(`/api/equipment/${listing.id}`)
      .set('Authorization', `Bearer ${token}`)
      .field('price', '999999');

    expect(res.status).toBe(403);
  });

  test('seller can delete their own listing', async () => {
    const token = await registerAndLogin('seller', 'del1@example.com');
    const listing = await createListing(token);

    const res = await request(app)
      .delete(`/api/equipment/${listing.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const mine = await request(app)
      .get('/api/equipment/mine')
      .set('Authorization', `Bearer ${token}`);
    expect(mine.body.equipment).toHaveLength(0);
  });

  test('a seller cannot delete another seller\'s listing', async () => {
    const tokenA = await registerAndLogin('seller', 'ownerC@example.com');
    const tokenB = await registerAndLogin('seller', 'ownerD@example.com');
    const listing = await createListing(tokenA);

    const res = await request(app)
      .delete(`/api/equipment/${listing.id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
  });
});
