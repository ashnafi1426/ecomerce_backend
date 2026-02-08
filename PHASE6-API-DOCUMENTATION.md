# Phase 6: Critical Features API Documentation

## Overview

This document provides comprehensive API documentation for all Phase 6 critical features:
- Product Variants System
- Discount and Promotion System
- Delivery Rating System
- Replacement Process System
- Enhanced Refund Process System

All endpoints require authentication unless otherwise specified. Role-based access control (RBAC) is enforced on all endpoints.

---

## Table of Contents

1. [Product Variants API](#product-variants-api)
2. [Discount and Promotion API](#discount-and-promotion-api)
3. [Delivery Rating API](#delivery-rating-api)
4. [Replacement Process API](#replacement-process-api)
5. [Enhanced Refund API](#enhanced-refund-api)
6. [Authentication](#authentication)
7. [Error Responses](#error-responses)

---

## Product Variants API

### Base URL: `/api/variants`

### 1. Create Product Variant

**Endpoint:** `POST /api/variants`

**Authentication:** Required (Seller role)

**Description:** Create a new variant for a product

**Request Body:**
```json
{
  "product_id": "uuid",
  "variant_name": "Large Blue Cotton",
  "attributes": {
    "size": "L",
    "color": "Blue",
    "material": "Cotton"
  },
  "price": 29.99,
  "compare_at_price": 39.99,
  "sku