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
    const resetUrl = `http://localhost:3000/reset-password/${token}`;
    await emailService.sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the link to reset: ${resetUrl}`
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