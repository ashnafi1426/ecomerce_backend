# SOFTWARE REQUIREMENTS SPECIFICATION
# FastShop Multi-Vendor E-Commerce Platform
## SELLER ROLE - COMPLETE SPECIFICATION

---

**Document Classification:** CONFIDENTIAL - INTERNAL USE ONLY  
**Document Version:** 1.0  
**Date:** February 7, 2026  
**Role Specification:** Seller (Vendor/Merchant)  
**Authority Level:** OWN DATA ONLY  
**Standard Compliance:** IEEE 830-1998 / ISO/IEC/IEEE 29148:2018

---

## DOCUMENT CONTROL

| Attribute | Value |
|-----------|-------|
| Document ID | SRS-SELLER-FSHOP-2026-001 |
| Version | 1.0 |
| Status | Final - Implementation Ready |
| Classification | Confidential |
| Role | Seller (Vendor/Merchant) |
| Authority | Own Data Access Only |
| Review Cycle | Quarterly |

## APPROVAL SIGNATURES

| Role | Name | Signature | Date | Status |
|------|------|-----------|------|--------|
| VP of Seller Relations | | | | ☐ Pending |
| Head of Marketplace Operations | | | | ☐ Pending |
| Head of Payments | | | | ☐ Pending |
| Legal Counsel | | | | ☐ Pending |

---

## TABLE OF CONTENTS

