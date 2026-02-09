const fs = require('fs');

/**
 * Generate Complete Postman Collection for FastShop Backend
 * Includes ALL backend APIs (Phases 1-6) for all roles with auto-save features
 */

const collection = {
	"info": {
		"name": "FastShop Complete Backend API - All Phases (1-6)",
		"description": "Complete API collection for ALL backend features with auto-save tokens and base URL for Admin, Manager, Seller, and Customer roles. Includes 150+ endpoints across all phases.",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
		"version": "6.0.0"
	},
	"auth": {
		"type": "bearer",
		"bearer": [
			{
				"key": "token",
				"value": "{{token}}",
				"type": "string"
			}
		]
	},
	"event": [
		{
			"listen": "prerequest",
			"script": {
				"type": "text/javascript",
				"exec": [
					"// Auto-set base URL if not set",
					"if (!pm.environment.get('base_url')) {",
					"    pm.environment.set('base_url', 'http://localhost:5000');",
					"    console.log('✅ Base URL auto-set to: http://localhost:5000');",
					"}"
				]
			}
		},
		{
			"listen": "test",
			"script": {
				"type": "text/javascript",
				"exec": [
					"// Global test script for all requests",
					"if (pm.response.code === 200 || pm.response.code === 201) {",
					"    console.log('✅ Request successful');",
					"} else if (pm.response.code === 401) {",
					"    console.log('⚠️ Unauthorized - Please login first');",
					"} else if (pm.response.code === 403) {",
					"    console.log('⚠️ Forbidden - Insufficient permissions');",
					"}"
				]
			}
		}
	],
	"item": [],
	"variable": [
		{
			"key": "base_url",
			"value": "http://localhost:5000",
			"type": "string"
		},
		{
			"key": "token",
			"value": "",
			"type": "string"
		},
		{
			"key": "admin_token",
			"value": "",
			"type": "string"
		},
		{
			"key": "manager_token",
			"value": "",
			"type": "string"
		},
		{
			"key": "seller_token",
			"value": "",
			"type": "string"
		},
		{
			"key": "customer_token",
			"value": "",
			"type": "string"
		},
		{
			"key": "product_id",
			"value": "",
			"type": "string"
		},
		{
			"key": "order_id",
			"value": "",
			"type": "string"
		},
		{
			"key": "category_id",
			"value": "",
			"type": "string"
		},
		{
			"key": "variant_id",
			"value": "",
			"type": "string"
		},
		{
			"key": "coupon_id",
			"value": "",
			"type": "string"
		},
		{
			"key": "promotion_id",
			"value": "",
			"type": "string"
		},
		{
			"key": "rating_id",
			"value": "",
			"type": "string"
		},
		{
			"key": "replacement_id",
			"value": "",
			"type": "string"
		},
		{
			"key": "refund_id",
			"value": "",
			"type": "string"
		},
		{
			"key": "review_id",
			"value": "",
			"type": "string"
		},
		{
			"key": "address_id",
			"value": "",
			"type": "string"
		},
		{
			"key": "payment_intent_id",
			"value": "",
			"type": "string"
		},
		{
			"key": "user_id",
			"value": "",
			"type": "string"
		},
		{
			"key": "seller_id",
			"value": "",
			"type": "string"
		},
		{
			"key": "notification_id",
			"value": "",
			"type": "string"
		},
		{
			"key": "dispute_id",
			"value": "",
			"type": "string"
		}
	]
};

// Helper function to create auto-save test script
function createAutoSaveScript(tokenVar, ...idVars) {
	const script = [
		`if (pm.response.code === 200 || pm.response.code === 201) {`,
		`    const response = pm.response.json();`,
		`    `,
		`    // Auto-save token`,
		`    if (response.token) {`,
		`        pm.environment.set('${tokenVar}', response.token);`,
		`        pm.environment.set('token', response.token);`,
		`        console.log('✅ Token auto-saved as ${tokenVar}');`,
		`    }`
	];
	
	// Auto-save IDs
	idVars.forEach(idVar => {
		const parts = idVar.split('.');
		if (parts.length === 1) {
			script.push(
				`    `,
				`    // Auto-save ${idVar}`,
				`    if (response.${idVar}) {`,
				`        const id = response.${idVar}.id || response.${idVar};`,
				`        pm.environment.set('${idVar}_id', id);`,
				`        console.log('✅ ${idVar}_id auto-saved:', id);`,
				`    }`
			);
		} else {
			script.push(
				`    `,
				`    // Auto-save ${parts[parts.length - 1]}`,
				`    if (response.${parts.join('?.')}) {`,
				`        const id = response.${parts.join('.')}.id || response.${parts.join('.')};`,
				`        pm.environment.set('${parts[parts.length - 1]}_id', id);`,
				`        console.log('✅ ${parts[parts.length - 1]}_id auto-saved:', id);`,
				`    }`
			);
		}
	});
	
	script.push(`}`);
	return script;
}

// Helper to create request object
function createRequest(method, path, body = null, useToken = null) {
	const request = {
		method,
		header: [{"key": "Content-Type", "value": "application/json"}],
		url: {
			raw: `{{base_url}}${path}`,
			host: ["{{base_url}}"],
			path: path.split('/').filter(p => p)
		}
	};
	
	if (useToken) {
		request.header.push({
			"key": "Authorization",
			"value": `Bearer {{${useToken}}}`,
			"type": "string"
		});
	}
	
	if (body) {
		request.body = {
			mode: "raw",
			raw: JSON.stringify(body, null, 2)
		};
	}
	
	return request;
}

