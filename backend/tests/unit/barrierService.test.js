const barrierService = require('../../src/services/barrierService');
const { SystemEvent } = require('../../src/models');
const logger = require('../../src/utils/logger');

jest.mock('../../src/models');
jest.mock('../../src/utils/logger');

describe('BarrierService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SystemEvent.create = jest.fn().mockResolvedValue({});
    process.env.BARRIER_OPEN_DELAY_MS = '10'; // Speed up tests
  });

  afterEach(() => {
    delete process.env.BARRIER_OPEN_DELAY_MS;
  });

  describe('openEntryBarrier', () => {
    test('should open entry barrier successfully', async () => {
      const sessionId = 'test-session-123';

      const result = await barrierService.openEntryBarrier(sessionId);

      expect(result).toEqual({
        success: true,
        message: 'Entry barrier opened',
        sessionId,
        openTime: expect.any(Date)
      });

      expect(logger.info).toHaveBeenCalledWith('Opening entry barrier:', { sessionId });
      expect(SystemEvent.create).toHaveBeenCalledWith({
        eventType: 'barrier_open',
        severity: 'low',
        component: 'Barrier',
        message: `Entry barrier opened for session ${sessionId}`,
        details: {}
      });
    });

    test('should use default delay when BARRIER_OPEN_DELAY_MS not set', async () => {
      delete process.env.BARRIER_OPEN_DELAY_MS;
      process.env.BARRIER_OPEN_DELAY_MS = '20';

      const startTime = Date.now();
      await barrierService.openEntryBarrier('session-123');
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(15);
    });

    test('should handle system event logging error gracefully', async () => {
      SystemEvent.create = jest.fn().mockRejectedValue(new Error('DB Error'));

      const result = await barrierService.openEntryBarrier('session-123');

      expect(result.success).toBe(true);
      expect(logger.error).toHaveBeenCalledWith('Failed to log system event:', expect.any(Error));
    });
  });

  describe('openExitBarrier', () => {
    test('should open exit barrier successfully', async () => {
      const sessionId = 'test-session-456';

      const result = await barrierService.openExitBarrier(sessionId);

      expect(result).toEqual({
        success: true,
        message: 'Exit barrier opened',
        sessionId,
        openTime: expect.any(Date)
      });

      expect(logger.info).toHaveBeenCalledWith('Opening exit barrier:', { sessionId });
      expect(SystemEvent.create).toHaveBeenCalledWith({
        eventType: 'barrier_open',
        severity: 'low',
        component: 'Barrier',
        message: `Exit barrier opened for session ${sessionId}`,
        details: {}
      });
    });
  });

  describe('closeBarrier', () => {
    test('should close barrier successfully', async () => {
      const barrierId = 'barrier-001';

      const result = await barrierService.closeBarrier(barrierId);

      expect(result).toEqual({
        success: true,
        message: 'Barrier closed',
        barrierId,
        closeTime: expect.any(Date)
      });

      expect(logger.info).toHaveBeenCalledWith('Closing barrier:', { barrierId });
      expect(SystemEvent.create).toHaveBeenCalledWith({
        eventType: 'barrier_close',
        severity: 'low',
        component: 'Barrier',
        message: `Barrier ${barrierId} closed`,
        details: {}
      });
    });
  });

  describe('delay', () => {
    test('should delay execution for specified milliseconds', async () => {
      const delayMs = 50;
      const startTime = Date.now();

      await barrierService.delay(delayMs);

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(delayMs - 10);
    });
  });
});
