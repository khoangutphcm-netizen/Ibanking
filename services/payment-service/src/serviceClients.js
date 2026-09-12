const axios = require("axios");

const ACCOUNT_SERVICE_URL = process.env.ACCOUNT_SERVICE_URL || "http://localhost:3002";
const TUITION_SERVICE_URL = process.env.TUITION_SERVICE_URL || "http://localhost:3003";
const OTP_SERVICE_URL = process.env.OTP_SERVICE_URL || "http://localhost:3005";

module.exports = {
  account: axios.create({ baseURL: ACCOUNT_SERVICE_URL, timeout: 5000 }),
  tuition: axios.create({ baseURL: TUITION_SERVICE_URL, timeout: 5000 }),
  otp: axios.create({ baseURL: OTP_SERVICE_URL, timeout: 5000 }),
};
