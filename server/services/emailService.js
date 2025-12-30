const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const twilio = require('twilio');

// Create email transporter with better error handling
let transporter;

// Check if using real Gmail or test account
const isRealEmail = process.env.EMAIL_USER && 
                   process.env.EMAIL_USER !== 'your-email@gmail.com' &&
                   process.env.EMAIL_PASS &&
                   process.env.EMAIL_PASS !== 'your-app-password';

if (isRealEmail) {
  // Use real Gmail configuration
  transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS?.replace(/\s+/g, '')
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });

  // Verify transporter configuration
  transporter.verify(function(error, success) {
    if (error) {
      console.log('❌ Email transporter verification failed:', error.message);
      console.log('⚠️ Please check your EMAIL_USER and EMAIL_PASS in .env file');
    } else {
      console.log('✅ Email server is ready to send messages');
      console.log(`📧 Using Gmail: ${process.env.EMAIL_USER}`);
    }
  });
} else {
  // Use Ethereal test account (automatic test email service)
  nodemailer.createTestAccount((err, account) => {
    if (err) {
      console.error('❌ Failed to create test email account:', err);
      return;
    }

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: account.user,
        pass: account.pass
      }
    });

    console.log('✅ Email service ready (Using test account)');
    console.log('📧 Test Email Account:', account.user);
    console.log('🔗 View emails at: https://ethereal.email/messages');
    console.log('💡 Configure real Gmail in .env to send actual emails');
  });
}

// Initialize Twilio client for SMS
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_ACCOUNT_SID.startsWith('AC') &&
    process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid' &&
    process.env.TWILIO_AUTH_TOKEN !== 'your_twilio_auth_token') {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio SMS initialized successfully');
  } catch (error) {
    console.log('⚠️ Twilio initialization failed:', error.message);
  }
} else {
  console.log('⚠️ Twilio not configured - SMS notifications will be skipped');
}