// ============================================
// 0. AUTHENTICATION (ALL ROLES)
// ============================================
collection.item.push({
	"name": "0. Authentication (All Roles)",
	"description": "Register and login for all user roles: Customer, Seller, Manager, Admin",
	"item": [
		{
			"name": "Register Customer",
			"event": [{
				"listen": "test",
				"script": { "exec": createAutoSaveScript('customer_token', 'user') }
			}],
			"request": createRequest('POST', '/api/auth/register', {
				"email": "customer@test.com",
				"password": "Test123!@#",
				"full_name": "Test Customer",
				"role": "customer"
			})
		},
		{
			"name": "Login Customer",
			"event": [{
				"listen": "test",
				"script": { "exec": createAutoSaveScript('customer_token', 'user') }
			}],
			"request": createRequest('POST', '/api/auth/login', {
				"email": "customer@test.com",
				"password": "Test123!@#"
			})
		},
		{
			"name": "Register Seller",
			"event": [{
				"listen": "test",
				"script": { "exec": createAutoSaveScript('seller_token', 'user', 'seller') }
			}],
			"request": createRequest('POST', '/api/auth/register/seller', {
				"email": "seller@test.com",
				"password": "Test123!@#",
				"full_name": "Test Seller",
				"business_name": "Test Store",
				"business_address": "123 Business St"
			})
		},
		{
			"name": "Login Seller",
			"event": [{
				"listen": "test",
				"script": { "exec": createAutoSaveScript('seller_token', 'user', 'seller') }
			}],
			"request": createRequest('POST', '/api/auth/login', {
				"email": "seller@test.com",
				"password": "Test123!@#"
			})
		},
		{
			"name": "Login Manager",
			"event": [{
				"listen": "test",
				"script": { "exec": createAutoSaveScript('manager_token', 'user') }
			}],
			"request": createRequest('POST', '/api/auth/login', {
				"email": "manager@test.com",
				"password": "Test123!@#"
			})
		},
		{
			"name": "Login Admin",
			"event": [{
				"listen": "test",
				"script": { "exec": createAutoSaveScript('admin_token', 'user') }
			}],
			"request": createRequest('POST', '/api/auth/login', {
				"email": "admin@test.com",
				"password": "Test123!@#"
			})
		},
		{
			"name": "Get Current User Profile",
			"request": createRequest('GET', '/api/auth/me', null, 'token')
		},
		{
			"name": "Update Profile",
			"request": createRequest('PUT', '/api/auth/profile', {
				"full_name": "Updated Name",
				"phone": "+1234567890"
			}, 'token')
		},
		{
			"name": "Get Seller Status",
			"request": createRequest('GET', '/api/auth/seller/status', null, 'seller_token')
		}
	]
});

// ============================================
// 1. CATEGORIES
// ============================================
collection.item.push({
	"name": "1. Categories",
	"description": "Category management endpoints",
	"item": [
		{
			"name": "Get All Categories",
			"request": createRequest('GET', '/api/categories')
		},
		{
			"name": "Get Category by ID",
			"request": createRequest('GET', '/api/categories/{{category_id}}')
		},
		{
			"name": "Create Category (Admin)",
			"event": [{
				"listen": "test",
				"script": { "exec": createAutoSaveScript('admin_token', 'category') }
			}],
			"request": createRequest('POST', '/api/categories', {
				"name": "Electronics",
				"description": "Electronic devices and gadgets",
				"image_url": "https://example.com/electronics.jpg"
			}, 'admin_token')
		},
		{
			"name": "Update Category (Admin)",
			"request": createRequest('PUT', '/api/categories/{{category_id}}', {
				"name": "Electronics Updated",
				"description": "Updated description"
			}, 'admin_token')
		},
		{
			"name": "Delete Category (Admin)",
			"request": createRequest('DELETE', '/api/categories/{{category_id}}', null, 'admin_token')
		}
	]
});

// ============================================
// 2. PRODUCTS
// ============================================
collection.item.push({
	"name": "2. Products",
	"description": "Product browsing and management",
	"item": [
		{
			"name": "Get All Products (Public)",
			"request": createRequest('GET', '/api/products')
		},
		{
			"name": "Search Products",
			"request": createRequest('GET', '/api/products/search?q=phone&category={{category_id}}')
		},
		{
			"name": "Get Product by ID",
			"request": createRequest('GET', '/api/products/{{product_id}}')
		},
		{
			"name": "Get Seller Products",
			"request": createRequest('GET', '/api/seller/products', null, 'seller_token')
		},
		{
			"name": "Create Product (Seller)",
			"event": [{
				"listen": "test",
				"script": { "exec": createAutoSaveScript('seller_token', 'product') }
			}],
			"request": createRequest('POST', '/api/seller/products', {
				"title": "iPhone 15 Pro",
				"description": "Latest iPhone model with advanced features",
				"price": 999.99,
				"category_id": "{{category_id}}",
				"image_url": "https://example.com/iphone15.jpg",
				"stock_quantity": 100
			}, 'seller_token')
		},
		{
			"name": "Update Product (Seller)",
			"request": createRequest('PUT', '/api/seller/products/{{product_id}}', {
				"title": "iPhone 15 Pro Max",
				"price": 1099.99
			}, 'seller_token')
		},
		{
			"name": "Delete Product (Seller)",
			"request": createRequest('DELETE', '/api/seller/products/{{product_id}}', null, 'seller_token')
		},
		{
			"name": "Get Approval Queue (Manager)",
			"request": createRequest('GET', '/api/manager/products/pending', null, 'manager_token')
		},
		{
			"name": "Approve Product (Manager)",
			"request": createRequest('POST', '/api/manager/products/{{product_id}}/approve', null, 'manager_token')
		},
		{
			"name": "Reject Product (Manager)",
			"request": createRequest('POST', '/api/manager/products/{{product_id}}/reject', {
				"reason": "Product does not meet quality standards"
			}, 'manager_token')
		}
	]
});

