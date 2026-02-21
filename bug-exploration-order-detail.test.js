/**
 * BUG EXPLORATION TEST - Order Detail 404 Fix
 * 
 * Property 1: Fault Condition - Sub-Order ID Returns 404 Error
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * DO NOT attempt to fix the test or the code when it fails
 * 
 * This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * 
 * GOAL: Surface counterexamples that demonstrate the bug exists
 * 
 * Expected Outcome on UNFIXED code: Test FAILS with 404 errors (this is correct - it proves the bug exists)
 * Expected Outcome on FIXED code: Test PASSES (confirms bug is fixed)
 */

const axios = require('axios');
const supabase = require('./config/supabase');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

/**
 * Helper: Get authentication token for a user
 */
async function getAuthToken(email, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email,
      password
    });
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Helper: Get sub-order IDs from database
 */
async function getSubOrderIds() {
  const { data, error } = await supabase
    .from('sub_orders')
    .select('id, parent_order_id, seller_id, items, total_amount, fulfillment_status')
    .limit(5);
  
  if (error) {
    console.error('Error fetching sub-orders:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Helper: Get parent order user_id for permission checks
 */
async function getParentOrderUserId(parentOrderId) {
  const { data, error } = await supabase
    .from('orders')
    .select('user_id')
    .eq('id', parentOrderId)
    .single();
  
  if (error) {
    console.error('Error fetching parent order:', error);
    return null;
  }
  
  return data?.user_id;
}

/**
 * Helper: Get user credentials by user_id
 */
async function getUserCredentials(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  
  // For testing, we'll use a default password
  // In production, you'd need proper test user setup
  return {
    email: data.email,
    password: 'password123' // Default test password
  };
}

/**
 * Bug Condition Function
 * Returns true when the order ID is a sub-order ID
 * (exists in sub_orders table but not in orders table)
 */
async function isBugCondition(orderId) {
  // Check if exists in sub_orders
  const { data: subOrder } = await supabase
    .from('sub_orders')
    .select('id')
    .eq('id', orderId)
    .single();
  
  // Check if exists in orders
  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .single();
  
  return subOrder !== null && order === null;
}

/**
 * Property 1: Fault Condition - Sub-Order Retrieval
 * 
 * FOR ALL X WHERE isBugCondition(X) DO
 *   result ← getOrderDetails'(X.orderId)
 *   ASSERT result.status = 200 AND 
 *          result.data IS NOT NULL AND
 *          result.data.id = X.orderId AND
 *          result.data.source = "sub_orders"
 * END FOR
 */
describe('Bug Exploration: Sub-Order 404 Fix', () => {
  let subOrderIds = [];
  
  beforeAll(async () => {
    // Get sub-order IDs from database
    subOrderIds = await getSubOrderIds();
    console.log(`\n[Bug Exploration] Found ${subOrderIds.length} sub-orders to test`);
    
    if (subOrderIds.length === 0) {
      console.warn('[Bug Exploration] WARNING: No sub-orders found in database. Test will be skipped.');
    }
  });
  
  test('should retrieve sub-order details with 200 status for all sub-order IDs', async () => {
    // Skip if no sub-orders found
    if (subOrderIds.length === 0) {
      console.log('[Bug Exploration] Skipping test - no sub-orders in database');
      return;
    }
    
    const results = [];
    
    for (const subOrder of subOrderIds) {
      console.log(`\n[Bug Exploration] Testing sub-order: ${subOrder.id}`);
      
      // Verify this is a bug condition (sub-order ID)
      const isBug = await isBugCondition(subOrder.id);
      console.log(`[Bug Exploration] Is bug condition: ${isBug}`);
      
      if (!isBug) {
        console.log(`[Bug Exploration] Skipping ${subOrder.id} - not a sub-order ID`);
        continue;
      }
      
      // Get parent order user_id for authentication
      const userId = await getParentOrderUserId(subOrder.parent_order_id);
      if (!userId) {
        console.log(`[Bug Exploration] Skipping ${subOrder.id} - cannot find parent order user`);
        continue;
      }
      
      // Get user credentials
      const credentials = await getUserCredentials(userId);
      if (!credentials) {
        console.log(`[Bug Exploration] Skipping ${subOrder.id} - cannot find user credentials`);
        continue;
      }
      
      try {
        // Get auth token
        const token = await getAuthToken(credentials.email, credentials.password);
        
        // Call GET /api/orders/:id with sub-order ID
        const response = await axios.get(`${API_BASE_URL}/api/orders/${subOrder.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // EXPECTED BEHAVIOR (after fix):
        // - Status should be 200
        // - Response should contain order data
        // - data.id should match the requested sub-order ID
        // - data should contain items, timeline, tracking
        
        console.log(`[Bug Exploration] Response status: ${response.status}`);
        console.log(`[Bug Exploration] Response data:`, JSON.stringify(response.data, null, 2));
        
        results.push({
          subOrderId: subOrder.id,
          status: response.status,
          success: response.data.success,
          hasData: response.data.data !== null && response.data.data !== undefined,
          dataId: response.data.data?.id,
          hasItems: Array.isArray(response.data.data?.items) && response.data.data.items.length > 0
        });
        
        // Assertions for expected behavior
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).not.toBeNull();
        expect(response.data.data.id).toBe(subOrder.id);
        expect(response.data.data.items).toBeDefined();
        expect(Array.isArray(response.data.data.items)).toBe(true);
        
        console.log(`[Bug Exploration] ✓ Sub-order ${subOrder.id} retrieved successfully`);
        
      } catch (error) {
        // ON UNFIXED CODE: This is expected to fail with 404
        // This is a COUNTEREXAMPLE that demonstrates the bug
        
        const status = error.response?.status;
        const errorMessage = error.response?.data?.message || error.message;
        
        console.log(`[Bug Exploration] ✗ COUNTEREXAMPLE FOUND:`);
        console.log(`[Bug Exploration]   Sub-order ID: ${subOrder.id}`);
        console.log(`[Bug Exploration]   Status: ${status}`);
        console.log(`[Bug Exploration]   Error: ${errorMessage}`);
        console.log(`[Bug Exploration]   Expected: 200 with order details`);
        console.log(`[Bug Exploration]   Actual: ${status} error`);
        
        results.push({
          subOrderId: subOrder.id,
          status: status,
          error: errorMessage,
          isCounterexample: true
        });
        
        // Re-throw to fail the test (expected on unfixed code)
        throw new Error(`Sub-order ${subOrder.id} returned ${status} instead of 200. Error: ${errorMessage}`);
      }
    }
    
    // Log summary
    console.log(`\n[Bug Exploration] Test Summary:`);
    console.log(`[Bug Exploration] Total sub-orders tested: ${results.length}`);
    console.log(`[Bug Exploration] Successful retrievals: ${results.filter(r => r.status === 200).length}`);
    console.log(`[Bug Exploration] Failed retrievals (counterexamples): ${results.filter(r => r.isCounterexample).length}`);
    
    // If we get here, all sub-orders were retrieved successfully (bug is fixed)
    console.log(`\n[Bug Exploration] ✓ All sub-orders retrieved successfully - bug is FIXED`);
  }, 30000); // 30 second timeout
  
  test('should include complete order details for sub-orders', async () => {
    // Skip if no sub-orders found
    if (subOrderIds.length === 0) {
      console.log('[Bug Exploration] Skipping test - no sub-orders in database');
      return;
    }
    
    // Test with first sub-order
    const subOrder = subOrderIds[0];
    
    // Verify this is a bug condition
    const isBug = await isBugCondition(subOrder.id);
    if (!isBug) {
      console.log(`[Bug Exploration] Skipping - ${subOrder.id} is not a sub-order ID`);
      return;
    }
    
    // Get parent order user_id for authentication
    const userId = await getParentOrderUserId(subOrder.parent_order_id);
    if (!userId) {
      console.log(`[Bug Exploration] Skipping - cannot find parent order user`);
      return;
    }
    
    // Get user credentials
    const credentials = await getUserCredentials(userId);
    if (!credentials) {
      console.log(`[Bug Exploration] Skipping - cannot find user credentials`);
      return;
    }
    
    try {
      // Get auth token
      const token = await getAuthToken(credentials.email, credentials.password);
      
      // Call GET /api/orders/:id with sub-order ID
      const response = await axios.get(`${API_BASE_URL}/api/orders/${subOrder.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Verify response structure includes all required fields
      expect(response.status).toBe(200);
      expect(response.data.data).toBeDefined();
      
      const orderData = response.data.data;
      
      // Verify required fields are present
      expect(orderData.id).toBe(subOrder.id);
      expect(orderData.items).toBeDefined();
      expect(Array.isArray(orderData.items)).toBe(true);
      expect(orderData.total).toBeDefined();
      expect(typeof orderData.total).toBe('number');
      
      // Verify items have product details
      if (orderData.items.length > 0) {
        const firstItem = orderData.items[0];
        expect(firstItem.product_id).toBeDefined();
        expect(firstItem.quantity).toBeDefined();
        expect(firstItem.price).toBeDefined();
      }
      
      console.log(`[Bug Exploration] ✓ Sub-order ${subOrder.id} has complete order details`);
      
    } catch (error) {
      // ON UNFIXED CODE: This is expected to fail
      const status = error.response?.status;
      const errorMessage = error.response?.data?.message || error.message;
      
      console.log(`[Bug Exploration] ✗ COUNTEREXAMPLE: Sub-order ${subOrder.id} returned ${status} - cannot verify complete details`);
      
      throw new Error(`Cannot verify complete details - endpoint returned ${status}: ${errorMessage}`);
    }
  }, 30000);
});

/**
 * EXPECTED TEST RESULTS:
 * 
 * ON UNFIXED CODE:
 * - Tests FAIL with 404 errors
 * - Counterexamples are logged showing sub-order IDs that return 404
 * - This confirms the bug exists
 * 
 * ON FIXED CODE:
 * - Tests PASS
 * - All sub-order IDs return 200 with complete order details
 * - This confirms the bug is fixed
 */
