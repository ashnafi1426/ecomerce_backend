import nodemailer from 'nodemailer';

/**
 * Email Service for Seller Notifications
 * Sends email notifications to sellers when their products are purchased
 */

// Create transporter with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'ashenafiashew074@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'lhln ysjx bmot ssnw'
  }
});

/**
 * Send new order notification email to seller
 * @param {Object} sellerInfo - Seller information
 * @param {Object} orderInfo - Order information
 */
async function sendSellerOrderNotification(sellerInfo, orderInfo) {
  try {
    const { email, display_name, business_name } = sellerInfo;
    const { sub_order_id, order_id, item_count, subtotal, items } = orderInfo;

    const sellerName = business_name || display_name || 'Seller';

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
    }
    .header {
      background-color: #FF9900;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #f9f9f9;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 0 0 5px 5px;
    }
    .order-details {
      background-color: white;
      padding: 15px;
      margin: 15px 0;
      border-radius: 5px;
      border: 1px solid #eee;
    }
    .item {
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .item:last-child {
      border-bottom: none;
    }
    .total {
      font-size: 18px;
      font-weight: bold;
      color: #FF9900;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 2px solid #FF9900;
    }
    .button {
      display: inline-block;
      background-color: #FF9900;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 New Order Received!</h1>
  </div>
  
  <div class="content">
    <p>Hello <strong>${sellerName}</strong>,</p>
    
    <p>Great news! You have received a new order on FastShop.</p>
    
    <div class="order-details">
      <h3>Order Details</h3>
      <p><strong>Order ID:</strong> ${order_id}</p>
      <p><strong>Sub-Order ID:</strong> ${sub_order_id}</p>
      <p><strong>Number of Items:</strong> ${item_count}</p>
      
      <h4>Items:</h4>
      ${items.map(item => `
        <div class="item">
          <strong>${item.title || item.product_title || 'Product'}</strong><br>
          Quantity: ${item.quantity} × $${parseFloat(item.price).toFixed(2)} = $${(item.quantity * parseFloat(item.price)).toFixed(2)}
        </div>
      `).join('')}
      
      <div class="total">
        Total: $${parseFloat(subtotal).toFixed(2)}
      </div>
    </div>
    
    <p><strong>Next Steps:</strong></p>
    <ul>
      <li>Log in to your seller dashboard</li>
      <li>Review the order details</li>
      <li>Prepare the items for shipment</li>
      <li>Update the order status once shipped</li>
    </ul>
    
    <center>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/seller/orders" class="button">
        View Order in Dashboard
      </a>
    </center>
  </div>
  
  <div class="footer">
    <p>This is an automated notification from FastShop</p>
    <p>Please do not reply to this email</p>
    <p>&copy; ${new Date().getFullYear()} FastShop. All rights reserved.</p>
  </div>
</body>
</html>
    `;

    // Plain text version
    const emailText = `
Hello ${sellerName},

Great news! You have received a new order on FastShop.

Order Details:
- Order ID: ${order_id}
- Sub-Order ID: ${sub_order_id}
- Number of Items: ${item_count}

Items:
${items.map(item => `- ${item.title || item.product_title || 'Product'}: ${item.quantity} × $${parseFloat(item.price).toFixed(2)} = $${(item.quantity * parseFloat(item.price)).toFixed(2)}`).join('\n')}

Total: $${parseFloat(subtotal).toFixed(2)}

Next Steps:
1. Log in to your seller dashboard
2. Review the order details
3. Prepare the items for shipment
4. Update the order status once shipped

View your orders: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/seller/orders

---
This is an automated notification from FastShop
Please do not reply to this email
© ${new Date().getFullYear()} FastShop. All rights reserved.
    `;

    // Send email
    const mailOptions = {
      from: `"FastShop" <${process.env.EMAIL_FROM || 'ashenafiashew074@gmail.com'}>`,
      to: email,
      subject: `🎉 New Order Received - ${item_count} item(s) - $${parseFloat(subtotal).toFixed(2)}`,
      text: emailText,
      html: emailHTML
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`[Email] Sent to ${email} - Message ID: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
      email: email
    };

  } catch (error) {
    console.error('[Email] Error sending seller notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send order shipped notification to seller
 * @param {Object} sellerInfo - Seller information
 * @param {Object} shipmentInfo - Shipment information
 */
async function sendOrderShippedConfirmation(sellerInfo, shipmentInfo) {
  try {
    const { email, display_name } = sellerInfo;
    const { order_id, tracking_number, carrier } = shipmentInfo;

    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px; }
    .content { padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Order Shipped Successfully</h1>
  </div>
  <div class="content">
    <p>Hello ${display_name},</p>
    <p>Your order <strong>${order_id}</strong> has been marked as shipped.</p>
    <p><strong>Tracking Number:</strong> ${tracking_number}</p>
    <p><strong>Carrier:</strong> ${carrier}</p>
    <p>The customer will be notified about the shipment.</p>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: `"FastShop" <${process.env.EMAIL_FROM || 'ashenafiashew074@gmail.com'}>`,
      to: email,
      subject: `✅ Order Shipped - ${order_id}`,
      html: emailHTML
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Shipment confirmation sent to ${email}`);
    
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('[Email] Error sending shipment confirmation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test email configuration
 */
async function testEmailConfiguration() {
  try {
    await transporter.verify();
    console.log('[Email] Configuration verified successfully');
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    console.error('[Email] Configuration error:', error);
    return { success: false, error: error.message };
  }
}

export {
  sendSellerOrderNotification,
  sendOrderShippedConfirmation,
  testEmailConfiguration
};
