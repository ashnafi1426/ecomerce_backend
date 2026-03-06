const { stripe } = require('../../config/stripe.js');
const supabase = require('../../config/supabase.js');

/**
 * Stripe Webhook Handler
 * POST /api/webhooks/stripe
 *
 * Handles Stripe webhook events for payment lifecycle.
 * Uses Supabase instead of raw SQL pool since the project uses Supabase throughout.
 */
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    // Check for duplicate webhook (idempotency)
    const { data: existing } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single();

    if (existing) {
      console.log(`Duplicate webhook event ${event.id}, skipping`);
      return res.json({ received: true, duplicate: true });
    }

    // Log webhook event
    await supabase
      .from('webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        payload: event,
        processed: false
      });

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark webhook as processed
    await supabase
      .from('webhook_events')
      .update({ processed: true })
      .eq('stripe_event_id', event.id);

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent) {
  console.log(`Processing successful payment: ${paymentIntent.id}`);

  const { id: paymentIntentId, amount, metadata } = paymentIntent;

  // 1. Update payment record
  await supabase
    .from('payments')
    .update({ status: 'succeeded', updated_at: new Date().toISOString() })
    .eq('stripe_payment_intent_id', paymentIntentId);

  // 2. Parse metadata
  const orderItems = JSON.parse(metadata.order_items || '[]');
  const shippingAddress = JSON.parse(metadata.shipping_address || '{}');
  const userId = metadata.user_id === 'guest' ? null : metadata.user_id;

  // 3. Create order
  const orderData = {
    amount: amount,
    status: 'paid',
    payment_intent_id: paymentIntentId,
    shipping_address: shippingAddress,
    basket: orderItems,
    order_items: orderItems
  };

  if (userId) {
    orderData.user_id = userId;
  } else {
    orderData.guest_email = metadata.guest_email || shippingAddress.email;
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderData)
    .select('id')
    .single();

  if (orderError) {
    console.error('Error creating order from webhook:', orderError);
    throw orderError;
  }

  const orderId = order.id;

  // 4. Create order items
  for (const item of orderItems) {
    await supabase
      .from('order_items')
      .insert({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      });
  }

  // 5. Link payment to order
  await supabase
    .from('payments')
    .update({ order_id: orderId })
    .eq('stripe_payment_intent_id', paymentIntentId);

  console.log(`Order ${orderId} created successfully for payment ${paymentIntentId}`);

  return orderId;
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent) {
  console.log(`Payment failed: ${paymentIntent.id}`);

  await supabase
    .from('payments')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);
}

/**
 * Handle canceled payment
 */
async function handlePaymentCanceled(paymentIntent) {
  console.log(`Payment canceled: ${paymentIntent.id}`);

  await supabase
    .from('payments')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);
}

/**
 * Handle refund
 */
async function handleRefund(charge) {
  console.log(`Refund processed: ${charge.id}`);

  const paymentIntentId = charge.payment_intent;

  // Get payment and order
  const { data: payment, error } = await supabase
    .from('payments')
    .select('id, order_id')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  if (error || !payment) {
    console.error(`Payment not found for refund: ${paymentIntentId}`);
    return;
  }

  // Update order status
  if (payment.order_id) {
    await supabase
      .from('orders')
      .update({ status: 'refunded' })
      .eq('id', payment.order_id);
  }
}

module.exports = { handleStripeWebhook };
