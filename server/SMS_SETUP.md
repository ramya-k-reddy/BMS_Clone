# SMS Notification Setup Guide

## Overview
The booking system now sends SMS notifications along with email confirmations. SMS includes booking details and QR code link.

## What's Included in SMS
- Movie title
- Booking ID
- Theater name
- Show date and time
- Seat numbers
- Total amount paid
- Direct link to view ticket

## Twilio Setup Instructions

### 1. Create Twilio Account
1. Go to [Twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free account
3. Verify your email and phone number

### 2. Get Your Credentials
1. Go to [Twilio Console](https://console.twilio.com/)
2. Copy your **Account SID**
3. Copy your **Auth Token**

### 3. Get a Phone Number
1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. For free trial: Use the trial phone number provided
3. For production: Purchase a phone number ($1-2/month)

### 4. Configure Environment Variables

Update your `.env` file with Twilio credentials:

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Note:** 
- `TWILIO_ACCOUNT_SID` starts with "AC"
- `TWILIO_PHONE_NUMBER` must include country code (e.g., +1 for US, +91 for India)

### 5. Trial Account Limitations
- **Free trial:** Can only send SMS to verified numbers
- **Verify numbers:** In Twilio Console → Phone Numbers → Verified Caller IDs
- **Upgrade:** Add payment method to remove restrictions

### 6. Testing
1. Restart your server after updating `.env`
2. Make a test booking with a verified phone number
3. Check SMS arrives within seconds

## Phone Number Format
- User phone numbers are automatically formatted
- System adds +91 for Indian numbers without country code
- For other countries, users should include country code

## Cost Estimation
- **Trial:** Free (limited to verified numbers)
- **Production:**
  - SMS: ~$0.0075 per message (India)
  - Phone number: ~$1-2/month
  - Estimated: ~$10-20/month for 1000 bookings

## Troubleshooting

### SMS not sending
1. Check Twilio credentials in `.env`
2. Verify phone number is in correct format
3. Check Twilio Console logs for errors
4. Ensure trial account has verified the recipient number

### Error: "Twilio not configured"
- Missing Twilio credentials in `.env`
- System will skip SMS but email will still work

### Error: "Invalid phone number"
- Phone number must include country code
- Format: +[country code][number] (e.g., +919876543210)

## Alternative: Use Twilio Sandbox (For Testing)
1. In Twilio Console, go to **Messaging** → **Try it out** → **Send an SMS**
2. Follow instructions to connect your WhatsApp/SMS
3. Use sandbox number for testing

## Disable SMS (Optional)
To disable SMS notifications, simply don't set Twilio credentials in `.env`. The system will automatically skip SMS and only send emails.

## Support
- Twilio Docs: https://www.twilio.com/docs/sms
- Twilio Support: https://support.twilio.com