// Generate QR code for ticket
const generateTicketQR = async (bookingData) => {
  try {
    // Create ticket data object
    const ticketData = {
      bookingId: bookingData.bookingId,
      movieTitle: bookingData.movieTitle,
      theaterName: bookingData.theaterName,
      screen: bookingData.screen,
      showDate: bookingData.showDate,
      showTime: bookingData.showTime,
      seats: bookingData.seats,
      totalAmount: bookingData.totalAmount,
      verificationUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-ticket/${bookingData.bookingId}`
    };

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(ticketData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
};

// Send SMS notification
const sendBookingSMS = async (phoneNumber, bookingData) => {
  if (!twilioClient) {
    console.log('⚠️ Twilio not configured, skipping SMS');
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    // Format phone number (ensure it has country code)
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      // Add +91 for Indian numbers if no country code
      formattedPhone = '+91' + formattedPhone.replace(/^0+/, '');
    }

    const message = `
🎬 BookMyShow - Booking Confirmed!

Movie: ${bookingData.movieTitle}
Booking ID: ${bookingData.bookingId}
Theater: ${bookingData.theaterName}
Date: ${bookingData.showDate}
Time: ${bookingData.showTime}
Seats: ${bookingData.seats}
Amount: ₹${bookingData.totalAmount}

View ticket: ${bookingData.ticketUrl}

Show this SMS at the entrance. Arrive 15 mins early.
    `.trim();

    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    console.log('✅ SMS sent successfully:', result.sid);
    return { success: true, messageSid: result.sid };
  } catch (error) {
    console.error('❌ Error sending SMS:', error.message);
    return { success: false, error: error.message };
  }
};

// Send booking confirmation email
const sendBookingConfirmation = async (booking, show, movie, theater) => {
  try {
    const seatsList = booking.seats.map(s => `${s.row}${s.seatNumber}`).join(', ');
    
    // Generate QR code for the ticket
    const qrCodeDataUrl = await generateTicketQR({
      bookingId: booking.bookingId,
      movieTitle: movie.title,
      theaterName: theater.name,
      screen: show.screen.screenNumber,
      showDate: new Date(show.showDate).toLocaleDateString('en-IN'),
      showTime: show.showTime,
      seats: seatsList,
      totalAmount: booking.totalAmount.total
    });
    
    const mailOptions = {
      from: `"BookMyShow" <${process.env.EMAIL_USER}>`,
      to: booking.contactDetails?.email || booking.user.email,
      subject: `🎬 Your Tickets - ${movie.title}`,
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
              max-width: 650px; 
              margin: 20px auto; 
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .header p {
              margin: 10px 0 0 0;
              opacity: 0.9;
              font-size: 16px;
            }
            .content { 
              padding: 30px; 
            }
            .ticket-card {
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
              border-radius: 12px;
              padding: 25px;
              margin: 20px 0;
              color: white;
            }
            .movie-title {
              font-size: 24px;
              font-weight: 700;
              margin: 0 0 20px 0;
              color: #10b981;
            }
            .ticket-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin: 20px 0;
            }
            .detail-item {
              display: flex;
              flex-direction: column;
            }
            .detail-label {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: rgba(255, 255, 255, 0.6);
              margin-bottom: 5px;
            }
            .detail-value {
              font-size: 16px;
              font-weight: 600;
              color: white;
            }
            .seats-section {
              background: rgba(16, 185, 129, 0.15);
              border: 1px solid rgba(16, 185, 129, 0.3);
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
            }
            .seats-label {
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #10b981;
              margin-bottom: 8px;
            }
            .seats-value {
              font-size: 18px;
              font-weight: 700;
              color: #10b981;
            }
            .total-amount {
              background: rgba(220, 38, 38, 0.15);
              border: 1px solid rgba(220, 38, 38, 0.3);
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .total-label {
              font-size: 14px;
              color: rgba(255, 255, 255, 0.8);
            }
            .total-value {
              font-size: 24px;
              font-weight: 700;
              color: #dc2626;
            }
            .qr-section {
              text-align: center;
              margin: 30px 0;
              padding: 25px;
              background: white;
              border-radius: 12px;
              border: 2px dashed #dc2626;
            }
            .qr-title {
              font-size: 16px;
              font-weight: 600;
              color: #dc2626;
              margin-bottom: 15px;
            }
            .qr-code {
              max-width: 250px;
              height: auto;
              margin: 10px auto;
            }
            .qr-instructions {
              font-size: 13px;
              color: #666;
              margin-top: 15px;
              line-height: 1.5;
            }
            .button { 
              background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
              color: white; 
              padding: 14px 40px; 
              text-decoration: none; 
              display: inline-block; 
              border-radius: 8px; 
              margin: 20px 0;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);
            }
            .important-notice {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .important-notice h3 {
              margin: 0 0 10px 0;
              color: #856404;
              font-size: 16px;
            }
            .important-notice ul {
              margin: 0;
              padding-left: 20px;
            }
            .important-notice li {
              color: #856404;
              margin: 5px 0;
              font-size: 14px;
            }
            .footer { 
              text-align: center; 
              color: #666; 
              font-size: 13px; 
              padding: 20px;
              background: #f9fafb;
              border-top: 1px solid #e5e7eb;
            }
            .footer p {
              margin: 5px 0;
            }
            @media (max-width: 600px) {
              .ticket-details {
                grid-template-columns: 1fr;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎬 Booking Confirmed!</h1>
              <p>Your tickets are ready</p>
            </div>
            
            <div class="content">
              <p style="font-size: 16px; margin-bottom: 20px;">
                Thank you for booking with <strong>BookMyShow</strong>. Here are your ticket details:
              </p>
              
              <div class="ticket-card">
                <h3 class="movie-title">${movie.title}</h3>
                
                <div class="ticket-details">
                  <div class="detail-item">
                    <span class="detail-label">Booking ID</span>
                    <span class="detail-value">${booking.bookingId}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Theater</span>
                    <span class="detail-value">${theater.name}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Screen</span>
                    <span class="detail-value">Screen ${show.screen.screenNumber}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${new Date(show.showDate).toLocaleDateString('en-IN', { 
                      weekday: 'short', 
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Show Time</span>
                    <span class="detail-value">${show.showTime}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Language</span>
                    <span class="detail-value">${show.language || 'English'}</span>
                  </div>
                </div>
                
                <div class="seats-section">
                  <div class="seats-label">Your Seats</div>
                  <div class="seats-value">${seatsList}</div>
                </div>
                
                <div class="total-amount">
                  <span class="total-label">Total Amount Paid</span>
                  <span class="total-value">₹${booking.totalAmount.total}</span>
                </div>
              </div>
              
              ${qrCodeDataUrl ? `
                <div class="qr-section">
                  <div class="qr-title">📱 Your E-Ticket QR Code</div>
                  <img src="${qrCodeDataUrl}" alt="Ticket QR Code" class="qr-code" />
                  <div class="qr-instructions">
                    Show this QR code at the theater entrance for verification.<br>
                    Screenshot or save this email for easy access.
                  </div>
                </div>
              ` : ''}
              
              <div style="text-align: center;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/booking-confirmation/${booking._id}" class="button">
                  View Full Ticket
                </a>
              </div>
              
              <div class="important-notice">
                <h3>⚠️ Important Instructions</h3>
                <ul>
                  <li>Please arrive at the theater <strong>15 minutes before</strong> the show time</li>
                  <li>Carry a valid <strong>Photo ID proof</strong> for verification</li>
                  <li>Show the QR code or booking ID at the entrance</li>
                  <li>Outside food and beverages are not allowed</li>
                  <li>Mobile phones must be switched off during the movie</li>
                </ul>
              </div>
              
              <p style="margin-top: 25px; font-size: 14px; color: #666; line-height: 1.6;">
                For any queries or support, please contact us at <strong>${process.env.EMAIL_USER}</strong>
              </p>
            </div>
            
            <div class="footer">
              <p><strong>This is an automated email. Please do not reply to this message.</strong></p>
              <p>&copy; 2025 BookMyShow. All rights reserved.</p>
              <p>Happy watching! 🍿</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Booking confirmation email sent:', info.messageId);
    
    // If using test account, log preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('📧 Preview email: ' + previewUrl);
    }
    
    // Send SMS notification if phone number is available
    const phoneNumber = booking.contactDetails?.phone || booking.user?.phone;
    if (phoneNumber) {
      const smsResult = await sendBookingSMS(phoneNumber, {
        bookingId: booking.bookingId,
        movieTitle: movie.title,
        theaterName: theater.name,
        showDate: new Date(show.showDate).toLocaleDateString('en-IN'),
        showTime: show.showTime,
        seats: seatsList,
        totalAmount: booking.totalAmount.total,
        ticketUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/booking-confirmation/${booking._id}`
      });
      
      if (smsResult.success) {
        console.log('✅ SMS notification sent');
      }
    }
    
    return { success: true, messageId: result[0].headers['x-message-id'] };
  } catch (error) {
    console.error('❌ Error sending booking confirmation email:', error);
    // Don't throw error - booking should succeed even if email fails
    return { success: false, error: error.message };
  }
};