// ============================================
// 3. PRODUCT VARIANTS (PHASE 6)
// ============================================
collection.item.push({
	"name": "3. Product Variants (Phase 6)",
	"description": "Product variant management system",
	"item": [
		{
			"name": "Create Variant (Seller)",
			"event": [{
				"listen": "test",
				"script": { "exec": createAutoSaveScript('seller_token', 'variant') }
			}],
			"request": createRequest('POST', '/api/variants', {
				"product_id": "{{product_id}}",
				"sku": "IPHONE-15-256-BLUE",
				"variant_name": "iPhone 15 Pro 256GB Blue",
				"attributes": {
					"storage": "256GB",
					"color": "Blue"
				},
				"price": 1099.99,
				"compare_at_price": 1199.99,
				"images": ["https://example.com/iphone-blue-1.jpg"]
			}, 'seller_token')
		},
		{
			"name": "Get Product Variants",
			"request": createRequest('GET', '/api/variants/products/{{product_id}}')
		},
		{
			"name": "Get Variant by ID",
			"request": createRequest('GET', '/api/variants/{{variant_id}}')
		},
		{
			"name": "Update Variant (Seller)",
			"request": createRequest('PUT', '/api/variants/{{variant_id}}', {
				"price": 1049.99,
				"is_available": true
			}, 'seller_token')
		},
		{
			"name": "Delete Variant (Seller)",
			"request": createRequest('DELETE', '/api/variants/{{variant_id}}', null, 'seller_token')
		},
		{
			"name": "Get Variant Inventory",
			"request": createRequest('GET', '/api/variants/{{variant_id}}/inventory', null, 'seller_token')
		},
		{
			"name": "Update Variant Inventory",
			"request": createRequest('PUT', '/api/variants/{{variant_id}}/inventory', {
				"quantity": 50,
				"low_stock_threshold": 10
			}, 'seller_token')
		},
		{
			"name": "Bulk Update Variants",
			"request": createRequest('PUT', '/api/variants/bulk', {
				"variants": [
					{
						"id": "{{variant_id}}",
						"price": 999.99,
						"quantity": 100
					}
				]
			}, 'seller_token')
		}
	]
});

// ============================================
// 4. SHOPPING CART
// ============================================
collection.item.push({
	"name": "4. Shopping Cart",
	"description": "Shopping cart operations",
	"item": [
		{
			"name": "Get Cart",
			"request": createRequest('GET', '/api/cart', null, 'customer_token')
		},
		{
			"name": "Get Cart Summary",
			"request": createRequest('GET', '/api/cart/summary', null, 'customer_token')
		},
		{
			"name": "Get Cart Count",
			"request": createRequest('GET', '/api/cart/count', null, 'customer_token')
		},
		{
			"name": "Add Item to Cart",
			"request": createRequest('POST', '/api/cart/items', {
				"product_id": "{{product_id}}",
				"variant_id": "{{variant_id}}",
				"quantity": 2
			}, 'customer_token')
		},
		{
			"name": "Update Cart Item Quantity",
			"request": createRequest('PUT', '/api/cart/items/{{product_id}}', {
				"quantity": 3
			}, 'customer_token')
		},
		{
			"name": "Remove Item from Cart",
			"request": createRequest('DELETE', '/api/cart/items/{{product_id}}', null, 'customer_token')
		},
		{
			"name": "Clear Cart",
			"request": createRequest('DELETE', '/api/cart', null, 'customer_token')
		},
		{
			"name": "Validate Cart",
			"request": createRequest('POST', '/api/cart/validate', null, 'customer_token')
		}
	]
});

