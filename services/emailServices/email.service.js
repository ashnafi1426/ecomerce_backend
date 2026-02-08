/**
 * EMAIL SERVICE
 * 
 * Business logic for sending transactional emails.
 * Handles all email notifications for the e-commerce platform.
 */

const { sendEmail } = require('../../config/email');
const supabase = require('../../config/supabase');

/**
 * REQUIREMENT 2.1: Send registration welcome email
 * @param {String} userEmail - User email address
 * @param {String} userName - User display name
 * @returns {Promise<Object>} Send result
 */
const sendRegistrationEmail = async (userEmail, userName) => {
  const subject = 'Welcome to Our E-Commerce Store!';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Our Store!</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName || 'there'}!</h2>
          <p>Thank you for registering with us. We're excited to have you as part of our community!</p>
          <p>You can now:</p>
          <ul>
            <li>Browse our extensive product catalog</li>
            <li>Add items to your cart</li>
            <li>Place orders securely</li>
            <li>Track your order status</li>
            <li>Leave product reviews</li>
          </ul>
          <p>Start shopping now and discover amazing products!</p>
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Start Shopping</a>
          </p>
        </div>
        <div class="footer">
          <p>© 2026 E-Commerce Store. All rights reserved.</p>
          <p>If you didn't create this account, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to Our E-Commerce Store!
    
    Hello ${userName || 'there'}!
    
    Thank you for registering with us. We're excited to have you as part of our community!
    
    You can now browse products, add items to cart, place orders, and more.
    
    Start shopping at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}
    
    © 2026 E-Commerce Store
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    html,
    text
  });
};

/**
 * REQUIREMENT 2.2: Send order placed confirmation email
 * @param {String} userEmail - User email address
 * @param {Object} order - Order object
 * @returns {Promise<Object>} Send result
 */
const sendOrderPlacedEmail = async (userEmail, order) => {
  const subject = `Order Confirmation - Order #${order.id.substring(0, 8)}`;
  
  // Generate order items HTML
  const orderItemsHtml = order.basket.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.title}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .order-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; }
        .total { font-size: 18px; font-weight: bold; text-align: right; padding: 15px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Thank you for your order!</h2>
          <p>Your order has been successfully placed and is being processed.</p>
          
          <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> ${order.id.substring(0, 8)}</p>
            <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            
            <h3>Items Ordered</h3>
            <table>
              <thead>
                <tr style="background-color: #f0f0f0;">
                  <th style="padding: 10px; text-align: left;">Product</th>
                  <th style="padding: 10px; text-align: center;">Quantity</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                  <th style="padding: 10px; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHtml}
              </tbody>
            </table>
            
            <div class="total">
              Total: $${(order.amount / 100).toFixed(2)}
            </div>
          </div>
          
          <p>We'll send you another email when your order ships.</p>
        </div>
        <div class="footer">
          <p>© 2026 E-Commerce Store. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Order Confirmed!
    
    Thank you for your order!
    
    Order ID: ${order.id.substring(0, 8)}
    Order Date: ${new Date(order.created_at).toLocaleDateString()}
    Status: ${order.status}
    Total: $${(order.amount / 100).toFixed(2)}
    
    We'll send you another email when your order ships.
    
    © 2026 E-Commerce Store
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    html,
    text
  });
};

/**
 * REQUIREMENT 2.3: Send payment success email
 * @param {String} userEmail - User email address
 * @param {Object} payment - Payment object
 * @param {Object} order - Order object
 * @returns {Promise<Object>} Send result
 */
