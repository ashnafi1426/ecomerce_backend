/**
 * ORDER TRACKING CONTROLLER
 * 
 * API endpoints for order tracking operations.
 * Handles order details retrieval, timeline viewing, order listing with filters,
 * status updates, and tracking information management.
 * 
 * Requirements: 7.1-7.7, 8.1, 8.4, 8.5, 9.1, 9.3, 9.4
 */

const orderTrackingService = require('../../services/orderTrackingServices/orderTracking.service');
const supabase = require('../../config/supabase');

/**
 * GET /api/orders/:id
 * Get detailed order with timeline, estimated delivery, tracking info,
 * replacement/refund requests, and sub-orders
 * 
 * Auth: Customer (owner), Seller (their orders), Admin
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7
 */
const getOrderDetails = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // First, try to fetch from orders table (parent orders)
    let { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        customer:users!orders_user_id_fkey(id, display_name, email),
        order_items(
          *,
          product:products(id, description, price, image_url)
        )
      `)
      .eq('id', orderId)
      .single();

    let isSubOrder = false;

    // If not found in orders table, check sub_orders table
    if (orderError && orderError.code === 'PGRST116') {
      // Try to fetch from sub_orders table
      const { data: subOrderData, error: subOrderError } = await supabase
        .from('sub_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (subOrderError) {
        return res.status(404).json({
          status: 'error',
          message: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      if (subOrderData) {
        isSubOrder = true;
        
        // Fetch parent order data for user_id and shipping_address
        const { data: parentOrder, error: parentError } = await supabase
          .from('orders')
          .select('user_id, shipping_address, payment_method, payment_status')
          .eq('id', subOrderData.parent_order_id)
          .single();

        if (parentError) {
          console.error('Error fetching parent order:', parentError);
          return res.status(500).json({
            status: 'error',
            message: 'Error fetching parent order data',
            code: 'INTERNAL_ERROR'
          });
        }

        // Fetch customer data
        const { data: customer, error: customerError } = await supabase
          .from('users')
          .select('id, display_name, email')
          .eq('id', parentOrder.user_id)
          .single();

        if (customerError) {
          console.error('Error fetching customer:', customerError);
        }

        // Fetch product details for items
        const itemsWithProducts = await Promise.all((subOrderData.items || []).map(async (item) => {
          try {
            const { data: product, error: productError } = await supabase
              .from('products')
              .select('id, title, description, price, image_url')
              .eq('id', item.product_id)
              .single();
            
            if (productError) {
              console.error(`Error fetching product ${item.product_id}:`, productError);
            }
            
            return {
              ...item,
              product: product || {
                id: item.product_id,
                description: item.title || item.name,
                price: item.price,
                image_url: item.image_url || null
              }
            };
          } catch (error) {
            console.error(`Failed to fetch product ${item.product_id}:`, error);
            return {
              ...item,
              product: {
                id: item.product_id,
                description: item.title || item.name,
                price: item.price,
                image_url: item.image_url || null
              }
            };
          }
        }));

        // Transform sub-order to match parent order structure
        order = {
          id: subOrderData.id,
          order_number: `SUB-${subOrderData.id.substring(0, 8)}`,
          user_id: parentOrder.user_id,
          customer: customer,
          status: subOrderData.fulfillment_status || 'pending',
          total_amount: subOrderData.total_amount,
          shipping_address: parentOrder?.shipping_address,
          payment_method: parentOrder?.payment_method,
          payment_status: parentOrder?.payment_status,
          order_items: itemsWithProducts,
          created_at: subOrderData.created_at,
          updated_at: subOrderData.updated_at,
          shipped_at: subOrderData.shipped_at,
          delivered_at: subOrderData.delivered_at,
          tracking_number: subOrderData.tracking_number,
          carrier: subOrderData.carrier,
          parent_order_id: subOrderData.parent_order_id,
          seller_id: subOrderData.seller_id,
          source: 'sub_orders'
        };
      }
    } else if (orderError) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // Debug logging for authorization
    console.log('[OrderTracking] Authorization check:', {
      userRole,
      userId,
      orderUserId: order.user_id,
      isSubOrder,
      orderId
    });

    // Authorization: Verify user owns the order or is seller/admin
    if (userRole === 'customer' && order.user_id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You do not have permission to access this order',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // For sellers, verify they have items in this order
    if (userRole === 'seller') {
      const { data: sellerItems, error: sellerError } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', orderId)
        .eq('seller_id', userId)
        .limit(1);

      if (sellerError || !sellerItems || sellerItems.length === 0) {
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: You do not have permission to access this order',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
    }

    // Build order timeline
    let timeline = [];
    try {
      timeline = await orderTrackingService.buildOrderTimeline(orderId);
    } catch (error) {
      console.error('Error building timeline:', error.message);
      // For sub-orders, timeline might not be available
      timeline = [];
    }

    // Calculate estimated delivery
    let estimatedDelivery = null;
    try {
      estimatedDelivery = await orderTrackingService.calculateEstimatedDelivery(orderId);
    } catch (error) {
      console.error('Error calculating estimated delivery:', error.message);
      // For sub-orders, estimated delivery might not be available
      estimatedDelivery = null;
    }

    // Get sub-order tracking for multi-seller orders
    let subOrders = [];
    try {
      subOrders = await orderTrackingService.getSubOrderTracking(orderId);
    } catch (error) {
      console.error('Error getting sub-order tracking:', error.message);
      // For sub-orders themselves, this might not be applicable
      subOrders = [];
    }

    // Get replacement requests
    const { data: replacementRequests, error: replacementError } = await supabase
      .from('replacement_requests')
      .select('*')
      .eq('order_id', orderId);

    if (replacementError) {
      console.error('Error fetching replacement requests:', replacementError);
    }

    // Get refund requests
    const { data: refundRequests, error: refundError } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('order_id', orderId);

    if (refundError) {
      console.error('Error fetching refund requests:', refundError);
    }

    // Prepare tracking info
    const trackingInfo = order.tracking_number ? {
      trackingNumber: order.tracking_number,
      carrier: order.carrier,
      shippedAt: order.shipped_at,
      estimatedDelivery: estimatedDelivery
    } : null;

    // Calculate total in dollars (convert from cents if needed)
    // For sub-orders, total_amount is in cents, for regular orders it might be in dollars
    let totalInDollars = 0;
    
    if (isSubOrder) {
      // For sub-orders: if total_amount is null/undefined, calculate from items
      if (order.total_amount !== null && order.total_amount !== undefined) {
        totalInDollars = order.total_amount / 100;
      } else {
        // Calculate from items array
        if (order.order_items && Array.isArray(order.order_items)) {
          totalInDollars = order.order_items.reduce((sum, item) => {
            const itemPrice = item.price || 0;
            const itemQuantity = item.quantity || 1;
            return sum + (itemPrice * itemQuantity);
          }, 0);
        }
      }
    } else {
      // For regular orders
      totalInDollars = order.total_amount || 0;
    }

    // Return complete order details
    res.status(200).json({
      success: true,  // Add success field for compatibility
      status: 'success',
      data: {
        // Flatten order data for compatibility with tests
        id: order.id,
        orderNumber: order.order_number,
        userId: order.user_id,
        customer: order.customer,
        status: order.status,
        totalAmount: order.total_amount,
        total: totalInDollars, // Add total field in dollars for frontend
        shippingAddress: order.shipping_address,
        shippingMethod: order.shipping_address?.method || 'standard',
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        items: order.order_items,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        shippedAt: order.shipped_at,
        deliveredAt: order.delivered_at,
        // Include nested order object for backward compatibility
        order: {
          id: order.id,
          orderNumber: order.order_number,
          userId: order.user_id,
          customer: order.customer,
          status: order.status,
          totalAmount: order.total_amount,
          total: totalInDollars, // Add total field in dollars for frontend
          shippingAddress: order.shipping_address,
          shippingMethod: order.shipping_address?.method || 'standard',
          paymentMethod: order.payment_method,
          paymentStatus: order.payment_status,
          items: order.order_items,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          shippedAt: order.shipped_at,
          deliveredAt: order.delivered_at
        },
        timeline,
        trackingInfo,
        estimatedDelivery,
        replacementRequests: replacementRequests || [],
        refundRequests: refundRequests || [],
        subOrders: subOrders || []
      }
    });
  } catch (error) {
    console.error('Error getting order details:', error);
    res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred. Please try again later.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * GET /api/orders/:id/timeline
 * Get order timeline
 * 
 * Auth: Customer (owner), Seller, Admin
 * Requirements: 7.2
 */
const getOrderTimeline = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Fetch order to verify ownership
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // Authorization: Verify user owns the order or is seller/admin
    if (userRole === 'customer' && order.user_id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You do not have permission to access this order',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // For sellers, verify they have items in this order
    if (userRole === 'seller') {
      const { data: sellerItems, error: sellerError } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', orderId)
        .eq('seller_id', userId)
        .limit(1);

      if (sellerError || !sellerItems || sellerItems.length === 0) {
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: You do not have permission to access this order',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
    }

    // Build order timeline
    const timeline = await orderTrackingService.buildOrderTimeline(orderId);

    res.status(200).json({
      status: 'success',
      data: {
        timeline
      }
    });
  } catch (error) {
    console.error('Error getting order timeline:', error);
    res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred. Please try again later.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * GET /api/orders
 * Get orders with filters and pagination
 * 
 * Auth: Customer (their orders), Admin (all orders)
 * Query params: status, search, page, limit
 * Requirements: 9.1, 9.3, 9.4
 */
const getOrdersWithFilters = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, search, page = 1, limit = 20 } = req.query;

    console.log('[OrderTracking] Fetching orders with filters:', { userId, userRole, status, search, page, limit });

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Try complex query first with proper error handling
    try {
      // Build query
      let query = supabase
        .from('orders')
        .select(`
          *,
          customer:users!orders_user_id_fkey(id, display_name, email),
          order_items(
            *,
            product:products(id, image_url)
          )
        `, { count: 'exact' });

      // Filter by user for customers
      if (userRole === 'customer') {
        query = query.eq('user_id', userId);
      }

      // Filter by status if provided
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      // Search by order number or product name
      if (search) {
        // For order number search
        if (search.match(/^[A-Z0-9-]+$/i)) {
          query = query.ilike('order_number', `%${search}%`);
        } else {
          // For product name search, we need to join with order_items and products
          // This is more complex, so we'll fetch and filter in memory
          // For now, just search order numbers
          query = query.ilike('order_number', `%${search}%`);
        }
      }

      // Apply pagination and sorting
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      const { data: orders, error, count } = await query;

      if (error) {
        console.error('[OrderTracking] Complex query failed:', error);
        throw error; // Fall through to simple query
      }

      // If searching by product name, filter results
      let filteredOrders = orders || [];
      if (search && !search.match(/^[A-Z0-9-]+$/i)) {
        filteredOrders = filteredOrders.filter(order => {
          return order.order_items?.some(item => 
            item.product?.name?.toLowerCase().includes(search.toLowerCase())
          );
        });
      }

      console.log(`[OrderTracking] ✅ Successfully fetched ${filteredOrders.length} orders`);

      return res.status(200).json({
        status: 'success',
        data: {
          orders: filteredOrders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count || 0,
            totalPages: Math.ceil((count || 0) / parseInt(limit))
          }
        }
      });
    } catch (complexQueryError) {
      console.error('[OrderTracking] Complex query failed, falling back to simple query:', complexQueryError);
      
      // Fallback to simple query without joins
      let simpleQuery = supabase
        .from('orders')
        .select('*', { count: 'exact' });

      // Filter by user for customers
      if (userRole === 'customer') {
        simpleQuery = simpleQuery.eq('user_id', userId);
      }

      // Filter by status if provided
      if (status && status !== 'all') {
        simpleQuery = simpleQuery.eq('status', status);
      }

      // Apply pagination and sorting
      simpleQuery = simpleQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      const { data: simpleOrders, error: simpleError, count: simpleCount } = await simpleQuery;

      if (simpleError) {
        console.error('[OrderTracking] Simple query also failed:', simpleError);
        throw simpleError;
      }

      // For each order, transform basket to items with product details
      const ordersWithItems = await Promise.all((simpleOrders || []).map(async (order) => {
        try {
          // Get basket items - handle both array and object formats
          let basketItems = [];
          if (Array.isArray(order.basket)) {
            basketItems = order.basket;
          } else if (order.basket && order.basket.items) {
            basketItems = order.basket.items;
          } else if (order.order_items) {
            basketItems = order.order_items;
          }
          
          // Fetch product details for each basket item
          const itemsWithDetails = await Promise.all(basketItems.map(async (item) => {
            try {
              const { data: product } = await supabase
                .from('products')
                .select('id, title, image_url, price')
                .eq('id', item.product_id)
                .single();
              
              return {
                ...item,
                product: product || {
                  id: item.product_id,
                  title: item.title || item.name,
                  image_url: item.image_url || null,
                  price: item.price
                }
              };
            } catch (productError) {
              console.error(`[OrderTracking] Failed to fetch product ${item.product_id}:`, productError);
              return {
                ...item,
                product: {
                  id: item.product_id,
                  title: item.title || item.name,
                  image_url: item.image_url || null,
                  price: item.price
                }
              };
            }
          }));
          
          return {
            ...order,
            order_items: itemsWithDetails,
            items: itemsWithDetails, // Add both for compatibility
            total: order.amount ? order.amount / 100 : order.total // Convert cents to dollars if needed
          };
        } catch (itemError) {
          console.error(`[OrderTracking] Failed to process items for order ${order.id}:`, itemError);
          return {
            ...order,
            order_items: [],
            items: []
          };
        }
      }));

      console.log(`[OrderTracking] ✅ Successfully fetched ${ordersWithItems.length} orders (simple query)`);

      return res.status(200).json({
        status: 'success',
        data: {
          orders: ordersWithItems,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: simpleCount || 0,
            totalPages: Math.ceil((simpleCount || 0) / parseInt(limit))
          }
        }
      });
    }
  } catch (error) {
    console.error('[OrderTracking] ❌ Error getting orders with filters:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'An unexpected error occurred. Please try again later.',
      code: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * PATCH /api/orders/:id/status
 * Update order status and emit WebSocket event
 * 
 * Auth: Seller (their orders), Admin
 * Body: { status, notes }
 * Requirements: 8.1, 8.4
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate status
    if (!status) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: [
          {
            field: 'status',
            message: 'Status is required'
          }
        ]
      });
    }

    // Fetch order to verify ownership
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // For sellers, verify they have items in this order
    if (userRole === 'seller') {
      const { data: sellerItems, error: sellerError } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', orderId)
        .eq('seller_id', userId)
        .limit(1);

      if (sellerError || !sellerItems || sellerItems.length === 0) {
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: You do not have permission to update this order',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
    }

    // Update order status
    const updatedOrder = await orderTrackingService.updateStatus(
      orderId,
      status,
      userId,
      { notes }
    );

    res.status(200).json({
      status: 'success',
      message: 'Order status updated successfully',
      data: {
        order: updatedOrder
      }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    
    if (error.message.includes('Invalid status')) {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        code: 'INVALID_STATUS'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred. Please try again later.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * PATCH /api/orders/:id/tracking
 * Add tracking information and emit WebSocket event
 * 
 * Auth: Seller (their orders), Admin
 * Body: { trackingNumber, carrier }
 * Requirements: 7.4, 8.5
 */
const addTrackingInfo = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const { trackingNumber, carrier } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate inputs
    if (!trackingNumber || !carrier) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: [
          ...(!trackingNumber ? [{ field: 'trackingNumber', message: 'Tracking number is required' }] : []),
          ...(!carrier ? [{ field: 'carrier', message: 'Carrier is required' }] : [])
        ]
      });
    }

    // Fetch order to verify ownership
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // For sellers, verify they have items in this order
    if (userRole === 'seller') {
      const { data: sellerItems, error: sellerError } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', orderId)
        .eq('seller_id', userId)
        .limit(1);

      if (sellerError || !sellerItems || sellerItems.length === 0) {
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: You do not have permission to update this order',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
    }

    // Add tracking information
    const updatedOrder = await orderTrackingService.addTracking(
      orderId,
      trackingNumber,
      carrier,
      userId
    );

    res.status(200).json({
      status: 'success',
      message: 'Tracking information added successfully',
      data: {
        order: updatedOrder,
        trackingInfo: {
          trackingNumber: updatedOrder.tracking_number,
          carrier: updatedOrder.carrier
        }
      }
    });
  } catch (error) {
    console.error('Error adding tracking information:', error);
    res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred. Please try again later.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

module.exports = {
  getOrderDetails,
  getOrderTimeline,
  getOrdersWithFilters,
  updateOrderStatus,
  addTrackingInfo
};
