const request = require('supertest');
const app = require('../../src/app');
const { sequelize, ParkingSession, Vehicle, ParkingSpace, Transaction } = require('../../src/models');

describe('Payment Flow Integration Tests', () => {
  let sessionId, vehicleId, spaceId;

  beforeAll(async () => {
    await sequelize.authenticate();

    // Create test data
    const vehicle = await Vehicle.create({
      licensePlate: 'TEST-PAY-1234',
      visitCount: 1
    });
    vehicleId = vehicle.id;

    const space = await ParkingSpace.findOne({ where: { status: 'available' } });

    if (space) {
      spaceId = space.id;
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

  describe('Payment Creation', () => {
    test('should create payment with valid data', async () => {
      if (!sessionId) {
        console.log('Skipping test: no session available');
        return;
      }

      const res = await request(app)
        .post('/payment/create')
        .send({
          sessionId,
          paymentMethod: 'credit_card'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('payment');
      expect(res.body.data).toHaveProperty('amount');
      expect(res.body.data).toHaveProperty('breakdown');
      expect(res.body.data).toHaveProperty('appliedRules');
    });

    test('should reject payment creation without sessionId', async () => {
      const res = await request(app)
        .post('/payment/create')
        .send({
          paymentMethod: 'credit_card'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('required');
    });

    test('should reject payment creation without paymentMethod', async () => {
      if (!sessionId) return;

      const res = await request(app)
        .post('/payment/create')
        .send({
          sessionId
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('should reject unsupported payment method', async () => {
      if (!sessionId) return;

      const res = await request(app)
        .post('/payment/create')
        .send({
          sessionId,
          paymentMethod: 'cryptocurrency' // Unsupported
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Unsupported payment method');
    });

    test('should reject payment for non-existent session', async () => {
      const res = await request(app)
        .post('/payment/create')
        .send({
          sessionId: '00000000-0000-0000-0000-000000000000',
          paymentMethod: 'credit_card'
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('should accept various supported payment methods', async () => {
      const methods = ['credit_card', 'debit_card', 'cash', 'mobile_wallet', 'upi'];

      for (const method of methods) {
        if (!sessionId) continue;

        // Create a new session for each test
        const newVehicle = await Vehicle.create({
          licensePlate: `TEST-${method}-${Date.now()}`,
          visitCount: 1
        });

        const newSpace = await ParkingSpace.findOne({ where: { status: 'available' } });
        if (!newSpace) continue;

        await newSpace.update({ status: 'occupied' });

        const newSession = await ParkingSession.create({
          vehicleId: newVehicle.id,
          spaceId: newSpace.id,
          entryTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          status: 'active'
        });

        const res = await request(app)
          .post('/payment/create')
          .send({
            sessionId: newSession.id,
            paymentMethod: method
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
      }
    });
  });

  describe('Payment Confirmation', () => {
    let testPaymentId;

    beforeEach(async () => {
      if (!sessionId) return;

      // Create a new session and payment for each test
      const vehicle = await Vehicle.create({
        licensePlate: `CONF-${Date.now()}`,
        visitCount: 1
      });

      const space = await ParkingSpace.findOne({ where: { status: 'available' } });
      if (!space) return;

      await space.update({ status: 'occupied' });

      const session = await ParkingSession.create({
        vehicleId: vehicle.id,
        spaceId: space.id,
        entryTime: new Date(Date.now() - 60 * 60 * 1000),
        status: 'active'
      });

      const createRes = await request(app)
        .post('/payment/create')
        .send({
          sessionId: session.id,
          paymentMethod: 'credit_card'
        });

      testPaymentId = createRes.body.data.payment.id;
    });

    test('should confirm payment successfully', async () => {
      if (!testPaymentId) return;

      const res = await request(app)
        .post('/payment/confirm')
        .send({ paymentId: testPaymentId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.payment.status).toBe('completed');
      expect(res.body.data.session.status).toBe('completed');
      expect(res.body.data.session.exitTime).toBeDefined();
    });

    test('should reject confirmation without paymentId', async () => {
      const res = await request(app)
        .post('/payment/confirm')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('should reject confirmation for non-existent payment', async () => {
      const res = await request(app)
        .post('/payment/confirm')
        .send({ paymentId: '00000000-0000-0000-0000-000000000000' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found');
    });

    test('should reject double confirmation of same payment', async () => {
      if (!testPaymentId) return;

      // First confirmation
      await request(app)
        .post('/payment/confirm')
        .send({ paymentId: testPaymentId });

      // Second confirmation (should fail)
      const res = await request(app)
        .post('/payment/confirm')
        .send({ paymentId: testPaymentId });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already completed');
    });
  });

  describe('Payment Details Retrieval', () => {
    test('should get payment details by ID', async () => {
      if (!sessionId) return;

      // Create a payment first
      const createRes = await request(app)
        .post('/payment/create')
        .send({
          sessionId,
          paymentMethod: 'cash'
        });

      const paymentId = createRes.body.data.payment.id;

      const res = await request(app)
        .get(`/payment/${paymentId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.id).toBe(paymentId);
    });

    test('should return 404 for non-existent payment', async () => {
      const res = await request(app)
        .get('/payment/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Complete Payment Flow', () => {
    test('should complete full payment cycle', async () => {
      if (!sessionId) {
        console.log('Skipping test: no session available');
        return;
      }

      // Create a fresh session
      const vehicle = await Vehicle.create({
        licensePlate: `FULL-${Date.now()}`,
        visitCount: 1
      });

      const space = await ParkingSpace.findOne({ where: { status: 'available' } });
      if (!space) return;

      await space.update({ status: 'occupied' });

      const session = await ParkingSession.create({
        vehicleId: vehicle.id,
        spaceId: space.id,
        entryTime: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        status: 'active'
      });

      // Step 1: Create payment
      const createRes = await request(app)
        .post('/payment/create')
        .send({
          sessionId: session.id,
          paymentMethod: 'credit_card'
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.amount).toBeGreaterThan(0);

      const paymentId = createRes.body.data.payment.id;
      const transactionId = createRes.body.data.transaction.id;

      // Step 2: Get payment details
      const detailsRes = await request(app)
        .get(`/payment/${paymentId}`);

      expect(detailsRes.status).toBe(200);
      expect(detailsRes.body.data.status).toBe('initiated');

      // Step 3: Confirm payment
      const confirmRes = await request(app)
        .post('/payment/confirm')
        .send({ paymentId });

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.data.payment.status).toBe('completed');
      expect(confirmRes.body.data.session.status).toBe('completed');

      // Verify space is released
      const updatedSpace = await ParkingSpace.findByPk(space.id);
      expect(updatedSpace.status).toBe('available');
    });
  });
});
