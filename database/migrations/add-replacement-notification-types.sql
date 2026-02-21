/**
 * Add replacement notification types to the notification_type enum
 * 
 * Spec: customer-order-management-enhancements
 * Task: 5.2 - Implement notification for replacement decisions
 * Requirements: 1.5, 2.1, 2.4, 14.2
 */

-- Add new notification types for replacement system
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'replacement_request_created';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'replacement_request_received';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'replacement_request_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'replacement_request_rejected';

-- Note: These types support the following requirements:
-- - replacement_request_created: Customer notification when request is submitted (Requirement 1.5)
-- - replacement_request_received: Seller notification when request is received (Requirement 2.1)
-- - replacement_request_approved: Customer notification when request is approved (Requirement 14.2)
-- - replacement_request_rejected: Customer notification when request is rejected (Requirements 2.4, 14.2)
