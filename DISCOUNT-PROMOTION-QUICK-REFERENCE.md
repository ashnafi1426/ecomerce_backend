# Discount & Promotion System - Quick Reference

## 🚀 Quick Start

### 1. Run Migration
```bash
node run-discount-promotion-migration.js
```

### 2. Run Tests
```bash
node test-coupons.js
node test-promotions.js
```

### 3. Restart Server
```bash
npm run dev
```

---

## 📋 Common Operations

### Create a Coupon
```javascript
POST /api/coupons
{
  "code": "SAVE20",
  "description": "$20 off orders over $100",
  "discount_type": "fixed",
  "discount_value": 20,
  "min_order_amount": 100,
  "usage_limit": 500,
  "per_user_limit": 1,
  "valid_from": "2024-01-01T00:00:00Z",
  "valid_until": "2024-12-31T23:59:59Z",
  "is_active": true,
  "applicable_to": "all"
}
```

### Validate a Coupon
```javascript
POST /api/coupons/validate
{
  "code": "SAVE20",
  "cartTotal": 150.00,
  "cartItems": []
}
```

### Create a Promotion
```javascript
POST /api/promotions
{
  "product_id": "uuid",
  "promotional_price": 79.99,
  "valid_from": "2024-01-01T00:00:00Z",
  "valid_until": "2024-12-31T23:59:59Z",
  "is_active": true
}
```

### Get Featured Products
```javascript
GET /api/promotions/products/featured?limit=10
```

---

## 🎯 Discount Types

| Type | Description | Example |
|------|-------------|---------|
| `percentage` | Percentage off | 10% off |
| `fixed` | Fixed amount off | $20 off |
| `free_shipping` | Free shipping | No shipping cost |

---

## 🔑 Key Endpoints

### Coupons
- `POST /api/coupons/validate` - Validate coupon
- `GET /api/coupons/user/available` - Get user's available coupons
- `GET /api/coupons/active` - Get active coupons
- `POST /api/coupons` - Create coupon (Admin)
- `GET /api/coupons/:id/usage` - Get usage stats (Admin)

### Promotions
- `GET /api/promotions/products/featured` - Featured products
- `GET /api/promotions/product/:id/price` - Get promo price
- `POST /api/promotions` - Create promotion (Seller/Admin)
- `POST /api/promotions/bulk` - Bulk create (Admin)

---

## 📊 Sample Coupons

| Code | Type | Discount | Min Order | Limit |
|------|------|----------|-----------|-------|
| WELCOME10 | percentage | 10% | $50 | 1/user |
| FREESHIP | free_shipping | - | $100 | 5/user |
| SAVE20 | fixed | $20 | $200 | 3/user |

---

## ✅ Validation Rules

### Coupons
- ✓ Code must be uppercase alphanumeric
- ✓ Must be active
- ✓ Must be within valid dates
- ✓ Must not exceed usage limits
- ✓ Cart must meet minimum amount
- ✓ User must not exceed per-user limit

### Promotions
- ✓ Promotional price < regular price
- ✓ Must be within valid dates
- ✓ Must be active
- ✓ Valid until > valid from

---

## 🔐 Permissions

| Role | Coupons | Promotions |
|------|---------|------------|
| Customer | Validate, View | View |
| Seller | - | Create, Manage Own |
| Manager | Full Access | Full Access |
| Admin | Full Access | Full Access |

---

## 🧪 Testing

```bash
# Test coupons (11 tests)
node test-coupons.js

# Test promotions (12 tests)
node test-promotions.js
```

---

## 📝 Code Examples

### Service Usage
```javascript
const couponService = require('./services/couponServices/coupon.service');
const promotionService = require('./services/promotionServices/promotion.service');

// Validate coupon
const result = await couponService.validateCoupon('SAVE20', userId, 150, []);

// Get promotional price
const price = await promotionService.getPromotionalPrice(productId);
```

### Database Queries
```sql
-- Get active coupons
SELECT * FROM coupons WHERE is_active = true AND NOW() BETWEEN valid_from AND valid_until;

-- Get promotional price
SELECT promotional_price FROM promotional_pricing 
WHERE product_id = 'uuid' AND is_active = true AND NOW() BETWEEN valid_from AND valid_until;
```

---

## 🛠️ Troubleshooting

### Migration Issues
If migration fails, run SQL manually:
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run: `database/migrations/create-discount-promotion-tables.sql`

### Test Failures
Ensure:
- Admin user exists
- Database tables created
- Server is running
- Environment variables set

### API Errors
Check:
- Authentication token
- User permissions
- Request body format
- Date formats (ISO 8601)

---

## 📞 Support

For issues or questions:
1. Check `DISCOUNT-PROMOTION-SYSTEM-COMPLETE.md`
2. Review test files for examples
3. Check server logs
4. Verify database schema

---

**Status**: ✅ Production Ready
**Version**: 1.0
**Last Updated**: 2024
