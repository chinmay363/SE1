const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/models');
const { generateAccessToken } = require('../../src/utils/jwt');
const adminService = require('../../src/services/adminService');

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

  describe('Occupancy Endpoints', () => {
    test('should get occupancy data with all required fields', async () => {
      const res = await request(app)
        .get('/admin/occupancy')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('available');
      expect(res.body.data).toHaveProperty('occupied');
      expect(res.body.data).toHaveProperty('maintenance');
      expect(res.body.data).toHaveProperty('reserved');
      expect(res.body.data).toHaveProperty('occupancyRate');
      expect(res.body.data).toHaveProperty('byFloorAndZone');
      expect(res.body.data).toHaveProperty('timestamp');
    });

    test('should return cached occupancy data on subsequent calls', async () => {
      // Clear cache first
      adminService.clearCache();

      // First call - fresh data
      const res1 = await request(app)
        .get('/admin/occupancy')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res1.body.data.cached).toBeFalsy();

      // Second call within cache TTL - should be cached
      const res2 = await request(app)
        .get('/admin/occupancy')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res2.body.data.cached).toBe(true);
    });

    test('should calculate occupancy rate correctly', async () => {
      const res = await request(app)
        .get('/admin/occupancy')
        .set('Authorization', `Bearer ${adminToken}`);

      const { total, occupied, occupancyRate } = res.body.data;
      const expectedRate = ((occupied / total) * 100).toFixed(2);

      expect(occupancyRate).toBe(expectedRate);
    });

    test('should group spaces by floor and zone', async () => {
      const res = await request(app)
        .get('/admin/occupancy')
        .set('Authorization', `Bearer ${adminToken}`);

      const { byFloorAndZone } = res.body.data;

      expect(Array.isArray(byFloorAndZone)).toBe(true);
      if (byFloorAndZone.length > 0) {
        expect(byFloorAndZone[0]).toHaveProperty('floor');
        expect(byFloorAndZone[0]).toHaveProperty('zone');
        expect(byFloorAndZone[0]).toHaveProperty('status');
        expect(byFloorAndZone[0]).toHaveProperty('count');
      }
    });
  });

  describe('Revenue Endpoints', () => {
    test('should get revenue data with comprehensive metrics', async () => {
      const res = await request(app)
        .get('/admin/revenue')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalRevenue');
      expect(res.body.data).toHaveProperty('transactionCount');
      expect(res.body.data).toHaveProperty('averageTransaction');
      expect(res.body.data).toHaveProperty('minTransaction');
      expect(res.body.data).toHaveProperty('maxTransaction');
      expect(res.body.data).toHaveProperty('revenueByDate');
      expect(res.body.data).toHaveProperty('revenueByMethod');
    });

    test('should return cached revenue data on subsequent calls', async () => {
      adminService.clearCache();

      // First call - fresh data
      const res1 = await request(app)
        .get('/admin/revenue')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res1.body.data.cached).toBeFalsy();

      // Second call within cache TTL - should be cached
      const res2 = await request(app)
        .get('/admin/revenue')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res2.body.data.cached).toBe(true);
    });

    test('should group revenue by date', async () => {
      const res = await request(app)
        .get('/admin/revenue')
        .set('Authorization', `Bearer ${adminToken}`);

      const { revenueByDate } = res.body.data;

      expect(Array.isArray(revenueByDate)).toBe(true);
      if (revenueByDate.length > 0) {
        expect(revenueByDate[0]).toHaveProperty('date');
        expect(revenueByDate[0]).toHaveProperty('revenue');
        expect(revenueByDate[0]).toHaveProperty('count');
      }
    });

    test('should group revenue by payment method', async () => {
      const res = await request(app)
        .get('/admin/revenue')
        .set('Authorization', `Bearer ${adminToken}`);

      const { revenueByMethod } = res.body.data;

      expect(Array.isArray(revenueByMethod)).toBe(true);
      if (revenueByMethod.length > 0) {
        expect(revenueByMethod[0]).toHaveProperty('paymentMethod');
        expect(revenueByMethod[0]).toHaveProperty('revenue');
        expect(revenueByMethod[0]).toHaveProperty('count');
        expect(revenueByMethod[0]).toHaveProperty('average');
      }
    });

    test('should calculate average transaction correctly', async () => {
      const res = await request(app)
        .get('/admin/revenue')
        .set('Authorization', `Bearer ${adminToken}`);

      const { totalRevenue, transactionCount, averageTransaction } = res.body.data;

      if (transactionCount > 0) {
        const expectedAvg = (parseFloat(totalRevenue) / transactionCount).toFixed(2);
        expect(averageTransaction).toBe(expectedAvg);
      } else {
        expect(averageTransaction).toBe('0.00');
      }
    });
  });

  describe('Dashboard Summary', () => {
    test('should get dashboard summary with all metrics', async () => {
      const res = await request(app)
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('occupancy');
      expect(res.body.data).toHaveProperty('revenue');
      expect(res.body.data).toHaveProperty('activeSessions');
      expect(res.body.data).toHaveProperty('totalVehicles');
      expect(res.body.data).toHaveProperty('unresolvedAlerts');
    });
  });

  describe('Authorization', () => {
    test('should reject non-admin access to occupancy', async () => {
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

    test('should reject non-admin access to revenue', async () => {
      const techToken = generateAccessToken({
        id: '456',
        username: 'tech',
        email: 'tech@test.com',
        role: 'technician'
      });

      const res = await request(app)
        .get('/admin/revenue')
        .set('Authorization', `Bearer ${techToken}`);

      expect(res.status).toBe(403);
    });

    test('should reject unauthorized access without token', async () => {
      const res = await request(app)
        .get('/admin/occupancy');

      expect(res.status).toBe(401);
    });

    test('should reject invalid token', async () => {
      const res = await request(app)
        .get('/admin/occupancy')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });

  describe('System Logs', () => {
    test('should get system logs', async () => {
      const res = await request(app)
        .get('/admin/logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('logs');
      expect(res.body.data).toHaveProperty('total');
    });

    test('should filter logs by action', async () => {
      const res = await request(app)
        .get('/admin/logs?action=create')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('logs');
    });
  });

  describe('System Events', () => {
    test('should get system events', async () => {
      const res = await request(app)
        .get('/admin/events')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('events');
      expect(res.body.data).toHaveProperty('total');
    });

    test('should filter events by severity', async () => {
      const res = await request(app)
        .get('/admin/events?severity=high')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('events');
    });
  });
});
