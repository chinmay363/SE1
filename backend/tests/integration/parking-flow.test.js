const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/models');

describe('Parking Flow Integration Tests', () => {
  beforeAll(async () => {
    // Wait for DB connection
    await sequelize.authenticate();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Complete Entry Flow: Identify -> Allocate -> Entry Barrier', () => {
    test('should complete full entry workflow', async () => {
      // Step 1: Identify license plate
      const identifyRes = await request(app)
        .post('/identify')
        .send({
          image: 'base64encodedimage123',
          simulateFailure: false
        });

      expect(identifyRes.status).toBe(200);
      expect(identifyRes.body.success).toBe(true);
      expect(identifyRes.body.data).toHaveProperty('licensePlate');

      const licensePlate = identifyRes.body.data.licensePlate;

      // Step 2: Allocate parking space
      const allocateRes = await request(app)
        .post('/parking/allocate')
        .send({ licensePlate });

      expect(allocateRes.status).toBe(200);
      expect(allocateRes.body.success).toBe(true);
      expect(allocateRes.body.data).toHaveProperty('session');
      expect(allocateRes.body.data).toHaveProperty('space');

      const sessionId = allocateRes.body.data.session.id;

      // Step 3: Open entry barrier
      const barrierRes = await request(app)
        .post('/barrier/entry')
        .send({ sessionId });

      expect(barrierRes.status).toBe(200);
      expect(barrierRes.body.success).toBe(true);
      expect(barrierRes.body.data).toHaveProperty('openTime');
    });
  });
});
