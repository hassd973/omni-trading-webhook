require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors());

const BASE_URL = 'https://omni.apex.exchange/api/v3';

app.get('/', (req, res) => {
  res.send('Omni Webhook is live ✅');
});

// ✅ Test route to check ENV variables
app.get('/test-env', (req, res) => {
  res.json({
    API_KEY: process.env.API_KEY ? '✅ Loaded' : '❌ Missing',
    SECRET: process.env.SECRET ? '✅ Loaded' : '❌ Missing',
    PASSPHRASE: process.env.PASSPHRASE ? '✅ Loaded' : '❌ Missing',
    ACCOUNT_ID: process.env.ACCOUNT_ID ? '✅ Loaded' : '⚠️ Not used in v3',
    OMNI_SEED: process.env.OMNI_SEED ? '✅ Loaded' : '⚠️ Not used',
    L2KEY: process.env.L2KEY ? '✅ Loaded' : '⚠️ Not used',
    PORT: process.env.PORT || '🔁 Defaulting to 10000'
  });
});

// ✅ Signature helper
function signRequest(method, path, body = {}) {
  const timestamp = Date.now().toString();
  const message = `${method}${path}${timestamp}${JSON.stringify(body)}`;
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

// ✅ BALANCE endpoint (no query param, Omni V3)
app.get('/balance', async (req, res) => {
  const path = `/account/balances`;

  try {
    const headers = signRequest('GET', path);
    const response = await axios.get(`${BASE_URL}${path}`, { headers });

    res.status(200).json(response.data);
  } catch (err) {
    console.error('Balance error:', err.response?.data || err.message);
    res.status(500).send(`Balance error: ${err.message}`);
  }
});

// ✅ POSITIONS endpoint
app.get('/positions', async (req, res) => {
  const path = `/positions`;

  try {
    const headers = signRequest('GET', path);
    const response = await axios.get(`${BASE_URL}${path}`, { headers });

    res.status(200).json(response.data);
  } catch (err) {
    console.error('Positions error:', err.response?.data || err.message);
    res.status(500).send(`Positions error: ${err.message}`);
  }
});

// ✅ ORDER creator
async function createOrder(symbol, side, type, size, price) {
  const path = '/order';
  const body = {
    symbol,
    side: side.toUpperCase(),
    type: type.toUpperCase(),
    size: parseFloat(size),
    ...(price && { price: parseFloat(price) }),
    timeInForce: 'GTC',
    clientOrderId: `webhook-${Date.now()}`,
    timestamp: Date.now()
  };

  const headers = signRequest('POST', path, body);
  console.log('Sending order:', body);

  try {
    const response = await axios.post(`${BASE_URL}${path}`, body, { headers });
    return response.data;
  } catch (error) {
    console.error('Order error:', error.response?.data || error.message);
    throw new Error(error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
  }
}

// ✅ WEBHOOK trigger
app.post('/webhook', async (req, res) => {
  try {
    const { market, order, size, price } = req.body;
    console.log('Webhook received:', req.body);

    const orderType = price ? 'LIMIT' : 'MARKET';
    const result = await createOrder(market, order, orderType, size, price);

    console.log('Order placed:', result);
    res.status(200).send('Order placed successfully');
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).send(`Order failed: ${error.message}`);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
