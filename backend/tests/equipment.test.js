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

// Admins can't self-register via the public API (by design — see auth.test.js),
// so tests that need one create the User document directly, then log in through
// the real /api/auth/login endpoint to get a genuine token, same as createAdmin.js does.
async function createAdminAndLogin(email) {
  const User = (await import('../src/models/User.js')).default;
  const password = 'password123';
  await User.create({ name: 'Test Admin', email, password, role: 'admin' });
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
}

async function createListing(sellerToken, overrides = {}) {
  const res = await request(app)
    .post('/api/equipment')
    .set('Authorization', `Bearer ${sellerToken}`)
    .field('title', overrides.title || 'Test Item')
    .field('description', overrides.description || 'A great item')
    .field('category', overrides.category || 'Camping')
    .field('price', String(overrides.price ?? 30))
    .field('listingType', overrides.listingType || 'rent');
  return res.body.equipment;
}

describe('Admin review queue (GET /api/equipment/pending, approve/reject)', () => {
  test('admin sees pending listings in the queue', async () => {
    const sellerToken = await registerAndLogin('seller', 'queue-seller1@example.com');
    const adminToken = await createAdminAndLogin('queue-admin1@example.com');
    await createListing(sellerToken, { title: 'Ladder' });

    const res = await request(app)
      .get('/api/equipment/pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.equipment.some((item) => item.title === 'Ladder')).toBe(true);
  });

  test('non-admins cannot access the pending queue', async () => {
    const sellerToken = await registerAndLogin('seller', 'queue-seller2@example.com');

    const res = await request(app)
      .get('/api/equipment/pending')
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(res.status).toBe(403);
  });

  test('admin can approve a pending listing, and it disappears from the queue', async () => {
    const sellerToken = await registerAndLogin('seller', 'approve-seller1@example.com');
    const adminToken = await createAdminAndLogin('approve-admin1@example.com');
    const listing = await createListing(sellerToken, { title: 'Tent' });

    const approveRes = await request(app)
      .patch(`/api/equipment/${listing.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.equipment.status).toBe('approved');

    const queue = await request(app)
      .get('/api/equipment/pending')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(queue.body.equipment.some((item) => item.id === listing.id)).toBe(false);
  });

  test('admin can reject a pending listing with a reason', async () => {
    const sellerToken = await registerAndLogin('seller', 'reject-seller1@example.com');
    const adminToken = await createAdminAndLogin('reject-admin1@example.com');
    const listing = await createListing(sellerToken, { title: 'Chainsaw' });

    const res = await request(app)
      .patch(`/api/equipment/${listing.id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Photo required for power tools.' });

    expect(res.status).toBe(200);
    expect(res.body.equipment.status).toBe('rejected');
    expect(res.body.equipment.rejectionReason).toBe('Photo required for power tools.');
  });

  test('an already-approved listing cannot be approved again', async () => {
    const sellerToken = await registerAndLogin('seller', 'doubleapprove@example.com');
    const adminToken = await createAdminAndLogin('doubleapprove-admin@example.com');
    const listing = await createListing(sellerToken);

    await request(app)
      .patch(`/api/equipment/${listing.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await request(app)
      .patch(`/api/equipment/${listing.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(409);
  });
});

describe('Public catalogue (GET /api/equipment, GET /api/equipment/:id)', () => {
  test('catalogue only shows approved listings, not pending/rejected ones', async () => {
    const sellerToken = await registerAndLogin('seller', 'cat-seller1@example.com');
    const adminToken = await createAdminAndLogin('cat-admin1@example.com');

    const approved = await createListing(sellerToken, { title: 'Approved Tent' });
    await request(app)
      .patch(`/api/equipment/${approved.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    await createListing(sellerToken, { title: 'Still Pending Ladder' });

    const rejected = await createListing(sellerToken, { title: 'Rejected Saw' });
    await request(app)
      .patch(`/api/equipment/${rejected.id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'no' });

    const res = await request(app).get('/api/equipment');

    expect(res.status).toBe(200);
    const titles = res.body.equipment.map((item) => item.title);
    expect(titles).toContain('Approved Tent');
    expect(titles).not.toContain('Still Pending Ladder');
    expect(titles).not.toContain('Rejected Saw');
  });

  test('catalogue search filters by title/description/category', async () => {
    const sellerToken = await registerAndLogin('seller', 'cat-seller2@example.com');
    const adminToken = await createAdminAndLogin('cat-admin2@example.com');

    const tent = await createListing(sellerToken, { title: 'Camping Tent', category: 'Camping' });
    await request(app).patch(`/api/equipment/${tent.id}/approve`).set('Authorization', `Bearer ${adminToken}`);

    const drill = await createListing(sellerToken, { title: 'Power Drill', category: 'Tools' });
    await request(app).patch(`/api/equipment/${drill.id}/approve`).set('Authorization', `Bearer ${adminToken}`);

    const res = await request(app).get('/api/equipment').query({ search: 'tent' });

    expect(res.status).toBe(200);
    expect(res.body.equipment).toHaveLength(1);
    expect(res.body.equipment[0].title).toBe('Camping Tent');
  });

  test('GET /api/equipment/:id returns an approved listing, 404s for pending ones', async () => {
    const sellerToken = await registerAndLogin('seller', 'cat-seller3@example.com');
    const adminToken = await createAdminAndLogin('cat-admin3@example.com');

    const approved = await createListing(sellerToken, { title: 'Visible Item' });
    await request(app).patch(`/api/equipment/${approved.id}/approve`).set('Authorization', `Bearer ${adminToken}`);
    const pending = await createListing(sellerToken, { title: 'Hidden Item' });

    const okRes = await request(app).get(`/api/equipment/${approved.id}`);
    expect(okRes.status).toBe(200);
    expect(okRes.body.equipment.title).toBe('Visible Item');

    const hiddenRes = await request(app).get(`/api/equipment/${pending.id}`);
    expect(hiddenRes.status).toBe(404);
  });

  test('an invalid id returns 400, not a 500', async () => {
    const res = await request(app).get('/api/equipment/not-a-real-id');
    expect(res.status).toBe(400);
  });
});

describe('Price cap settings (GET/PUT /api/settings/price-cap)', () => {
  test('admin can read and update the price cap', async () => {
    const adminToken = await createAdminAndLogin('cap-admin1@example.com');

    const initial = await request(app)
      .get('/api/settings/price-cap')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(initial.status).toBe(200);
    expect(typeof initial.body.maxListingPrice).toBe('number');

    const updated = await request(app)
      .put('/api/settings/price-cap')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ maxListingPrice: 750 });
    expect(updated.status).toBe(200);
    expect(updated.body.maxListingPrice).toBe(750);

    const confirm = await request(app)
      .get('/api/settings/price-cap')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(confirm.body.maxListingPrice).toBe(750);
  });

  test('a new price cap is actually enforced on new listings', async () => {
    const adminToken = await createAdminAndLogin('cap-admin2@example.com');
    const sellerToken = await registerAndLogin('seller', 'cap-seller1@example.com');

    await request(app)
      .put('/api/settings/price-cap')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ maxListingPrice: 100 });

    const overCap = await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${sellerToken}`)
      .field('title', 'Too Expensive')
      .field('description', 'x')
      .field('price', '150')
      .field('listingType', 'sale');
    expect(overCap.status).toBe(403);

    const underCap = await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${sellerToken}`)
      .field('title', 'Within Cap')
      .field('description', 'x')
      .field('price', '90')
      .field('listingType', 'sale');
    expect(underCap.status).toBe(201);
  });

  test('non-admins cannot read or change the price cap', async () => {
    const sellerToken = await registerAndLogin('seller', 'cap-seller2@example.com');

    const getRes = await request(app)
      .get('/api/settings/price-cap')
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(getRes.status).toBe(403);

    const putRes = await request(app)
      .put('/api/settings/price-cap')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ maxListingPrice: 1 });
    expect(putRes.status).toBe(403);
  });
});
