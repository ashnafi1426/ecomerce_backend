/**
 * REPLACEMENT NOTIFICATION SERVICE
 * 
 * Handles creating notifications when replacement requests are created or updated
 * 
 * Spec: customer-order-management-enhancements
 * Requirements: 1.5, 2.1
 */

const notificationService = require('./notification.service');
const emailService = require('../emailServices/email.service');
const supabase = require('../../config/supabase');

/**
 * Send notifications when a replacement request is created
 * - Send email and in-app notification to seller
 * - Send in-app notification to customer
 * 
 * @param {Object} replacementRequest - Replacement request object with customer, seller, product details
 * @returns {Promise<Object>} { customerNotification, sellerNotification, sellerEmail }
 * 
 * Requirements: 1.5, 2.1
 */
async function notifyReplacementRequestCreated(replacementRequest) {
  try {
    console.log(`[Replacement Notification] Creating notifications for replacement request ${replacementRequest.id}`);
    
    const { 
      id: requestId, 
      customer_id, 
      seller_id, 
      product_id,
      reason,
      description,
      order_id
    } = replacementRequest;
    
    // Get product details
    let productTitle = 'Product';
    if (replacementRequest.product && replacementRequest.product.title) {
      productTitle = replacementRequest.product.title;
    } else if (product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('title')
        .eq('id', product_id)
        .single();
      if (product) productTitle = product.title;
    }
    
    // Get customer details for seller notification
    let customerName = 'Customer';
    let customerEmail = '';
    if (replacementRequest.customer) {
      customerName = replacementRequest.customer.display_name || 'Customer';
      customerEmail = replacementRequest.customer.email || '';
    } else if (customer_id) {
      const { data: customer } = await supabase
        .from('users')
        .select('display_name, email')
        .eq('id', customer_id)
        .single();
      if (customer) {
        customerName = customer.display_name || 'Customer';
        customerEmail = customer.email || '';
      }
    }
    
    // Get seller details for email
    let sellerEmail = '';
    let sellerName = 'Seller';
    if (replacementRequest.seller) {
      sellerEmail = replacementRequest.seller.email || '';
      sellerName = replacementRequest.seller.display_name || 'Seller';
    } else if (seller_id) {
      const { data: seller } = await supabase
        .from('users')
        .select('email, display_name, business_name')
        .eq('id', seller_id)
        .single();
      if (seller) {
        sellerEmail = seller.email || '';
        sellerName = seller.business_name || seller.display_name || 'Seller';
      }
    }
    
    // 1. Create in-app notification for customer (Requirement 1.5)
    const customerNotification = await notificationService.createNotification({
      user_id: customer_id,
      type: 'replacement_request_created',
      title: 'Replacement Request Submitted',
      message: `Your replacement request for "${productTitle}" has been submitted and is being reviewed by the seller.`,
      priority: 'medium',
      metadata: {
        replacement_request_id: requestId,
        order_id: order_id,
        product_id: product_id,
        product_name: productTitle,
        reason: reason,
        status: 'pending'
      },
      action_url: `/orders/${order_id}`,
      action_text: 'View Order',
      channels: ['in_app']
    });
    
    console.log(`[Replacement Notification] ✅ Created customer notification`);
    console.log(`   Customer: ${customer_id}`);
    console.log(`   Product: ${productTitle}`);
    
    // 2. Create in-app notification for seller (Requirement 2.1)
    const sellerNotification = await notificationService.createNotification({
      user_id: seller_id,
      type: 'replacement_request_received',
      title: 'New Replacement Request',
      message: `${customerName} has requested a replacement for "${productTitle}". Please review and respond.`,
      priority: 'high',
      metadata: {
        replacement_request_id: requestId,
        order_id: order_id,
        product_id: product_id,
        product_name: productTitle,
        customer_id: customer_id,
        customer_name: customerName,
        reason: reason,
        status: 'pending'
      },
      action_url: `/seller/replacements/${requestId}`,
      action_text: 'Review Request',
      channels: ['in_app']
    });
    
    console.log(`[Replacement Notification] ✅ Created seller in-app notification`);
    console.log(`   Seller: ${seller_id}`);
    console.log(`   Customer: ${customerName}`);
    
    // 3. Send email notification to seller (Requirement 2.1)
    let sellerEmailResult = null;
    if (sellerEmail) {
      try {
        sellerEmailResult = await sendSellerReplacementRequestEmail({
          email: sellerEmail,
          sellerName: sellerName,
          customerName: customerName,
          productTitle: productTitle,
          reason: reason,
          description: description,
          requestId: requestId,
          orderId: order_id
        });
        
        console.log(`[Replacement Notification] ✅ Sent email to seller: ${sellerEmail}`);
      } catch (emailError) {
        console.error('[Replacement Notification] ⚠️ Failed to send seller email (non-critical):', emailError.message);
        // Don't throw - email failure shouldn't break notification creation
      }
    } else {
      console.log(`[Replacement Notification] ⚠️ No seller email found, skipping email notification`);
    }
    
    return {
      customerNotification,
      sellerNotification,
      sellerEmail: sellerEmailResult
    };
    
  } catch (error) {
    console.error('[Replacement Notification] Error creating notifications:', error);
    // Don't throw - notifications are not critical to the replacement request creation
    return null;
  }
}

