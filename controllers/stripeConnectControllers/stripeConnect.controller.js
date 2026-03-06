const supabase = require('../../config/supabase');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * STRIPE CONNECT CONTROLLER
 * =========================
 *
 * Handles Stripe Connect Express account management:
 * 1. Create connected account for sellers
 * 2. Generate onboarding link
 * 3. Check account status
 * 4. Handle Connect webhooks
 */

/**
 * Create Stripe Express Connected Account for a seller
 * POST /api/connect/create-account
 */
const createConnectedAccount = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Verify user is a seller
    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .select('id, email, role, stripe_account_id, business_name')
      .eq('id', sellerId)
      .single();

    if (sellerError || !seller) {
      return res.status(404).json({ success: false, error: 'Seller not found' });
    }

    if (seller.role !== 'seller') {
      return res.status(403).json({ success: false, error: 'Only sellers can create connected accounts' });
    }

    // Check if already has a connected account
    if (seller.stripe_account_id) {
      return res.status(400).json({
        success: false,
        error: 'Stripe connected account already exists',
        stripe_account_id: seller.stripe_account_id
      });
    }

    // Create Express connected account
    const account = await stripe.accounts.create({
      type: 'express',
      email: seller.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: seller.business_name || undefined,
      },
      metadata: {
        seller_id: sellerId,
        platform: 'ecommerce_marketplace'
      }
    });

    // Save stripe_account_id to database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        stripe_account_id: account.id,
        stripe_onboarding_completed: false
      })
      .eq('id', sellerId);

    if (updateError) {
      console.error('[Stripe Connect] Error saving account ID:', updateError);
      return res.status(500).json({ success: false, error: 'Failed to save Stripe account' });
    }

    console.log(`[Stripe Connect] Created account ${account.id} for seller ${sellerId}`);

    res.json({
      success: true,
      account_id: account.id,
      message: 'Stripe connected account created. Complete onboarding to start receiving payments.'
    });

  } catch (error) {
    console.error('[Stripe Connect] Error creating account:', error);
    res.status(500).json({ success: false, error: 'Failed to create Stripe connected account', details: error.message });
  }
};

/**
 * Generate Stripe onboarding link for seller
 * POST /api/connect/onboarding-link
 */
const generateOnboardingLink = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Get seller's stripe_account_id
    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .select('stripe_account_id')
      .eq('id', sellerId)
      .single();

    if (sellerError || !seller) {
      return res.status(404).json({ success: false, error: 'Seller not found' });
    }

    if (!seller.stripe_account_id) {
      return res.status(400).json({
        success: false,
        error: 'No Stripe connected account found. Create one first.'
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: seller.stripe_account_id,
      refresh_url: `${frontendUrl}/seller/stripe-onboarding?refresh=true`,
      return_url: `${frontendUrl}/seller/stripe-onboarding?success=true`,
      type: 'account_onboarding',
    });

    console.log(`[Stripe Connect] Generated onboarding link for seller ${sellerId}`);

    res.json({
      success: true,
      url: accountLink.url,
      expires_at: accountLink.expires_at
    });

  } catch (error) {
    console.error('[Stripe Connect] Error generating onboarding link:', error);
    res.status(500).json({ success: false, error: 'Failed to generate onboarding link', details: error.message });
  }
};

/**
 * Get seller's Stripe account status
 * GET /api/connect/account-status
 */
const getAccountStatus = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Get seller's stripe_account_id
    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .select('stripe_account_id, stripe_onboarding_completed')
      .eq('id', sellerId)
      .single();

    if (sellerError || !seller) {
      return res.status(404).json({ success: false, error: 'Seller not found' });
    }

    if (!seller.stripe_account_id) {
      return res.json({
        success: true,
        status: 'not_created',
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
        onboarding_completed: false
      });
    }

    // Retrieve account from Stripe
    const account = await stripe.accounts.retrieve(seller.stripe_account_id);

    // Update onboarding status if newly completed
    const isFullyOnboarded = account.charges_enabled && account.payouts_enabled && account.details_submitted;

    if (isFullyOnboarded && !seller.stripe_onboarding_completed) {
      await supabase
        .from('users')
        .update({ stripe_onboarding_completed: true })
        .eq('id', sellerId);
    }

    res.json({
      success: true,
      status: isFullyOnboarded ? 'active' : 'pending',
      account_id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      onboarding_completed: isFullyOnboarded,
      requirements: account.requirements
    });

  } catch (error) {
    console.error('[Stripe Connect] Error getting account status:', error);
    res.status(500).json({ success: false, error: 'Failed to get account status', details: error.message });
  }
};

