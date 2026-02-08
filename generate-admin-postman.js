/**
 * ADMIN POSTMAN COLLECTION GENERATOR
 * Generates a complete Postman collection for admin operations
 */

const fs = require('fs');

const collection = {
  info: {
    name: "E-Commerce Admin API - Complete",
    description: "Complete admin Postman collection with all admin endpoints",
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

// Helper function to create request
const createRequest = (name, method, path, body = null, description = "") => {
  const request = {
    name,
    request: {
      method,
      header: [
        { key: "Authorization", value: "Bearer {{adminToken}}", type: "text" }
      ],
      url: {
        raw: `{{baseUrl}}${path}`,
        host: ["{{baseUrl}}"],
        path: path.split('/').filter(p => p)
      },
      description
    }
  };

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    request.request.header.push({ key: "Content-Type", value: "application/json" });
    request.request.body = {
      mode: "raw",
      raw: JSON.stringify(body, null, 2)
    };
  }

  return request;
};

// 0. Health Check
collection.item.push({
  name: "0. Health Check",
  item: [
    {
      name: "Health Check",
      request: {
        method: "GET",
        header: [],
        url: {
          raw: "{{baseUrl}}/api/v1/health",
          host: ["{{baseUrl}}"],
          path: ["api", "v1", "health"]
        }
      }
    }
  ]
});

// 1. Admin Authentication
collection.item.push({
  name: "1. Admin Authentication",
  item: [
    {
      name: "Register Admin",
      event: [{
        listen: "test",
        script: {
          exec: [
            "if (pm.response.code === 201) {",
            "  var jsonData = pm.response.json();",
            "  pm.collectionVariables.set('adminToken', jsonData.token);",
            "  console.log('Admin token saved');",
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
            email: "admin@ecommerce.com",
            password: "Admin123!@#",
            displayName: "Admin User"
          }, null, 2)
        },
        url: {
          raw: "{{baseUrl}}/api/auth/register",
          host: ["{{baseUrl}}"],
          path: ["api", "auth", "register"]
        },
        description: "Register admin account - Note: You need to manually set role to 'admin' in database"
      }
    },
    {
      name: "Login Admin",
      event: [{
        listen: "test",
        script: {
          exec: [
            "if (pm.response.code === 200) {",
            "  var jsonData = pm.response.json();",
            "  pm.collectionVariables.set('adminToken', jsonData.token);",
            "  console.log('Admin logged in');",
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
            email: "admin@ecommerce.com",
            password: "Admin123!@#"
          }, null, 2)
        },
        url: {
          raw: "{{baseUrl}}/api/auth/login",
          host: ["{{baseUrl}}"],
          path: ["api", "auth", "login"]
        }
      }
    },
    createRequest("Get Admin Profile", "GET", "/api/auth/me")
  ]
});

// Write to file
fs.writeFileSync(
  'E-Commerce-Admin-API.postman_collection.json',
  JSON.stringify(collection, null, 2)
);

console.log('✅ Admin Postman collection generated successfully!');
console.log('📁 File: E-Commerce-Admin-API.postman_collection.json');
console.log('\n📋 Collection includes:');
console.log('  - Health Check');
console.log('  - Admin Authentication');
console.log('  - More sections will be added...');