/**
 * Send email notification to seller about new replacement request
 * @param {Object} emailData - Email data
 * @returns {Promise<Object>} Email result
 */
async function sendSellerReplacementRequestEmail(emailData) {
  try {
    const {
      email,
      sellerName,
      customerName,
      productTitle,
      reason,
      description,
      requestId,
      orderId
    } = emailData;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // Format reason for display
    const reasonMap = {
      'defective': 'Defective Product',
      'damaged': 'Damaged in Shipping',
      'wrong_item': 'Wrong Item Received',
      'missing_parts': 'Missing Parts',
      'other': 'Other'
    };
    const reasonDisplay = reasonMap[reason] || reason;

    // Create email HTML
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .email-container {
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background-color: #ff6b35;
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px 20px;
    }
    .alert-box {
      background-color: #fff3cd;
      border-left: 4px solid #ff6b35;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .request-details {
      background-color: #f9f9f9;
      padding: 15px;
      margin: 15px 0;
      border-radius: 5px;
      border: 1px solid #eee;
    }
    .request-details p {
      margin: 8px 0;
    }
    .reason-badge {
      display: inline-block;
      background-color: #ff6b35;
      color: white;
      padding: 5px 12px;
      border-radius: 15px;
      font-size: 12px;
      font-weight: bold;
      margin: 5px 0;
    }
    .button {
      display: inline-block;
      background-color: #ff6b35;
      color: white !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
      font-weight: bold;
      text-align: center;
    }
    .button:hover {
      background-color: #e55a2b;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 12px;
    }
    .action-required {
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🔄 New Replacement Request</h1>
    </div>
    
    <div class="content">
      <p>Hello <strong>${sellerName}</strong>,</p>
      
      <div class="alert-box">
        <p style="margin: 0; font-size: 16px;">
          <strong>${customerName}</strong> has submitted a replacement request for one of your products.
        </p>
      </div>
      
      <div class="request-details">
        <h3 style="margin-top: 0;">Request Details</h3>
        <p><strong>Product:</strong> ${productTitle}</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Request ID:</strong> ${requestId}</p>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Reason:</strong> <span class="reason-badge">${reasonDisplay}</span></p>
        ${description ? `<p><strong>Description:</strong><br>${description}</p>` : ''}
      </div>
      
      <div class="action-required">
        ⚠️ Action Required: Please review this request and respond within 48 hours.
      </div>
      
      <p><strong>Next Steps:</strong></p>
      <ul>
        <li>Review the replacement request details</li>
        <li>Check the customer's photos and description</li>
        <li>Approve the request to send a replacement product</li>
        <li>Or reject the request with a clear explanation</li>
      </ul>
      
      <center>
        <a href="${frontendUrl}/seller/replacements/${requestId}" class="button">
          Review Replacement Request
        </a>
      </center>
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        💡 Tip: Responding quickly to replacement requests helps maintain customer satisfaction and your seller rating.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>FastShop</strong> - Your Multi-Vendor Marketplace</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} FastShop. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Plain text version
    const emailText = `
🔄 New Replacement Request

Hello ${sellerName},

${customerName} has submitted a replacement request for one of your products.

Request Details:
- Product: ${productTitle}
- Order ID: ${orderId}
- Request ID: ${requestId}
- Customer: ${customerName}
- Reason: ${reasonDisplay}
${description ? `- Description: ${description}` : ''}

⚠️ Action Required: Please review this request and respond within 48 hours.

Next Steps:
1. Review the replacement request details
2. Check the customer's photos and description
3. Approve the request to send a replacement product
4. Or reject the request with a clear explanation

Review Request: ${frontendUrl}/seller/replacements/${requestId}

💡 Tip: Responding quickly to replacement requests helps maintain customer satisfaction and your seller rating.

---
This is an automated notification from FastShop
Please do not reply to this email
© ${new Date().getFullYear()} FastShop. All rights reserved.
    `;

    // Use nodemailer directly (similar to email.service.js)
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'ashenafiashew074@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'lhln ysjx bmot ssnw'
      }
    });

    const mailOptions = {
      from: `"FastShop Replacements" <${process.env.EMAIL_FROM || 'ashenafiashew074@gmail.com'}>`,
      to: email,
      subject: `🔄 New Replacement Request - ${productTitle}`,
      text: emailText,
      html: emailHTML
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`[Replacement Email] ✅ Sent to ${email} - Message ID: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
      email: email
    };

  } catch (error) {
    console.error('[Replacement Email] ❌ Error sending email:', error);
    throw error;
  }
}

/**
 * Send notification when a replacement request is approved
 * - Send in-app notification to customer
 * - Send email notification to customer
 * 
 * @param {Object} replacementRequest - Replacement request object with customer, seller, product details
 * @returns {Promise<Object>} { customerNotification, customerEmail }
 * 
 * Requirement: 14.2
 */
async function notifyReplacementApproved(replacementRequest) {
  try {
    console.log(`[Replacement Notification] Creating approval notifications for replacement request ${replacementRequest.id}`);
    
    const { 
      id: requestId, 
      customer_id, 
      product_id,
      order_id,
      replacement_order_id
    } = replacementRequest;
    
    // Get product details
    let productTitle = 'Product';
    if (replacementRequest.product && replacementRequest.product.title) {
      productTitle = replacementRequest.product.title;
    } else if (product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('title')
        .eq('id', product_id)
        .single();
      if (product) productTitle = product.title;
    }
    
    // Get customer details
    let customerName = 'Customer';
    let customerEmail = '';
    if (replacementRequest.customer) {
      customerName = replacementRequest.customer.display_name || 'Customer';
      customerEmail = replacementRequest.customer.email || '';
    } else if (customer_id) {
      const { data: customer } = await supabase
        .from('users')
        .select('display_name, email')
        .eq('id', customer_id)
        .single();
      if (customer) {
        customerName = customer.display_name || 'Customer';
        customerEmail = customer.email || '';
      }
    }
    
    // 1. Create in-app notification for customer (Requirement 14.2)
    const customerNotification = await notificationService.createNotification({
      user_id: customer_id,
      type: 'replacement_request_approved',
      title: 'Replacement Request Approved',
      message: `Great news! Your replacement request for "${productTitle}" has been approved. A replacement will be shipped to you soon.`,
      priority: 'high',
      metadata: {
        replacement_request_id: requestId,
        order_id: order_id,
        replacement_order_id: replacement_order_id,
        product_id: product_id,
        product_name: productTitle,
        status: 'approved'
      },
      action_url: `/orders/${replacement_order_id || order_id}`,
      action_text: 'View Replacement Order',
      channels: ['in_app']
    });
    
    console.log(`[Replacement Notification] ✅ Created customer approval notification`);
    console.log(`   Customer: ${customer_id}`);
    console.log(`   Product: ${productTitle}`);
    
    // 2. Send email notification to customer (Requirement 14.2)
    let customerEmailResult = null;
    if (customerEmail) {
      try {
        customerEmailResult = await sendCustomerReplacementApprovedEmail({
          email: customerEmail,
          customerName: customerName,
          productTitle: productTitle,
          requestId: requestId,
          orderId: order_id,
          replacementOrderId: replacement_order_id
        });
        
        console.log(`[Replacement Notification] ✅ Sent approval email to customer: ${customerEmail}`);
      } catch (emailError) {
        console.error('[Replacement Notification] ⚠️ Failed to send customer email (non-critical):', emailError.message);
      }
    } else {
      console.log(`[Replacement Notification] ⚠️ No customer email found, skipping email notification`);
    }
    
    return {
      customerNotification,
      customerEmail: customerEmailResult
    };
    
  } catch (error) {
    console.error('[Replacement Notification] Error creating approval notifications:', error);
    return null;
  }
}

/**
 * Send notification when a replacement request is rejected
 * - Send in-app notification to customer with rejection reason
 * - Send email notification to customer with rejection reason
 * 
 * @param {Object} replacementRequest - Replacement request object with customer, seller, product details
 * @returns {Promise<Object>} { customerNotification, customerEmail }
 * 
 * Requirement: 14.2
 */
async function notifyReplacementRejected(replacementRequest) {
  try {
    console.log(`[Replacement Notification] Creating rejection notifications for replacement request ${replacementRequest.id}`);
    
    const { 
      id: requestId, 
      customer_id, 
      product_id,
      order_id,
      rejection_reason
    } = replacementRequest;
    
    // Get product details
    let productTitle = 'Product';
    if (replacementRequest.product && replacementRequest.product.title) {
      productTitle = replacementRequest.product.title;
    } else if (product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('title')
        .eq('id', product_id)
        .single();
      if (product) productTitle = product.title;
    }
    
    // Get customer details
    let customerName = 'Customer';
    let customerEmail = '';
    if (replacementRequest.customer) {
      customerName = replacementRequest.customer.display_name || 'Customer';
      customerEmail = replacementRequest.customer.email || '';
    } else if (customer_id) {
      const { data: customer } = await supabase
        .from('users')
        .select('display_name, email')
        .eq('id', customer_id)
        .single();
      if (customer) {
        customerName = customer.display_name || 'Customer';
        customerEmail = customer.email || '';
      }
    }
    
    // 1. Create in-app notification for customer (Requirement 14.2)
    const customerNotification = await notificationService.createNotification({
      user_id: customer_id,
      type: 'replacement_request_rejected',
      title: 'Replacement Request Declined',
      message: `Your replacement request for "${productTitle}" has been declined. Reason: ${rejection_reason || 'Not specified'}`,
      priority: 'high',
      metadata: {
        replacement_request_id: requestId,
        order_id: order_id,
        product_id: product_id,
        product_name: productTitle,
        status: 'rejected',
        rejection_reason: rejection_reason
      },
      action_url: `/orders/${order_id}`,
      action_text: 'View Order',
      channels: ['in_app']
    });
    
    console.log(`[Replacement Notification] ✅ Created customer rejection notification`);
    console.log(`   Customer: ${customer_id}`);
    console.log(`   Product: ${productTitle}`);
    console.log(`   Reason: ${rejection_reason}`);
    
    // 2. Send email notification to customer (Requirement 14.2)
    let customerEmailResult = null;
    if (customerEmail) {
      try {
        customerEmailResult = await sendCustomerReplacementRejectedEmail({
          email: customerEmail,
          customerName: customerName,
          productTitle: productTitle,
          requestId: requestId,
          orderId: order_id,
          rejectionReason: rejection_reason
        });
        
        console.log(`[Replacement Notification] ✅ Sent rejection email to customer: ${customerEmail}`);
      } catch (emailError) {
        console.error('[Replacement Notification] ⚠️ Failed to send customer email (non-critical):', emailError.message);
      }
    } else {
      console.log(`[Replacement Notification] ⚠️ No customer email found, skipping email notification`);
    }
    
    return {
      customerNotification,
      customerEmail: customerEmailResult
    };
    
  } catch (error) {
    console.error('[Replacement Notification] Error creating rejection notifications:', error);
    return null;
  }
}

/**
 * Send email notification to customer about replacement approval
 * @param {Object} emailData - Email data
 * @returns {Promise<Object>} Email result
 */
async function sendCustomerReplacementApprovedEmail(emailData) {
  try {
    const {
      email,
      customerName,
      productTitle,
      requestId,
      orderId,
      replacementOrderId
    } = emailData;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .email-container {
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background-color: #28a745;
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px 20px;
    }
    .success-box {
      background-color: #d4edda;
      border-left: 4px solid #28a745;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .request-details {
      background-color: #f9f9f9;
      padding: 15px;
      margin: 15px 0;
      border-radius: 5px;
      border: 1px solid #eee;
    }
    .request-details p {
      margin: 8px 0;
    }
    .button {
      display: inline-block;
      background-color: #28a745;
      color: white !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
      font-weight: bold;
      text-align: center;
    }
    .button:hover {
      background-color: #218838;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>✅ Replacement Approved!</h1>
    </div>
    
    <div class="content">
      <p>Hello <strong>${customerName}</strong>,</p>
      
      <div class="success-box">
        <p style="margin: 0; font-size: 16px;">
          <strong>Great news!</strong> Your replacement request has been approved.
        </p>
      </div>
      
      <div class="request-details">
        <h3 style="margin-top: 0;">Replacement Details</h3>
        <p><strong>Product:</strong> ${productTitle}</p>
        <p><strong>Original Order ID:</strong> ${orderId}</p>
        <p><strong>Request ID:</strong> ${requestId}</p>
        ${replacementOrderId ? `<p><strong>Replacement Order ID:</strong> ${replacementOrderId}</p>` : ''}
      </div>
      
      <p><strong>What happens next?</strong></p>
      <ul>
        <li>A replacement product will be prepared and shipped to you</li>
        <li>You'll receive tracking information once it ships</li>
        <li>The replacement is provided at no additional cost</li>
        <li>You can track your replacement order in your account</li>
      </ul>
      
      <center>
        <a href="${frontendUrl}/orders/${replacementOrderId || orderId}" class="button">
          Track Replacement Order
        </a>
      </center>
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        💡 Thank you for your patience. We're committed to ensuring you receive a quality product.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>FastShop</strong> - Your Multi-Vendor Marketplace</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} FastShop. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const emailText = `
✅ Replacement Approved!

Hello ${customerName},

Great news! Your replacement request has been approved.

Replacement Details:
- Product: ${productTitle}
- Original Order ID: ${orderId}
- Request ID: ${requestId}
${replacementOrderId ? `- Replacement Order ID: ${replacementOrderId}` : ''}

What happens next?
1. A replacement product will be prepared and shipped to you
2. You'll receive tracking information once it ships
3. The replacement is provided at no additional cost
4. You can track your replacement order in your account

Track Replacement Order: ${frontendUrl}/orders/${replacementOrderId || orderId}

💡 Thank you for your patience. We're committed to ensuring you receive a quality product.

---
This is an automated notification from FastShop
Please do not reply to this email
© ${new Date().getFullYear()} FastShop. All rights reserved.
    `;

    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'ashenafiashew074@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'lhln ysjx bmot ssnw'
      }
    });

    const mailOptions = {
      from: `"FastShop Replacements" <${process.env.EMAIL_FROM || 'ashenafiashew074@gmail.com'}>`,
      to: email,
      subject: `✅ Replacement Approved - ${productTitle}`,
      text: emailText,
      html: emailHTML
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`[Replacement Email] ✅ Sent approval email to ${email} - Message ID: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
      email: email
    };

  } catch (error) {
    console.error('[Replacement Email] ❌ Error sending approval email:', error);
    throw error;
  }
}

