// OTP utility — replace with MSG91/Twilio in production
const sendOTP = async (phone, otp) => {
  // DEV: log to console. PROD: integrate SMS gateway
  console.log(`[OTP] Send to ${phone}: ${otp}`);
  // Example MSG91 integration (uncomment and configure):
  // const axios = require('axios');
  // await axios.get(`https://api.msg91.com/api/v5/otp?template_id=...&mobile=${phone}&otp=${otp}&authkey=${process.env.OTP_API_KEY}`);
  return true;
};

module.exports = { sendOTP };
