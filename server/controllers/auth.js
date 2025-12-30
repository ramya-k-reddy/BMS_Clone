exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ success: false, message: 'Token and password are required' });
  }
  try {
    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('../services/emailService');

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Always respond with success to avoid user enumeration
      return res.json({ success: true, message: 'If this email exists, a reset link will be sent.' });
    }
    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    // Send email
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${token}`;
    await emailService.sendEmail({
      to: user.email,
      subject: '🔐 Password Reset Request - BookMyShow',
      text: `You requested a password reset. Click the link to reset: ${resetUrl}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white; 
              padding: 30px; 
              text-align: center; 
            }
            .header h1 { margin: 0; font-size: 28px; }
            .content { 
              padding: 30px; 
              background: white; 
            }
            .content p { margin: 15px 0; line-height: 1.8; }
            .button {
              display: inline-block;
              padding: 12px 30px;
              margin: 20px 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white !important;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
            }
            .warning {
              background: #fef3c7;
              padding: 15px;
              border-left: 4px solid #f59e0b;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer { 
              text-align: center; 
              color: #666; 
              font-size: 12px; 
              padding: 20px;
              background: #f9fafb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${user.name}</strong>,</p>
              <p>We received a request to reset your password for your BookMyShow account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #667eea; font-size: 14px;">
                ${resetUrl}
              </p>
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul style="margin: 10px 0;">
                  <li>This link will expire in <strong>1 hour</strong></li>
                  <li>If you didn't request this, please ignore this email</li>
                  <li>Your password won't change until you create a new one</li>
                </ul>
              </div>
              <p>If you have any questions or concerns, please contact our support team.</p>
            </div>
            <div class="footer">
              <p><strong>This is an automated email. Please do not reply to this message.</strong></p>
              <p>&copy; 2025 BookMyShow. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    return res.json({ success: true, message: 'If this email exists, a reset link will be sent.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.listPendingPartners = async (req, res) => {
  try {
    const partners = await User.find({ role: 'partner', approved: false });
    res.json({ success: true, partners });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.approvePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const partner = await User.findOne({ _id: id, role: 'partner' });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    partner.approved = true;
    await partner.save();
    res.json({ success: true, message: 'Partner approved', partner });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};