// ============================================
// 5. COUPONS & PROMOTIONS (PHASE 6)
// ============================================
collection.item.push({
	"name": "5. Coupons & Promotions (Phase 6)",
	"description": "Discount and promotion management",
	"item": [
		{
			"name": "Create Coupon (Manager)",
			"event": [{
				"listen": "test",
				"script": { "exec": createAutoSaveScript('manager_token', 'coupon') }
			}],
			"request": createRequest('POST', '/api/coupons', {
				"code": "SUMMER2026",
				"discount_type": "percentage",
				"discount_value": 20,
				"min_purchase_amount": 50,
				"max_discount_amount": 100,
				"usage_limit": 1000,
				"usage_limit_per_customer": 1,
				"start_date": "2026-06-01T00:00:00Z",
				"end_date": "2026-08-31T23:59:59Z",
				"applicable_to": {
					"product_ids": [],
					"category_ids": []
				},
				"allow_stacking": false
			}, 'manager_token')
		},
		{
			"name": "Get All Coupons (Manager)",
			"request": createRequest('GET', '/api/coupons', null, 'manager_token')
		},
		{
			"name": "Get Coupon by ID",
			"request": createRequest('GET', '/api/coupons/{{coupon_id}}', null, 'manager_token')
		},
		{
			"name": "Validate Coupon (Customer)",
			"request": createRequest('POST', '/api/coupons/validate', {
				"code": "SUMMER2026",
				"order_total": 150.00,
				"items": [
					{
						"product_id": "{{product_id}}",
						"quantity": 2,
						"price": 75.00
					}
				]
			}, 'customer_token')
		},
		{
			"name": "Apply Coupon (Customer)",
			"request": createRequest('POST', '/api/coupons/apply', {
				"code": "SUMMER2026",
				"order_id": "{{order_id}}"
			}, 'customer_token')
		},
		{
			"name": "Update Coupon (Manager)",
			"request": createRequest('PUT', '/api/coupons/{{coupon_id}}', {
				"discount_value": 25,
				"usage_limit": 2000
			}, 'manager_token')
		},
		{
			"name": "Deactivate Coupon (Manager)",
			"request": createRequest('PUT', '/api/coupons/{{coupon_id}}/deactivate', null, 'manager_token')
		},
		{
			"name": "Get Coupon Analytics (Manager)",
			"request": createRequest('GET', '/api/coupons/{{coupon_id}}/analytics', null, 'manager_token')
		},
		{
			"name": "Create Promotion (Manager)",
			"event": [{
				"listen": "test",
				"script": { "exec": createAutoSaveScript('manager_token', 'promotion') }
			}],
			"request": createRequest('POST', '/api/promotions', {
				"product_id": "{{product_id}}",
				"promotional_price": 799.99,
				"start_date": "2026-06-01T00:00:00Z",
				"end_date": "2026-06-30T23:59:59Z"
			}, 'manager_token')
		},
		{
			"name": "Get Active Promotions",
			"request": createRequest('GET', '/api/promotions/active')
		},
		{
			"name": "Get Promotion by ID",
			"request": createRequest('GET', '/api/promotions/{{promotion_id}}', null, 'manager_token')
		},
		{
			"name": "Update Promotion (Manager)",
			"request": createRequest('PUT', '/api/promotions/{{promotion_id}}', {
				"promotional_price": 749.99
			}, 'manager_token')
		},
		{
			"name": "Delete Promotion (Manager)",
			"request": createRequest('DELETE', '/api/promotions/{{promotion_id}}', null, 'manager_token')
		},
		{
			"name": "Get Promotion Analytics (Manager)",
			"request": createRequest('GET', '/api/promotions/{{promotion_id}}/analytics', null, 'manager_token')
		}
	]
});

console.log('✅ Part 1 of collection generated (0-5)');
console.log('📝 Continuing with remaining sections...');


// ============================================
// 6. PAYMENTS
// ============================================
collection.item.push({
	"name": "6. Payments",
	"description": "Payment processing with Stripe",
	"item": [
		{
			"name": "Create Payment Intent",
			"event": [{
				"listen": "test",
				"script": { "exec": createAutoSaveScript('customer_token', 'paymentIntent') }
			}],
			"request": createRequest('POST', '/api/payments/create-intent', {
				"amount": 99999,
				"currency": "usd"
			}, 'customer_token')
		},
		{
			"name": "Get Payment by ID",
			"request": createRequest('GET', '/api/payments/{{payment_intent_id}}', null, 'customer_token')
		},
		{
			"name": "Get All Payments (Admin)",
			"request": createRequest('GET', '/api/admin/payments', null, 'admin_token')
		},
		{
			"name": "Get Payment Statistics (Admin)",
			"request": createRequest('GET', '/api/admin/payments/statistics', null, 'admin_token')
		}
	]
});

// ============================================
// 7. ORDERS
// ============================================
collection.item.push({
	"name": "7. Orders",
	"description": "Order creation and management",
	"item": [
		{
			"name": "Create Order from Cart",
			"event": [{
				"listen": "test",
				"script": { "exec": createAutoSaveScript('customer_token', 'order') }
			}],
			"request": createRequest('POST', '/api/orders', {
				"payment_intent_id": "{{payment_intent_id}}",
				"shipping_address_id": "{{address_id}}",
				"billing_address_id": "{{address_id}}"
			}, 'customer_token')
		},
		{
			"name": "Get My Orders",
			"request": createRequest('GET', '/api/orders', null, 'customer_token')
		},
		{
			"name": "Get Order by ID",
			"request": createRequest('GET', '/api/orders/{{order_id}}', null, 'customer_token')
		},
		{
			"name": "Cancel Order",
			"request": createRequest('POST', '/api/orders/{{order_id}}/cancel', null, 'customer_token')
		},
		{
			"name": "Get Invoice",
			"request": createRequest('GET', '/api/orders/{{order_id}}/invoice', null, 'customer_token')
		},
		{
			"name": "Get Order Refunds",
			"request": createRequest('GET', '/api/orders/{{order_id}}/refunds', null, 'customer_token')
		},
		{
			"name": "Get Order with Refund Details",
			"request": createRequest('GET', '/api/orders/{{order_id}}/with-refunds', null, 'customer_token')
		},
		{
			"name": "Check Refund Eligibility",
			"request": createRequest('GET', '/api/orders/{{order_id}}/refund-eligibility', null, 'customer_token')
		},
		{
			"name": "Get All Orders (Admin)",
			"request": createRequest('GET', '/api/admin/orders', null, 'admin_token')
		},
		{
			"name": "Get Order Statistics (Admin)",
			"request": createRequest('GET', '/api/admin/orders/statistics', null, 'admin_token')
		},
		{
			"name": "Get Recent Orders (Admin)",
			"request": createRequest('GET', '/api/admin/orders/recent', null, 'admin_token')
		},
		{
			"name": "Update Order Status (Admin)",
			"request": createRequest('PATCH', '/api/admin/orders/{{order_id}}/status', {
				"status": "shipped"
			}, 'admin_token')
		}
	]
});

