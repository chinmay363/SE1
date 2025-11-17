const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/models');
const { generateAccessToken } = require('../../src/utils/jwt');

describe('Admin Integration Tests', () => {
  let adminToken;

  beforeAll(async () => {
    await sequelize.authenticate();

    // Generate admin token
    adminToken = generateAccessToken({
      id: '123',
      username: 'admin',
      email: 'admin@test.com',
      role: 'admin'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Admin Endpoints', () => {
    test('should get occupancy data', async () => {
      const res = await request(app)
        .get('/admin/occupancy')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('available');
      expect(res.body.data).toHaveProperty('occupied');
      expect(res.body.data).toHaveProperty('occupancyRate');
    });

    test('should get revenue data', async () => {
      const res = await request(app)
        .get('/admin/revenue')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalRevenue');
      expect(res.body.data).toHaveProperty('transactionCount');
    });

    test('should reject non-admin access', async () => {
      const techToken = generateAccessToken({
        id: '456',
        username: 'tech',
        email: 'tech@test.com',
        role: 'technician'
      });

      const res = await request(app)
        .get('/admin/occupancy')
        .set('Authorization', `Bearer ${techToken}`);

      expect(res.status).toBe(403);
    });
  });
});
