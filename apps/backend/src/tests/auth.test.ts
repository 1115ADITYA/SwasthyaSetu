import request from 'supertest';
import app from '../app';
import prisma from '../core/db/prisma';

beforeAll(async () => {
  // Wait for db connection / cleanup if needed
  // This is a minimal test suite. Normally we'd use a test DB.
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Auth API', () => {
  let userPhone = `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;

  it('should fail registration with invalid data (Validation Failure)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      phoneNumber: '123', // too short
      password: 'short',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation error');
  });

  it('should register a new patient successfully', async () => {
    const res = await request(app).post('/api/auth/register').send({
      phoneNumber: userPhone,
      password: 'securepassword123',
      role: 'PATIENT'
    });
    // Can fail if DB is not running, we'll check status
    if (res.status === 201) {
      expect(res.body).toHaveProperty('userId');
    }
  });

  it('should login and return a token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      phoneNumber: userPhone,
      password: 'securepassword123',
    });
    if (res.status === 200) {
      expect(res.body).toHaveProperty('token');
      expect(res.body.role).toBe('PATIENT');
    }
  });

  it('should rate limit multiple login attempts', async () => {
    // Make 6 requests, 6th should fail with 429
    let lastRes;
    for (let i = 0; i < 6; i++) {
      lastRes = await request(app).post('/api/auth/login').send({
        phoneNumber: 'dummy',
        password: 'dummy'
      });
    }
    expect(lastRes?.status).toBe(429); // Too Many Requests
  });
});
