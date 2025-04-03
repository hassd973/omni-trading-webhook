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

// ✅ BALANCE endpoint (no query param)
app.get('/balance', async (req, res) => {
  const path = `/account/balances`;
  const params = { accountId: process.env.ACCOUNT_ID };

  try {
    const headers = signRequest('GET', path, params);
    const response = await axios.get(`${BASE_URL}${path}`, {
      headers
    });

    res.status(200).json({
      accountId: process.env.ACCOUNT_ID,
      balances: response.data
    });
  } catch (err) {
    console.error('Balance error:', err.message);
    res.status(500).send(`Failed to fetch balance: ${err.message}`);
  }
});

// ✅ POSITIONS endpoint (no query param)
app.get('/positions', async (req, res) => {
  const path = `/positions`;
  const params = { accountId: process.env.ACCOUNT_ID };

  try {
    const headers = signRequest('GET', path, params);
    const response = await axios.get(`${BASE_URL}${path}`, {
      headers
    });

    res.status(200).json({
      openPositions: response.data
    });
  } catch (err) {
    console.error('Positions error:', err.message);
    res.status(500).send(`Failed to fetch positions: ${err.message}`);
  }
});

// ✅ CREATE ORDER
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
  console.log('Sending order request:', { params });

  try {
    const response = await axios.post(`${BASE_URL}${path}`, params, { headers });
    return response.data;
  } catch (error) {
    console.error('Order error:', error.response?.data || error.message);
    throw new Error(error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
  }
}

// ✅ WEBHOOK endpoint
app.post('/webhook', async (req, res) => {
  try {
    const { market, order, size, price } = req.body;
    console.log('Received webhook:', req.body);

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
