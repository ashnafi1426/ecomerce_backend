# SOFTWARE REQUIREMENTS SPECIFICATION
# FastShop Multi-Vendor E-Commerce Platform
## CUSTOMER ROLE - COMPLETE SPECIFICATION

---

**Document Classification:** CONFIDENTIAL - INTERNAL USE ONLY  
**Document Version:** 1.0  
**Date:** February 7, 2026  
**Role Specification:** Customer (Buyer)  
**Authority Level:** READ + TRANSACTION PERMISSIONS  
**Standard Compliance:** IEEE 830-1998 / ISO/IEC/IEEE 29148:2018

---

## DOCUMENT CONTROL

| Attribute | Value |
|-----------|-------|
| Document ID | SRS-CUSTOMER-FSHOP-2026-001 |
| Version | 1.0 |
| Status | Final - Implementation Ready |
| Classification | Confidential |
| Role | Customer (Buyer) |
| Authority | Read + Transaction Permissions Only |
| Review Cycle | Quarterly |

## APPROVAL SIGNATURES

| Role | Name | Signature | Date | Status |
|------|------|-----------|------|--------|
| VP of Customer Experience | | | | ☐ Pending |
| Head of E-Commerce | | | | ☐ Pending |
| Head of Payments | | | | ☐ Pending |
| Head of Security | | | | ☐ Pending |
| Legal Counsel | | | | ☐ Pending |

---

## TABLE OF CONTENTS

