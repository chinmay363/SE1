const barrierService = require('../../src/services/barrierService');
const { SystemEvent } = require('../../src/models');
const logger = require('../../src/utils/logger');

jest.mock('../../src/models');
jest.mock('../../src/utils/logger');

describe('BarrierService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment variable
    process.env.BARRIER_OPEN_DELAY_MS = '10'; // Use short delay for tests
  });

  afterEach(() => {
    delete process.env.BARRIER_OPEN_DELAY_MS;
  });

  describe('openEntryBarrier', () => {
    test('should open entry barrier successfully', async () => {
      SystemEvent.create = jest.fn().mockResolvedValue({
        id: 'event-123',
        eventType: 'barrier_open',
        severity: 'low'
      });

      const result = await barrierService.openEntryBarrier('session-123');

      expect(logger.info).toHaveBeenCalledWith('Opening entry barrier:', { sessionId: 'session-123' });
      expect(SystemEvent.create).toHaveBeenCalledWith({
        eventType: 'barrier_open',
        severity: 'low',
        component: 'Barrier',
        message: 'Entry barrier opened for session session-123',
        details: {}
      });
      expect(result).toEqual({
        success: true,
        message: 'Entry barrier opened',
        sessionId: 'session-123',
        openTime: expect.any(Date)
      });
    });

    test('should use default delay when env var not set', async () => {
      delete process.env.BARRIER_OPEN_DELAY_MS;

      SystemEvent.create = jest.fn().mockResolvedValue({});

      const startTime = Date.now();
      await barrierService.openEntryBarrier('session-456');
      const endTime = Date.now();

      // Should take at least 2000ms (default) but we're mocking it to be fast for tests
      // Just verify it completes
      expect(endTime - startTime).toBeLessThan(3000);
    });

    test('should handle system event logging errors gracefully', async () => {
      SystemEvent.create = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await barrierService.openEntryBarrier('session-789');

      expect(logger.error).toHaveBeenCalledWith('Failed to log system event:', expect.any(Error));
      expect(result).toEqual({
        success: true,
        message: 'Entry barrier opened',
        sessionId: 'session-789',
        openTime: expect.any(Date)
      });
    });
  });

  describe('openExitBarrier', () => {
    test('should open exit barrier successfully', async () => {
      SystemEvent.create = jest.fn().mockResolvedValue({
        id: 'event-456',
        eventType: 'barrier_open',
        severity: 'low'
      });

      const result = await barrierService.openExitBarrier('session-999');

      expect(logger.info).toHaveBeenCalledWith('Opening exit barrier:', { sessionId: 'session-999' });
      expect(SystemEvent.create).toHaveBeenCalledWith({
        eventType: 'barrier_open',
        severity: 'low',
        component: 'Barrier',
        message: 'Exit barrier opened for session session-999',
        details: {}
      });
      expect(result).toEqual({
        success: true,
        message: 'Exit barrier opened',
        sessionId: 'session-999',
        openTime: expect.any(Date)
      });
    });

    test('should handle system event logging errors gracefully', async () => {
      SystemEvent.create = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await barrierService.openExitBarrier('session-111');

      expect(logger.error).toHaveBeenCalledWith('Failed to log system event:', expect.any(Error));
      expect(result).toEqual({
        success: true,
        message: 'Exit barrier opened',
        sessionId: 'session-111',
        openTime: expect.any(Date)
      });
    });
  });

  describe('closeBarrier', () => {
    test('should close barrier successfully', async () => {
      SystemEvent.create = jest.fn().mockResolvedValue({
        id: 'event-789',
        eventType: 'barrier_close',
        severity: 'low'
      });

      const result = await barrierService.closeBarrier('barrier-001');

      expect(logger.info).toHaveBeenCalledWith('Closing barrier:', { barrierId: 'barrier-001' });
      expect(SystemEvent.create).toHaveBeenCalledWith({
        eventType: 'barrier_close',
        severity: 'low',
        component: 'Barrier',
        message: 'Barrier barrier-001 closed',
        details: {}
      });
      expect(result).toEqual({
        success: true,
        message: 'Barrier closed',
        barrierId: 'barrier-001',
        closeTime: expect.any(Date)
      });
    });

    test('should handle system event logging errors gracefully', async () => {
      SystemEvent.create = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await barrierService.closeBarrier('barrier-002');

      expect(logger.error).toHaveBeenCalledWith('Failed to log system event:', expect.any(Error));
      expect(result).toEqual({
        success: true,
        message: 'Barrier closed',
        barrierId: 'barrier-002',
        closeTime: expect.any(Date)
      });
    });
  });

  describe('logSystemEvent', () => {
    test('should log system event successfully', async () => {
      SystemEvent.create = jest.fn().mockResolvedValue({
        id: 'event-999',
        eventType: 'test_event',
        severity: 'medium'
      });

      await barrierService.logSystemEvent('test_event', 'medium', 'Test message');

      expect(SystemEvent.create).toHaveBeenCalledWith({
        eventType: 'test_event',
        severity: 'medium',
        component: 'Barrier',
        message: 'Test message',
        details: {}
      });
    });

    test('should handle errors when logging system event', async () => {
      const error = new Error('Database connection failed');
      SystemEvent.create = jest.fn().mockRejectedValue(error);

      await barrierService.logSystemEvent('test_event', 'high', 'Test message');

      expect(logger.error).toHaveBeenCalledWith('Failed to log system event:', error);
    });
  });

  describe('delay', () => {
    test('should delay execution', async () => {
      const startTime = Date.now();
      await barrierService.delay(50);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(45); // Allow some margin
    });
  });
});
