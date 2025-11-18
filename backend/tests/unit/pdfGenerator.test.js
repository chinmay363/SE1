const { generateReceipt } = require('../../src/utils/pdfGenerator');
const PDFDocument = require('pdfkit');

// Mock PDFDocument
jest.mock('pdfkit');

describe('pdfGenerator', () => {
  describe('generateReceipt', () => {
    let mockDoc;
    let mockOn;
    let mockFontSize;
    let mockText;
    let mockMoveDown;
    let mockEnd;

    beforeEach(() => {
      jest.clearAllMocks();

      // Create chainable mock methods
      mockFontSize = jest.fn().mockReturnThis();
      mockText = jest.fn().mockReturnThis();
      mockMoveDown = jest.fn().mockReturnThis();
      mockEnd = jest.fn();
      mockOn = jest.fn();

      mockDoc = {
        fontSize: mockFontSize,
        text: mockText,
        moveDown: mockMoveDown,
        end: mockEnd,
        on: mockOn
      };

      PDFDocument.mockImplementation(() => mockDoc);
    });

    test('should generate receipt PDF successfully', async () => {
      const receiptData = {
        receiptNumber: 'RCP-001',
        transactionDate: new Date('2024-01-15T14:30:00'),
        licensePlate: 'ABC-1234',
        spaceNumber: '1A01',
        entryTime: new Date('2024-01-15T10:00:00'),
        exitTime: new Date('2024-01-15T12:00:00'),
        durationMinutes: 120,
        amount: 50,
        paymentMethod: 'credit_card',
        status: 'completed'
      };

      // Simulate the PDF generation process
      mockOn.mockImplementation((event, callback) => {
        if (event === 'data') {
          // Simulate data chunks
          setTimeout(() => callback(Buffer.from('chunk1')), 0);
          setTimeout(() => callback(Buffer.from('chunk2')), 0);
        } else if (event === 'end') {
          // Simulate end event
          setTimeout(callback, 0);
        }
      });

      const resultPromise = generateReceipt(receiptData);

      // Wait for promise to resolve
      const result = await resultPromise;

      expect(PDFDocument).toHaveBeenCalledWith({ size: 'A4', margin: 50 });
      expect(mockFontSize).toHaveBeenCalledWith(20);
      expect(mockText).toHaveBeenCalledWith('PARKING RECEIPT', { align: 'center' });
      expect(mockText).toHaveBeenCalledWith(`Receipt Number: ${receiptData.receiptNumber}`);
      expect(mockText).toHaveBeenCalledWith(`License Plate: ${receiptData.licensePlate}`);
      expect(mockText).toHaveBeenCalledWith(`Space Number: ${receiptData.spaceNumber}`);
      expect(mockText).toHaveBeenCalledWith(`Duration: ${receiptData.durationMinutes} minutes (2 hours)`);
      expect(mockText).toHaveBeenCalledWith(`Amount: $${receiptData.amount}`);
      expect(mockText).toHaveBeenCalledWith(`Payment Method: ${receiptData.paymentMethod}`);
      expect(mockText).toHaveBeenCalledWith(`Status: ${receiptData.status}`);
      expect(mockEnd).toHaveBeenCalled();
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    test('should handle duration calculation correctly', async () => {
      const receiptData = {
        receiptNumber: 'RCP-002',
        transactionDate: new Date('2024-01-15'),
        licensePlate: 'XYZ-9999',
        spaceNumber: '2B05',
        entryTime: new Date('2024-01-15T09:00:00'),
        exitTime: new Date('2024-01-15T14:30:00'),
        durationMinutes: 330, // 5.5 hours
        amount: 100,
        paymentMethod: 'cash',
        status: 'completed'
      };

      mockOn.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from('data')), 0);
        } else if (event === 'end') {
          setTimeout(callback, 0);
        }
      });

      await generateReceipt(receiptData);

      // Check that duration is calculated correctly (330 minutes = 6 hours when ceiled)
      expect(mockText).toHaveBeenCalledWith(
        expect.stringContaining('330 minutes (6 hours)')
      );
    });

    test('should format dates correctly', async () => {
      const testDate = new Date('2024-06-15T16:45:30');
      const receiptData = {
        receiptNumber: 'RCP-003',
        transactionDate: testDate,
        licensePlate: 'TEST-123',
        spaceNumber: '3C10',
        entryTime: testDate,
        exitTime: new Date('2024-06-15T18:00:00'),
        durationMinutes: 75,
        amount: 25,
        paymentMethod: 'credit_card',
        status: 'completed'
      };

      mockOn.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from('data')), 0);
        } else if (event === 'end') {
          setTimeout(callback, 0);
        }
      });

      await generateReceipt(receiptData);

      expect(mockText).toHaveBeenCalledWith(`Date: ${testDate.toLocaleString()}`);
      expect(mockText).toHaveBeenCalledWith(`Entry Time: ${testDate.toLocaleString()}`);
    });

    test('should include footer text', async () => {
      const receiptData = {
        receiptNumber: 'RCP-004',
        transactionDate: new Date(),
        licensePlate: 'FOO-BAR',
        spaceNumber: '1A01',
        entryTime: new Date(),
        exitTime: new Date(),
        durationMinutes: 60,
        amount: 20,
        paymentMethod: 'debit_card',
        status: 'completed'
      };

      mockOn.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from('data')), 0);
        } else if (event === 'end') {
          setTimeout(callback, 0);
        }
      });

      await generateReceipt(receiptData);

      expect(mockText).toHaveBeenCalledWith('Thank you for using our parking service!', { align: 'center' });
      expect(mockText).toHaveBeenCalledWith('Automated Parking Management System', { align: 'center' });
    });

    test('should reject promise on error', async () => {
      const receiptData = {
        receiptNumber: 'RCP-005',
        transactionDate: new Date(),
        licensePlate: 'ERR-001',
        spaceNumber: '1A01',
        entryTime: new Date(),
        exitTime: new Date(),
        durationMinutes: 60,
        amount: 20,
        paymentMethod: 'cash',
        status: 'completed'
      };

      // Make PDFDocument constructor throw an error
      PDFDocument.mockImplementation(() => {
        throw new Error('PDF creation failed');
      });

      await expect(generateReceipt(receiptData)).rejects.toThrow('PDF creation failed');
    });
  });
});
