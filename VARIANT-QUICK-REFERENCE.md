# Product Variants - Quick Reference Guide

## 🚀 Quick Start

### 1. Setup (One-Time)
```bash
# Execute SQL in Supabase Dashboard
# File: database/migrations/create-product-variants.sql
```

### 2. Test
```bash
node test-variants.js
```

### 3. Use
See API examples below

---

## 📋 API Endpoints Cheat Sheet

### Create Variant
```http
POST /api/products/:productId/variants
Authorization: Bearer {sellerToken}
Content-Type: application/json

{
  "variant_name": "Size: Large",
  "sku": "SKU-L-001",
  "price_adjustment": 5.00,
  "attributes": {"size": "L"},
  "initial_quantity": 100,
  "low_stock_threshold": 10
}
```

### Bulk Create Variants
```http
POST /api/products/:productId/variants/bulk
Authorization: Bearer {sellerToken}

{
  "variants": [
    {
      "variant_name": "Size: Small",
      "sku": "SKU-S-001",
      "price_adjustment": -5.00,
      "attributes": {"size": "S"},
      "initial_quantity": 50
    },
    {
      "variant_name": "Size: Medium",
      "sku": "SKU-M-001",
      "price_adjustment": 0,
      "attributes": {"size": "M"},
      "initial_quantity": 75
    }
  ]
}
```

### Get Product Variants
```http
GET /api/products/:productId/variants
GET /api/products/:productId/variants?active_only=true
```

### Get Variant Details
```http
GET /api/variants/:variantId
```

### Update Variant
```http
PUT /api/variants/:variantId
Authorization: Bearer {sellerToken}

{
  "variant_name": "Size: Large (Updated)",
  "price_adjustment": 7.00,
  "is_active": true
}
```

### Delete Variant
```http
DELETE /api/variants/:variantId
Authorization: Bearer {sellerToken}
```

### Get Variant Inventory
```http
GET /api/variants/:variantId/inventory
```

### Update Inventory (Set Quantity)
```http
PUT /api/variants/:variantId/inventory
Authorization: Bearer {sellerToken}

{
  "quantity": 150
}
```

### Update Inventory (Adjust)
```http
PUT /api/variants/:variantId/inventory
Authorization: Bearer {sellerToken}

{
  "adjustment": 25  // Add 25 to current quantity
}
```

### Check Availability
```http
GET /api/variants/:variantId/availability?quantity=10
```

### Get Variant Price
```http
GET /api/variants/:variantId/price
```

### Search by Attributes
```http
POST /api/products/:productId/variants/search

{
  "attributes": {
    "size": "L",
    "color": "Red"
  }
}
```

### Get Low Stock Variants
```http
GET /api/products/:productId/variants/low-stock
Authorization: Bearer {sellerToken}
```

### Add Variant to Cart
```http
POST /api/cart/items
Authorization: Bearer {customerToken}

{
  "productId": "product-uuid",
  "variantId": "variant-uuid",
  "quantity": 2
}
```

---

## 💻 Code Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

