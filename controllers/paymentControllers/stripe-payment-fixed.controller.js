// FIXED VERSION - Apply these changes to stripe-payment.controller.js
// 
// KEY CHANGES:
// 1. Added validation for seller_id before processing
// 2. Changed 'continue' to 'throw new Error()' for sub-order failures
// 3. Changed 'continue' to 'throw new Error()' for earnings failures
// 4. Added 'parent_order_id' field to earnings (instead of 'order_id')
// 5. Added better logging with ✅ indicators
// 6. Return earnings_created count in result

/**
 * Split Order by Sellers and Create Earnings - FIXED VERSION
 * Internal function to handle multi-vendor order splitting
 */
const splitOrderBySellers = async (orderId, orderItems) => {
  try {
    console.log('[Order Splitting] Starting for order:', orderId);
    
    // ✅ FIX 1: Validate inputs
    if (!orderId || !orderItems || orderItems.length === 0) {
      throw new Error('Invalid order data for splitting');
    }
    
    // Group items by seller
    const itemsBySeller = {};
    
    for (const item of orderItems) {
      const sellerId = item.seller_id;
      
      // ✅ FIX 2: Skip placeholder sellers or invalid seller IDs
      if (sellerId === 'placeholder-seller-id' || sellerId === 'default-seller' || !sellerId) {
        console.warn('[Order Splitting] Skipping item with invalid seller_id:', item.product_id);
        continue;
      }
      
      if (!itemsBySeller[sellerId]) {
        itemsBySeller[sellerId] = [];
      }
      
      itemsBySeller[sellerId].push(item);
    }
    
    const sellerIds = Object.keys(itemsBySeller);
    
    // ✅ FIX 3: Return error if no valid sellers
    if (sellerIds.length === 0) {
      console.warn('[Order Splitting] No valid sellers found in order');
      return {
        success: false,
        error: 'No valid sellers found in order items',
        sellers_count: 0
      };
    }
    
    console.log('[Order Splitting] Found sellers:', sellerIds.length);
    
    const subOrders = [];
    const earningsCreated = [];
    
    // Create sub-order and earnings for each seller
    for (const sellerId of sellerIds) {
      const sellerItems = itemsBySeller[sellerId];
      
      // Calculate subtotal
      const subtotal = sellerItems.reduce((sum, item) => sum + item.total, 0);
      const subtotalCents = Math.round(subtotal * 100);
      
      // Get commission rate (default to 10% if RPC fails)
      const categoryId = sellerItems[0].category_id || 1;
      let commissionRate = 10.00;
      let commissionAmount = Math.round(subtotalCents * 0.10);
      let netAmount = subtotalCents - commissionAmount;
      
      try {
        const { data: commissionData } = await supabase
          .rpc('calculate_seller_earnings', {
            seller_uuid: sellerId,
            gross_amount_cents: subtotalCents,
            category_id: categoryId
          });
        
        if (commissionData && commissionData[0]) {
          commissionRate = commissionData[0].commission_rate || 10.00;
          commissionAmount = commissionData[0].commission_amount || commissionAmount;
          netAmount = commissionData[0].net_amount || netAmount;
        }
      } catch (rpcError) {
        console.warn('[Order Splitting] RPC failed, using default commission:', rpcError.message);
      }
      
      // Create sub-order
      const { data: subOrder, error: subOrderError } = await supabase
        .from('sub_orders')
        .insert([{
          parent_order_id: orderId,
          seller_id: sellerId,
          items: sellerItems,
          subtotal: subtotalCents,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          seller_payout: netAmount,
          status: 'pending_fulfillment',
          fulfillment_status: 'pending'
        }])
        .select()
        .single();
      
      // ✅ FIX 4: Throw error instead of continue
      if (subOrderError) {
        console.error('[Order Splitting] Error creating sub-order:', subOrderError);
        throw new Error(`Failed to create sub-order for seller ${sellerId}: ${subOrderError.message}`);
      }
      
      subOrders.push(subOrder);
      console.log(`[Order Splitting] ✅ Created sub-order ${subOrder.id} for seller ${sellerId}`);
      
      // Create seller earnings record
      const availableDate = new Date();
      availableDate.setDate(availableDate.getDate() + 7); // 7 days holding period
      
      const { data: earning, error: earningsError } = await supabase
        .from('seller_earnings')
        .insert([{
          seller_id: sellerId,
          sub_order_id: subOrder.id,  // ✅ FIX 5: Include sub_order_id
          parent_order_id: orderId,   // ✅ FIX 6: Use parent_order_id instead of order_id
          gross_amount: subtotalCents,
          commission_amount: commissionAmount,
          net_amount: netAmount,
          commission_rate: commissionRate,
          status: 'pending',
          available_date: availableDate.toISOString().split('T')[0]
        }])
        .select()
        .single();
      
      // ✅ FIX 7: Throw error instead of just logging
      if (earningsError) {
        console.error('[Order Splitting] Error creating earnings:', earningsError);
        throw new Error(`Failed to create earnings for seller ${sellerId}: ${earningsError.message}`);
      }
      
      earningsCreated.push(earning);
      console.log(`[Order Splitting] ✅ Created earnings ${earning.id} for seller ${sellerId}`);
      console.log(`   Gross: $${(subtotalCents/100).toFixed(2)}, Commission: $${(commissionAmount/100).toFixed(2)}, Net: $${(netAmount/100).toFixed(2)}`);
    }
    
    console.log(`[Order Splitting] ✅ Complete: ${subOrders.length} sub-orders, ${earningsCreated.length} earnings created`);
    
    // ✅ FIX 8: Return earnings_created count
    return {
      success: true,
      sellers_count: sellerIds.length,
      sub_orders: subOrders.length,
      earnings_created: earningsCreated.length,
      is_multi_vendor: sellerIds.length > 1
    };
    
  } catch (error) {
    console.error('[Order Splitting] Fatal error:', error);
    console.error('[Order Splitting] Stack trace:', error.stack);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
};

// INSTRUCTIONS TO APPLY FIX:
// 1. Open: .kiro/specs/fastshop-ecommerce-platform/ecomerce_backend/controllers/paymentControllers/stripe-payment.controller.js
// 2. Find the splitOrderBySellers function (around line 330)
// 3. Replace the entire function body with the code above
// 4. Save the file
// 5. Restart the backend server
