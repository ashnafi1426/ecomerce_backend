import { stripe, stripeConfig } from '../../config/stripe.js';
import supabase from '../../config/supabase.js';
import { splitOrderBySeller, notifySellers } from '../../services/orderServices/order-splitting-with-email.service.js';

/**
 * Create Payment Intent
 * POST /api/payments/create-intent
 * 
 * Security: Recalculates all prices on backend
 * Never trusts frontend pricing
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const userId = req.user?.id; // Can be null for guest checkout
    const { cartItems, shippingAddress, billingAddress } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // 1. Fetch actual product prices from database (NEVER trust frontend)
    const productIds = cartItems.map(item => item.id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, price, title, status')
      .in('id', productIds);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    // 2. Validate all products exist and are available
    for (const cartItem of cartItems) {
      const product = products.find(p => p.id === cartItem.id);
      
      if (!product) {
        return res.status(400).json({ 
          error: `Product ${cartItem.id} not found` 
        });
      }
      
      if (product.status !== 'active') {
        return res.status(400).json({ 
          error: `Product "${product.title}" is not available` 
        });
      }
    }

    // 3. Calculate total from database prices
    let subtotal = 0;
    const orderItems = [];

    for (const cartItem of cartItems) {
      const product = products.find(p => p.id === cartItem.id);
      const itemTotal = parseFloat(product.price) * cartItem.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product_id: product.id,
        quantity: cartItem.quantity,
        price: parseFloat(product.price),
        title: product.title
      });
    }

    // 4. Calculate tax and shipping (customize based on your logic)
    const taxRate = 0.08; // 8% tax
    const tax = subtotal * taxRate;
    const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
    const total = subtotal + tax + shipping;

    // 5. Convert to cents for Stripe
    const amountInCents = Math.round(total * 100);

    // 6. Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: stripeConfig.currency,
      payment_method_types: stripeConfig.paymentMethodTypes,
      metadata: {
        user_id: userId || 'guest',
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        shipping: shipping.toFixed(2),
        total: total.toFixed(2),
        items_count: cartItems.length,
        order_items: JSON.stringify(orderItems),
        shipping_address: JSON.stringify(shippingAddress),
        billing_address: JSON.stringify(billingAddress),
        guest_email: shippingAddress?.email || billingAddress?.email || ''
      }
    });

    // 7. Store payment record (status: pending)
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: amountInCents,
        currency: stripeConfig.currency,
        status: 'pending',
        metadata: {
          subtotal,
          tax,
          shipping,
          total,
          items: orderItems
        }
      });

    if (paymentError) {
      console.error('Error storing payment:', paymentError);
      // Don't fail the request, payment intent is already created
    }

    // 8. Return client secret to frontend
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: total,
      breakdown: {
        subtotal,
        tax,
        shipping,
        total
      }
    });

  } catch (error) {
    console.error('Create Payment Intent Error:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      message: error.message 
    });
  }
};

/**
 * Get Payment Status
 * GET /api/payments/:paymentIntentId
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (error || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Also fetch from Stripe for real-time status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      payment,
      stripeStatus: paymentIntent.status,
      order_id: payment.order_id
    });

  } catch (error) {
    console.error('Get Payment Status Error:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
};

/**
 * Cancel Payment
 * POST /api/payments/:paymentIntentId/cancel
 */
export const cancelPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const userId = req.user?.id;

    // Verify payment belongs to user
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (fetchError || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Cancel on Stripe
    const canceledIntent = await stripe.paymentIntents.cancel(paymentIntentId);

    // Update database
    const { error: updateError } = await supabase
      .from('payments')
      .update({ 
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntentId);

    if (updateError) {
      console.error('Error updating payment status:', updateError);
    }

    res.json({
      message: 'Payment canceled successfully',
      status: canceledIntent.status
    });

  } catch (error) {
    console.error('Cancel Payment Error:', error);
    res.status(500).json({ error: 'Failed to cancel payment' });
  }
};

/**
 * Create Order After Payment Success (No Webhooks)
 * POST /api/payments/create-order
 * 
 * This endpoint is called by frontend after successful payment
 * It verifies the payment with Stripe before creating the order
 */