// ============================================
// 8. DELIVERY RATINGS (PHASE 6)
// ============================================
collection.item.push({
	"name": "8. Delivery Ratings (Phase 6)",
	"description": "Delivery rating and feedback system",
	"item": [
		{
			"name": "Submit Delivery Rating (Customer)",
			"event": [{
				"listen": "test",
				"script": { "exec": createAutoSaveScript('customer_token', 'rating') }
			}],
			"request": createRequest('POST', '/api/delivery-ratings', {
				"order_id": "{{order_id}}",
				"overall_rating": 5,
				"speed_rating": 5,
				"packaging_rating": 4,
				"communication_rating": 5,
				"overall_feedback": "Excellent service!",
				"speed_feedback": "Very fast delivery",
				"packaging_feedback": "Well packaged",
				"communication_feedback": "Great communication"
			}, 'customer_token')
		},
		{
			"name": "Get Order Delivery Rating",
			"request": createRequest('GET', '/api/delivery-ratings/orders/{{order_id}}', null, 'customer_token')
		},
		{
			"name": "Get Seller Delivery Metrics",
			"request": createRequest('GET', '/api/delivery-ratings/sellers/{{seller_id}}/metrics', null, 'seller_token')
		},
		{
			"name": "Get Seller Rating Distribution",
			"request": createRequest('GET', '/api/delivery-ratings/sellers/{{seller_id}}/distribution', null, 'seller_token')
		},
		{
			"name": "Get Delivery Rating Analytics (Manager)",
			"request": createRequest('GET', '/api/delivery-ratings/analytics', null, 'manager_token')
		},
		{
			"name": "Get Flagged Ratings (Manager)",
			"request": createRequest('GET', '/api/delivery-ratings/flagged', null, 'manager_token')
		}
	]
});

// ============================================
// 9. REPLACEMENTS (PHASE 6)
// ============================================
collection.item.push({
	"name": "9. Replacements (Phase 6)",
	"description": "Product replacement request system",
	"item": [
		{
			"name": "Create Replacement Request (Customer)",
			"event": [{
				"listen": "test",
				"script": { "exec": createAutoSaveScript('customer_token', 'replacement') }
			}],
			"request": createRequest('POST', '/api/replacements', {
				"order_id": "{{order_id}}",
				"product_id": "{{product_id}}",
				"variant_id": "{{variant_id}}",
				"quantity": 1,
				"reason": "defective_product",
				"description": "Product arrived damaged",
				"images": ["https://example.com/damage1.jpg"]
			}, 'customer_token')
		},
		{
			"name": "Get My Replacement Requests (Customer)",
			"request": createRequest('GET', '/api/replacements/my-requests', null, 'customer_token')
		},
		{
			"name": "Get Replacement by ID",
			"request": createRequest('GET', '/api/replacements/{{replacement_id}}', null, 'customer_token')
		},
		{
			"name": "Get All Replacements (Manager)",
			"request": createRequest('GET', '/api/replacements', null, 'manager_token')
		},
		{
			"name": "Approve Replacement (Manager)",
			"request": createRequest('PUT', '/api/replacements/{{replacement_id}}/approve', null, 'manager_token')
		},
		{
			"name": "Reject Replacement (Manager)",
			"request": createRequest('PUT', '/api/replacements/{{replacement_id}}/reject', {
				"reason": "Product shows signs of misuse"
			}, 'manager_token')
		},
		{
			"name": "Update Replacement Shipment (Seller)",
			"request": createRequest('PUT', '/api/replacements/{{replacement_id}}/shipment', {
				"tracking_number": "TRACK123456",
				"carrier": "FedEx",
				"estimated_delivery": "2026-02-15T00:00:00Z"
			}, 'seller_token')
		},
		{
			"name": "Mark Replacement Delivered (Seller)",
			"request": createRequest('PUT', '/api/replacements/{{replacement_id}}/delivered', null, 'seller_token')
		},
		{
			"name": "Get Replacement Analytics (Manager)",
			"request": createRequest('GET', '/api/replacements/analytics', null, 'manager_token')
		}
	]
});

