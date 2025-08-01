import 'reflect-metadata';

// Setup global test environment
beforeAll(() => {
  // Setup test database, Redis, etc.
  process.env.NODE_ENV = 'test';
  process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
});

afterAll(async () => {
  // Cleanup test environment
});
