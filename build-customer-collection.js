#!/usr/bin/env node
/**
 * BUILD COMPLETE CUSTOMER POSTMAN COLLECTION
 * Generates a comprehensive customer collection with all endpoints
 */

const fs = require('fs');

// Base collection structure
const collection = {
  info: {
    name: "E-Commerce Customer API - Complete",
    description: "Complete customer Postman collection. Register/Login first, then test all customer operations.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    version: "1.0.0"
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5004", type: "string" },
    { key: "customerToken", value: "", type: "string" },
    { key: "productId", value: "", type: "string" },
    { key: "categoryId", value: "", type: "string" },
    { key: "cartItemId", value: "", type: "string" },
    { key: "orderId", value: "", type: "string" },
    { key: "addressId", value: "", type: "string" },
    { key: "reviewId", value: "", type: "string" },
    { key: "returnId", value: "", type: "string" },
    { key: "paymentIntentId", value: "", type: "string" }
  ],
  item: []
};

// Helper to create request
const req = (name, method, path, body = null, saveVar = null, noAuth = false) => {
  const request = {
    name,
    request: {
      method,
      header: noAuth ? [] : [{ key: "Authorization", value: "Bearer {{customerToken}}", type: "text" }],
      url: {
        raw: `{{baseUrl}}${path}`,
        host: ["{{baseUrl}}"],
        path: path.split('/').filter(p => p)
      }
    }
  };

  if (body) {
    request.request.header.push({ key: "Content-Type", value: "application/json" });
    request.request.body = { mode: "raw", raw: JSON.stringify(body, null, 2) };
  }

  if (saveVar) {
    request.event = [{
      listen: "test",
      script: {
        exec: [
          `if (pm.response.code === 200 || pm.response.code === 201) {`,
          `  var data = pm.response.json();`,
          `  pm.collectionVariables.set('${saveVar}', data.${saveVar} || data.id);`,
          `}`
        ]
      }
    }];
  }

  return request;
};

// 0. Health Check
collection.item.push({
  name: "0. Health Check",
  item: [req("Health Check", "GET", "/api/v1/health", null, null, true)]
});

// 1. Customer Authentication
collection.item.push({
  name: "1. Customer Authentication",
  item: [
    {
      name: "Register Customer",
      event: [{
        listen: "test",
        script: {
          exec: [
            "if (pm.response.code === 200 || pm.response.code === 201) {",
            "  var data = pm.response.json();",
            "  if (data.token) {",
            "    pm.collectionVariables.set('customerToken', data.token);",
            "  }",
            "}"
          ]
        }
      }],
      request: {
        method: "POST",
        header: [{ key: "Content-Type", value: "application/json" }],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            email: "customer@test.com",
            password: "Customer123!",
            displayName: "Test Customer"
          }, null, 2)
        },
        url: {
          raw: "{{baseUrl}}/api/auth/register",
          host: ["{{baseUrl}}"],
          path: ["api", "auth", "register"]
        }
      }
    },
    {
      name: "Login Customer",
      event: [{
        listen: "test",
        script: {
          exec: [
            "if (pm.response.code === 200) {",
            "  pm.collectionVariables.set('customerToken', pm.response.json().token);",
            "}"
          ]
        }
      }],
      request: {
        method: "POST",
        header: [{ key: "Content-Type", value: "application/json" }],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            email: "customer@test.com",
            password: "Customer123!"
          }, null, 2)
        },
        url: {
          raw: "{{baseUrl}}/api/auth/login",
          host: ["{{baseUrl}}"],
          path: ["api", "auth", "login"]
        }
      }
    },
    req("Get My Profile", "GET", "/api/auth/me"),
    req("Update My Profile", "PUT", "/api/auth/profile", {
      displayName: "Updated Customer",
      phone: "+1234567890"
    })
  ]
});

// 2. Browse Products & Categories
collection.item.push({
  name: "2. Browse Products & Categories",
  item: [
    req("Get All Categories", "GET", "/api/categories", null, null, true),
    req("Get Category by ID", "GET", "/api/categories/{{categoryId}}", null, null, true),
    req("Get All Products", "GET", "/api/products", null, null, true),
    req("Get Product by ID", "GET", "/api/products/{{productId}}", null, null, true),
    req("Search Products", "GET", "/api/products/search?q=phone", null, null, true),
    req("Get Products by Category", "GET", "/api/products?category={{categoryId}}", null, null, true),
    req("Get Featured Products", "GET", "/api/products?featured=true", null, null, true),
    req("Get Products with Pagination", "GET", "/api/products?page=1&limit=10", null, null, true)
  ]
});

// 3. Shopping Cart
collection.item.push({
  name: "3. Shopping Cart",
  item: [
    req("Get My Cart", "GET", "/api/cart"),
    req("Add Item to Cart", "POST", "/api/cart/items", {
      product_id: "{{productId}}",
      quantity: 2
    }, "cartItemId"),
    req("Update Cart Item Quantity", "PUT", "/api/cart/items/{{cartItemId}}", {
      quantity: 3
    }),
    req("Remove Item from Cart", "DELETE", "/api/cart/items/{{cartItemId}}"),
    req("Clear Cart", "DELETE", "/api/cart"),
    req("Get Cart Summary", "GET", "/api/cart/summary")
  ]
});