// ============================================
// 10. ENHANCED REFUNDS (PHASE 6)
// ============================================
collection.item.push({
	"name": "10. Enhanced Refunds (Phase 6)",
	"description": "Advanced refund processing system",
	"item": [
		{
			"name": "Create Refund Request (Customer)",
			"event": [{
				"listen": "test",
				"script": { "exec": createAutoSaveScript('customer_token', 'refund') }
			}],
			"request": createRequest('POST', '/api/refunds', {
				"order_id": "{{order_id}}",
				"refund_type": "partial",
				"refund_amount": 50.00,
				"reason": "product_quality",
				"description": "Product not as described",
				"images": ["https://example.com/issue1.jpg"]
			}, 'customer_token')
		},
		{
			"name": "Get My Refund Requests (Customer)",
			"request": createRequest('GET', '/api/refunds/my-requests', null, 'customer_token')
		},
		{
			"name": "Get Refund by ID",
			"request": createRequest('GET', '/api/refunds/{{refund_id}}', null, 'customer_token')
		},
		{
			"name": "Get All Refunds (Manager)",
			"request": createRequest('GET', '/api/refunds', null, 'manager_token')
		},
		{
			"name": "Process Partial Refund (Manager)",
			"request": createRequest('POST', '/api/refunds/{{refund_id}}/process-partial', {
				"refund_amount": 50.00,
				"reason": "Approved - product quality issue"
			}, 'manager_token')
		},
		{
			"name": "Process Full Refund (Manager)",
			"request": createRequest('POST', '/api/refunds/{{refund_id}}/process-full', {
				"reason": "Approved - full refund requested"
			}, 'manager_token')
		},
		{
			"name": "Issue Goodwill Refund (Manager)",
			"request": createRequest('POST', '/api/refunds/goodwill', {
				"order_id": "{{order_id}}",
				"amount": 25.00,
				"reason": "Compensation for delayed delivery"
			}, 'manager_token')
		},
		{
			"name": "Get Refund Analytics (Manager)",
			"request": createRequest('GET', '/api/refunds/analytics', null, 'manager_token')
		},
		{
			"name": "Get Refund Trends (Manager)",
			"request": createRequest('GET', '/api/refunds/analytics/trends', null, 'manager_token')
		}
	]
});

// ============================================
// 11. REVIEWS
// ============================================
collection.item.push({
	"name": "11. Reviews",
	"description": "Product review system",
	"item": [
		{
			"name": "Create Review (Customer)",
			"event": [{
				"listen": "test",
				"script": { "exec": createAutoSaveScript('customer_token', 'review') }
			}],
			"request": createRequest('POST', '/api/reviews', {
				"product_id": "{{product_id}}",
				"order_id": "{{order_id}}",
				"rating": 5,
				"title": "Excellent Product!",
				"comment": "Great quality and fast shipping",
				"images": ["https://example.com/review1.jpg"]
			}, 'customer_token')
		},
		{
			"name": "Get Product Reviews",
			"request": createRequest('GET', '/api/products/{{product_id}}/reviews')
		},
		{
			"name": "Get My Reviews (Customer)",
			"request": createRequest('GET', '/api/reviews/my-reviews', null, 'customer_token')
		},
		{
			"name": "Update Review (Customer)",
			"request": createRequest('PUT', '/api/reviews/{{review_id}}', {
				"rating": 4,
				"title": "Good Product",
				"comment": "Updated review"
			}, 'customer_token')
		},
		{
			"name": "Delete Review (Customer)",
			"request": createRequest('DELETE', '/api/reviews/{{review_id}}', null, 'customer_token')
		},
		{
			"name": "Get Pending Reviews (Admin)",
			"request": createRequest('GET', '/api/admin/reviews/pending', null, 'admin_token')
		},
		{
			"name": "Approve Review (Admin)",
			"request": createRequest('POST', '/api/admin/reviews/{{review_id}}/approve', null, 'admin_token')
		},
		{
			"name": "Reject Review (Admin)",
			"request": createRequest('POST', '/api/admin/reviews/{{review_id}}/reject', {
				"reason": "Inappropriate content"
			}, 'admin_token')
		}
	]
});

// ============================================
// 12. ADDRESSES
// ============================================
collection.item.push({
	"name": "12. Addresses",
	"description": "User address management",
	"item": [
		{
			"name": "Create Address",
			"event": [{
				"listen": "test",
				"script": { "exec": createAutoSaveScript('customer_token', 'address') }
			}],
			"request": createRequest('POST', '/api/addresses', {
				"address_line1": "123 Main St",
				"address_line2": "Apt 4B",
				"city": "New York",
				"state": "NY",
				"postal_code": "10001",
				"country": "USA",
				"is_default": true
			}, 'customer_token')
		},
		{
			"name": "Get My Addresses",
			"request": createRequest('GET', '/api/addresses', null, 'customer_token')
		},
		{
			"name": "Get Address by ID",
			"request": createRequest('GET', '/api/addresses/{{address_id}}', null, 'customer_token')
		},
		{
			"name": "Update Address",
			"request": createRequest('PUT', '/api/addresses/{{address_id}}', {
				"address_line1": "456 Oak Ave",
				"city": "Brooklyn"
			}, 'customer_token')
		},
		{
			"name": "Delete Address",
			"request": createRequest('DELETE', '/api/addresses/{{address_id}}', null, 'customer_token')
		},
		{
			"name": "Set Default Address",
			"request": createRequest('PUT', '/api/addresses/{{address_id}}/default', null, 'customer_token')
		}
	]
});

// ============================================
// 13. INVENTORY (ADMIN)
// ============================================
collection.item.push({
	"name": "13. Inventory (Admin)",
	"description": "Inventory management",
	"item": [
		{
			"name": "Get All Inventory",
			"request": createRequest('GET', '/api/admin/inventory', null, 'admin_token')
		},
		{
			"name": "Get Product Inventory",
			"request": createRequest('GET', '/api/admin/inventory/{{product_id}}', null, 'admin_token')
		},
		{
			"name": "Update Inventory",
			"request": createRequest('PUT', '/api/admin/inventory/{{product_id}}', {
				"quantity": 150,
				"low_stock_threshold": 20
			}, 'admin_token')
		},
		{
			"name": "Get Low Stock Products",
			"request": createRequest('GET', '/api/admin/inventory/low-stock', null, 'admin_token')
		},
		{
			"name": "Get Inventory History",
			"request": createRequest('GET', '/api/admin/inventory/{{product_id}}/history', null, 'admin_token')
		}
	]
});

