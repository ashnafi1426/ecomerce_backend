# Order Tracking Service

## Overview

The Order Tracking Service provides comprehensive order tracking functionality for the FastShop e-commerce platform. It handles order timeline building, estimated delivery calculations, sub-order tracking for multi-seller orders, status updates, and tracking information management.

## Features

### 1. Order Timeline Building
- Aggregates all status changes from `order_status_history` table
- Returns chronological timeline with timestamps and details
- Includes tracking information and metadata for each event

### 2. Estimated Delivery Calculation
- Calculates delivery dates based on shipping method
- Accounts for processing time (2 days) if not yet shipped
- Supports multiple shipping methods:
  - Standard: 7 days
  - Express: 3 days
  - Overnight: 1 day
  - Two Day: 2 days
  - Economy: 10 days

### 3. Sub-Order Tracking
- Retrieves tracking information for multi-seller orders
- Returns separate tracking details for each seller's portion
- Includes seller information and individual timelines

### 4. Status Updates
- Updates order status with validation
- Creates history records automatically
- Emits WebSocket events for real-time updates (placeholder)

### 5. Tracking Information
- Adds tracking numbers and carrier information
- Updates order records and history
- Emits WebSocket events for tracking updates (placeholder)

## API Reference

### buildOrderTimeline(orderId)

Builds a complete timeline of status changes for an order.

**Parameters:**
- `orderId` (String): Order UUID

**Returns:**
- Promise<Array>: Array of timeline events

**Example:**
```javascript
const timeline = await orderTrackingService.buildOrderTimeline('order-uuid');
// Returns:
// [
//   {
//     id: 'event-uuid',
//     status: 'confirmed',
//     previousStatus: 'pending',
//     timestamp: '2024-01-15T10:00:00Z',
//     changedBy: 'user-uuid',
//     reason: 'Payment confirmed',
//     notes: 'Order confirmed by system',
//     trackingNumber: null,
//     carrier: null,
//     metadata: {}
//   },
//   ...
// ]
```

### calculateEstimatedDelivery(orderId)

Calculates the estimated delivery date based on shipping method and current status.

**Parameters:**
- `orderId` (String): Order UUID

**Returns:**
- Promise<Date|null>: Estimated delivery date or null if already delivered

**Example:**
```javascript
const estimatedDate = await orderTrackingService.calculateEstimatedDelivery('order-uuid');
// Returns: Date object (e.g., 2024-01-22T00:00:00Z)
```

### getSubOrderTracking(orderId)

Gets tracking information for all sub-orders in a multi-seller order.

**Parameters:**
- `orderId` (String): Order UUID

**Returns:**
- Promise<Array>: Array of sub-order tracking information

**Example:**
```javascript
const subOrders = await orderTrackingService.getSubOrderTracking('order-uuid');
// Returns:
// [
//   {
//     subOrderId: 'sub-order-uuid',
//     sellerId: 'seller-uuid',
//     sellerName: 'Seller Name',
//     sellerEmail: 'seller@example.com',
//     status: 'shipped',
//     amount: 2999,
//     trackingNumber: '1Z999AA10123456784',
//     carrier: 'UPS',
//     shippedAt: '2024-01-16T10:00:00Z',
//     deliveredAt: null,
//     timeline: [...],
//     items: [...]
//   },
//   ...
// ]
```

### updateStatus(orderId, newStatus, userId, options)

Updates order status and creates a history record.

**Parameters:**
- `orderId` (String): Order UUID
- `newStatus` (String): New status value
- `userId` (String): User ID making the change
- `options` (Object): Additional options
  - `reason` (String): Reason for status change
  - `notes` (String): Additional notes
  - `metadata` (Object): Additional metadata

**Returns:**
- Promise<Object>: Updated order object

**Valid Statuses:**
- `pending`
- `confirmed`
- `processing`
- `shipped`
- `out_for_delivery`
- `delivered`
- `cancelled`
- `refunded`

**Example:**
```javascript
const updatedOrder = await orderTrackingService.updateStatus(
  'order-uuid',
  'shipped',
  'seller-uuid',
  {
    reason: 'Package handed to carrier',
    notes: 'Shipped via UPS',
    metadata: { warehouse: 'WH-001' }
  }
);
```

### addTracking(orderId, trackingNumber, carrier, userId)

Adds tracking number and carrier information to an order.

**Parameters:**
- `orderId` (String): Order UUID
- `trackingNumber` (String): Tracking number from carrier
- `carrier` (String): Carrier name (e.g., 'UPS', 'FedEx', 'USPS')
- `userId` (String): User ID adding the tracking info

**Returns:**
- Promise<Object>: Updated order object

**Example:**
```javascript
const updatedOrder = await orderTrackingService.addTracking(
  'order-uuid',
  '1Z999AA10123456784',
  'UPS',
  'seller-uuid'
);
```

## Database Schema

### order_status_history Table

```sql
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES users(id),
  change_reason TEXT,
  notes TEXT,
  tracking_number VARCHAR(255),
  carrier VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);
```

## Integration Points

### WebSocket Events (Placeholder)

The service includes placeholder code for WebSocket event emission. When the WebSocketHandler is implemented (task 26), these placeholders will be replaced with actual WebSocket calls:

- **Status Update Event**: Emitted when order status changes
- **Tracking Update Event**: Emitted when tracking information is added

### Notification System

The service integrates with the notification system through the status update and tracking addition methods. Notifications should be triggered by:
- Order status changes (handled by notification service)
- Tracking information additions (handled by notification service)

## Error Handling

All methods include comprehensive error handling:
- Database query errors are caught and logged
- Validation errors throw descriptive error messages
- WebSocket errors are logged but don't fail the main operation
- History creation errors are logged but don't fail status updates

## Future Enhancements

1. **WebSocket Integration**: Replace placeholder event emission with actual WebSocket handler calls
2. **Advanced Status Validation**: Implement state machine for status transitions
3. **Carrier API Integration**: Fetch real-time tracking updates from carrier APIs
4. **Delivery Prediction ML**: Use machine learning for more accurate delivery estimates
5. **Multi-Package Support**: Handle orders with multiple packages per sub-order

## Requirements Validation

This service validates the following requirements from the design document:

- **Requirement 7.2**: Build order timeline from status history ✓
- **Requirement 7.3**: Calculate estimated delivery date ✓
- **Requirement 7.4**: Add tracking information ✓
- **Requirement 7.7**: Get sub-order tracking for multi-seller orders ✓
- **Requirement 8.1**: Update order status ✓
- **Requirement 8.4**: Emit WebSocket event for status updates (placeholder) ✓
- **Requirement 8.5**: Emit WebSocket event for tracking updates (placeholder) ✓

## Testing

Unit tests are provided in `orderTracking.service.test.js`. Run tests with:

```bash
npm test orderTracking.service.test.js
```

## Usage Example

```javascript
const orderTrackingService = require('./services/orderTrackingServices/orderTracking.service');

// Build timeline
const timeline = await orderTrackingService.buildOrderTimeline(orderId);

// Calculate estimated delivery
const estimatedDate = await orderTrackingService.calculateEstimatedDelivery(orderId);

// Get sub-order tracking
const subOrders = await orderTrackingService.getSubOrderTracking(orderId);

// Update status
const updatedOrder = await orderTrackingService.updateStatus(
  orderId,
  'shipped',
  userId,
  { notes: 'Package shipped' }
);

// Add tracking
const orderWithTracking = await orderTrackingService.addTracking(
  orderId,
  '1Z999AA10123456784',
  'UPS',
  userId
);
```
