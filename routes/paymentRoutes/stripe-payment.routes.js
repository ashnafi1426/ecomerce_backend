const express = require('express');
const router = express.Router();
const supabase = require('../../config/supabase.js');
const { authenticate, optionalAuthenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

// Import Stripe payment controller
const {
  createPaymentIntent,
  createOrderAfterPayment,
  getPaymentStatus,
  processRefund
} = require('../../controllers/paymentControllers/stripe-payment.controller');

// ============================================
// STRIPE PAYMENT ROUTES
// ============================================

/**
 * Create Stripe Payment Intent
 * POST /api/stripe/create-intent
 * 
 * Creates a payment intent with backend price validation
 * Supports both authenticated users and guest checkout
 */
router.post('/create-intent', optionalAuthenticate, createPaymentIntent);

/**
 * Create Order After Payment Success
 * POST /api/stripe/create-order
 * 
 * Called after Stripe payment succeeds to:
 * 1. Verify payment with Stripe
 * 2. Create order in database
 * 3. Split order by sellers
 * 4. Create seller earnings records
 */
router.post('/create-order', optionalAuthenticate, createOrderAfterPayment);

/**
 * Get Payment Status
 * GET /api/stripe/status/:paymentIntentId
 * 
 * Returns payment status from both Stripe and database
 */
router.get('/status/:paymentIntentId', getPaymentStatus);

/**
 * Process Refund (Admin Only)
 * POST /api/stripe/refund/:paymentId
 * 
 * Processes refund through Stripe and updates database
 */
router.post('/refund/:paymentId', authenticate, requireAdmin, processRefund);

// ============================================
// SELLER PAYOUT ROUTES
// ============================================

/**
 * Get Seller Earnings
 * GET /api/stripe/seller/earnings
 */
router.get('/seller/earnings', authenticate, async (req, res) => {
  try {
    const sellerId = req.user.id;
    
    // Get seller earnings with available balance calculation
    const { data: earnings, error } = await supabase
      .from('seller_earnings')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    
    if (error) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch earnings' 
      });
    }
    
    // Calculate balances
    const stats = {
      total_earnings: 0,
      available_balance: 0,
      pending_balance: 0,
      paid_balance: 0
    };
    
    earnings?.forEach(earning => {
      const amount = earning.net_amount || 0;
      stats.total_earnings += amount;
      
      if (earning.status === 'available') {
        stats.available_balance += amount;
      } else if (earning.status === 'pending') {
        stats.pending_balance += amount;
      } else if (earning.status === 'paid') {
        stats.paid_balance += amount;
      }
    });
    
    res.json({
      success: true,
      stats: {
        // Convert from cents to dollars
        total_earnings: stats.total_earnings / 100,
        available_balance: stats.available_balance / 100,
        pending_balance: stats.pending_balance / 100,
        paid_balance: stats.paid_balance / 100
      },
      earnings: earnings || []
    });
    
  } catch (error) {
    console.error('[Seller Earnings] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch seller earnings' 
    });
  }
});

/**
 * Request Payout
 * POST /api/stripe/seller/payout/request
 */
router.post('/seller/payout/request', authenticate, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { amount, method = 'stripe_connect' } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid payout amount' 
      });
    }
    
    const amountInCents = Math.round(amount * 100);
    
    // Check available balance
    const { data: earnings, error: earningsError } = await supabase
      .from('seller_earnings')
      .select('net_amount')
      .eq('seller_id', sellerId)
      .eq('status', 'available')
      .lte('available_date', new Date().toISOString().split('T')[0]);
    
    if (earningsError) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to check balance' 
      });
    }
    
    const availableBalance = earnings?.reduce((sum, e) => sum + (e.net_amount || 0), 0) || 0;
    
    if (amountInCents > availableBalance) {
      return res.status(400).json({ 
        success: false, 
        error: 'Insufficient available balance' 
      });
    }
    
    // Create payout request
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .insert([{
        seller_id: sellerId,
        amount: amountInCents,
        method: method,
        status: 'pending_approval',
        requested_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (payoutError) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create payout request' 
      });
    }
    
    res.json({
      success: true,
      payout_id: payout.id,
      amount: amount,
      status: 'pending_approval',
      message: 'Payout request submitted successfully'
    });
    
  } catch (error) {
    console.error('[Payout Request] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to request payout' 
    });
  }
});