1. [SELLER ROLE OVERVIEW](#1-seller-role-overview)
2. [SELLER REGISTRATION & VERIFICATION](#2-seller-registration-verification)
3. [PRODUCT MANAGEMENT](#3-product-management)
4. [INVENTORY MANAGEMENT](#4-inventory-management)
5. [ORDER FULFILLMENT](#5-order-fulfillment)
6. [SHIPPING & TRACKING](#6-shipping-tracking)
7. [SELLER PAYMENTS & PAYOUTS](#7-seller-payments-payouts)
8. [COMMISSION TRANSPARENCY](#8-commission-transparency)
9. [REFUND & RETURN IMPACT](#9-refund-return-impact)
10. [SELLER DASHBOARD REQUIREMENTS](#10-seller-dashboard-requirements)
11. [NOTIFICATIONS](#11-notifications)
12. [REPORTING & EARNINGS ANALYTICS](#12-reporting-earnings-analytics)
13. [SECURITY CONSTRAINTS](#13-security-constraints)
14. [ERROR SCENARIOS](#14-error-scenarios)

---

# 1. SELLER ROLE OVERVIEW

## 1.1 Role Definition

**Role Name:** Seller (Vendor/Merchant)  
**Role Code:** SELLER  
**Role Type:** Marketplace Vendor  
**Authority Level:** OWN DATA ONLY  
**Access Scope:** Own Products, Orders, and Financial Data  
**Restriction Level:** CANNOT access other sellers' data or system configuration  

## 1.2 Role Purpose

The Seller role represents independent vendors who list and sell products on the FastShop marketplace. Sellers are responsible for:

1. **Product Listing**: Creating and managing product catalog
2. **Inventory Control**: Maintaining accurate stock levels
3. **Order Fulfillment**: Processing and shipping customer orders
4. **Customer Service**: Responding to customer inquiries and issues
5. **Financial Management**: Tracking earnings, commissions, and payouts
6. **Performance Monitoring**: Maintaining quality standards and ratings
7. **Compliance**: Adhering to platform policies and regulations

## 1.3 Role Characteristics

### 1.3.1 Authority Matrix

| Capability | Seller Authority | Requires Approval | Restrictions |
|------------|-----------------|-------------------|--------------|
| Create Products | FULL | YES (Manager approval) | Own products only |
| Edit Products | FULL | YES (if already approved) | Own products only |
| Delete Products | FULL | NO | Own products only, cannot delete if active orders |
| View Orders | FULL | NO | Own orders only |
| Fulfill Orders | FULL | NO | Own orders only |
| Cancel Orders | LIMITED | YES (customer consent) | Own orders only, before shipment |
| Process Refunds | NONE | N/A | Manager handles refunds |
| View Payments | FULL | NO | Own transactions only |
| Configure Payouts | FULL | NO | Own payout settings only |
| View Other Sellers | NONE | N/A | Cannot see other sellers' data |
| Modify Commission | NONE | N/A | Admin-only function |
| Access Customer Data | LIMITED | NO | Only for own orders |
| Generate Reports | FULL | NO | Own data only |

### 1.3.2 Data Isolation Rules

**CRITICAL SECURITY REQUIREMENT:**  
The System SHALL enforce strict data isolation ensuring sellers can ONLY access their own data.

**CAN Access:**
✅ Own products (created by seller)  
✅ Own orders (containing seller's products)  
✅ Own inventory data  
✅ Own financial transactions  
✅ Own payout history  
✅ Own performance metrics  
✅ Own customer reviews  
✅ Customer information for own orders only  
✅ Own dashboard and analytics  

**CANNOT Access:**
❌ Other sellers' products  
❌ Other sellers' orders  
❌ Other sellers' financial data  
❌ Other sellers' performance metrics  
❌ Platform-wide statistics  
❌ System configuration  
❌ Commission rate configuration  
❌ User management  
❌ Admin or Manager functions  
❌ Customer data beyond own orders  

### 1.3.3 Seller Account Types

| Account Type | Requirements | Commission Rate | Features |
|--------------|-------------|-----------------|----------|
| **Individual Seller** | Personal ID, Tax ID | Standard (15%) | Basic features |
| **Business Seller** | Business License, Tax ID | Standard (15%) | All features |
| **Bronze Seller** | <$10K monthly sales | Standard (15%) | Standard support |
| **Silver Seller** | $10K-$50K monthly sales | Reduced (12%) | Priority support |
| **Gold Seller** | $50K-$100K monthly sales | Reduced (10%) | Premium support, featured placement |
| **Platinum Seller** | >$100K monthly sales | Reduced (8%) | VIP support, auto-approval |

### 1.3.4 Seller Performance Metrics

| Metric | Target | Impact |
|--------|--------|--------|
| Order Fulfillment Rate | >95% | Account standing |
| On-Time Shipment Rate | >90% | Search ranking |
| Customer Rating | >4.0/5.0 | Visibility |
| Return Rate | <10% | Commission rate |
| Response Time | <24 hours | Customer satisfaction |
| Policy Compliance | 100% | Account suspension risk |

---

# 2. SELLER REGISTRATION & VERIFICATION

## 2.1 Seller Registration Process

### FR-SELLER-2.1.1: Seller Account Registration

**Priority:** P0 - CRITICAL

**Description:**  
The System SHALL allow new sellers to register and create seller accounts with required business information.

**Acceptance Criteria:**

**AC-2.1.1.1:** WHEN a user navigates to the seller registration page, THE System SHALL display a registration form with the following sections:
- Account Information
- Business Information
- Contact Information
- Bank Account Information
- Tax Information
- Terms and Conditions

**AC-2.1.1.2:** THE System SHALL require the following Account Information fields:
- Email Address (unique, valid format)
- Password (minimum 12 characters, uppercase, lowercase, number, special character)
- Confirm Password (must match password)

**AC-2.1.1.3:** THE System SHALL require the following Business Information fields:
- Business Type (Individual/Sole Proprietor/Partnership/Corporation/LLC)
- Business Name (2-100 characters)
- Business Registration Number (if applicable)
- Business License Number (if applicable)
- Tax ID / EIN (required for business, SSN for individual)
- Business Address (Street, City, State, ZIP, Country)

**AC-2.1.1.4:** THE System SHALL require the following Contact Information fields:
- Contact Person Name
- Phone Number (with country code)
- Alternative Email (optional)
- Business Website (optional)

**AC-2.1.1.5:** THE System SHALL require the following Bank Account Information fields:
- Bank Name
- Account Holder Name
- Account Number
- Routing Number (for US) or SWIFT/IBAN (international)
- Account Type (Checking/Savings)

**AC-2.1.1.6:** THE System SHALL require the following Tax Information fields:
- Tax ID Type (SSN/EIN/VAT)
- Tax ID Number
- Tax Residency Country
- W-9 Form Upload (for US sellers)
- Tax Certificate Upload (if applicable)

**AC-2.1.1.7:** WHEN seller enters email address, THE System SHALL validate:
- Email format is valid (contains @ and domain)
- Email is not already registered
- Email domain is not from disposable email providers

**AC-2.1.1.8:** WHEN seller enters password, THE System SHALL display real-time password strength indicator (Weak/Fair/Good/Strong/Very Strong).

**AC-2.1.1.9:** WHEN seller enters Tax ID, THE System SHALL validate format based on country (e.g., 9 digits for US SSN, XX-XXXXXXX for US EIN).

**AC-2.1.1.10:** WHEN seller enters bank account number, THE System SHALL mask the number after entry (show only last 4 digits).

**AC-2.1.1.11:** THE System SHALL require seller to upload the following documents:
- Government-issued ID (Passport/Driver's License/National ID)
- Business License (if business account)
- Tax Certificate or W-9 Form
- Bank Statement or Voided Check (for account verification)

**AC-2.1.1.12:** THE System SHALL validate uploaded documents:
- File format: PDF, JPG, PNG only
- File size: Maximum 5MB per file
- Image quality: Minimum 300 DPI for scanned documents
- Document expiration: Not expired (for IDs and licenses)

**AC-2.1.1.13:** THE System SHALL require seller to accept Terms and Conditions by checking:
- Seller Agreement checkbox
- Privacy Policy checkbox
- Commission Structure acknowledgment checkbox

**AC-2.1.1.14:** WHEN seller clicks "Submit Registration", THE System SHALL validate all required fields are completed.

**AC-2.1.1.15:** WHEN all validations pass, THE System SHALL:
- Create seller account with status "Pending Verification"
- Generate unique Seller ID
- Send verification email to registered email address
- Display message "Registration submitted successfully. Please check your email to verify your account."

**AC-2.1.1.16:** WHEN seller clicks verification link in email within 24 hours, THE System SHALL:
- Mark email as verified
- Change account status to "Pending Admin Approval"
- Send notification to Admin for account review
- Display message "Email verified. Your account is under review. You will be notified within 2-3 business days."

**AC-2.1.1.17:** WHEN verification link expires (after 24 hours), THE System SHALL:
- Display message "Verification link expired"
- Provide option to resend verification email
- Allow maximum 3 resend attempts

**AC-2.1.1.18:** THE System SHALL save registration progress automatically every 2 minutes to prevent data loss.

**AC-2.1.1.19:** THE System SHALL allow seller to save draft and complete registration later (draft expires after 7 days).

**AC-2.1.1.20:** THE System SHALL log all registration attempts with timestamp, IP address, and user agent for security monitoring.

**Edge Cases:**

**EC-2.1.1.1:** IF seller closes browser during registration, THE System SHALL save progress and allow resumption from last completed section.

**EC-2.1.1.2:** IF seller enters email that was previously registered but never verified, THE System SHALL allow re-registration and invalidate old verification link.

**EC-2.1.1.3:** IF seller uploads corrupted or unreadable document, THE System SHALL display error "Unable to read document. Please upload a clear, readable file."

**EC-2.1.1.4:** IF seller enters bank account number that fails validation, THE System SHALL display error "Invalid account number format. Please verify and try again."

**EC-2.1.1.5:** IF seller's IP address is from high-risk country, THE System SHALL flag account for enhanced verification and notify Admin.

**EC-2.1.1.6:** IF seller attempts to register multiple accounts with same Tax ID, THE System SHALL block registration and display "An account with this Tax ID already exists."

**EC-2.1.1.7:** IF seller enters business name that matches existing seller, THE System SHALL display warning "Similar business name exists. Please ensure you're not creating duplicate account."

**EC-2.1.1.8:** IF document upload fails due to network error, THE System SHALL allow retry without losing other form data.

**EC-2.1.1.9:** IF seller's email bounces during verification, THE System SHALL mark account as "Email Invalid" and request alternative email.

**EC-2.1.1.10:** IF seller attempts SQL injection or XSS in form fields, THE System SHALL sanitize input, block submission, and log security incident.

### FR-SELLER-2.1.2: Admin Verification and Approval

**Priority:** P0 - CRITICAL

**Description:**  
The System SHALL allow Admin to review and verify seller registration applications before granting marketplace access.

**Acceptance Criteria:**

**AC-2.1.2.1:** WHEN a seller completes registration, THE System SHALL create a verification task in Admin's approval queue.

**AC-2.1.2.2:** WHEN Admin views seller verification queue, THE System SHALL display:
- Seller Name
- Business Name
- Registration Date
- Days Pending
- Verification Status
- Risk Score (Low/Medium/High)
- Quick Actions (Approve/Reject/Request More Info)

**AC-2.1.2.3:** WHEN Admin clicks on a seller application, THE System SHALL display complete seller information:
- All registration form data
- Uploaded documents (viewable/downloadable)
- Email verification status
- IP address and geolocation
- Device information
- Risk assessment report

**AC-2.1.2.4:** THE System SHALL perform automated verification checks:
- Email domain verification
- Phone number validation
- Tax ID format validation
- Bank account validation (via third-party service)
- Address verification
- Document authenticity check (basic)
- Duplicate account check
- Fraud risk assessment

**AC-2.1.2.5:** THE System SHALL display verification checklist for Admin:
- ☐ Business License Verified
- ☐ Tax ID Verified
- ☐ Bank Account Verified
- ☐ Identity Document Verified
- ☐ Address Verified
- ☐ No Duplicate Accounts Found
- ☐ No Fraud Indicators Found

**AC-2.1.2.6:** WHEN Admin approves seller account, THE System SHALL:
- Change account status from "Pending Approval" to "Approved"
- Send approval email to seller with login credentials and next steps
- Grant seller access to Seller Dashboard
- Create seller store page
- Assign default commission rate based on account type
- Log approval action with Admin ID and timestamp

**AC-2.1.2.7:** WHEN Admin rejects seller account, THE System SHALL:
- Change account status to "Rejected"
- Require Admin to select rejection reason from predefined list
- Require Admin to provide detailed explanation
- Send rejection email to seller with reason and appeal process
- Log rejection action with Admin ID, reason, and timestamp
- Retain application data for 90 days for appeal purposes

**AC-2.1.2.8:** WHEN Admin requests more information, THE System SHALL:
- Change account status to "Information Requested"
- Allow Admin to specify which documents or information needed
- Send email to seller with specific requests
- Set deadline for response (7 days)
- Send reminder after 5 days if no response
- Auto-reject after 10 days if no response

**AC-2.1.2.9:** WHEN seller provides requested information, THE System SHALL:
- Notify Admin of updated application
- Move application back to top of verification queue
- Display "Updated" badge on application

**AC-2.1.2.10:** THE System SHALL enforce verification SLA:
- Target: 2-3 business days for standard applications
- Priority: 1 business day for high-value sellers
- Alert Admin if application pending >5 days

**AC-2.1.2.11:** THE System SHALL allow Admin to assign verification tasks to specific team members.

**AC-2.1.2.12:** THE System SHALL track verification metrics:
- Average verification time
- Approval rate
- Rejection rate
- Applications pending
- Applications by risk level

**AC-2.1.2.13:** WHERE seller has high risk score, THE System SHALL require additional verification:
- Video call verification
- Additional document submission
- Enhanced due diligence
- Admin manager approval

**AC-2.1.2.14:** WHERE seller is from restricted country, THE System SHALL block registration or require special approval.

**AC-2.1.2.15:** THE System SHALL integrate with third-party verification services:
- Identity verification (e.g., Jumio, Onfido)
- Bank account verification (e.g., Plaid, Stripe)
- Business verification (e.g., Dun & Bradstreet)
- Tax ID verification (e.g., TIN Check)

**Edge Cases:**

**EC-2.1.2.1:** IF Admin approves seller but email notification fails, THE System SHALL still complete approval and retry email delivery.

**EC-2.1.2.2:** IF seller's bank account verification fails, THE System SHALL allow conditional approval with requirement to update bank details before first payout.

**EC-2.1.2.3:** IF two Admins try to approve/reject same application simultaneously, THE System SHALL allow first action and notify second Admin "Already processed by [Admin Name]".

**EC-2.1.2.4:** IF seller appeals rejection, THE System SHALL create new review task for Admin manager.

**EC-2.1.2.5:** IF third-party verification service is down, THE System SHALL allow manual verification by Admin with appropriate documentation.

### FR-SELLER-2.1.3: Seller Onboarding

**Priority:** P1 - HIGH

**Description:**  
The System SHALL provide guided onboarding process for newly approved sellers to set up their store and list first products.

**Acceptance Criteria:**

**AC-2.1.3.1:** WHEN a seller logs in for the first time after approval, THE System SHALL display welcome screen with onboarding wizard.

**AC-2.1.3.2:** THE System SHALL guide seller through onboarding steps:
- Step 1: Store Setup
- Step 2: Payment Configuration
- Step 3: Shipping Settings
- Step 4: Add First Product
- Step 5: Review and Launch

**AC-2.1.3.3:** In Step 1 (Store Setup), THE System SHALL require:
- Store Name (3-50 characters, unique)
- Store Description (50-500 characters)
- Store Logo (optional, max 2MB, square format)
- Store Banner (optional, max 5MB, 1920x400 pixels)
- Store Categories (select up to 5 primary categories)
- Business Hours (optional)
- Return Policy (select from templates or custom)

**AC-2.1.3.4:** In Step 2 (Payment Configuration), THE System SHALL display:
- Current payout method (from registration)
- Option to update bank account details
- Payout schedule selection (Daily/Weekly/Bi-weekly/Monthly)
- Minimum payout threshold (default $50, adjustable $25-$500)
- Tax withholding preferences

**AC-2.1.3.5:** In Step 3 (Shipping Settings), THE System SHALL require:
- Shipping origin address
- Shipping zones (domestic/international)
- Shipping methods (Standard/Express/Overnight)
- Shipping rates (flat rate/calculated/free)
- Processing time (1-3 days/3-5 days/5-7 days)
- Package dimensions and weight limits

**AC-2.1.3.6:** In Step 4 (Add First Product), THE System SHALL provide:
- Simplified product creation form
- Product templates for common categories
- Image upload with drag-and-drop
- Bulk product import option (CSV)
- Link to detailed product guide

**AC-2.1.3.7:** In Step 5 (Review and Launch), THE System SHALL display:
- Summary of all settings
- Checklist of completed items
- Recommendations for improvement
- Option to skip and complete later
- "Launch Store" button

**AC-2.1.3.8:** WHEN seller clicks "Launch Store", THE System SHALL:
- Activate seller store page
- Make store searchable (if products approved)
- Send congratulations email
- Provide link to seller dashboard
- Display "Store Launched Successfully" message

**AC-2.1.3.9:** THE System SHALL allow seller to skip onboarding and access dashboard directly.

**AC-2.1.3.10:** THE System SHALL save onboarding progress and allow resumption later.

**AC-2.1.3.11:** THE System SHALL display onboarding progress indicator (e.g., "3 of 5 steps completed").

**AC-2.1.3.12:** THE System SHALL provide contextual help and tooltips throughout onboarding.

**AC-2.1.3.13:** THE System SHALL offer video tutorials for each onboarding step.

**AC-2.1.3.14:** THE System SHALL provide live chat support during onboarding (business hours).

**AC-2.1.3.15:** THE System SHALL track onboarding completion rate and time for analytics.

**Edge Cases:**

**EC-2.1.3.1:** IF seller closes browser during onboarding, THE System SHALL save progress and resume from last completed step.

**EC-2.1.3.2:** IF seller skips onboarding, THE System SHALL display reminder banner on dashboard until onboarding is completed.

**EC-2.1.3.3:** IF seller uploads invalid store logo format, THE System SHALL display error and suggest correct formats.

**EC-2.1.3.4:** IF seller tries to launch store without adding any products, THE System SHALL display warning "Add at least one product before launching store" but allow proceeding.

**EC-2.1.3.5:** IF seller's store name is too similar to existing store, THE System SHALL suggest alternatives.

---

# 3. PRODUCT MANAGEMENT

## 3.1 Product Creation

### FR-SELLER-3.1.1: Create New Product

**Priority:** P0 - CRITICAL

**Description:**  
The System SHALL allow sellers to create new product listings with complete product information.

**Acceptance Criteria:**

**AC-3.1.1.1:** WHEN a seller navigates to "Add Product" page, THE System SHALL display product creation form with the following sections:
- Basic Information
- Pricing
- Inventory
- Images
- Variations (optional)
- Shipping
- SEO (optional)

**AC-3.1.1.2:** In Basic Information section, THE System SHALL require:
- Product Name (5-200 characters)
- Product Description (minimum 50 characters, rich text editor)
- Category (select from hierarchical category tree)
- Brand (select existing or add new)
- Condition (New/Refurbished/Used)
- Product Type (Physical/Digital)

**AC-3.1.1.3:** In Pricing section, THE System SHALL require:
- Price (minimum $0.01, maximum $999,999.99)
- Currency (default to seller's country currency)
- Compare at Price (optional, must be higher than Price)
- Cost per Item (optional, for profit calculation)
- Tax (Taxable/Non-taxable)

**AC-3.1.1.4:** In Inventory section, THE System SHALL require:
- SKU (Stock Keeping Unit, alphanumeric, unique per seller)
- Barcode (UPC/EAN/ISBN, optional)
- Quantity (0-999,999)
- Track Inventory (Yes/No toggle)
- Allow Backorders (Yes/No toggle)
- Low Stock Threshold (optional, default 10)

**AC-3.1.1.5:** In Images section, THE System SHALL:
- Allow upload of 1-10 images
- Require at least 1 image
- Support drag-and-drop upload
- Support formats: JPEG, PNG, WebP
- Require minimum resolution: 800x800 pixels
- Recommend resolution: 2000x2000 pixels
- Maximum file size: 10MB per image
- Allow image reordering (first image is primary)
- Provide image editing tools (crop, rotate, adjust)

**AC-3.1.1.6:** In Variations section (optional), THE System SHALL allow:
- Add variation types (Size, Color, Material, etc.)
- Add variation values (Small/Medium/Large, Red/Blue/Green, etc.)
- Set price, SKU, and inventory for each variation
- Upload variation-specific images
- Enable/disable specific variations

**AC-3.1.1.7:** In Shipping section, THE System SHALL require:
- Weight (in kg or lbs)
- Dimensions (Length x Width x Height in cm or inches)
- Shipping Class (Standard/Heavy/Fragile/Perishable)
- Ships From (default to seller's address, can add multiple warehouses)

**AC-3.1.1.8:** In SEO section (optional), THE System SHALL allow:
- Meta Title (max 60 characters)
- Meta Description (max 160 characters)
- URL Slug (auto-generated from product name, editable)
- Keywords (comma-separated)

**AC-3.1.1.9:** WHEN seller enters product name, THE System SHALL:
- Auto-generate URL slug
- Check for duplicate product names from same seller
- Display warning if similar product exists

**AC-3.1.1.10:** WHEN seller enters price, THE System SHALL:
- Validate price is greater than $0
- Calculate estimated commission
- Display net earnings after commission
- Display warning if price is significantly lower/higher than similar products

**AC-3.1.1.11:** WHEN seller uploads images, THE System SHALL:
- Display upload progress bar
- Validate image format and size
- Compress images automatically (maintain quality)
- Generate thumbnails
- Display preview of uploaded images

**AC-3.1.1.12:** WHEN seller adds variations, THE System SHALL:
- Generate all possible combinations
- Allow bulk editing of variation prices
- Calculate total inventory across all variations
- Validate each variation has unique SKU

**AC-3.1.1.13:** WHEN seller clicks "Save as Draft", THE System SHALL:
- Save product with status "Draft"
- Allow seller to edit later
- NOT submit for approval
- Display "Product saved as draft" message

**AC-3.1.1.14:** WHEN seller clicks "Submit for Approval", THE System SHALL:
- Validate all required fields are completed
- Check image requirements are met
- Change product status to "Pending Approval"
- Send notification to Manager for approval
- Display "Product submitted for approval. You will be notified once reviewed." message

**AC-3.1.1.15:** THE System SHALL auto-save product draft every 2 minutes to prevent data loss.

**AC-3.1.1.16:** THE System SHALL display character count for text fields with limits.

**AC-3.1.1.17:** THE System SHALL provide product templates for common categories to speed up creation.

**AC-3.1.1.18:** THE System SHALL allow seller to duplicate existing product to create similar product.

**AC-3.1.1.19:** THE System SHALL display estimated approval time based on category and current queue.

**AC-3.1.1.20:** THE System SHALL log product creation with timestamp and IP address.

**Edge Cases:**

**EC-3.1.1.1:** IF seller closes browser during product creation, THE System SHALL save draft automatically and allow resumption.

**EC-3.1.1.2:** IF seller uploads image that fails virus scan, THE System SHALL reject image and display "Image failed security check. Please upload a different image."

**EC-3.1.1.3:** IF seller enters SKU that already exists for their products, THE System SHALL display error "SKU already in use. Please use unique SKU."

**EC-3.1.1.4:** IF seller tries to submit product without images, THE System SHALL display error "At least one product image is required."

**EC-3.1.1.5:** IF seller enters price of $0, THE System SHALL display error "Price must be greater than $0."

**EC-3.1.1.6:** IF seller's account is suspended while creating product, THE System SHALL save draft but prevent submission.

**EC-3.1.1.7:** IF image upload fails due to network error, THE System SHALL allow retry without losing other form data.

**EC-3.1.1.8:** IF seller creates product in restricted category, THE System SHALL display warning and require additional information.

**EC-3.1.1.9:** IF seller adds more than 100 variations, THE System SHALL display warning "Large number of variations may affect performance. Consider creating separate products."

**EC-3.1.1.10:** IF seller enters product description with prohibited words, THE System SHALL highlight them and prevent submission until removed.

---
