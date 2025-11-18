const paymentController = require('../../src/controllers/paymentController');
const paymentService = require('../../src/services/paymentService');
const { generateReceipt } = require('../../src/utils/pdfGenerator');

jest.mock('../../src/services/paymentService');
jest.mock('../../src/utils/pdfGenerator');

describe('PaymentController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {}
    };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      send: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    test('should create payment successfully', async () => {
      const mockResult = {
        payment: { id: 'payment-123' },
        amount: 25.50
      };
      paymentService.createPayment.mockResolvedValue(mockResult);
      req.body = { sessionId: 'session-456', paymentMethod: 'card' };

      await paymentController.createPayment(req, res, next);

      expect(paymentService.createPayment).toHaveBeenCalledWith('session-456', 'card');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payment created',
        data: mockResult
      });
    });

    test('should handle create payment error', async () => {
      const error = new Error('Payment creation failed');
      paymentService.createPayment.mockRejectedValue(error);
      req.body = { sessionId: 'session-456', paymentMethod: 'card' };

      await paymentController.createPayment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('confirmPayment', () => {
    test('should confirm payment successfully', async () => {
      const mockResult = {
        payment: { id: 'payment-123', status: 'completed' },
        session: { id: 'session-456', status: 'completed' }
      };
      paymentService.confirmPayment.mockResolvedValue(mockResult);
      req.body = { paymentId: 'payment-123' };

      await paymentController.confirmPayment(req, res, next);

      expect(paymentService.confirmPayment).toHaveBeenCalledWith('payment-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payment confirmed',
        data: mockResult
      });
    });

    test('should handle confirm payment error', async () => {
      const error = new Error('Payment confirmation failed');
      paymentService.confirmPayment.mockRejectedValue(error);
      req.body = { paymentId: 'payment-123' };

      await paymentController.confirmPayment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getPaymentDetails', () => {
    test('should get payment details successfully', async () => {
      const mockPayment = {
        id: 'payment-123',
        amount: 30.00,
        status: 'completed'
      };
      paymentService.getPaymentDetails.mockResolvedValue(mockPayment);
      req.params = { paymentId: 'payment-123' };

      await paymentController.getPaymentDetails(req, res, next);

      expect(paymentService.getPaymentDetails).toHaveBeenCalledWith('payment-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockPayment
      });
    });

    test('should return 404 when payment not found', async () => {
      paymentService.getPaymentDetails.mockResolvedValue(null);
      req.params = { paymentId: 'payment-999' };

      await paymentController.getPaymentDetails(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Payment not found'
      });
    });

    test('should handle get payment details error', async () => {
      const error = new Error('Database error');
      paymentService.getPaymentDetails.mockRejectedValue(error);
      req.params = { paymentId: 'payment-123' };

      await paymentController.getPaymentDetails(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('generateReceipt', () => {
    test('should generate receipt PDF successfully', async () => {
      const mockPayment = {
        transaction: {
          receiptNumber: 'RCP-001',
          transactionDate: new Date('2024-01-01'),
          amount: 25.50,
          paymentMethod: 'card',
          status: 'completed',
          session: {
            vehicle: { licensePlate: 'ABC-123' },
            space: { spaceNumber: '1A01' },
            entryTime: new Date('2024-01-01T10:00:00Z'),
            exitTime: new Date('2024-01-01T12:00:00Z'),
            durationMinutes: 120
          }
        }
      };
      const mockPDFBuffer = Buffer.from('PDF content');

      paymentService.getPaymentDetails.mockResolvedValue(mockPayment);
      generateReceipt.mockResolvedValue(mockPDFBuffer);
      req.params = { transactionId: 'transaction-123' };

      await paymentController.generateReceipt(req, res, next);

      expect(generateReceipt).toHaveBeenCalledWith({
        receiptNumber: 'RCP-001',
        transactionDate: mockPayment.transaction.transactionDate,
        licensePlate: 'ABC-123',
        spaceNumber: '1A01',
        entryTime: mockPayment.transaction.session.entryTime,
        exitTime: mockPayment.transaction.session.exitTime,
        durationMinutes: 120,
        amount: 25.50,
        paymentMethod: 'card',
        status: 'completed'
      });
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=receipt-RCP-001.pdf');
      expect(res.send).toHaveBeenCalledWith(mockPDFBuffer);
    });

    test('should return 404 when payment not found for receipt', async () => {
      paymentService.getPaymentDetails.mockResolvedValue(null);
      req.params = { transactionId: 'transaction-999' };

      await paymentController.generateReceipt(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Transaction not found'
      });
    });

    test('should return 404 when payment has no transaction', async () => {
      paymentService.getPaymentDetails.mockResolvedValue({ id: 'payment-123' });
      req.params = { transactionId: 'transaction-123' };

      await paymentController.generateReceipt(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Transaction not found'
      });
    });

    test('should handle receipt generation error', async () => {
      const error = new Error('PDF generation failed');
      paymentService.getPaymentDetails.mockRejectedValue(error);
      req.params = { transactionId: 'transaction-123' };

      await paymentController.generateReceipt(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getReceiptData', () => {
    test('should get receipt data successfully', async () => {
      const mockPayment = {
        transaction: {
          receiptNumber: 'RCP-002',
          transactionDate: new Date('2024-01-02'),
          amount: 15.00,
          paymentMethod: 'cash',
          status: 'completed',
          session: {
            vehicle: { licensePlate: 'XYZ-789' },
            space: { spaceNumber: '2B05' },
            entryTime: new Date('2024-01-02T14:00:00Z'),
            exitTime: new Date('2024-01-02T15:30:00Z'),
            durationMinutes: 90
          }
        }
      };

      paymentService.getPaymentDetails.mockResolvedValue(mockPayment);
      req.params = { transactionId: 'transaction-456' };

      await paymentController.getReceiptData(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          receiptNumber: 'RCP-002',
          transactionDate: mockPayment.transaction.transactionDate,
          licensePlate: 'XYZ-789',
          spaceNumber: '2B05',
          entryTime: mockPayment.transaction.session.entryTime,
          exitTime: mockPayment.transaction.session.exitTime,
          durationMinutes: 90,
          amount: 15.00,
          paymentMethod: 'cash',
          status: 'completed'
        }
      });
    });

    test('should return 404 when transaction not found for receipt data', async () => {
      paymentService.getPaymentDetails.mockResolvedValue(null);
      req.params = { transactionId: 'transaction-999' };

      await paymentController.getReceiptData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Transaction not found'
      });
    });

    test('should return 404 when payment has no transaction for receipt data', async () => {
      paymentService.getPaymentDetails.mockResolvedValue({ id: 'payment-789' });
      req.params = { transactionId: 'transaction-456' };

      await paymentController.getReceiptData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Transaction not found'
      });
    });

    test('should handle get receipt data error', async () => {
      const error = new Error('Database error');
      paymentService.getPaymentDetails.mockRejectedValue(error);
      req.params = { transactionId: 'transaction-456' };

      await paymentController.getReceiptData(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