/**
 * Send email notification to customer about replacement rejection
 * @param {Object} emailData - Email data
 * @returns {Promise<Object>} Email result
 */
async function sendCustomerReplacementRejectedEmail(emailData) {
  try {
    const {
      email,
      customerName,
      productTitle,
      requestId,
      orderId,
      rejectionReason
    } = emailData;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .email-container {
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background-color: #dc3545;
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px 20px;
    }
    .warning-box {
      background-color: #f8d7da;
      border-left: 4px solid #dc3545;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .request-details {
      background-color: #f9f9f9;
      padding: 15px;
      margin: 15px 0;
      border-radius: 5px;
      border: 1px solid #eee;
    }
    .request-details p {
      margin: 8px 0;
    }
    .reason-box {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      padding: 15px;
      margin: 15px 0;
      border-radius: 5px;
    }
    .button {
      display: inline-block;
      background-color: #007bff;
      color: white !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
      font-weight: bold;
      text-align: center;
    }
    .button:hover {
      background-color: #0056b3;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>❌ Replacement Request Declined</h1>
    </div>
    
    <div class="content">
      <p>Hello <strong>${customerName}</strong>,</p>
      
      <div class="warning-box">
        <p style="margin: 0; font-size: 16px;">
          We regret to inform you that your replacement request has been declined.
        </p>
      </div>
      
      <div class="request-details">
        <h3 style="margin-top: 0;">Request Details</h3>
        <p><strong>Product:</strong> ${productTitle}</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Request ID:</strong> ${requestId}</p>
      </div>
      
      <div class="reason-box">
        <h3 style="margin-top: 0;">Reason for Decline</h3>
        <p>${rejectionReason || 'No specific reason provided'}</p>
      </div>
      
      <p><strong>What you can do:</strong></p>
      <ul>
        <li>Review the reason provided by the seller</li>
        <li>Contact customer support if you have questions</li>
        <li>Consider submitting a refund request if eligible</li>
        <li>Reach out to the seller directly for clarification</li>
      </ul>
      
      <center>
        <a href="${frontendUrl}/orders/${orderId}" class="button">
          View Order Details
        </a>
      </center>
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        💡 If you believe this decision was made in error, please contact our customer support team.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>FastShop</strong> - Your Multi-Vendor Marketplace</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} FastShop. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const emailText = `
❌ Replacement Request Declined

Hello ${customerName},

We regret to inform you that your replacement request has been declined.

Request Details:
- Product: ${productTitle}
- Order ID: ${orderId}
- Request ID: ${requestId}

Reason for Decline:
${rejectionReason || 'No specific reason provided'}

What you can do:
1. Review the reason provided by the seller
2. Contact customer support if you have questions
3. Consider submitting a refund request if eligible
4. Reach out to the seller directly for clarification

View Order Details: ${frontendUrl}/orders/${orderId}

💡 If you believe this decision was made in error, please contact our customer support team.

---
This is an automated notification from FastShop
Please do not reply to this email
© ${new Date().getFullYear()} FastShop. All rights reserved.
    `;

    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'ashenafiashew074@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'lhln ysjx bmot ssnw'
      }
    });

    const mailOptions = {
      from: `"FastShop Replacements" <${process.env.EMAIL_FROM || 'ashenafiashew074@gmail.com'}>`,
      to: email,
      subject: `❌ Replacement Request Declined - ${productTitle}`,
      text: emailText,
      html: emailHTML
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`[Replacement Email] ✅ Sent rejection email to ${email} - Message ID: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
      email: email
    };

  } catch (error) {
    console.error('[Replacement Email] ❌ Error sending rejection email:', error);
    throw error;
  }
}

module.exports = {
  notifyReplacementRequestCreated,
  notifyReplacementApproved,
  notifyReplacementRejected,
  sendSellerReplacementRequestEmail,
  sendCustomerReplacementApprovedEmail,
  sendCustomerReplacementRejectedEmail
};
