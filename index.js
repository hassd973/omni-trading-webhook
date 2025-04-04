require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const { ethers } = require('ethers');

const app = express();
app.use(express.json());

const BASE_URL = 'https://omni.apex.exchange';
const API_PREFIX = '/api/v3';

const requiredEnvVars = [
  'API_KEY', 'SECRET', 'PASSPHRASE', 'ETH_PRIVATE_KEY', 'ACCOUNT_ID', 'OMNI_SEED', 'L2KEY', 'CHAIN_ID'
];

requiredEnvVars.forEach((key) => {
  const emoji = key.includes('KEY') ? '🔑' : key.includes('SEED') ? '🌍' : key.includes('CHAIN') ? '🧬' : '📡';
  console.log(`${emoji} ${key}: ${process.env[key] ? '✔️' : '❌ Missing'}`);
});

// Signature helper
function signRequest(method, path, params = '') {
  const timestamp = Date.now().toString();
  const message = `${method}${path}${timestamp}${params}`;
  const signature = crypto.createHmac('sha256', process.env.SECRET).update(message).digest('hex');

  return {
    'Content-Type': 'application/json',
    'APEX-API-KEY': process.env.API_KEY,
    'APEX-PASSPHRASE': process.env.PASSPHRASE,
    'APEX-SIGNATURE': signature,
    'APEX-TIMESTAMP': timestamp
  };
}

// Fetch account info
async function fetchAccount() {
  const path = '/v3/account';
  try {
    const headers = signRequest('GET', path);
    const response = await axios.get(`${BASE_URL}${path}`, { headers });
    console.log('✅ Account info:', response.data);
  } catch (error) {
    console.error('❌ Account error:', error.response?.data || error.message);
  }
}

// Fetch positions
async function fetchPositions() {
  const path = '/v3/account/positions';
  try {
    const headers = signRequest('GET', path);
    const response = await axios.get(`${BASE_URL}${path}`, { headers });
    console.log('✅ Positions:', response.data);
  } catch (error) {
    console.error('❌ Positions error:', error.response?.data || error.message);
  }
}

// Place order from webhook
async function createOrder(symbol, side, type, size, price) {
  const path = '/v3/order';
  const body = {
    symbol: symbol.replace('USD', '-USD'),
    side: side.toUpperCase(),
    type: type.toUpperCase(),
    size: parseFloat(size),
    timeInForce: 'GTC',
    accountId: process.env.ACCOUNT_ID,
    l2Key: process.env.L2KEY,
    clientOrderId: `webhook-${Date.now()}`,
    timestamp: Date.now(),
    ...(price && { price: parseFloat(price) })
  };

  const headers = signRequest('POST', path, JSON.stringify(body));

  try {
    const response = await axios.post(`${BASE_URL}${path}`, body, { headers });
    return response.data;
  } catch (error) {
    console.error('❌ Order error:', error.response?.data || error.message);
    throw new Error(error.response ? JSON.stringify(error.response.data) : error.message);
  }
}

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  const { symbol, action, quantity, price } = req.body;
  try {
    const order = await createOrder(symbol, action, price ? 'LIMIT' : 'MARKET', quantity, price);
    console.log('✅ Order placed:', order);
    res.status(200).send('Order placed successfully');
  } catch (error) {
    console.error('❌ Webhook order failed:', error.message);
    res.status(500).send(`Order failed: ${error.message}`);
  }
});

// Root
app.get('/', (req, res) => {
  res.send('✅ ICE KING Omni Webhook running');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🧊 ICE KING running on port ${PORT}`);
  fetchAccount();
  fetchPositions();
});
