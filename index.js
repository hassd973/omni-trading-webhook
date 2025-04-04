require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const { ethers } = require('ethers');

const app = express();
app.use(express.json());

const BASE_URL = 'https://omni.apex.exchange/api/v3';

// ✅ Console check for all required env vars
console.log('🔑 API_KEY:', process.env.API_KEY ? '✔️' : '❌');
console.log('🔐 SECRET:', process.env.SECRET ? '✔️' : '❌');
console.log('🔒 PASSPHRASE:', process.env.PASSPHRASE ? '✔️' : '❌');
console.log('🔑 ETH_PRIVATE_KEY:', process.env.ETH_PRIVATE_KEY ? '✔️' : '❌');
console.log('🔗 ACCOUNT_ID:', process.env.ACCOUNT_ID ? '✔️' : '❌');
console.log('🌍 OMNI_SEED:', process.env.OMNI_SEED ? '✔️' : '❌');
console.log('📡 L2KEY:', process.env.L2KEY ? '✔️' : '❌');

function signRequest(method, path, params = {}) {
  const timestamp = Date.now().toString();
  const message = `${method}${path}${timestamp}${JSON.stringify(params)}`;
  const signature = crypto
    .createHmac('sha256', process.env.SECRET)
    .update(message)
    .digest('hex');

  return {
    'Content-Type': 'application/json',
    'APEX-API-KEY': process.env.API_KEY,
    'APEX-PASSPHRASE': process.env.PASSPHRASE,
    'APEX-SIGNATURE': signature,
    'APEX-TIMESTAMP': timestamp
  };
}

// ✅ Fetch Account Info
async function fetchAccount() {
  const path = '/account';
  const headers = signRequest('GET', path);
  try {
    const response = await axios.get(`${BASE_URL}${path}`, { headers });
    console.log('✅ Account info:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Account fetch error:', error.response?.data || error.message);
  }
}

// ✅ Create Order Logic
async function createOrder(symbol, side, type, size, price) {
  const path = '/order';
  const params = {
    symbol,
    side: side.toUpperCase(),
    type: type.toUpperCase(),
    size: parseFloat(size),
    ...(price && { price: parseFloat(price) }),
    timeInForce: 'GTC',
    accountId: process.env.ACCOUNT_ID,
    l2Key: process.env.L2KEY,
    clientOrderId: `webhook-${Date.now()}`,
    timestamp: Date.now()
  };

  const headers = signRequest('POST', path, params);
  console.log('🛰️ Sending order:', { params });

  try {
    const response = await axios.post(`${BASE_URL}${path}`, params, { headers });
    console.log('✅ Order placed:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Order error:', error.response?.data || error.message);
    throw new Error(error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
  }
}

// ✅ Webhook for Trading
app.post('/webhook', async (req, res) => {
  try {
    const { symbol, action, quantity, price } = req.body;
    console.log('📩 Webhook received:', req.body);
    const order = await createOrder(
      symbol,
      action,
      price ? 'LIMIT' : 'MARKET',
      quantity,
      price
    );
    res.status(200).send('✅ Trade executed');
  } catch (error) {
    res.status(500).send(`❌ Trade error: ${error.message}`);
  }
});

// 🧊 Server Boot
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🧊 ICE KING running on port ${PORT}`);
  fetchAccount(); // Fetch account info once server is running
});