/**
 * Handle Stripe Connect webhook events
 * POST /api/connect/webhook
 */
const handleConnectWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('[Connect Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  console.log(`[Connect Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object;
        const isFullyOnboarded = account.charges_enabled && account.payouts_enabled && account.details_submitted;

        // Update seller's onboarding status
        await supabase
          .from('users')
          .update({ stripe_onboarding_completed: isFullyOnboarded })
          .eq('stripe_account_id', account.id);

        console.log(`[Connect Webhook] Account ${account.id} updated. Onboarded: ${isFullyOnboarded}`);
        break;
      }

      case 'transfer.created': {
        const transfer = event.data.object;
        // Update seller_earnings with confirmed transfer
        if (transfer.id) {
          await supabase
            .from('seller_earnings')
            .update({ status: 'processing' })
            .eq('stripe_transfer_id', transfer.id);
        }
        console.log(`[Connect Webhook] Transfer ${transfer.id} created`);
        break;
      }

      case 'transfer.reversed': {
        const transfer = event.data.object;
        // Update seller_earnings when transfer is reversed (refund)
        if (transfer.id) {
          await supabase
            .from('seller_earnings')
            .update({ status: 'refunded' })
            .eq('stripe_transfer_id', transfer.id);
        }
        console.log(`[Connect Webhook] Transfer ${transfer.id} reversed`);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        // Update payment status
        await supabase
          .from('payments')
          .update({ status: 'succeeded' })
          .eq('stripe_payment_intent_id', paymentIntent.id);
        console.log(`[Connect Webhook] PaymentIntent ${paymentIntent.id} succeeded`);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const status = charge.amount_refunded === charge.amount ? 'refunded' : 'partially_refunded';
        await supabase
          .from('payments')
          .update({ status })
          .eq('stripe_payment_intent_id', charge.payment_intent);
        console.log(`[Connect Webhook] Charge ${charge.id} refunded (${status})`);
        break;
      }

      default:
        console.log(`[Connect Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error(`[Connect Webhook] Error handling event ${event.type}:`, error);
    res.status(500).json({ error: 'Webhook handler error' });
  }
};

/**
 * Admin: Check any seller's Stripe status
 * GET /api/connect/seller-status/:sellerId
 */
const getSellerStripeStatus = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .select('id, email, business_name, stripe_account_id, stripe_onboarding_completed')
      .eq('id', sellerId)
      .single();

    if (sellerError || !seller) {
      return res.status(404).json({ success: false, error: 'Seller not found' });
    }

    if (!seller.stripe_account_id) {
      return res.json({
        success: true,
        seller_id: sellerId,
        email: seller.email,
        business_name: seller.business_name,
        stripe_status: 'not_connected',
        onboarding_completed: false
      });
    }

    // Get live status from Stripe
    const account = await stripe.accounts.retrieve(seller.stripe_account_id);

    res.json({
      success: true,
      seller_id: sellerId,
      email: seller.email,
      business_name: seller.business_name,
      stripe_account_id: seller.stripe_account_id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      onboarding_completed: account.charges_enabled && account.payouts_enabled && account.details_submitted
    });

  } catch (error) {
    console.error('[Stripe Connect] Error getting seller status:', error);
    res.status(500).json({ success: false, error: 'Failed to get seller Stripe status', details: error.message });
  }
};

module.exports = {
  createConnectedAccount,
  generateOnboardingLink,
  getAccountStatus,
  handleConnectWebhook,
  getSellerStripeStatus
};