// ============================================
// 14. ANALYTICS (ADMIN/MANAGER)
// ============================================
collection.item.push({
	"name": "14. Analytics (Admin/Manager)",
	"description": "Business analytics and reports",
	"item": [
		{
			"name": "Get Dashboard Analytics",
			"request": createRequest('GET', '/api/admin/analytics/dashboard', null, 'admin_token')
		},
		{
			"name": "Get Sales Overview",
			"request": createRequest('GET', '/api/admin/analytics/sales/overview', null, 'admin_token')
		},
		{
			"name": "Get Revenue Analytics",
			"request": createRequest('GET', '/api/admin/analytics/revenue', null, 'admin_token')
		},
		{
			"name": "Get Product Performance",
			"request": createRequest('GET', '/api/admin/analytics/products/performance', null, 'admin_token')
		},
		{
			"name": "Get Customer Analytics",
			"request": createRequest('GET', '/api/admin/analytics/customers', null, 'admin_token')
		},
		{
			"name": "Get Feature Analytics (Manager)",
			"request": createRequest('GET', '/api/admin/analytics/features', null, 'manager_token')
		}
	]
});

// ============================================
// 15. USERS (ADMIN)
// ============================================
collection.item.push({
	"name": "15. Users (Admin)",
	"description": "User management",
	"item": [
		{
			"name": "Get All Users",
			"request": createRequest('GET', '/api/admin/users', null, 'admin_token')
		},
		{
			"name": "Get User by ID",
			"request": createRequest('GET', '/api/admin/users/{{user_id}}', null, 'admin_token')
		},
		{
			"name": "Update User Role",
			"request": createRequest('PUT', '/api/admin/users/{{user_id}}/role', {
				"role": "manager"
			}, 'admin_token')
		},
		{
			"name": "Deactivate User",
			"request": createRequest('PUT', '/api/admin/users/{{user_id}}/deactivate', null, 'admin_token')
		},
		{
			"name": "Activate User",
			"request": createRequest('PUT', '/api/admin/users/{{user_id}}/activate', null, 'admin_token')
		},
		{
			"name": "Delete User",
			"request": createRequest('DELETE', '/api/admin/users/{{user_id}}', null, 'admin_token')
		}
	]
});

// ============================================
// 16. SELLERS (PHASE 5)
// ============================================
collection.item.push({
	"name": "16. Sellers (Phase 5)",
	"description": "Seller management and verification",
	"item": [
		{
			"name": "Get All Sellers (Manager)",
			"request": createRequest('GET', '/api/manager/sellers', null, 'manager_token')
		},
		{
			"name": "Get Seller by ID",
			"request": createRequest('GET', '/api/sellers/{{seller_id}}', null, 'manager_token')
		},
		{
			"name": "Get Pending Sellers (Manager)",
			"request": createRequest('GET', '/api/manager/sellers/pending', null, 'manager_token')
		},
		{
			"name": "Verify Seller (Manager)",
			"request": createRequest('POST', '/api/manager/sellers/{{seller_id}}/verify', null, 'manager_token')
		},
		{
			"name": "Reject Seller (Manager)",
			"request": createRequest('POST', '/api/manager/sellers/{{seller_id}}/reject', {
				"reason": "Incomplete documentation"
			}, 'manager_token')
		},
		{
			"name": "Get Seller Performance",
			"request": createRequest('GET', '/api/sellers/{{seller_id}}/performance', null, 'seller_token')
		}
	]
});

// ============================================
// 17. NOTIFICATIONS (PHASE 5)
// ============================================
collection.item.push({
	"name": "17. Notifications (Phase 5)",
	"description": "User notification system",
	"item": [
		{
			"name": "Get My Notifications",
			"request": createRequest('GET', '/api/notifications', null, 'token')
		},
		{
			"name": "Get Unread Notifications",
			"request": createRequest('GET', '/api/notifications/unread', null, 'token')
		},
		{
			"name": "Mark Notification as Read",
			"request": createRequest('PUT', '/api/notifications/{{notification_id}}/read', null, 'token')
		},
		{
			"name": "Mark All as Read",
			"request": createRequest('PUT', '/api/notifications/mark-all-read', null, 'token')
		},
		{
			"name": "Delete Notification",
			"request": createRequest('DELETE', '/api/notifications/{{notification_id}}', null, 'token')
		}
	]
});

// ============================================
// 18. DISPUTES (PHASE 5)
// ============================================
collection.item.push({
	"name": "18. Disputes (Phase 5)",
	"description": "Order dispute management",
	"item": [
		{
			"name": "Create Dispute (Customer)",
			"event": [{
				"listen": "test",
				"script": { "exec": createAutoSaveScript('customer_token', 'dispute') }
			}],
			"request": createRequest('POST', '/api/disputes', {
				"order_id": "{{order_id}}",
				"reason": "product_not_received",
				"description": "Order never arrived",
				"evidence": ["https://example.com/evidence1.jpg"]
			}, 'customer_token')
		},
		{
			"name": "Get My Disputes (Customer)",
			"request": createRequest('GET', '/api/disputes/my-disputes', null, 'customer_token')
		},
		{
			"name": "Get Dispute by ID",
			"request": createRequest('GET', '/api/disputes/{{dispute_id}}', null, 'customer_token')
		},
		{
			"name": "Get All Disputes (Manager)",
			"request": createRequest('GET', '/api/manager/disputes', null, 'manager_token')
		},
		{
			"name": "Resolve Dispute (Manager)",
			"request": createRequest('PUT', '/api/manager/disputes/{{dispute_id}}/resolve', {
				"resolution": "Refund issued to customer",
				"outcome": "customer_favor"
			}, 'manager_token')
		},
		{
			"name": "Add Dispute Message",
			"request": createRequest('POST', '/api/disputes/{{dispute_id}}/messages', {
				"message": "Additional information provided"
			}, 'customer_token')
		}
	]
});

