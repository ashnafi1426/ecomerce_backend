/**
 * FIXED POSTMAN COLLECTION GENERATOR
 * Generates a corrected Postman collection with proper authentication
 */

const fs = require('fs');

const collection = {
  info: {
    name: "E-Commerce API - Fixed Collection",
    description: "Fixed Postman collection with correct authentication endpoints",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    version: "2.0.0"
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5004", type: "string" },
    { key: "customerToken", value: "", type: "string" },
    { key: "adminToken", value: "", type: "string" },
    { key: "productId", value: "", type: "string" },
    { key: "orderId", value: "", type: "string" },
    { key: "categoryId", value: "", type: "string" },
    { key: "cartItemId", value: "", type: "string" },
    { key: "reviewId", value: "", type: "string" },
    { key: "paymentIntentId", value: "", type: "string" }
  ],
  item: [
    // 0. Health Check
    {
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
            },
            description: "Check if server is running and database is connected"
          }
        }
      ]
    },
    // 1. Authentication
    {
      name: "1. Authentication",
      item: [
        {
          name: "Register Customer",
          event: [{
            listen: "test",
            script: {
              exec: [
                "if (pm.response.code === 201) {",
                "  var jsonData = pm.response.json();",
                "  pm.collectionVariables.set('customerToken', jsonData.token);",
                "  console.log('Customer token saved:', jsonData.token);",
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
            },
            description: "Register a new customer account"
          }
        },
        {
          name: "Login Customer",
          event: [{
            listen: "test",
            script: {
              exec: [
                "if (pm.response.code === 200) {",
                "  var jsonData = pm.response.json();",
                "  pm.collectionVariables.set('customerToken', jsonData.token);",
                "  console.log('Customer logged in, token saved');",
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
            },
            description: "Login with customer credentials"
          }
        },
        {
          name: "Get Current User Profile",
          request: {
            method: "GET",
            header: [{
              key: "Authorization",
              value: "Bearer {{customerToken}}",
              type: "text"
            }],
            url: {
              raw: "{{baseUrl}}/api/auth/me",
              host: ["{{baseUrl}}"],
              path: ["api", "auth", "me"]
            },
            description: "Get authenticated user profile - REQUIRES TOKEN"
          }
        },
        {
          name: "Update Profile",
          request: {
            method: "PUT",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{customerToken}}", type: "text" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                displayName: "Updated Customer Name",
                phone: "+1234567890"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/api/auth/profile",
              host: ["{{baseUrl}}"],
              path: ["api", "auth", "profile"]
            },
            description: "Update user profile"
          }
        }
      ]
    },
    // 2. Categories
    {
      name: "2. Categories",
      item: [
        {
          name: "Create Category (Admin)",
          event: [{
            listen: "test",
            script: {
              exec: [
                "if (pm.response.code === 201) {",
                "  var jsonData = pm.response.json();",
                "  pm.collectionVariables.set('categoryId', jsonData.category.id);",
                "}"
              ]
            }
          }],
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{adminToken}}", type: "text" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "Electronics",
                description: "Electronic devices and gadgets"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/api/categories",
              host: ["{{baseUrl}}"],
              path: ["api", "categories"]
            }
          }
        },
        {
          name: "Get All Categories",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{baseUrl}}/api/categories",
              host: ["{{baseUrl}}"],
              path: ["api", "categories"]
            }
          }
        }
      ]
    }
  ]
};

// Write to file
fs.writeFileSync(
  'E-Commerce-API-Fixed.postman_collection.json',
  JSON.stringify(collection, null, 2)
);

console.log('✅ Fixed Postman collection generated: E-Commerce-API-Fixed.postman_collection.json');
console.log('\n📋 Key Fixes:');
console.log('  - Correct authentication endpoints (/api/auth/*)');
console.log('  - Proper token handling in test scripts');
console.log('  - Fixed "Get Current User" endpoint');
console.log('  - Added "Update Profile" endpoint');
console.log('\n🚀 Import this file into Postman and test!');
