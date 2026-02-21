const refundService = require('../../services/refundServices/refund.service');

/**
 * Refund Controller
 * Handles HTTP requests for refund process
 * Implements Requirements 3.1, 3.3, 4.2, 4.3, 4.5, 13.1, 13.2, 15.1, 15.3, 15.6
 */
class RefundController {
  /**
   * Create refund request
   * POST /api/refunds
   * @access Customer
   * Implements Requirement 3.3
   */
  async createRefundRequest(req, res) {
    try {
      const customerId = req.user.id;
      const {
        orderId,
        productId,
        reason,
        description,
        photoUrls
      } = req.body;

      // Validate required fields
      if (!orderId || !productId || !reason || !description) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: orderId, productId, reason, description'
        });
      }

      const requestData = {
        orderId,
        productId,
        customerId,
        reason,
        description,
        photoUrls: photoUrls || []
      };

      const refund = await refundService.createRequest(requestData);

      res.status(201).json({
        success: true,
        message: 'Refund request created successfully',
        data: refund
      });
    } catch (error) {
      console.error('Error in createRefundRequest controller:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create refund request'
      });
    }
  }

  /**
   * Calculate refund amount
   * POST /api/refunds/calculate
   * @access Customer
   * Implements Requirement 3.6
   */
  async calculateRefundAmount(req, res) {
    try {
      const { orderId, productId } = req.body;

      // Validate required fields
      if (!orderId || !productId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: orderId, productId'
        });
      }

      const refundCalculation = await refundService.calculateRefundAmount(orderId, productId);

      res.status(200).json({
        success: true,
        data: refundCalculation
      });
    } catch (error) {
      console.error('Error in calculateRefundAmount controller:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to calculate refund amount'
      });
    }
  }

  /**
   * Get customer's refund requests
   * GET /api/refunds/my-requests
   * @access Customer
   * Implements Requirement 3.1
   */
  async getMyRefundRequests(req, res) {
    try {
      const customerId = req.user.id;
      const { status, page = 1, limit = 20 } = req.query;

      const filters = {
        customerId,
        status,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const refunds = await refundService.getCustomerRefunds(filters);

      res.status(200).json({
        success: true,
        data: {
          requests: refunds.requests || refunds,
          total: refunds.total || 0,
          page: filters.page,
          limit: filters.limit,
          totalPages: refunds.totalPages || Math.ceil((refunds.total || 0) / filters.limit)
        }
      });
    } catch (error) {
      console.error('Error in getMyRefundRequests controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get refund requests'
      });
    }
  }

  /**
   * Get refund requests for manager review
   * GET /api/refunds/manager-requests
   * @access Manager
   * Implements Requirement 4.2
   */
  async getManagerRefundRequests(req, res) {
    try {
      const { status, seller, page = 1, limit = 20 } = req.query;

      const filters = {
        status,
        sellerId: seller,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const refunds = await refundService.getManagerRefunds(filters);

      res.status(200).json({
        success: true,
        data: {
          requests: refunds.requests || refunds,
          total: refunds.total || 0,
          page: filters.page,
          limit: filters.limit,
          totalPages: refunds.totalPages || Math.ceil((refunds.total || 0) / filters.limit)
        }
      });
    } catch (error) {
      console.error('Error in getManagerRefundRequests controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get manager refund requests'
      });
    }
  }

  /**
   * Approve refund request (Manager)
   * PATCH /api/refunds/:id/approve
   * @access Manager
   * Implements Requirement 4.3
   */
  async approveRefundRequest(req, res) {
    try {
      const { id } = req.params;
      const managerId = req.user.id;

      const refund = await refundService.processApproval(id, managerId);

      res.status(200).json({
        success: true,
        message: 'Refund request approved and processed successfully',
        data: refund
      });
    } catch (error) {
      console.error('Error in approveRefundRequest controller:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to approve refund request'
      });
    }
  }

  /**
   * Reject refund request (Manager)
   * PATCH /api/refunds/:id/reject
   * @access Manager
   * Implements Requirement 4.5
   */
  async rejectRefundRequest(req, res) {
    try {
      const { id } = req.params;
      const managerId = req.user.id;
      const { reason } = req.body;

      if (!reason || reason.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }

      const refund = await refundService.processRejection(id, managerId, reason);

      res.status(200).json({
        success: true,
        message: 'Refund request rejected successfully',
        data: refund
      });
    } catch (error) {
      console.error('Error in rejectRefundRequest controller:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reject refund request'
      });
    }
  }

  /**
   * Get all refund requests (Admin)
   * GET /api/refunds/admin/all
   * @access Admin
   * Implements Requirements 15.1, 15.3
   */
  async getAllRefundRequestsAdmin(req, res) {
    try {
      const { status, seller, startDate, endDate, page = 1, limit = 20 } = req.query;

      const filters = {
        status,
        sellerId: seller,
        startDate,
        endDate,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      // Get all refund requests with filtering
      const refunds = await refundService.getAllRefunds(filters);

      // Calculate metrics for admin dashboard
      const metrics = await refundService.getRefundAnalytics(filters);

      res.status(200).json({
        success: true,
        data: {
          requests: refunds.requests || refunds,
          total: refunds.total || 0,
          page: filters.page,
          limit: filters.limit,
          totalPages: refunds.totalPages || Math.ceil((refunds.total || 0) / filters.limit),
          metrics: {
            totalRequests: metrics.total_requests || 0,
            totalAmount: metrics.total_amount || 0,
            pendingCount: metrics.pending_count || 0,
            approvedCount: metrics.approved_count || 0,
            rejectedCount: metrics.rejected_count || 0,
            completedCount: metrics.completed_count || 0,
            approvalRate: metrics.approval_rate || '0.0',
            rejectionRate: metrics.rejection_rate || '0.0',
            avgProcessingTime: metrics.avg_processing_time || '0',
            commonReasons: metrics.common_reasons || {}
          }
        }
      });
    } catch (error) {
      console.error('Error in getAllRefundRequestsAdmin controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get all refund requests'
      });
    }
  }

  /**
   * Get refund analytics
   * GET /api/refunds/analytics
   * @access Admin
   * Implements Requirements 13.1, 13.2, 15.2
   */
  async getRefundAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const filters = {
        startDate,
        endDate
      };

      const analytics = await refundService.getRefundAnalytics(filters);

      res.status(200).json({
        success: true,
        data: {
          totalRefunds: analytics.total_requests || 0,
          totalAmount: analytics.total_amount || 0,
          approvalRate: analytics.approval_rate || '0.0',
          avgProcessingTime: analytics.avg_processing_time || '0',
          statusBreakdown: {
            pending: analytics.pending_count || 0,
            processing: analytics.processing_count || 0,
            completed: analytics.completed_count || 0,
            rejected: analytics.rejected_count || 0,
            failed: analytics.failed_count || 0
          },
          reasonBreakdown: analytics.common_reasons || {},
          timeline: analytics.timeline || []
        }
      });
    } catch (error) {
      console.error('Error in getRefundAnalytics controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get refund analytics'
      });
    }
  }

  /**
   * Admin override of manager decision
   * POST /api/refunds/:id/override
   * @access Admin
   * Implements Requirement 15.6
   */
  async overrideRefundDecision(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const { action, reason } = req.body;

      // Validate action
      if (!action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Must be "approve" or "reject"'
        });
      }

      // Validate reason
      if (!reason || reason.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Override reason is required'
        });
      }

      let refund;
      if (action === 'approve') {
        refund = await refundService.processApproval(id, adminId);
      } else {
        refund = await refundService.processRejection(id, adminId, reason);
      }

      res.status(200).json({
        success: true,
        message: `Refund request ${action}d by admin override`,
        data: refund
      });
    } catch (error) {
      console.error('Error in overrideRefundDecision controller:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to override refund decision'
      });
    }
  }
}

module.exports = new RefundController();