// 4. Addresses
collection.item.push({
  name: "4. Addresses",
  item: [
    req("Get My Addresses", "GET", "/api/addresses"),
    req("Create Address", "POST", "/api/addresses", {
      address_line1: "123 Main Street",
      address_line2: "Apt 4B",
      city: "New York",
      state: "NY",
      postal_code: "10001",
      country: "USA",
      is_default: true
    }, "addressId"),
    req("Get Address by ID", "GET", "/api/addresses/{{addressId}}"),
    req("Update Address", "PUT", "/api/addresses/{{addressId}}", {
      address_line1: "456 Oak Avenue",
      city: "Brooklyn"
    }),
    req("Set Default Address", "PATCH", "/api/addresses/{{addressId}}/default"),
    req("Delete Address", "DELETE", "/api/addresses/{{addressId}}")
  ]
});

// 5. Orders & Checkout
collection.item.push({
  name: "5. Orders & Checkout",
  item: [
    req("Create Order from Cart", "POST", "/api/orders", {
      shipping_address_id: "{{addressId}}",
      payment_method: "card"
    }, "orderId"),
    req("Get My Orders", "GET", "/api/orders"),
    req("Get Order by ID", "GET", "/api/orders/{{orderId}}"),
    req("Get Order Details", "GET", "/api/orders/{{orderId}}/details"),
    req("Cancel Order", "POST", "/api/orders/{{orderId}}/cancel"),
    req("Get Order History", "GET", "/api/orders/history"),
    req("Track Order", "GET", "/api/orders/{{orderId}}/track")
  ]
});

// 6. Payments
collection.item.push({
  name: "6. Payments",
  item: [
    req("Create Payment Intent", "POST", "/api/payments/create-intent", {
      order_id: "{{orderId}}",
      amount: 9999
    }, "paymentIntentId"),
    req("Confirm Payment", "POST", "/api/payments/confirm", {
      payment_intent_id: "{{paymentIntentId}}",
      order_id: "{{orderId}}"
    }),
    req("Get Payment by Order", "GET", "/api/payments/order/{{orderId}}"),
    req("Get My Payment History", "GET", "/api/payments/history")
  ]
});

// 7. Reviews & Ratings
collection.item.push({
  name: "7. Reviews & Ratings",
  item: [
    req("Get Product Reviews", "GET", "/api/reviews/product/{{productId}}", null, null, true),
    req("Create Review", "POST", "/api/reviews", {
      product_id: "{{productId}}",
      order_id: "{{orderId}}",
      rating: 5,
      title: "Great product!",
      comment: "I love this product. Highly recommended!"
    }, "reviewId"),
    req("Get My Reviews", "GET", "/api/reviews/my-reviews"),
    req("Update My Review", "PUT", "/api/reviews/{{reviewId}}", {
      rating: 4,
      title: "Good product",
      comment: "Updated review - still good but not perfect"
    }),
    req("Delete My Review", "DELETE", "/api/reviews/{{reviewId}}"),
    req("Get Review by ID", "GET", "/api/reviews/{{reviewId}}", null, null, true)
  ]
});

// 8. Returns & Refunds
collection.item.push({
  name: "8. Returns & Refunds",
  item: [
    req("Create Return Request", "POST", "/api/returns", {
      order_id: "{{orderId}}",
      reason: "Product not as described",
      description: "The product color is different from the image",
      refund_amount: 9999
    }, "returnId"),
    req("Get My Returns", "GET", "/api/returns"),
    req("Get Return by ID", "GET", "/api/returns/{{returnId}}"),
    req("Cancel Return Request", "POST", "/api/returns/{{returnId}}/cancel"),
    req("Get Return Status", "GET", "/api/returns/{{returnId}}/status")
  ]
});

// 9. Wishlist (if implemented)
collection.item.push({
  name: "9. Wishlist",
  item: [
    req("Get My Wishlist", "GET", "/api/wishlist"),
    req("Add to Wishlist", "POST", "/api/wishlist", {
      product_id: "{{productId}}"
    }),
    req("Remove from Wishlist", "DELETE", "/api/wishlist/{{productId}}"),
    req("Clear Wishlist", "DELETE", "/api/wishlist")
  ]
});

// 10. Customer Dashboard
collection.item.push({
  name: "10. Customer Dashboard",
  item: [
    req("Get Dashboard Summary", "GET", "/api/customer/dashboard"),
    req("Get Order Statistics", "GET", "/api/customer/statistics/orders"),
    req("Get Spending Statistics", "GET", "/api/customer/statistics/spending"),
    req("Get Recent Activity", "GET", "/api/customer/activity/recent"),
    req("Get Recommended Products", "GET", "/api/customer/recommendations")
  ]
});

// Save collection
const filename = 'E-Commerce-Customer-Complete.postman_collection.json';
fs.writeFileSync(filename, JSON.stringify(collection, null, 2));

console.log('✅ Customer Postman Collection Generated!');
console.log(`📁 File: ${filename}`);
console.log('\n📋 Collection includes:');
console.log('  ✅ 0. Health Check (1 request)');
console.log('  ✅ 1. Customer Authentication (4 requests)');
console.log('  ✅ 2. Browse Products & Categories (8 requests)');
console.log('  ✅ 3. Shopping Cart (6 requests)');
console.log('  ✅ 4. Addresses (6 requests)');
console.log('  ✅ 5. Orders & Checkout (7 requests)');
console.log('  ✅ 6. Payments (4 requests)');
console.log('  ✅ 7. Reviews & Ratings (6 requests)');
console.log('  ✅ 8. Returns & Refunds (5 requests)');
console.log('  ✅ 9. Wishlist (4 requests)');
console.log('  ✅ 10. Customer Dashboard (5 requests)');
console.log('\n📊 Total: 56 customer requests');
console.log('\n🚀 Import this file into Postman and start testing!');
console.log('\n⚠️  IMPORTANT: Register/Login first to get the token!');