1. [CUSTOMER ROLE OVERVIEW](#1-customer-role-overview)
2. [REGISTRATION & AUTHENTICATION](#2-registration-authentication)
3. [PRODUCT BROWSING & SEARCH](#3-product-browsing-search)
4. [CART MANAGEMENT](#4-cart-management)
5. [CHECKOUT & PAYMENTS](#5-checkout-payments)
6. [MULTI-SELLER ORDERS](#6-multi-seller-orders)
7. [ORDER TRACKING](#7-order-tracking)
8. [REVIEWS & RATINGS](#8-reviews-ratings)
9. [RETURNS & REFUNDS](#9-returns-refunds)
10. [DISPUTES](#10-disputes)
11. [NOTIFICATIONS](#11-notifications)
12. [CUSTOMER DASHBOARD](#12-customer-dashboard)
13. [SECURITY & PRIVACY](#13-security-privacy)
14. [ERROR HANDLING](#14-error-handling)

---

# 1. CUSTOMER ROLE OVERVIEW

## 1.1 Role Definition

**Role Name:** Customer (Buyer)  
**Role Code:** CUSTOMER  
**Role Type:** End User / Buyer  
**Authority Level:** READ + TRANSACTION PERMISSIONS  
**Access Scope:** Public Products + Own Transaction Data  
**Restriction Level:** CANNOT access seller data, other customers' data, or system configuration  

## 1.2 Role Purpose

The Customer role represents end users who browse and purchase products from the FastShop marketplace. Customers are responsible for:

1. **Product Discovery**: Browsing and searching for products
2. **Purchase Decisions**: Adding products to cart and completing checkout
3. **Payment**: Providing payment information and completing transactions
4. **Order Management**: Tracking orders and managing deliveries
5. **Feedback**: Leaving reviews and ratings for purchased products
6. **Returns**: Requesting returns and refunds when necessary
7. **Account Management**: Managing personal information and preferences

## 1.3 Role Characteristics

### 1.3.1 Authority Matrix

| Capability | Customer Authority | Requires Approval | Restrictions |
|------------|-------------------|-------------------|--------------|
| Browse Products | FULL | NO | Public products only |
| Search Products | FULL | NO | Approved products only |
| View Product Details | FULL | NO | Public information only |
| Add to Cart | FULL | NO | In-stock products only |
| Checkout | FULL | NO | Valid payment required |
| Make Payment | FULL | NO | Verified payment method |
| Track Orders | FULL | NO | Own orders only |
| Cancel Orders | LIMITED | YES (before shipment) | Own orders only |
| Request Returns | FULL | YES (Manager approval) | Within return window |
| Leave Reviews | FULL | NO | Purchased products only |
| View Seller Info | LIMITED | NO | Public seller info only |
| Contact Seller | FULL | NO | Through platform only |
| Raise Disputes | FULL | NO | Own orders only |
| Modify Account | FULL | NO | Own account only |
| Delete Account | FULL | YES (with data retention) | Own account only |
| Access Other Customers | NONE | N/A | Privacy protected |
| Access Seller Dashboard | NONE | N/A | Seller-only function |
| Modify Prices | NONE | N/A | Read-only |
| Configure System | NONE | N/A | Admin-only function |

### 1.3.2 Data Access Rules

**CAN Access:**
✅ All approved products (public catalog)  
✅ Product details, images, descriptions  
✅ Seller public profiles and ratings  
✅ Product reviews from all customers  
✅ Own account information  
✅ Own order history  
✅ Own payment history  
✅ Own wishlist  
✅ Own addresses  
✅ Own reviews and ratings  
✅ Own support tickets  

**CANNOT Access:**
❌ Other customers' personal information  
❌ Other customers' order history  
❌ Seller financial data  
❌ Seller inventory details  
❌ Product cost prices  
❌ Commission rates  
❌ System configuration  
❌ Admin or Manager functions  
❌ Unapproved products  
❌ Deleted or suspended products  

### 1.3.3 Customer Account Types

| Account Type | Requirements | Benefits |
|--------------|-------------|----------|
| **Guest** | None | Browse and purchase without account |
| **Registered** | Email verification | Order history, wishlist, faster checkout |
| **Verified** | Phone verification | Enhanced security, priority support |
| **Premium** | Subscription | Free shipping, exclusive deals, early access |
| **VIP** | High purchase volume | Personal shopper, special discounts, concierge |

### 1.3.4 Customer Journey Stages

| Stage | Description | Key Actions |
|-------|-------------|-------------|
| **Discovery** | Finding products | Browse, search, filter |
| **Evaluation** | Comparing options | View details, read reviews, compare |
| **Decision** | Adding to cart | Select variations, add to cart |
| **Purchase** | Completing order | Checkout, payment, confirmation |
| **Fulfillment** | Receiving order | Track shipment, receive delivery |
| **Post-Purchase** | After delivery | Review product, request return if needed |
| **Loyalty** | Repeat purchases | Reorder, refer friends, join loyalty program |

---

# 2. REGISTRATION & AUTHENTICATION

## 2.1 Customer Registration

### FR-CUST-2.1.1: Customer Account Registration

**Priority:** P0 - CRITICAL

**Description:**  
The System SHALL allow new customers to create accounts with minimal required information for quick registration.

**Acceptance Criteria:**

**AC-2.1.1.1:** WHEN a user navigates to the registration page, THE System SHALL display a simple registration form with the following fields:
- Full Name (required)
- Email Address (required)
- Password (required)
- Confirm Password (required)
- Terms and Conditions checkbox (required)
- Privacy Policy checkbox (required)
- Marketing emails opt-in (optional)

**AC-2.1.1.2:** THE System SHALL validate Full Name:
- Minimum 2 characters
- Maximum 100 characters
- Letters, spaces, hyphens, and apostrophes only
- Cannot be only numbers or special characters

**AC-2.1.1.3:** THE System SHALL validate Email Address:
- Valid email format (contains @ and domain)
- Not already registered in the system
- Not from disposable email providers (e.g., tempmail, guerrillamail)
- Maximum 255 characters

**AC-2.1.1.4:** THE System SHALL validate Password:
- Minimum 8 characters (recommended 12+)
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
- Cannot contain user's email or name
- Cannot be in list of common passwords (e.g., "Password123!")

**AC-2.1.1.5:** THE System SHALL display real-time password strength indicator as customer types:
- Weak (red): Meets minimum requirements only
- Fair (orange): 8-10 characters with mixed case and numbers
- Good (yellow): 11-14 characters with all requirements
- Strong (light green): 15+ characters with all requirements
- Very Strong (dark green): 18+ characters with all requirements and no dictionary words

**AC-2.1.1.6:** THE System SHALL validate Confirm Password:
- Must exactly match Password field
- Display error immediately if mismatch
- Update validation in real-time as customer types

**AC-2.1.1.7:** THE System SHALL require customer to check Terms and Conditions checkbox before registration.

**AC-2.1.1.8:** THE System SHALL require customer to check Privacy Policy checkbox before registration.

**AC-2.1.1.9:** THE System SHALL provide links to view full Terms and Conditions and Privacy Policy in modal or new tab.

**AC-2.1.1.10:** WHEN customer clicks "Create Account" button, THE System SHALL:
- Validate all required fields are completed
- Validate all field formats are correct
- Check email is not already registered
- Hash password using bcrypt with cost factor 12
- Create customer account with status "Email Verification Pending"
- Generate unique Customer ID
- Send verification email to registered email address
- Display message "Account created successfully! Please check your email to verify your account."
- Redirect to email verification pending page

**AC-2.1.1.11:** THE System SHALL send verification email within 1 minute containing:
- Welcome message
- Verification link (valid for 24 hours)
- Customer name
- Registered email address
- Instructions to verify email
- Link to resend verification email
- Customer support contact information

**AC-2.1.1.12:** WHEN customer clicks verification link in email, THE System SHALL:
- Validate token is valid and not expired
- Mark email as verified
- Change account status to "Active"
- Automatically log customer in
- Redirect to welcome page or homepage
- Display "Email verified successfully! Welcome to FastShop!" message

**AC-2.1.1.13:** WHEN verification link expires (after 24 hours), THE System SHALL:
- Display "Verification link expired" message
- Provide "Resend Verification Email" button
- Allow maximum 5 resend attempts
- Generate new verification link with 24-hour validity

**AC-2.1.1.14:** THE System SHALL allow customer to log in even if email is not verified, but SHALL:
- Display prominent banner "Please verify your email address"
- Restrict certain features (e.g., cannot leave reviews, cannot contact sellers)
- Send reminder email after 24 hours, 3 days, and 7 days
- Automatically delete unverified accounts after 30 days

**AC-2.1.1.15:** THE System SHALL provide social login options:
- Google Sign-In
- Facebook Login
- Apple Sign-In
- Each SHALL create account automatically with email from social provider
- Each SHALL mark email as verified automatically
- Each SHALL allow customer to set password later for direct login

**AC-2.1.1.16:** WHEN customer registers via social login, THE System SHALL:
- Retrieve name and email from social provider
- Create account with status "Active"
- Skip email verification (already verified by social provider)
- Redirect to homepage
- Display "Welcome! Your account has been created." message

**AC-2.1.1.17:** THE System SHALL log all registration attempts with:
- Timestamp
- IP address
- User agent (browser and device)
- Registration method (email/Google/Facebook/Apple)
- Success or failure status
- Failure reason (if applicable)

**AC-2.1.1.18:** THE System SHALL implement rate limiting:
- Maximum 5 registration attempts per IP address per hour
- Maximum 3 registration attempts per email address per day
- Display CAPTCHA after 3 failed attempts from same IP

**AC-2.1.1.19:** THE System SHALL save registration progress automatically if customer navigates away (session storage).

**AC-2.1.1.20:** THE System SHALL provide "Show/Hide Password" toggle for password fields.

**Edge Cases:**

**EC-2.1.1.1:** IF customer closes browser during registration, THE System SHALL not save partial data (registration must be completed in one session).

**EC-2.1.1.2:** IF customer enters email that was previously registered but account was deleted, THE System SHALL allow re-registration with same email.

**EC-2.1.1.3:** IF verification email fails to send (email service down), THE System SHALL:
- Still create account
- Log email failure
- Display message "Account created but verification email could not be sent. Please try resending verification email."
- Provide "Resend Verification Email" button immediately

**EC-2.1.1.4:** IF customer clicks verification link multiple times, THE System SHALL:
- Accept first click and verify account
- Display "Email already verified" message for subsequent clicks
- Redirect to login page

**EC-2.1.1.5:** IF customer tries to register with email of existing account, THE System SHALL:
- Display error "An account with this email already exists"
- Provide "Forgot Password?" link
- NOT reveal whether email is registered (security measure) if configured

**EC-2.1.1.6:** IF customer enters SQL injection or XSS attempt in form fields, THE System SHALL:
- Sanitize all inputs
- Block registration attempt
- Log security incident with IP address
- Display generic error "Invalid input. Please try again."

**EC-2.1.1.7:** IF customer's IP address is from high-risk country or known VPN, THE System SHALL:
- Allow registration but flag account for review
- Require additional verification (phone number)
- Log for fraud monitoring

**EC-2.1.1.8:** IF customer registers during system maintenance, THE System SHALL:
- Display maintenance message
- Save registration data temporarily
- Process registration after maintenance
- Send verification email after maintenance

**EC-2.1.1.9:** IF social login provider is down, THE System SHALL:
- Display error "Social login temporarily unavailable"
- Suggest email registration as alternative
- Retry social login after 30 seconds

**EC-2.1.1.10:** IF customer's email domain has strict spam filters, THE System SHALL:
- Provide alternative verification method (SMS)
- Display instructions to check spam folder
- Provide customer support contact for manual verification

### FR-CUST-2.1.2: Customer Login

**Priority:** P0 - CRITICAL

**Description:**  
The System SHALL provide secure login functionality for registered customers with multiple authentication options.

**Acceptance Criteria:**

**AC-2.1.2.1:** WHEN a customer navigates to the login page, THE System SHALL display login form with:
- Email Address field
- Password field
- "Remember Me" checkbox (optional)
- "Forgot Password?" link
- "Login" button
- "Create Account" link
- Social login buttons (Google, Facebook, Apple)

**AC-2.1.2.2:** WHEN customer enters email and password and clicks "Login", THE System SHALL:
- Validate email format
- Validate password is not empty
- Check credentials against database
- Verify account is active (not suspended or deleted)
- Verify email is verified (or allow login with warning)

**AC-2.1.2.3:** WHEN credentials are valid, THE System SHALL:
- Create session with unique session ID
- Set session expiration (30 minutes of inactivity)
- Log login event (timestamp, IP address, user agent)
- Redirect to homepage or return URL (if customer was redirected to login)
- Display "Welcome back, [Customer Name]!" message

**AC-2.1.2.4:** WHEN credentials are invalid, THE System SHALL:
- Display error "Invalid email or password"
- NOT reveal which field is incorrect (security measure)
- Increment failed login counter
- Log failed login attempt
- NOT lock account until 5 failed attempts

**AC-2.1.2.5:** WHEN customer fails login 3 consecutive times, THE System SHALL:
- Display CAPTCHA challenge on next attempt
- Continue to allow login attempts with CAPTCHA

**AC-2.1.2.6:** WHEN customer fails login 5 consecutive times within 15 minutes, THE System SHALL:
- Temporarily lock account for 15 minutes
- Send security alert email to customer
- Display "Too many failed login attempts. Account locked for 15 minutes."
- Provide "Forgot Password?" link

**AC-2.1.2.7:** WHEN customer fails login 10 consecutive times within 24 hours, THE System SHALL:
- Lock account until password reset
- Send security alert email with password reset link
- Display "Account locked due to multiple failed login attempts. Please reset your password."
- Notify Admin of potential security incident

**AC-2.1.2.8:** WHEN "Remember Me" is checked, THE System SHALL:
- Extend session to 30 days
- Store secure cookie with encrypted token
- Still require re-authentication for sensitive operations (change password, update payment methods)

**AC-2.1.2.9:** WHEN customer logs in from new device or location, THE System SHALL:
- Send notification email with login details (device, location, time)
- Provide "Was this you?" option in email
- Provide "Secure my account" link if unauthorized

**AC-2.1.2.10:** WHEN customer is inactive for 30 minutes, THE System SHALL:
- Automatically log out customer
- Clear session data
- Display "Session expired. Please log in again." message on next action
- Preserve cart contents (if any)

**AC-2.1.2.11:** WHEN customer logs out manually, THE System SHALL:
- Destroy session
- Clear session cookies
- Redirect to homepage
- Display "You have been logged out successfully" message

**AC-2.1.2.12:** THE System SHALL support social login for returning customers:
- Google Sign-In
- Facebook Login
- Apple Sign-In
- Each SHALL authenticate via OAuth 2.0
- Each SHALL create session automatically
- Each SHALL link to existing account if email matches

**AC-2.1.2.13:** THE System SHALL implement security headers:
- X-Frame-Options: DENY (prevent clickjacking)
- X-Content-Type-Options: nosniff
- Strict-Transport-Security: max-age=31536000
- Content-Security-Policy: appropriate directives

**AC-2.1.2.14:** THE System SHALL log all login attempts with:
- Timestamp
- Email address (hashed for privacy)
- IP address
- User agent
- Login method (email/Google/Facebook/Apple)
- Success or failure status
- Geolocation (country, city)

**AC-2.1.2.15:** THE System SHALL display login history in customer account settings:
- Last 10 login attempts
- Date and time
- Device type
- Location (city, country)
- IP address (partially masked)
- Status (successful/failed)

**Edge Cases:**

**EC-2.1.2.1:** IF customer's account is suspended while logged in, THE System SHALL:
- Immediately terminate all active sessions
- Display "Your account has been suspended. Please contact support." message
- Redirect to homepage
- Send suspension notification email

**EC-2.1.2.2:** IF customer's password is changed by Admin while logged in, THE System SHALL:
- Terminate all active sessions except current one
- Require re-login on next page load
- Send password change notification email

**EC-2.1.2.3:** IF customer logs in from two different devices simultaneously, THE System SHALL:
- Allow both sessions
- Display warning "You are logged in from multiple devices"
- Provide option to log out other sessions

**EC-2.1.2.4:** IF customer's session cookie is tampered with, THE System SHALL:
- Reject session
- Log security incident
- Force re-login
- Send security alert email

**EC-2.1.2.5:** IF database connection fails during login, THE System SHALL:
- Display "Service temporarily unavailable. Please try again."
- Log error for investigation
- NOT reveal technical details to customer

**EC-2.1.2.6:** IF customer tries to login with deleted account, THE System SHALL:
- Display "Invalid email or password" (same as wrong credentials)
- NOT reveal account was deleted
- Log attempt for security monitoring

**EC-2.1.2.7:** IF social login provider returns error, THE System SHALL:
- Display "Social login failed. Please try again or use email login."
- Log error details
- Provide fallback to email login

**EC-2.1.2.8:** IF customer's IP address changes during session (e.g., mobile network switch), THE System SHALL:
- Maintain session
- Log IP change
- Send security notification if change is significant (different country)

**EC-2.1.2.9:** IF customer clicks "Back" button after logout, THE System SHALL:
- Display "Session expired" message
- Redirect to login page
- NOT allow access to protected pages

**EC-2.1.2.10:** IF customer has multiple accounts with same email (edge case from migration), THE System SHALL:
- Merge accounts or prompt customer to choose
- Log incident for Admin review
- Ensure data integrity

### FR-CUST-2.1.3: Two-Factor Authentication (2FA)

**Priority:** P1 - HIGH

**Description:**  
The System SHALL provide optional two-factor authentication for customers who want enhanced account security.

**Acceptance Criteria:**

**AC-2.1.3.1:** WHEN a customer navigates to account security settings, THE System SHALL display 2FA section with:
- Current 2FA status (Enabled/Disabled)
- "Enable 2FA" button (if disabled)
- "Disable 2FA" button (if enabled)
- 2FA method options (Authenticator App/SMS)
- Backup codes section

**AC-2.1.3.2:** WHEN customer clicks "Enable 2FA", THE System SHALL display 2FA setup wizard with steps:
- Step 1: Choose 2FA method (Authenticator App or SMS)
- Step 2: Setup chosen method
- Step 3: Verify setup
- Step 4: Save backup codes

**AC-2.1.3.3:** WHEN customer chooses "Authenticator App" method, THE System SHALL:
- Generate unique secret key
- Display QR code for scanning
- Display manual entry code (for manual setup)
- Provide instructions for popular apps (Google Authenticator, Authy, Microsoft Authenticator)
- Require customer to enter verification code to confirm setup

**AC-2.1.3.4:** WHEN customer chooses "SMS" method, THE System SHALL:
- Require customer to enter phone number
- Validate phone number format
- Send verification code via SMS
- Require customer to enter code to confirm setup
- Display "SMS charges may apply" warning

**AC-2.1.3.5:** WHEN customer successfully sets up 2FA, THE System SHALL:
- Generate 10 backup codes (8-digit alphanumeric)
- Display backup codes with instruction to save securely
- Require customer to confirm they saved backup codes
- Enable 2FA for the account
- Send confirmation email
- Display "2FA enabled successfully" message

**AC-2.1.3.6:** WHEN 2FA is enabled and customer logs in, THE System SHALL:
- First verify email and password
- Then display 2FA verification page
- Request 2FA code (6-digit for authenticator, 6-digit for SMS)
- Provide "Use backup code" option
- Provide "Didn't receive code?" option (for SMS)

**AC-2.1.3.7:** WHEN customer enters valid 2FA code, THE System SHALL:
- Verify code is correct and not expired
- Mark code as used (prevent reuse)
- Complete login process
- Log successful 2FA verification

**AC-2.1.3.8:** WHEN customer enters invalid 2FA code, THE System SHALL:
- Display error "Invalid verification code"
- Allow retry (maximum 5 attempts)
- After 5 failed attempts, lock account temporarily (15 minutes)
- Send security alert email

**AC-2.1.3.9:** WHEN customer clicks "Use backup code", THE System SHALL:
- Display backup code entry field
- Accept any unused backup code
- Mark used backup code as invalid
- Display remaining backup codes count
- Suggest generating new backup codes if <3 remaining

**AC-2.1.3.10:** WHEN customer clicks "Didn't receive code?" (SMS method), THE System SHALL:
- Provide "Resend Code" button
- Allow maximum 3 resend attempts per 15 minutes
- Display countdown timer (60 seconds) before allowing resend

**AC-2.1.3.11:** WHEN customer disables 2FA, THE System SHALL:
- Require current password for confirmation
- Require current 2FA code for confirmation
- Disable 2FA for the account
- Invalidate all backup codes
- Send confirmation email
- Display "2FA disabled" message

**AC-2.1.3.12:** WHEN customer loses access to 2FA device, THE System SHALL provide account recovery:
- Option 1: Use backup codes
- Option 2: Verify identity via email link
- Option 3: Contact customer support with ID verification

**AC-2.1.3.13:** THE System SHALL support TOTP (Time-based One-Time Password) algorithm:
- 30-second time window
- 6-digit codes
- Compatible with RFC 6238 standard

**AC-2.1.3.14:** THE System SHALL allow customer to regenerate backup codes:
- Require current password
- Require current 2FA code
- Invalidate all old backup codes
- Generate 10 new backup codes
- Display new codes for saving

**AC-2.1.3.15:** THE System SHALL display 2FA status on account dashboard:
- "2FA Enabled" badge (green)
- Last 2FA verification time
- Number of backup codes remaining
- Option to manage 2FA settings

**Edge Cases:**

**EC-2.1.3.1:** IF customer's device time is out of sync, THE System SHALL:
- Accept codes within ±90 seconds time window
- Display hint "If code doesn't work, check your device time"

**EC-2.1.3.2:** IF customer tries to use same 2FA code twice, THE System SHALL:
- Reject second attempt
- Display "Code already used. Please wait for new code."

**EC-2.1.3.3:** IF customer enables 2FA but never completes setup, THE System SHALL:
- Keep 2FA disabled
- Delete incomplete setup after 24 hours
- Allow customer to restart setup

**EC-2.1.3.4:** IF SMS delivery fails, THE System SHALL:
- Retry sending after 30 seconds
- After 3 failed attempts, suggest authenticator app method
- Log SMS delivery failure

**EC-2.1.3.5:** IF customer's phone number changes, THE System SHALL:
- Require 2FA verification before updating number
- Send confirmation to both old and new numbers
- Update 2FA SMS destination

**EC-2.1.3.6:** IF customer's account is compromised and attacker tries to disable 2FA, THE System SHALL:
- Require both password and 2FA code
- Send immediate security alert email
- Provide "Secure my account" option in email

**EC-2.1.3.7:** IF customer uses all backup codes, THE System SHALL:
- Display warning "No backup codes remaining"
- Prompt to generate new backup codes
- Still allow 2FA login via authenticator/SMS

**EC-2.1.3.8:** IF customer's authenticator app is reset/deleted, THE System SHALL:
- Allow account recovery via email verification
- Require identity verification
- Allow 2FA reset after verification

**EC-2.1.3.9:** IF customer travels to different timezone, THE System SHALL:
- Continue to accept TOTP codes (time-based, not timezone-based)
- No action required from customer

**EC-2.1.3.10:** IF customer has 2FA enabled and email is compromised, THE System SHALL:
- Still require 2FA code for login
- 2FA provides additional security layer
- Customer should contact support to secure account

---
