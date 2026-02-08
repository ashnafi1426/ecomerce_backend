#!/usr/bin/env node
/**
 * BUILD COMPLETE ADMIN POSTMAN COLLECTION
 * Generates a comprehensive admin collection with all endpoints
 */

const fs = require('fs');

// Base collection structure
const collection = {
  info: {
    name: "E-Commerce Admin API - Complete",
    description: "Complete admin Postman collection. Login as admin first, then test all admin operations.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    version: "1.0.0"
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5004", type: "string" },
    { key: "adminToken", value: "", type: "string" },
    { key: "userId", value: "", type: "string" },
    { key: "productId", value: "", type: "string" },
    { key: "categoryId", value: "", type: "string" },
    { key: "orderId", value: "", type: "string" },
    { key: "reviewId", value: "", type: "string" },
    { key: "returnId", value: "", type: "string" },
    { key: "paymentId", value: "", type: "string" }
  ],
  item: []
};

// Helper to create request
const req = (name, method, path, body = null, saveVar = null) => {
  const request = {
    name,
    request: {
      method,
      header: [{ key: "Authorization", value: "Bearer {{adminToken}}", type: "text" }],
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
  item: [req("Health Check", "GET", "/api/v1/health")]
});

// 1. Admin Authentication
collection.item.push({
  name: "1. Admin Authentication",
  item: [
    {
      name: "Login Admin",
      event: [{
        listen: "test",
        script: {
          exec: [
            "if (pm.response.code === 200) {",
            "  pm.collectionVariables.set('adminToken', pm.response.json().token);",
            "}"
          ]
        }
      }],
      request: {
        method: "POST",
        header: [{ key: "Content-Type", value: "application/json" }],
        body: {
          mode: "raw",
          raw: JSON.stringify({ email: "admin@ecommerce.com", password: "Admin123!@#" }, null, 2)
        },
        url: {
          raw: "{{baseUrl}}/api/auth/login",
          host: ["{{baseUrl}}"],
          path: ["api", "auth", "login"]
        }
      }
    },
    req("Get Admin Profile", "GET", "/api/auth/me"),
    req("Update Profile", "PUT", "/api/auth/profile", { displayName: "Admin", phone: "+1234567890" })
  ]
});

// 2. User Management
collection.item.push({
  name: "2. User Management",
  item: [
    req("Get All Users", "GET", "/api/users"),
    req("Search Users", "GET", "/api/users/search?q=test"),
    req("Get User by ID", "GET", "/api/users/{{userId}}"),
    req("Create User", "POST", "/api/users", {
      email: "newuser@test.com",
      password: "Password123!",
      role: "customer",
      displayName: "New User"
    }, "userId"),
    req("Update User", "PUT", "/api/users/{{userId}}", { displayName: "Updated User" }),
    req("Get User Statistics", "GET", "/api/users/{{userId}}/statistics"),
    req("Update User Status", "PATCH", "/api/users/{{userId}}/status", { status: "active" }),
    req("Block User", "POST", "/api/users/{{userId}}/block"),
    req("Unblock User", "POST", "/api/users/{{userId}}/unblock"),
    req("Assign Role", "PATCH", "/api/users/{{userId}}/role", { role: "customer" }),
    req("Delete User", "DELETE", "/api/users/{{userId}}")
  ]
});

// 3. Category Management
collection.item.push({
  name: "3. Category Management",
  item: [
    req("Get All Categories", "GET", "/api/categories"),
    req("Create Category", "POST", "/api/categories", {
      name: "Electronics",
      description: "Electronic devices"
    }, "categoryId"),
    req("Get Category by ID", "GET", "/api/categories/{{categoryId}}"),
    req("Update Category", "PUT", "/api/categories/{{categoryId}}", {
      name: "Electronics Updated",
      description: "Updated description"
    }),
    req("Delete Category", "DELETE", "/api/categories/{{categoryId}}")
  ]
});

// 4. Product Management
collection.item.push({
  name: "4. Product Management",
  item: [
    req("Get All Products", "GET", "/api/products"),
    req("Search Products", "GET", "/api/products/search?q=phone"),
    req("Create Product", "POST", "/api/products", {
      title: "iPhone 15 Pro",
      description: "Latest iPhone",
      price: 999.99,
      category_id: "{{categoryId}}",
      image_url: "https://example.com/iphone.jpg",
      status: "active"
    }, "productId"),
    req("Get Product by ID", "GET", "/api/products/{{productId}}"),
    req("Update Product", "PUT", "/api/products/{{productId}}", {
      title: "iPhone 15 Pro Max",
      price: 1099.99
    }),
    req("Delete Product", "DELETE", "/api/products/{{productId}}")
  ]
});

// 5. Inventory Management
collection.item.push({
  name: "5. Inventory Management",
  item: [
    req("Get All Inventory", "GET", "/api/admin/inventory"),
    req("Create Inventory", "POST", "/api/admin/inventory", {
      product_id: "{{productId}}",
      quantity: 100,
      low_stock_threshold: 10
    }),
    req("Get Inventory by Product", "GET", "/api/admin/inventory/{{productId}}"),
    req("Update Inventory", "PUT", "/api/admin/inventory/{{productId}}", { quantity: 150 }),
    req("Get Low Stock Products", "GET", "/api/admin/inventory/low-stock"),
    req("Get Inventory Reports", "GET", "/api/admin/inventory/reports")
  ]
});

// 6. Order Management
collection.item.push({
  name: "6. Order Management",
  item: [
    req("Get All Orders", "GET", "/api/admin/orders"),
    req("Get Order by ID", "GET", "/api/admin/orders/{{orderId}}"),
    req("Update Order Status", "PUT", "/api/admin/orders/{{orderId}}/status", { status: "shipped" }),
    req("Get Orders by Status", "GET", "/api/admin/orders?status=pending_payment"),
    req("Get Recent Orders", "GET", "/api/admin/orders/recent")
  ]
});

// 7. Payment Management
collection.item.push({
  name: "7. Payment Management",
  item: [
    req("Get All Payments", "GET", "/api/admin/payments"),
    req("Get Payment Statistics", "GET", "/api/admin/payments/statistics"),
    req("Process Refund", "POST", "/api/admin/payments/{{paymentId}}/refund", { amount: 5000 }),
    req("Sync Payment Status", "POST", "/api/admin/payments/{{paymentId}}/sync")
  ]
});

// 8. Review Management
collection.item.push({
  name: "8. Review Management",
  item: [
    req("Get All Reviews", "GET", "/api/admin/reviews"),
    req("Get Pending Reviews", "GET", "/api/admin/reviews/pending"),
    req("Get Review Statistics", "GET", "/api/admin/reviews/statistics"),
    req("Approve Review", "POST", "/api/admin/reviews/{{reviewId}}/approve"),
    req("Reject Review", "POST", "/api/admin/reviews/{{reviewId}}/reject")
  ]
});

// 9. Analytics & Reports
collection.item.push({
  name: "9. Analytics & Reports",
  item: [
    req("Dashboard", "GET", "/api/admin/analytics/dashboard"),
    req("Sales Overview", "GET", "/api/admin/analytics/sales/overview"),
    req("Sales by Date", "GET", "/api/admin/analytics/sales/by-date?startDate=2026-01-01&endDate=2026-12-31"),
    req("Top Products", "GET", "/api/admin/analytics/sales/top-products?limit=10"),
    req("Revenue Overview", "GET", "/api/admin/analytics/revenue/overview"),
    req("Revenue by Category", "GET", "/api/admin/analytics/revenue/by-category"),
    req("Revenue Trends", "GET", "/api/admin/analytics/revenue/trends"),
    req("Customer Statistics", "GET", "/api/admin/analytics/customers/statistics"),
    req("Customer Segmentation", "GET", "/api/admin/analytics/customers/segmentation"),
    req("Customer Retention", "GET", "/api/admin/analytics/customers/retention"),
    req("Inventory Overview", "GET", "/api/admin/analytics/inventory/overview"),
    req("Low Stock Report", "GET", "/api/admin/analytics/inventory/low-stock"),
    req("Inventory Turnover", "GET", "/api/admin/analytics/inventory/turnover")
  ]
});

// Save collection
const filename = 'E-Commerce-Admin-Complete.postman_collection.json';
fs.writeFileSync(filename, JSON.stringify(collection, null, 2));

console.log('✅ Admin Postman Collection Generated!');
console.log(`📁 File: ${filename}`);
console.log('\n📋 Collection includes:');
console.log('  ✅ 0. Health Check (1 request)');
console.log('  ✅ 1. Admin Authentication (3 requests)');
console.log('  ✅ 2. User Management (11 requests)');
console.log('  ✅ 3. Category Management (5 requests)');
console.log('  ✅ 4. Product Management (6 requests)');
console.log('  ✅ 5. Inventory Management (6 requests)');
console.log('  ✅ 6. Order Management (5 requests)');
console.log('  ✅ 7. Payment Management (4 requests)');
console.log('  ✅ 8. Review Management (5 requests)');
console.log('  ✅ 9. Analytics & Reports (13 requests)');
console.log('\n📊 Total: 59 admin requests');
console.log('\n🚀 Import this file into Postman and start testing!');
console.log('\n⚠️  IMPORTANT: Login as admin first to get the token!');