// ============================================
// 19. COMMISSIONS (PHASE 4)
// ============================================
collection.item.push({
	"name": "19. Commissions (Phase 4)",
	"description": "Commission management for multi-vendor",
	"item": [
		{
			"name": "Get Commission Settings (Admin)",
			"request": createRequest('GET', '/api/admin/commissions/settings', null, 'admin_token')
		},
		{
			"name": "Update Commission Settings (Admin)",
			"request": createRequest('PUT', '/api/admin/commissions/settings', {
				"default_rate": 15,
				"category_rates": {
					"electronics": 10,
					"clothing": 20
				}
			}, 'admin_token')
		},
		{
			"name": "Get Seller Commissions",
			"request": createRequest('GET', '/api/sellers/{{seller_id}}/commissions', null, 'seller_token')
		},
		{
			"name": "Get Commission Report (Admin)",
			"request": createRequest('GET', '/api/admin/commissions/report', null, 'admin_token')
		}
	]
});

// ============================================
// 20. SELLER BALANCE (PHASE 4)
// ============================================
collection.item.push({
	"name": "20. Seller Balance (Phase 4)",
	"description": "Seller balance and payout management",
	"item": [
		{
			"name": "Get My Balance (Seller)",
			"request": createRequest('GET', '/api/sellers/balance', null, 'seller_token')
		},
		{
			"name": "Get Balance History (Seller)",
			"request": createRequest('GET', '/api/sellers/balance/history', null, 'seller_token')
		},
		{
			"name": "Request Payout (Seller)",
			"request": createRequest('POST', '/api/sellers/balance/payout', {
				"amount": 1000.00,
				"payout_method": "bank_transfer"
			}, 'seller_token')
		},
		{
			"name": "Get Payout Requests (Admin)",
			"request": createRequest('GET', '/api/admin/payouts', null, 'admin_token')
		},
		{
			"name": "Process Payout (Admin)",
			"request": createRequest('POST', '/api/admin/payouts/{{payout_id}}/process', null, 'admin_token')
		}
	]
});

// ============================================
// 21. SUB-ORDERS (PHASE 4)
// ============================================
collection.item.push({
	"name": "21. Sub-Orders (Phase 4)",
	"description": "Multi-vendor sub-order management",
	"item": [
		{
			"name": "Get Order Sub-Orders",
			"request": createRequest('GET', '/api/orders/{{order_id}}/sub-orders', null, 'customer_token')
		},
		{
			"name": "Get Seller Sub-Orders",
			"request": createRequest('GET', '/api/sellers/sub-orders', null, 'seller_token')
		},
		{
			"name": "Update Sub-Order Status (Seller)",
			"request": createRequest('PUT', '/api/sellers/sub-orders/{{sub_order_id}}/status', {
				"status": "shipped",
				"tracking_number": "TRACK123456"
			}, 'seller_token')
		}
	]
});

// ============================================
// 22. AUDIT LOGS (ADMIN)
// ============================================
collection.item.push({
	"name": "22. Audit Logs (Admin)",
	"description": "System audit trail",
	"item": [
		{
			"name": "Get Audit Logs",
			"request": createRequest('GET', '/api/admin/audit-logs', null, 'admin_token')
		},
		{
			"name": "Get User Audit Logs",
			"request": createRequest('GET', '/api/admin/audit-logs/users/{{user_id}}', null, 'admin_token')
		},
		{
			"name": "Get Entity Audit Logs",
			"request": createRequest('GET', '/api/admin/audit-logs/entity/orders/{{order_id}}', null, 'admin_token')
		}
	]
});

// Write to file
const outputFile = 'Complete-Backend-API.postman_collection.json';
fs.writeFileSync(outputFile, JSON.stringify(collection, null, 2));

console.log('\n✅ Complete Postman Collection Generated Successfully!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📝 File:', outputFile);
console.log('📊 Total Sections:', collection.item.length);
console.log('🔐 Roles Included: Customer, Seller, Manager, Admin');
console.log('🎯 Features:');
console.log('   ✓ Auto-save base URL (default: http://localhost:5000)');
console.log('   ✓ Auto-save tokens for all roles');
console.log('   ✓ Auto-save all resource IDs');
console.log('   ✓ 150+ endpoints across all phases (1-6)');
console.log('   ✓ Complete Phase 6 critical features');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📖 How to Use:');
console.log('1. Import', outputFile, 'into Postman');
console.log('2. Create a new environment or use existing one');
console.log('3. Start with "0. Authentication" to login and get tokens');
console.log('4. Tokens and IDs will auto-save as you test endpoints');
console.log('5. Test endpoints in order for best results');
console.log('\n🚀 Ready to test your complete backend API!');
