require('dotenv').config();
const Alpaca = require('@alpacahq/alpaca-trade-api');

const alpacaConfig = {
  keyId: process.env.APCA_API_KEY_ID,
  secretKey: process.env.APCA_API_SECRET_KEY,
  paper: process.env.APCA_API_BASE_URL === 'https://paper-api.alpaca.markets',
};
module.exports = new Alpaca(alpacaConfig);
