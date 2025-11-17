const lprService = require('../../src/services/lprService');

// Mock the models
jest.mock('../../src/models', () => ({
  SystemEvent: {
    create: jest.fn().mockResolvedValue({})
  }
}));

describe('LPR Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.LPR_PROCESSING_DELAY_MS = '10'; // Fast for tests
    process.env.LPR_FAILURE_RATE = '0.0';
  });

  describe('identifyPlate', () => {
    test('should successfully identify a license plate', async () => {
      const imageData = 'base64imagedata';
      const result = await lprService.identifyPlate(imageData, false);

      expect(result).toHaveProperty('licensePlate');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('processingTime');
      expect(result.confidence).toBe(0.95);
    });

    test('should generate deterministic plate from same image', async () => {
      const imageData = 'base64imagedata';
      const result1 = await lprService.identifyPlate(imageData, false);
      const result2 = await lprService.identifyPlate(imageData, false);

      expect(result1.licensePlate).toBe(result2.licensePlate);
    });

    test('should generate different plates for different images', async () => {
      const image1 = 'base64imagedata1';
      const image2 = 'base64imagedata2';

      const result1 = await lprService.identifyPlate(image1, false);
      const result2 = await lprService.identifyPlate(image2, false);

      expect(result1.licensePlate).not.toBe(result2.licensePlate);
    });

    test('should fail when simulateFailure is true', async () => {
      const imageData = 'base64imagedata';

      await expect(lprService.identifyPlate(imageData, true))
        .rejects.toThrow('License plate recognition failed');
    });

    test('should generate plate in correct format', async () => {
      const imageData = 'base64imagedata';
      const result = await lprService.identifyPlate(imageData, false);

      expect(result.licensePlate).toMatch(/^[A-Z]{3}-\d{4}$/);
    });
  });

  describe('generatePlateFromImage', () => {
    test('should generate plate from image hash', () => {
      const imageData = 'testimage123';
      const plate = lprService.generatePlateFromImage(imageData);

      expect(plate).toMatch(/^[A-Z]{3}-\d{4}$/);
    });

    test('should be deterministic', () => {
      const imageData = 'testimage123';
      const plate1 = lprService.generatePlateFromImage(imageData);
      const plate2 = lprService.generatePlateFromImage(imageData);

      expect(plate1).toBe(plate2);
    });
  });
});
