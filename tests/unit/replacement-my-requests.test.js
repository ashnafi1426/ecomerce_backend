/**
 * Unit tests for GET /api/replacements/my-requests endpoint
 * Tests Requirement 1.1: Customer can view their replacement request history
 */

const replacementController = require('../../controllers/replacementControllers/replacement.controller');

describe('ReplacementController - getMyReplacementRequests', () => {
  let mockReq, mockRes, mockReplacementService;

  beforeEach(() => {
    // Mock request object
    mockReq = {
      user: {
        id: 'customer-123',
        role: 'customer'
      },
      query: {}
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock replacement service
    mockReplacementService = {
      getCustomerReplacements: jest.fn()
    };
  });

  describe('Basic functionality', () => {
    it('should return paginated replacement requests for authenticated customer', async () => {
      // Arrange
      const mockReplacements = {
        requests: [
          {
            id: 'req-1',
            order_id: 'order-1',
            product_id: 'prod-1',
            customer_id: 'customer-123',
            status: 'pending',
            reason_category: 'defective',
            reason_description: 'Product not working',
            created_at: '2024-01-15T10:00:00Z'
          },
          {
            id: 'req-2',
            order_id: 'order-2',
            product_id: 'prod-2',
            customer_id: 'customer-123',
            status: 'approved',
            reason_category: 'damaged',
            reason_description: 'Package arrived damaged',
            created_at: '2024-01-10T15:30:00Z'
          }
        ],
        total: 2,
        totalPages: 1
      };

      mockReplacementService.getCustomerReplacements.mockResolvedValue(mockReplacements);

      // Act
      await replacementController.getMyReplacementRequests(mockReq, mockRes);

      // Assert
      expect(mockReplacementService.getCustomerReplacements).toHaveBeenCalledWith(
        'customer-123',
        { status: undefined, page: 1, limit: 20 }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          requests: mockReplacements.requests,
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1
        }
      });
    });

    it('should handle empty replacement requests list', async () => {
      // Arrange
      const mockReplacements = {
        requests: [],
        total: 0,
        totalPages: 0
      };

      mockReplacementService.getCustomerReplacements.mockResolvedValue(mockReplacements);

      // Act
      await replacementController.getMyReplacementRequests(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          requests: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        }
      });
    });
  });

  describe('Status filtering', () => {
    it('should filter by status when provided', async () => {
      // Arrange
      mockReq.query.status = 'pending';
      const mockReplacements = {
        requests: [
          {
            id: 'req-1',
            status: 'pending',
            order_id: 'order-1',
            product_id: 'prod-1'
          }
        ],
        total: 1,
        totalPages: 1
      };

      mockReplacementService.getCustomerReplacements.mockResolvedValue(mockReplacements);

      // Act
      await replacementController.getMyReplacementRequests(mockReq, mockRes);

      // Assert
      expect(mockReplacementService.getCustomerReplacements).toHaveBeenCalledWith(
        'customer-123',
        { status: 'pending', page: 1, limit: 20 }
      );
    });

    it('should support multiple status values', async () => {
      // Arrange
      const statuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
      
      for (const status of statuses) {
        mockReq.query.status = status;
        mockReplacementService.getCustomerReplacements.mockResolvedValue({
          requests: [],
          total: 0,
          totalPages: 0
        });

        // Act
        await replacementController.getMyReplacementRequests(mockReq, mockRes);

        // Assert
        expect(mockReplacementService.getCustomerReplacements).toHaveBeenCalledWith(
          'customer-123',
          { status, page: 1, limit: 20 }
        );
      }
    });
  });

  describe('Pagination', () => {
    it('should handle custom page and limit parameters', async () => {
      // Arrange
      mockReq.query.page = '2';
      mockReq.query.limit = '10';
      const mockReplacements = {
        requests: [],
        total: 25,
        totalPages: 3
      };

      mockReplacementService.getCustomerReplacements.mockResolvedValue(mockReplacements);

      // Act
      await replacementController.getMyReplacementRequests(mockReq, mockRes);

      // Assert
      expect(mockReplacementService.getCustomerReplacements).toHaveBeenCalledWith(
        'customer-123',
        { status: undefined, page: 2, limit: 10 }
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          requests: [],
          total: 25,
          page: 2,
          limit: 10,
          totalPages: 3
        }
      });
    });

    it('should default to page 1 and limit 20 when not provided', async () => {
      // Arrange
      const mockReplacements = {
        requests: [],
        total: 0,
        totalPages: 0
      };

      mockReplacementService.getCustomerReplacements.mockResolvedValue(mockReplacements);

      // Act
      await replacementController.getMyReplacementRequests(mockReq, mockRes);

      // Assert
      expect(mockReplacementService.getCustomerReplacements).toHaveBeenCalledWith(
        'customer-123',
        { status: undefined, page: 1, limit: 20 }
      );
    });

    it('should calculate totalPages correctly', async () => {
      // Arrange
      const mockReplacements = {
        requests: [],
        total: 45,
        totalPages: undefined // Service doesn't provide totalPages
      };

      mockReplacementService.getCustomerReplacements.mockResolvedValue(mockReplacements);

      // Act
      await replacementController.getMyReplacementRequests(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          requests: [],
          total: 45,
          page: 1,
          limit: 20,
          totalPages: 3 // 45 / 20 = 2.25, rounded up to 3
        }
      });
    });
  });

  describe('Error handling', () => {
    it('should handle service errors gracefully', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockReplacementService.getCustomerReplacements.mockRejectedValue(error);

      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await replacementController.getMyReplacementRequests(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database connection failed'
      });
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should handle service errors without message', async () => {
      // Arrange
      mockReplacementService.getCustomerReplacements.mockRejectedValue(new Error());

      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await replacementController.getMyReplacementRequests(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to get replacement requests'
      });

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Response structure validation', () => {
    it('should always include required fields in response', async () => {
      // Arrange
      const mockReplacements = {
        requests: [{ id: 'req-1' }],
        total: 1
      };

      mockReplacementService.getCustomerReplacements.mockResolvedValue(mockReplacements);

      // Act
      await replacementController.getMyReplacementRequests(mockReq, mockRes);

      // Assert
      const responseData = mockRes.json.mock.calls[0][0].data;
      expect(responseData).toHaveProperty('requests');
      expect(responseData).toHaveProperty('total');
      expect(responseData).toHaveProperty('page');
      expect(responseData).toHaveProperty('limit');
      expect(responseData).toHaveProperty('totalPages');
    });

    it('should handle service returning array instead of object', async () => {
      // Arrange
      const mockReplacements = [
        { id: 'req-1' },
        { id: 'req-2' }
      ];

      mockReplacementService.getCustomerReplacements.mockResolvedValue(mockReplacements);

      // Act
      await replacementController.getMyReplacementRequests(mockReq, mockRes);

      // Assert
      const responseData = mockRes.json.mock.calls[0][0].data;
      expect(responseData.requests).toEqual(mockReplacements);
      expect(responseData.total).toBe(0);
      expect(responseData.totalPages).toBe(0);
    });
  });
});

console.log('✅ Unit tests defined for getMyReplacementRequests endpoint');
console.log('   Run with: npm test -- replacement-my-requests.test.js');
