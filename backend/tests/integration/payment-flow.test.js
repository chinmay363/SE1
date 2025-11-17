const request = require('supertest');
const app = require('../../src/app');
const { sequelize, ParkingSession, Vehicle, ParkingSpace } = require('../../src/models');

describe('Payment Flow Integration Tests', () => {
  let sessionId;

  beforeAll(async () => {
    await sequelize.authenticate();

    // Create test data
    const vehicle = await Vehicle.create({
      licensePlate: 'TEST-1234',
      visitCount: 1
    });

    const space = await ParkingSpace.findOne({ where: { status: 'available' } });

    if (space) {
      await space.update({ status: 'occupied' });

      const session = await ParkingSession.create({
        vehicleId: vehicle.id,
        spaceId: space.id,
        entryTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: 'active'
      });

      sessionId = session.id;
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Payment Confirmation Flow', () => {
    test('should create and confirm payment', async () => {
      if (!sessionId) {
        console.log('Skipping test: no session available');
        return;
      }

      // Step 1: Create payment
      const createRes = await request(app)
        .post('/payment/create')
        .send({
          sessionId,
          paymentMethod: 'credit_card'
        });

      expect(createRes.status).toBe(200);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data).toHaveProperty('payment');
      expect(createRes.body.data).toHaveProperty('amount');

      const paymentId = createRes.body.data.payment.id;

      // Step 2: Confirm payment
      const confirmRes = await request(app)
        .post('/payment/confirm')
        .send({ paymentId });

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.success).toBe(true);
      expect(confirmRes.body.data.payment.status).toBe('completed');
      expect(confirmRes.body.data.session.status).toBe('completed');
    });
  });
});
