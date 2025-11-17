// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'apms_test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.BCRYPT_ROUNDS = '4';
process.env.HOURLY_RATE = '5.0';
process.env.FIRST_HOUR_FREE = 'false';
process.env.BARRIER_OPEN_DELAY_MS = '100';
process.env.LPR_PROCESSING_DELAY_MS = '100';
process.env.LPR_FAILURE_RATE = '0.0';

// Set test timeout
jest.setTimeout(30000);