export const createOrderAfterPayment = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment Intent ID is required' });
    }

    // 1. Verify payment exists in our database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // 2. Check if order already exists for this payment
    if (payment.order_id) {
      return res.status(400).json({ 
        error: 'Order already created for this payment',
        order_id: payment.order_id
      });
    }

    // 3. Verify payment status with Stripe (CRITICAL - Never trust frontend)
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: 'Payment not successful',
        status: paymentIntent.status
      });
    }

    // 4. Extract order data from payment metadata
    const orderItems = JSON.parse(paymentIntent.metadata.order_items);
    const shippingAddress = JSON.parse(paymentIntent.metadata.shipping_address);
    const billingAddress = JSON.parse(paymentIntent.metadata.billing_address);

    // 5. Determine if this is a guest or registered user order
    const isGuest = !userId;
    
    // Try to get email from multiple sources
    let guestEmail = null;
    if (isGuest) {
      // Priority: billing address email > shipping address email > metadata guest_email
      guestEmail = billingAddress?.email || shippingAddress?.email || paymentIntent.metadata.guest_email;
      
      if (!guestEmail) {
        return res.status(400).json({ 
          error: 'Email is required for guest orders' 
        });
      }
    }
    
    const guestPhone = isGuest ? shippingAddress?.phone : null;

    // Generate tracking token for guest orders
    const trackingToken = isGuest ? `TRACK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : null;

    // 6. Create order (using actual orders table structure)
    // IMPORTANT: Must satisfy check_user_or_guest constraint
    // Either user_id OR guest_email must be set (not both, not neither)
    const orderData = {
      payment_intent_id: paymentIntentId,
      amount: paymentIntent.amount, // Amount in cents
      basket: orderItems, // Store items array directly in basket JSONB
      shipping_address: shippingAddress,
      status: 'paid', // Payment already succeeded, so status is 'paid'
      order_items: orderItems // Also store in order_items JSONB
    };

    // Add user_id for registered users OR guest_email for guests
    if (isGuest) {
      orderData.guest_email = guestEmail;
      orderData.guest_phone = guestPhone;
      orderData.order_tracking_token = trackingToken;
    } else {
      orderData.user_id = userId;
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return res.status(500).json({ 
        error: 'Failed to create order',
        message: orderError.message,
        details: orderError
      });
    }

    const orderId = order.id;

    // 7. Create order items and handle inventory
    for (const item of orderItems) {
      // Create order item with subtotal
      const itemSubtotal = item.price * item.quantity;
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderId,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          subtotal: itemSubtotal
        });

      if (itemError) {
        console.error('Error creating order item:', itemError);
      }

      // Check if there's an active reservation for this product
      const { data: reservation } = await supabase
        .from('inventory_reservations')
        .select('id')
        .eq('product_id', item.product_id)
        .eq('status', 'active')
        .or(`user_id.eq.${userId},session_id.eq.${paymentIntent.metadata.session_id || 'none'}`)
        .single();

      if (reservation) {
        // Convert reservation to order (deducts from inventory)
        const { error: conversionError } = await supabase.rpc('convert_reservation_to_order', {
          p_reservation_id: reservation.id,
          p_order_id: orderId
        });

        if (conversionError) {
          console.error('Error converting reservation:', conversionError);
          // Fallback to direct inventory deduction
          await supabase.rpc('decrement_inventory', {
            p_product_id: item.product_id,
            p_quantity: item.quantity
          });
        }
      } else {
        // No reservation found, directly deduct inventory
        const { error: inventoryError } = await supabase.rpc('decrement_inventory', {
          p_product_id: item.product_id,
          p_quantity: item.quantity
        });

        if (inventoryError) {
          console.error('Error updating inventory:', inventoryError);
          // Continue anyway - inventory can be manually adjusted
        }
      }
    }

    // 7. Update payment record with order_id
    const { error: updateError } = await supabase
      .from('payments')
      .update({ 
        order_id: orderId,
        status: 'succeeded',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntentId);

    if (updateError) {
      console.error('Error updating payment:', updateError);
    }

    // 8. PHASE 3: Split order by seller if multi-vendor
    try {
      console.log(`[Payment] Checking if order ${orderId} needs splitting...`);
      const splitResult = await splitOrderBySeller(orderId, orderItems);
      
      if (splitResult.isSplit) {
        console.log(`[Payment] Order split into ${splitResult.subOrders.length} sub-orders for ${splitResult.sellerCount} sellers`);
        
        // Notify sellers about their new orders (in-app + email)
        await notifySellers(splitResult.subOrders, orderId);
        console.log(`[Payment] Sellers notified successfully (in-app + email)`);
      } else {
        console.log(`[Payment] Single seller order, no splitting needed`);
      }
    } catch (splitError) {
      console.error('[Payment] Order splitting error:', splitError);
      // Don't fail the order creation - splitting can be done manually if needed
      // Order is already created successfully at this point
    }

    res.json({
      success: true,
      order_id: orderId,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Create Order After Payment Error:', error);
    res.status(500).json({ 
      error: 'Failed to create order',
      message: error.message 
    });
  }
};
