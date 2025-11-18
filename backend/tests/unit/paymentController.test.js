const paymentController = require('../../src/controllers/paymentController');
const paymentService = require('../../src/services/paymentService');
const { generateReceipt } = require('../../src/utils/pdfGenerator');

jest.mock('../../src/services/paymentService');
jest.mock('../../src/utils/pdfGenerator');

describe('PaymentController', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {}
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('createPayment', () => {
    test('should create payment successfully', async () => {
      const mockResult = {
        paymentId: 'payment-123',
        amount: 50,
        status: 'pending'
      };

      req.body = {
        sessionId: 'session-123',
        paymentMethod: 'credit_card'
      };

      paymentService.createPayment.mockResolvedValue(mockResult);

      await paymentController.createPayment(req, res, next);

      expect(paymentService.createPayment).toHaveBeenCalledWith('session-123', 'credit_card');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payment created',
        data: mockResult
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle errors', async () => {
      const error = new Error('Payment creation failed');
      req.body = {
        sessionId: 'session-123',
        paymentMethod: 'credit_card'
      };

      paymentService.createPayment.mockRejectedValue(error);

      await paymentController.createPayment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('confirmPayment', () => {
    test('should confirm payment successfully', async () => {
      const mockResult = {
        paymentId: 'payment-123',
        status: 'completed'
      };

      req.body = {
        paymentId: 'payment-123'
      };

      paymentService.confirmPayment.mockResolvedValue(mockResult);

      await paymentController.confirmPayment(req, res, next);

      expect(paymentService.confirmPayment).toHaveBeenCalledWith('payment-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payment confirmed',
        data: mockResult
      });
    });

    test('should handle errors', async () => {
      const error = new Error('Payment confirmation failed');
      req.body = {
        paymentId: 'payment-123'
      };

      paymentService.confirmPayment.mockRejectedValue(error);

      await paymentController.confirmPayment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getPaymentDetails', () => {
    test('should return payment details successfully', async () => {
      const mockPayment = {
        id: 'payment-123',
        amount: 50,
        status: 'completed'
      };

      req.params = {
        paymentId: 'payment-123'
      };

      paymentService.getPaymentDetails.mockResolvedValue(mockPayment);

      await paymentController.getPaymentDetails(req, res, next);

      expect(paymentService.getPaymentDetails).toHaveBeenCalledWith('payment-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockPayment
      });
    });

    test('should return 404 when payment not found', async () => {
      req.params = {
        paymentId: 'payment-123'
      };

      paymentService.getPaymentDetails.mockResolvedValue(null);

      await paymentController.getPaymentDetails(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Payment not found'
      });
    });

    test('should handle errors', async () => {
      const error = new Error('Database error');
      req.params = {
        paymentId: 'payment-123'
      };

      paymentService.getPaymentDetails.mockRejectedValue(error);

      await paymentController.getPaymentDetails(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('generateReceipt', () => {
    test('should generate receipt PDF successfully', async () => {
      const mockPayment = {
        transaction: {
          receiptNumber: 'RCP-001',
          transactionDate: new Date('2024-01-15'),
          amount: 50,
          paymentMethod: 'credit_card',
          status: 'completed',
          session: {
            vehicle: { licensePlate: 'ABC-1234' },
            space: { spaceNumber: '1A01' },
            entryTime: new Date('2024-01-15T10:00:00'),
            exitTime: new Date('2024-01-15T12:00:00'),
            durationMinutes: 120
          }
        }
      };

      const mockPdfBuffer = Buffer.from('pdf-content');

      req.params = {
        transactionId: 'txn-123'
      };

      paymentService.getPaymentDetails.mockResolvedValue(mockPayment);
      generateReceipt.mockResolvedValue(mockPdfBuffer);

      await paymentController.generateReceipt(req, res, next);

      expect(paymentService.getPaymentDetails).toHaveBeenCalledWith('txn-123');
      expect(generateReceipt).toHaveBeenCalledWith(
        expect.objectContaining({
          receiptNumber: 'RCP-001',
          licensePlate: 'ABC-1234',
          spaceNumber: '1A01'
        })
      );
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=receipt-RCP-001.pdf');
      expect(res.send).toHaveBeenCalledWith(mockPdfBuffer);
    });

    test('should return 404 when payment not found', async () => {
      req.params = {
        transactionId: 'txn-123'
      };

      paymentService.getPaymentDetails.mockResolvedValue(null);

      await paymentController.generateReceipt(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Transaction not found'
      });
    });

    test('should return 404 when transaction not found on payment', async () => {
      req.params = {
        transactionId: 'txn-123'
      };

      paymentService.getPaymentDetails.mockResolvedValue({ id: 'payment-123' });

      await paymentController.generateReceipt(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Transaction not found'
      });
    });

    test('should handle errors', async () => {
      const error = new Error('PDF generation error');
      req.params = {
        transactionId: 'txn-123'
      };

      paymentService.getPaymentDetails.mockRejectedValue(error);

      await paymentController.generateReceipt(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getReceiptData', () => {
    test('should return receipt data successfully', async () => {
      const mockPayment = {
        transaction: {
          receiptNumber: 'RCP-001',
          transactionDate: new Date('2024-01-15'),
          amount: 50,
          paymentMethod: 'credit_card',
          status: 'completed',
          session: {
            vehicle: { licensePlate: 'ABC-1234' },
            space: { spaceNumber: '1A01' },
            entryTime: new Date('2024-01-15T10:00:00'),
            exitTime: new Date('2024-01-15T12:00:00'),
            durationMinutes: 120
          }
        }
      };

      req.params = {
        transactionId: 'txn-123'
      };

      paymentService.getPaymentDetails.mockResolvedValue(mockPayment);

      await paymentController.getReceiptData(req, res, next);

      expect(paymentService.getPaymentDetails).toHaveBeenCalledWith('txn-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          receiptNumber: 'RCP-001',
          licensePlate: 'ABC-1234',
          spaceNumber: '1A01'
        })
      });
    });

    test('should return 404 when payment not found', async () => {
      req.params = {
        transactionId: 'txn-123'
      };

      paymentService.getPaymentDetails.mockResolvedValue(null);

      await paymentController.getReceiptData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Transaction not found'
      });
    });

    test('should return 404 when transaction not found on payment', async () => {
      req.params = {
        transactionId: 'txn-123'
      };

      paymentService.getPaymentDetails.mockResolvedValue({ id: 'payment-123' });

      await paymentController.getReceiptData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Transaction not found'
      });
    });

    test('should handle errors', async () => {
      const error = new Error('Database error');
      req.params = {
        transactionId: 'txn-123'
      };

      paymentService.getPaymentDetails.mockRejectedValue(error);

      await paymentController.getReceiptData(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
