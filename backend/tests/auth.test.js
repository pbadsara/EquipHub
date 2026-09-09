import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';

// These integration tests run against a REAL MongoDB-wire-protocol server —
// not a mock. By default they spin up mongodb-memory-server (a real mongod
// binary). If TEST_MONGODB_URI is set instead, they connect to that server
// directly (used in sandboxed environments where downloading a mongod binary
// isn't possible — see README.md "Verification notes" for details). Either
// way, the exact same app code and code paths are exercised.

jest.setTimeout(60000);

let mongod;
let app;
const externalUri = process.env.TEST_MONGODB_URI;

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
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

describe('POST /api/auth/register', () => {
  test('registers a renter/buyer and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Riya Renter',
      email: 'riya@example.com',
      password: 'password123',
      role: 'renter',
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('renter');
    expect(res.body.user.password).toBeUndefined();
  });

  test('registers a seller and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Sam Seller',
      email: 'sam@example.com',
      password: 'password123',
      role: 'seller',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('seller');
  });

  test('rejects public self-registration as admin', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Wannabe Admin',
      email: 'notadmin@example.com',
      password: 'password123',
      role: 'admin',
    });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/cannot self-register/i);
  });

  test('rejects duplicate email', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'First',
      email: 'dupe@example.com',
      password: 'password123',
      role: 'renter',
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Second',
      email: 'dupe@example.com',
      password: 'password123',
      role: 'seller',
    });

    expect(res.status).toBe(409);
  });

  test('rejects missing required fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@example.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  async function registerUser(overrides = {}) {
    return request(app)
      .post('/api/auth/register')
      .send({
        name: 'Login Tester',
        email: 'login@example.com',
        password: 'password123',
        role: 'renter',
        ...overrides,
      });
  }

  test('logs in with correct credentials and returns role for redirection', async () => {
    await registerUser();

    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('renter');
  });

  test('rejects wrong password', async () => {
    await registerUser();

    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
  });

  test('rejects unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
  });
});

describe('Role-based access to dashboard routes', () => {
  async function registerAndLogin(role, email) {
    const reg = await request(app).post('/api/auth/register').send({
      name: `User ${role}`,
      email,
      password: 'password123',
      role,
    });
    return reg.body.token;
  }

  test('seller token can access /api/dashboard/seller but not /api/dashboard/renter', async () => {
    const token = await registerAndLogin('seller', 'seller1@example.com');

    const sellerRes = await request(app)
      .get('/api/dashboard/seller')
      .set('Authorization', `Bearer ${token}`);
    expect(sellerRes.status).toBe(200);

    const renterRes = await request(app)
      .get('/api/dashboard/renter')
      .set('Authorization', `Bearer ${token}`);
    expect(renterRes.status).toBe(403);
  });

  test('renter token can access /api/dashboard/renter but not /api/dashboard/admin', async () => {
    const token = await registerAndLogin('renter', 'renter1@example.com');

    const renterRes = await request(app)
      .get('/api/dashboard/renter')
      .set('Authorization', `Bearer ${token}`);
    expect(renterRes.status).toBe(200);

    const adminRes = await request(app)
      .get('/api/dashboard/admin')
      .set('Authorization', `Bearer ${token}`);
    expect(adminRes.status).toBe(403);
  });

  test('unauthenticated request is rejected', async () => {
    const res = await request(app).get('/api/dashboard/renter');
    expect(res.status).toBe(401);
  });
});
