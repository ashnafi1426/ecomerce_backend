/**
 * ORDER TRACKING WEBSOCKET HANDLER TESTS
 * 
 * Unit tests for WebSocket connection authentication and order ownership verification
 */

const { verifyOrderOwnership } = require('./order-tracking.handler');
const supabase = require('../config/supabase');

// Mock Supabase
jest.mock('../config/supabase', () => ({
  from: jest.fn()
}));

describe('Order Tracking WebSocket Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyOrderOwnership', () => {
    it('should allow admin to access any order', async () => {
      const orderId = 'order-123';
      const userId = 'admin-456';
      const userRole = 'admin';

      const result = await verifyOrderOwnership(orderId, userId, userRole);

      expect(result).toBe(true);
      // Should not query database for admins
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should allow customer to access their own order', async () => {
      const orderId = 'order-123';
      const userId = 'customer-456';
      const userRole = 'customer';

      // Mock order query
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { user_id: userId },
        error: null
      });

      supabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
        single: mockSingle
      });

      mockEq.mockReturnValue({
        single: mockSingle
      });

      const result = await verifyOrderOwnership(orderId, userId, userRole);

      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('orders');
    });

    it('should deny customer access to another customer\'s order', async () => {
      const orderId = 'order-123';
      const userId = 'customer-456';
      const userRole = 'customer';

      // Mock order query - different user_id
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { user_id: 'different-customer-789' },
        error: null
      });

      supabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
        single: mockSingle
      });

      mockEq.mockReturnValue({
        single: mockSingle
      });

      const result = await verifyOrderOwnership(orderId, userId, userRole);

      expect(result).toBe(false);
    });

    it('should allow seller to access their sub-order', async () => {
      const orderId = 'order-123';
      const userId = 'seller-456';
      const userRole = 'seller';

      // Mock order query - different user_id (not the seller)
      const mockOrderSelect = jest.fn().mockReturnThis();
      const mockOrderEq = jest.fn().mockReturnThis();
      const mockOrderSingle = jest.fn().mockResolvedValue({
        data: { user_id: 'customer-789' },
        error: null
      });

      // Mock sub_orders query - seller has a sub-order
      const mockSubOrderSelect = jest.fn().mockReturnThis();
      const mockSubOrderEq1 = jest.fn().mockReturnThis();
      const mockSubOrderEq2 = jest.fn().mockReturnThis();
      const mockSubOrderLimit = jest.fn().mockResolvedValue({
        data: [{ id: 'sub-order-1' }],
        error: null
      });

      // First call is for orders table
      supabase.from.mockReturnValueOnce({
        select: mockOrderSelect,
        eq: mockOrderEq,
        single: mockOrderSingle
      });

      mockOrderSelect.mockReturnValue({
        eq: mockOrderEq,
        single: mockOrderSingle
      });

      mockOrderEq.mockReturnValue({
        single: mockOrderSingle
      });

      // Second call is for sub_orders table
      supabase.from.mockReturnValueOnce({
        select: mockSubOrderSelect,
        eq: mockSubOrderEq1
      });

      mockSubOrderSelect.mockReturnValue({
        eq: mockSubOrderEq1
      });

      mockSubOrderEq1.mockReturnValue({
        eq: mockSubOrderEq2
      });

      mockSubOrderEq2.mockReturnValue({
        limit: mockSubOrderLimit
      });

      const result = await verifyOrderOwnership(orderId, userId, userRole);

      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('orders');
      expect(supabase.from).toHaveBeenCalledWith('sub_orders');
    });

    it('should deny seller access to order they are not fulfilling', async () => {
      const orderId = 'order-123';
      const userId = 'seller-456';
      const userRole = 'seller';

      // Mock order query - different user_id
      const mockOrderSelect = jest.fn().mockReturnThis();
      const mockOrderEq = jest.fn().mockReturnThis();
      const mockOrderSingle = jest.fn().mockResolvedValue({
        data: { user_id: 'customer-789' },
        error: null
      });

      // Mock sub_orders query - no sub-orders for this seller
      const mockSubOrderSelect = jest.fn().mockReturnThis();
      const mockSubOrderEq1 = jest.fn().mockReturnThis();
      const mockSubOrderEq2 = jest.fn().mockReturnThis();
      const mockSubOrderLimit = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });

      // First call is for orders table
      supabase.from.mockReturnValueOnce({
        select: mockOrderSelect,
        eq: mockOrderEq,
        single: mockOrderSingle
      });

      mockOrderSelect.mockReturnValue({
        eq: mockOrderEq,
        single: mockOrderSingle
      });

      mockOrderEq.mockReturnValue({
        single: mockOrderSingle
      });

      // Second call is for sub_orders table
      supabase.from.mockReturnValueOnce({
        select: mockSubOrderSelect,
        eq: mockSubOrderEq1
      });

      mockSubOrderSelect.mockReturnValue({
        eq: mockSubOrderEq1
      });

      mockSubOrderEq1.mockReturnValue({
        eq: mockSubOrderEq2
      });

      mockSubOrderEq2.mockReturnValue({
        limit: mockSubOrderLimit
      });

      const result = await verifyOrderOwnership(orderId, userId, userRole);

      expect(result).toBe(false);
    });

    it('should return false when order is not found', async () => {
      const orderId = 'non-existent-order';
      const userId = 'customer-456';
      const userRole = 'customer';

      // Mock order query - order not found
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Order not found' }
      });

      supabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
        single: mockSingle
      });

      mockEq.mockReturnValue({
        single: mockSingle
      });

      const result = await verifyOrderOwnership(orderId, userId, userRole);

      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const orderId = 'order-123';
      const userId = 'customer-456';
      const userRole = 'customer';

      // Mock order query - database error
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      supabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
        single: mockSingle
      });

      mockEq.mockReturnValue({
        single: mockSingle
      });

      const result = await verifyOrderOwnership(orderId, userId, userRole);

      expect(result).toBe(false);
    });
  });
});