// Send booking cancellation email
const sendBookingCancellation = async (booking, reason = 'Payment timeout') => {
  try {
    const mailOptions = {
      from: `"BookMyShow" <${process.env.EMAIL_USER}>`,
      to: booking.contactDetails.email,
      subject: `Booking Cancelled - ${booking.bookingId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 20px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Cancelled</h1>
            </div>
            
            <div class="content">
              <h2>Your booking has been cancelled</h2>
              <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
              <p><strong>Reason:</strong> ${reason}</p>
              <p>The reserved seats have been released and are now available for other customers.</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
            
            <div class="footer">
              <p>&copy; 2025 BookMyShow. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Cancellation email sent for booking:', booking.bookingId);
    
    // If using test account, log preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('📧 Preview email: ' + previewUrl);
    }
  } catch (error) {
    console.error('❌ Error sending cancellation email:', error);
  }
};

// General send email function for forgot password and other purposes
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Wait for transporter to be initialized if using test account
    if (!transporter) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!transporter) {
      throw new Error('Email transporter not initialized');
    }

    const mailOptions = {
      from: `"BookMyShow" <${process.env.EMAIL_USER || 'noreply@bookmyshow.com'}>`,
      to,
      subject,
      text,
      html: html || `
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
              color: white;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
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
              <h1>🎬 BookMyShow</h1>
            </div>
            <div class="content">
              ${text.split('\n').map(line => `<p>${line}</p>`).join('')}
            </div>
            <div class="footer">
              <p>&copy; 2025 BookMyShow. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    
    // If using test account, log preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('📧 Preview email: ' + previewUrl);
    }
    
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendBookingCancellation,
  sendBookingSMS
};
