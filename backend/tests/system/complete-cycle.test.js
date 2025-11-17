const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/models');

describe('Complete Parking Cycle System Test', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('should complete full parking lifecycle: entry -> parking -> payment -> exit', async () => {
    // 1. License Plate Recognition
    const lprRes = await request(app)
      .post('/identify')
      .send({
        image: 'system-test-image-data-12345',
        simulateFailure: false
      });

    expect(lprRes.status).toBe(200);
    const licensePlate = lprRes.body.data.licensePlate;

    // 2. Allocate Parking Space
    const allocateRes = await request(app)
      .post('/parking/allocate')
      .send({ licensePlate });

    expect(allocateRes.status).toBe(200);
    const { session, space } = allocateRes.body.data;
    const sessionId = session.id;

    expect(space.status).toBe('occupied');

    // 3. Open Entry Barrier
    const entryBarrierRes = await request(app)
      .post('/barrier/entry')
      .send({ sessionId });

    expect(entryBarrierRes.status).toBe(200);

    // 4. Create Payment
    const paymentRes = await request(app)
      .post('/payment/create')
      .send({
        sessionId,
        paymentMethod: 'card'
      });

    expect(paymentRes.status).toBe(200);
    const { payment, amount } = paymentRes.body.data;
    expect(amount).toBeGreaterThanOrEqual(0);

    // 5. Confirm Payment
    const confirmRes = await request(app)
      .post('/payment/confirm')
      .send({ paymentId: payment.id });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.payment.status).toBe('completed');
    expect(confirmRes.body.data.session.status).toBe('completed');

    // 6. Open Exit Barrier
    const exitBarrierRes = await request(app)
      .post('/barrier/exit')
      .send({ sessionId });

    expect(exitBarrierRes.status).toBe(200);

    // 7. Verify Space is Released
    const spacesRes = await request(app)
      .get('/parking/spaces');

    expect(spacesRes.status).toBe(200);
    const releasedSpace = spacesRes.body.data.find(s => s.id === space.id);
    expect(releasedSpace.status).toBe('available');
  });
});