// Create variant
const createVariant = async (productId, token) => {
  const response = await axios.post(
    `http://localhost:5000/api/products/${productId}/variants`,
    {
      variant_name: 'Size: Large',
      sku: `SKU-L-${Date.now()}`,
      price_adjustment: 5.00,
      attributes: { size: 'L' },
      initial_quantity: 100
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};

// Get variants
const getVariants = async (productId) => {
  const response = await axios.get(
    `http://localhost:5000/api/products/${productId}/variants`
  );
  return response.data;
};

// Add to cart with variant
const addToCart = async (productId, variantId, token) => {
  const response = await axios.post(
    'http://localhost:5000/api/cart/items',
    {
      productId,
      variantId,
      quantity: 1
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};
```

### React Example

```jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function ProductVariants({ productId }) {
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    // Fetch variants
    axios.get(`/api/products/${productId}/variants`)
      .then(res => setVariants(res.data.data))
      .catch(err => console.error(err));
  }, [productId]);

  const addToCart = async () => {
    if (!selectedVariant) return;
    
    try {
      await axios.post('/api/cart/items', {
        productId,
        variantId: selectedVariant.id,
        quantity: 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Added to cart!');
    } catch (error) {
      alert('Failed to add to cart');
    }
  };

  return (
    <div>
      <h3>Select Variant:</h3>
      {variants.map(variant => (
        <button
          key={variant.id}
          onClick={() => setSelectedVariant(variant)}
          className={selectedVariant?.id === variant.id ? 'selected' : ''}
        >
          {variant.variant_name}
          {variant.price_adjustment !== 0 && (
            <span> ({variant.price_adjustment > 0 ? '+' : ''}${variant.price_adjustment})</span>
          )}
        </button>
      ))}
      <button onClick={addToCart} disabled={!selectedVariant}>
        Add to Cart
      </button>
    </div>
  );
}
```

---

## 🗄️ Database Schema

### product_variants
```sql
id                UUID PRIMARY KEY
product_id        UUID REFERENCES products(id)
variant_name      VARCHAR(255)
sku               VARCHAR(100) UNIQUE
price_adjustment  DECIMAL(10, 2)
attributes        JSONB
is_active         BOOLEAN
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

### variant_inventory
```sql
id                  UUID PRIMARY KEY
variant_id          UUID REFERENCES product_variants(id)
quantity            INTEGER
reserved_quantity   INTEGER
low_stock_threshold INTEGER
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### cart_items (updated)
```sql
id          UUID PRIMARY KEY
user_id     UUID REFERENCES users(id)
product_id  UUID REFERENCES products(id)
variant_id  UUID REFERENCES product_variants(id)  -- NEW
quantity    INTEGER
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

---

## 🔑 Key Concepts

### Price Calculation
```
Final Price = Base Product Price + Variant Price Adjustment

Example:
- Product: $29.99
- Variant (Large): +$5.00
- Final Price: $34.99
```

### Inventory Management
```
Available Quantity = Total Quantity - Reserved Quantity

Example:
- Total: 100
- Reserved: 15 (in carts/pending orders)
- Available: 85
```

### Attributes (JSONB)
```json
{
  "size": "L",
  "color": "Red",
  "material": "Cotton",
  "style": "Slim Fit"
}
```

---

## ✅ Common Use Cases

### 1. T-Shirt with Sizes
```javascript
const sizes = ['S', 'M', 'L', 'XL'];
const variants = sizes.map(size => ({
  variant_name: `Size: ${size}`,
  sku: `TSHIRT-${size}-${Date.now()}`,
  price_adjustment: size === 'XL' ? 5.00 : 0,
  attributes: { size },
  initial_quantity: 100
}));

// Bulk create
await axios.post(`/api/products/${productId}/variants/bulk`, { variants });
```

### 2. Shoes with Size and Color
```javascript
const sizes = [7, 8, 9, 10, 11];
const colors = ['Black', 'White', 'Blue'];

const variants = [];
for (const size of sizes) {
  for (const color of colors) {
    variants.push({
      variant_name: `Size: ${size}, Color: ${color}`,
      sku: `SHOE-${size}-${color}-${Date.now()}`,
      price_adjustment: 0,
      attributes: { size, color },
      initial_quantity: 50
    });
  }
}

await axios.post(`/api/products/${productId}/variants/bulk`, { variants });
```

### 3. Check Stock Before Adding to Cart
```javascript
const checkAndAddToCart = async (variantId, quantity) => {
  // Check availability
  const availRes = await axios.get(
    `/api/variants/${variantId}/availability?quantity=${quantity}`
  );
  
  if (!availRes.data.data.is_available) {
    alert(`Only ${availRes.data.data.available_quantity} available`);
    return;
  }
  
  // Add to cart
  await axios.post('/api/cart/items', {
    productId,
    variantId,
    quantity
  });
};
```

---

## 🐛 Troubleshooting

### Error: "SKU already exists"
**Solution:** Use unique SKUs with timestamps or UUIDs
```javascript
sku: `SKU-${productId.slice(0,8)}-${Date.now()}`
```

### Error: "Insufficient stock"
**Solution:** Check available quantity first
```javascript
const { data } = await axios.get(`/api/variants/${variantId}/inventory`);
console.log('Available:', data.data.available);
```

### Error: "Variant not found"
**Solution:** Verify variant exists and is active
```javascript
const { data } = await axios.get(`/api/variants/${variantId}`);
if (!data.data.is_active) {
  console.log('Variant is inactive');
}
```

---

## 📊 Response Examples

### Create Variant Response
```json
{
  "success": true,
  "message": "Variant created successfully",
  "data": {
    "id": "uuid",
    "product_id": "uuid",
    "variant_name": "Size: Large",
    "sku": "SKU-L-001",
    "price_adjustment": 5.00,
    "attributes": {"size": "L"},
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "inventory": {
      "id": "uuid",
      "variant_id": "uuid",
      "quantity": 100,
      "reserved_quantity": 0,
      "low_stock_threshold": 10
    }
  }
}
```

### Get Variants Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "variant_name": "Size: Small",
      "sku": "SKU-S-001",
      "price_adjustment": -5.00,
      "attributes": {"size": "S"},
      "inventory": [{
        "quantity": 50,
        "reserved_quantity": 5
      }]
    }
  ],
  "count": 1
}
```

### Cart with Variant Response
```json
[
  {
    "id": "uuid",
    "product_id": "uuid",
    "variant_id": "uuid",
    "quantity": 2,
    "product": {
      "title": "T-Shirt",
      "price": 29.99
    },
    "variant": {
      "variant_name": "Size: Large",
      "price_adjustment": 5.00,
      "attributes": {"size": "L"}
    }
  }
]
```

---

## 🎯 Best Practices

1. **Always use unique SKUs** - Include product ID and timestamp
2. **Check availability** - Before adding to cart
3. **Handle inactive variants** - Filter in UI
4. **Use bulk creation** - For multiple variants
5. **Set low stock thresholds** - For alerts
6. **Validate attributes** - Before searching
7. **Update inventory carefully** - Use adjustments for safety

---

## 📚 Related Documentation

- Full Implementation: `PRODUCT-VARIANTS-IMPLEMENTATION.md`
- Setup Guide: `VARIANT-SETUP-INSTRUCTIONS.md`
- Test Suite: `test-variants.js`
- Migration SQL: `database/migrations/create-product-variants.sql`

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Production Ready