const sendPaymentSuccessEmail = async (userEmail, payment, order) => {
  const subject = `Payment Received - Order #${order.id.substring(0, 8)}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .payment-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .success-icon { font-size: 48px; text-align: center; color: #4CAF50; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Successful!</h1>
        </div>
        <div class="content">
          <div class="success-icon">✓</div>
          <h2>Your payment has been processed</h2>
          <p>We've received your payment and your order is now being prepared for shipment.</p>
          
          <div class="payment-details">
            <h3>Payment Details</h3>
            <p><strong>Order ID:</strong> ${order.id.substring(0, 8)}</p>
            <p><strong>Payment ID:</strong> ${payment.payment_intent_id.substring(0, 20)}...</p>
            <p><strong>Amount Paid:</strong> $${(payment.amount / 100).toFixed(2)}</p>
            <p><strong>Payment Date:</strong> ${new Date(payment.created_at).toLocaleDateString()}</p>
            <p><strong>Payment Method:</strong> ${payment.payment_method || 'Card'}</p>
          </div>
          
          <p>Your order will be shipped soon. We'll notify you when it's on its way!</p>
        </div>
        <div class="footer">
          <p>© 2026 E-Commerce Store. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Payment Successful!
    
    Your payment has been processed successfully.
    
    Order ID: ${order.id.substring(0, 8)}
    Payment ID: ${payment.payment_intent_id.substring(0, 20)}...
    Amount Paid: $${(payment.amount / 100).toFixed(2)}
    Payment Date: ${new Date(payment.created_at).toLocaleDateString()}
    
    Your order will be shipped soon!
    
    © 2026 E-Commerce Store
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    html,
    text
  });
};

/**
 * REQUIREMENT 2.4: Send order shipped email
 * @param {String} userEmail - User email address
 * @param {Object} order - Order object
 * @param {String} trackingNumber - Tracking number (optional)
 * @returns {Promise<Object>} Send result
 */
const sendOrderShippedEmail = async (userEmail, order, trackingNumber = null) => {
  const subject = `Your Order Has Shipped - Order #${order.id.substring(0, 8)}`;
  
  const trackingHtml = trackingNumber 
    ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>
       <p>You can track your package using the tracking number above.</p>`
    : '<p>You will receive tracking information soon.</p>';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .shipping-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .icon { font-size: 48px; text-align: center; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Order Has Shipped!</h1>
        </div>
        <div class="content">
          <div class="icon">📦</div>
          <h2>Your package is on its way!</h2>
          <p>Great news! Your order has been shipped and is on its way to you.</p>
          
          <div class="shipping-details">
            <h3>Shipping Details</h3>
            <p><strong>Order ID:</strong> ${order.id.substring(0, 8)}</p>
            <p><strong>Shipped Date:</strong> ${new Date().toLocaleDateString()}</p>
            ${trackingHtml}
          </div>
          
          <p>Your order should arrive within 3-5 business days.</p>
          <p>Thank you for shopping with us!</p>
        </div>
        <div class="footer">
          <p>© 2026 E-Commerce Store. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Your Order Has Shipped!
    
    Your package is on its way!
    
    Order ID: ${order.id.substring(0, 8)}
    Shipped Date: ${new Date().toLocaleDateString()}
    ${trackingNumber ? `Tracking Number: ${trackingNumber}` : 'Tracking information coming soon'}
    
    Your order should arrive within 3-5 business days.
    
    © 2026 E-Commerce Store
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    html,
    text
  });
};

/**
 * REQUIREMENT 3: Send low stock alert to admins
 * @param {Array} lowStockProducts - Array of low stock products
 * @returns {Promise<Array>} Array of send results
 */
const sendLowStockAlert = async (lowStockProducts) => {
  // Get all admin users
  const { data: admins, error } = await supabase
    .from('users')
    .select('email, display_name')
    .eq('role', 'admin')
    .eq('status', 'active');

  if (error || !admins || admins.length === 0) {
    console.warn('⚠️  No admin users found for low stock alert');
    return [];
  }

  const subject = `⚠️ Low Stock Alert - ${lowStockProducts.length} Products Need Attention`;
  
  const productListHtml = lowStockProducts.map(product => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${product.title}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${product.available_stock}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${product.low_stock_threshold}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">
        <span style="color: ${product.available_stock === 0 ? 'red' : 'orange'}; font-weight: bold;">
          ${product.status === 'out_of_stock' ? 'OUT OF STOCK' : 'LOW STOCK'}
        </span>
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .alert-box { background-color: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; background-color: white; }
        th { background-color: #f0f0f0; padding: 10px; text-align: left; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Low Stock Alert</h1>
        </div>
        <div class="content">
          <div class="alert-box">
            <strong>Action Required:</strong> ${lowStockProducts.length} products are running low on stock or out of stock.
          </div>
          
          <h3>Products Needing Attention</h3>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th style="text-align: center;">Available Stock</th>
                <th style="text-align: center;">Threshold</th>
                <th style="text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${productListHtml}
            </tbody>
          </table>
          
          <p style="margin-top: 20px;">Please restock these products as soon as possible to avoid lost sales.</p>
        </div>
        <div class="footer">
          <p>© 2026 E-Commerce Store - Admin Alert System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    LOW STOCK ALERT
    
    ${lowStockProducts.length} products need attention:
    
    ${lowStockProducts.map(p => `- ${p.title}: ${p.available_stock} units (threshold: ${p.low_stock_threshold})`).join('\n')}
    
    Please restock these products as soon as possible.
    
    © 2026 E-Commerce Store
  `;

  // Send email to all admins
  const results = [];
  for (const admin of admins) {
    const result = await sendEmail({
      to: admin.email,
      subject,
      html,
      text
    });
    results.push({ admin: admin.email, ...result });
  }

  return results;
};

module.exports = {
  sendRegistrationEmail,
  sendOrderPlacedEmail,
  sendPaymentSuccessEmail,
  sendOrderShippedEmail,
  sendLowStockAlert
};