/**
 * Get Seller Payouts
 * GET /api/stripe/seller/payouts
 */
router.get('/seller/payouts', authenticate, async (req, res) => {
  try {
    const sellerId = req.user.id;
    
    const { data: payouts, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    
    if (error) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch payouts' 
      });
    }
    
    res.json({
      success: true,
      payouts: payouts || []
    });
    
  } catch (error) {
    console.error('[Seller Payouts] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch payouts' 
    });
  }
});

// ============================================
// ADMIN PAYMENT MANAGEMENT ROUTES
// ============================================

/**
 * Get All Payments (Admin)
 * GET /api/stripe/admin/payments
 */
router.get('/admin/payments', authenticate, requireAdmin, async (req, res) => {
  try {
    const adminStripeController = require('../../controllers/paymentControllers/admin-stripe-payment.controller');
    return await adminStripeController.getAllPayments(req, res);
  } catch (error) {
    console.error('[Admin Payments] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch payments' 
    });
  }
});

/**
 * Get Payment Statistics (Admin)
 * GET /api/stripe/admin/statistics
 */
router.get('/admin/statistics', authenticate, requireAdmin, async (req, res) => {
  try {
    const adminStripeController = require('../../controllers/paymentControllers/admin-stripe-payment.controller');
    return await adminStripeController.getPaymentStatistics(req, res);
  } catch (error) {
    console.error('[Admin Statistics] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to calculate statistics' 
    });
  }
});

/**
 * Process Refund (Admin)
 * POST /api/stripe/admin/refund/:paymentId
 */
router.post('/admin/refund/:paymentId', authenticate, requireAdmin, async (req, res) => {
  try {
    const adminStripeController = require('../../controllers/paymentControllers/admin-stripe-payment.controller');
    return await adminStripeController.processRefund(req, res);
  } catch (error) {
    console.error('[Admin Refund] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process refund' 
    });
  }
});

/**
 * Process Payout (Admin)
 * POST /api/stripe/admin/payout
 */
router.post('/admin/payout', authenticate, requireAdmin, async (req, res) => {
  try {
    const adminStripeController = require('../../controllers/paymentControllers/admin-stripe-payment.controller');
    return await adminStripeController.processPayout(req, res);
  } catch (error) {
    console.error('[Admin Payout] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process payout' 
    });
  }
});

/**
 * Get Sellers (Admin)
 * GET /api/stripe/admin/sellers
 */
router.get('/admin/sellers', authenticate, requireAdmin, async (req, res) => {
  try {
    const adminStripeController = require('../../controllers/paymentControllers/admin-stripe-payment.controller');
    return await adminStripeController.getSellers(req, res);
  } catch (error) {
    console.error('[Admin Sellers] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch sellers' 
    });
  }
});

/**
 * Approve Payout (Admin)
 * POST /api/stripe/admin/payout/:payoutId/approve
 */
router.post('/admin/payout/:payoutId/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const { payoutId } = req.params;
    const adminId = req.user.id;
    
    // Update payout status
    const { data: payout, error } = await supabase
      .from('payouts')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: adminId
      })
      .eq('id', payoutId)
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to approve payout' 
      });
    }
    
    // TODO: Process actual payout with Stripe Connect or bank transfer
    
    res.json({
      success: true,
      payout_id: payoutId,
      status: 'approved',
      message: 'Payout approved successfully'
    });
    
  } catch (error) {
    console.error('[Approve Payout] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to approve payout' 
    });
  }
});

/**
 * Process Earnings Availability (Admin)
 * POST /api/stripe/admin/process-earnings
 */
router.post('/admin/process-earnings', authenticate, requireAdmin, async (req, res) => {
  try {
    const { processEarningsAvailability } = require('../../controllers/paymentControllers/stripe-payment.controller');
    
    await processEarningsAvailability();
    
    res.json({
      success: true,
      message: 'Earnings availability processed successfully'
    });
    
  } catch (error) {
    console.error('[Process Earnings] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process earnings availability' 
    });
  }
});


// Get payment status
router.get('/payment-status/:paymentIntentId', authenticate, getPaymentStatus);

module.exports = router;