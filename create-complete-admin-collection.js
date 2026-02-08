/**
 * COMPLETE ADMIN POSTMAN COLLECTION
 * Full admin collection with all endpoints
 */

const fs = require('fs');

const collection = {
  "info": {
    "name": "E-Commerce Admin API - Complete",
    "description": "Complete admin Postman collection - Login as admin and manage everything",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    "version": "1.0.0"
  },
  "variable": [
    { "key": "baseUrl", "value": "http://localhost:5004" },
    { "key": "adminToken", "value": "" },
    { "key": "userId", "value": "" },
    { "key": "productId", "value": "" },
    { "key": "categoryId", "value": "" },
    { "key": "orderId", "value": "" },
    { "key": "reviewId", "value": "" },
    { "key": "returnId", "value": "" },
    { "key": "paymentId", "value": "" }
  ],
  "item": [
    {
      "name": "0. Health Check",
      "item": [
        {
          "name": "Health Check",
          "request": {
            "method": "GET",
            "header": [],
            "url": "{{baseUrl}}/api/v1/health"
          }
        }
      ]
    },
    {
      "name": "1. Admin Authentication",
      "item": [
        {
          "name": "Login Admin",
          "event": [{
            "listen": "test",
            "script": {
              "exec": [
                "if (pm.response.code === 200) {",
                "  pm.collectionVariables.set('adminToken', pm.response.json().token);",
                "}"
              ]
            }
          }],
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": JSON.stringify({
                "email": "admin@ecommerce.com",
                "password": "Admin123!@#"
              }, null, 2)
            },
            "url": "{{baseUrl}}/api/auth/login"
          }
        },
        {
          "name": "Get Admin Profile",
          "request": {
            "method": "GET",
            "header": [{"key": "Authorization", "value": "Bearer {{adminToken}}"}],
            "url": "{{baseUrl}}/api/auth/me"
          }
        }
      ]
    }
  ]
};

// Save
fs.writeFileSync('E-Commerce-Admin-Complete.postman_collection.json', JSON.stringify(collection, null, 2));
console.log('✅ Created: E-Commerce-Admin-Complete.postman_collection.json');
