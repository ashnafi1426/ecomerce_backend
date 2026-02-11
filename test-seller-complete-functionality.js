/**
 * Complete Seller Functionality Test
 * 
 * Tests all seller dashboard features end-to-end:
 * 1. Seller login
 * 2. Dashboard stats
 * 3. Add product
 * 4. View products
 * 5. View orders
 * 6. Customer purchase flow
 * 7. Review system
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test credentials
const SELLER_CREDENTIALS = {
  email: 'seller@test.com',
  password: 'password123'
};

const CUSTOMER_CREDENTIALS = {
  email: 'customer@test.com',
  password: 'password123'
};

let sellerToken = '';
let customerToken = '';
let testProductId = '';
let testOrderId = '';

async function makeRequest(method, url, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method} ${url} failed:`, error.response?.data || error.message);
    throw error;
  }
}

async function testSellerLogin() {
  console.log('\n🔐 Testing Seller Login...');
  try {
    const response = await makeRequest('POST', '/auth/login', SELLER_CREDENTIALS);
    sellerToken = response.token;
    console.log('✅ Seller login successful');
    return true;
  } catch (error) {
    console.error('❌ Seller login failed');
    return false;
  }
}

async function testCustomerLogin() {
  console.log('\n🔐 Testing Customer Login...');
  try {
    const response = await makeRequest('POST', '/auth/login', CUSTOMER_CREDENTIALS);
    customerToken = response.token;
    console.log('✅ Customer login successful');
    return true;
  } catch (error) {
    console.error('❌ Customer login failed');
    return false;
  }
}

async function testSellerDashboard() {
  console.log('\n📊 Testing Seller Dashboard...');
  try {
    const response = await makeRequest('GET', '/seller/dashboard', null, sellerToken);
    console.log('✅ Dashboard stats loaded:', {
      productCount: response.data?.productCount || 0,
      pendingOrders: response.data?.pendingOrders || 0,
      totalEarnings: response.data?.balance?.total_earnings || 0
    });
    return true;
  } catch (error) {
    console.error('❌ Dashboard stats failed');
    return false;
  }
}

async function testAddProduct() {
  console.log('\n➕ Testing Add Product...');
  try {
    const productData = {
      title: 'Test Product - Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation. Perfect for music lovers and professionals.',
      price: 99.99,
      imageUrl: 'https://via.placeholder.com/400x400/667eea/ffffff?text=Headphones',
      categoryId: null,
      initialQuantity: 50,
      lowStockThreshold: 5
    };
    
    const response = await makeRequest('POST', '/seller/products', productData, sellerToken);
    testProductId = response.product?.id;
    console.log('✅ Product created successfully:', {
      id: testProductId,
      title: response.product?.title,
      status: response.product?.status,
      approvalStatus: response.product?.approval_status
    });
    return true;
  } catch (error) {
    console.error('❌ Add product failed');
    return false;
  }
}

async function testSellerProducts() {
  console.log('\n📦 Testing Seller Products List...');
  try {
    const response = await makeRequest('GET', '/seller/products', null, sellerToken);
    console.log('✅ Products loaded:', {
      count: response.count || 0,
      products: response.products?.length || 0
    });
    
    if (response.products && response.products.length > 0) {
      console.log('   Sample product:', {
        title: response.products[0].title,
        price: response.products[0].price,
        status: response.products[0].status
      });
    }
    return true;
  } catch (error) {
    console.error('❌ Seller products list failed');
    return false;
  }
}

async function testSellerOrders() {
  console.log('\n📋 Testing Seller Orders...');
  try {
    const response = await makeRequest('GET', '/seller/sub-orders', null, sellerToken);
    console.log('✅ Orders loaded:', {
      count: response.count || 0,
      orders: response.orders?.length || 0
    });
    
    if (response.orders && response.orders.length > 0) {
      console.log('   Sample order:', {
        id: response.orders[0].id,
        productName: response.orders[0].product_name,
        totalAmount: response.orders[0].total_amount,
        status: response.orders[0].fulfillment_status
      });
    }
    return true;
  } catch (error) {
    console.error('❌ Seller orders failed');
    return false;
  }
}

async function testCustomerBrowseProducts() {
  console.log('\n🛍️ Testing Customer Browse Products...');
  try {
    const response = await makeRequest('GET', '/products', null, customerToken);
    console.log('✅ Customer can browse products:', {
      count: response.count || 0,
      products: response.products?.length || 0
    });
    
    if (response.products && response.products.length > 0) {
      console.log('   Sample product for customer:', {
        title: response.products[0].title,
        price: response.products[0].price,
        seller: response.products[0].seller_name || 'Unknown'
      });
    }
    return true;
  } catch (error) {
    console.error('❌ Customer browse products failed');
    return false;
  }
}

async function testAddToCart() {
  console.log('\n🛒 Testing Add to Cart...');
  if (!testProductId) {
    console.log('⚠️ No test product ID available, skipping cart test');
    return false;
  }
  
  try {
    const response = await makeRequest('POST', '/cart/items', {
      productId: testProductId,
      quantity: 1
    }, customerToken);
    
    console.log('✅ Product added to cart successfully');
    return true;
  } catch (error) {
    console.error('❌ Add to cart failed');
    return false;
  }
}

async function testGetCart() {
  console.log('\n🛒 Testing Get Cart...');
  try {
    const response = await makeRequest('GET', '/cart', null, customerToken);
    console.log('✅ Cart retrieved:', {
      itemCount: response.items?.length || 0,
      total: response.total || 0
    });
    
    if (response.items && response.items.length > 0) {
      console.log('   Cart item:', {
        productName: response.items[0].product_name,
        quantity: response.items[0].quantity,
        price: response.items[0].price
      });
    }
    return true;
  } catch (error) {
    console.error('❌ Get cart failed');
    return false;
  }
}

async function testCreateOrder() {
  console.log('\n📝 Testing Create Order...');
  try {
    const orderData = {
      shippingAddress: {
        fullName: 'Test Customer',
        email: 'customer@test.com',
        address: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'United States',
        phone: '555-0123'
      },
      paymentMethod: 'test',
      paymentStatus: 'paid'
    };
    
    const response = await makeRequest('POST', '/orders', orderData, customerToken);
    testOrderId = response.order?.id;
    console.log('✅ Order created successfully:', {
      orderId: testOrderId,
      status: response.order?.status,
      amount: response.order?.amount
    });
    return true;
  } catch (error) {
    console.error('❌ Create order failed');
    return false;
  }
}

async function testCreateReview() {
  console.log('\n⭐ Testing Create Review...');
  if (!testProductId) {
    console.log('⚠️ No test product ID available, skipping review test');
    return false;
  }
  
  try {
    const reviewData = {
      productId: testProductId,
      rating: 5,
      title: 'Excellent Product!',
      comment: 'This product exceeded my expectations. Great quality and fast shipping!'
    };
    
    const response = await makeRequest('POST', '/reviews', reviewData, customerToken);
    console.log('✅ Review created successfully:', {
      rating: response.review?.rating,
      title: response.review?.title
    });
    return true;
  } catch (error) {
    console.error('❌ Create review failed');
    return false;
  }
}

async function testGetProductReviews() {
  console.log('\n⭐ Testing Get Product Reviews...');
  if (!testProductId) {
    console.log('⚠️ No test product ID available, skipping reviews test');
    return false;
  }
  
  try {
    const response = await makeRequest('GET', `/products/${testProductId}/reviews`, null, customerToken);
    console.log('✅ Product reviews retrieved:', {
      count: response.count || 0,
      reviews: response.reviews?.length || 0
    });
    
    if (response.reviews && response.reviews.length > 0) {
      console.log('   Sample review:', {
        rating: response.reviews[0].rating,
        title: response.reviews[0].title,
        author: response.reviews[0].user_name || 'Anonymous'
      });
    }
    return true;
  } catch (error) {
    console.error('❌ Get product reviews failed');
    return false;
  }
}

async function testSellerReviews() {
  console.log('\n⭐ Testing Seller Reviews...');
  try {
    const response = await makeRequest('GET', '/seller/reviews', null, sellerToken);
    console.log('✅ Seller reviews retrieved:', {
      count: response.count || 0,
      reviews: response.reviews?.length || 0
    });
    
    if (response.reviews && response.reviews.length > 0) {
      console.log('   Sample review for seller:', {
        rating: response.reviews[0].rating,
        productTitle: response.reviews[0].products?.title,
        customerName: response.reviews[0].users?.display_name
      });
    }
    return true;
  } catch (error) {
    console.error('❌ Seller reviews failed');
    return false;
  }
}

async function runCompleteTest() {
  console.log('🚀 Starting Complete Seller Functionality Test...\n');
  
  const results = {
    sellerLogin: false,
    customerLogin: false,
    sellerDashboard: false,
    addProduct: false,
    sellerProducts: false,
    sellerOrders: false,
    customerBrowseProducts: false,
    addToCart: false,
    getCart: false,
    createOrder: false,
    createReview: false,
    getProductReviews: false,
    sellerReviews: false
  };
  
  // Test seller functionality
  results.sellerLogin = await testSellerLogin();
  if (results.sellerLogin) {
    results.sellerDashboard = await testSellerDashboard();
    results.addProduct = await testAddProduct();
    results.sellerProducts = await testSellerProducts();
    results.sellerOrders = await testSellerOrders();
    results.sellerReviews = await testSellerReviews();
  }
  
  // Test customer functionality
  results.customerLogin = await testCustomerLogin();
  if (results.customerLogin) {
    results.customerBrowseProducts = await testCustomerBrowseProducts();
    results.addToCart = await testAddToCart();
    results.getCart = await testGetCart();
    results.createOrder = await testCreateOrder();
    results.createReview = await testCreateReview();
    results.getProductReviews = await testGetProductReviews();
  }
  
  // Print summary
  console.log('\n📊 TEST RESULTS SUMMARY:');
  console.log('========================');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  });
  
  console.log(`\n🎯 Overall: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Seller functionality is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the issues above.');
  }
  
  return results;
}

// Run the complete test
runCompleteTest().catch(console.error);