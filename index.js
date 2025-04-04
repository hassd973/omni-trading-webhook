require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors());

const BASE_URL = 'https://omni.apex.exchange';

// ✅ Log key setup
console.log('🔑 API_KEY:', process.env.API_KEY ? '✔️' : '❌ Missing');
console.log('🔐 SECRET:', process.env.SECRET ? '✔️' : '❌ Missing');
console.log('🔒 PASSPHRASE:', process.env.PASSPHRASE ? '✔️' : '❌ Missing');

// ✅ Test connectivity
async function testApi() {
  try {
    const res = await axios.get(`${BASE_URL}/api/v3/time`);
    console.log('✅ Omni API live:', res.data);
  } catch (err) {
    console.error('❌ API test failed:', err.message);
  }
}
testApi();

// ✅ Sign requests
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

// ✅ GET /balance
app.get('/balance', async (req, res) => {
  const path = `/api/v3/private/account/balances`;
  try {
    const headers = signRequest('GET', path);
    const response = await axios.get(`${BASE_URL}${path}`, { headers });
    res.status(200).json(response.data);
  } catch (err) {
    console.error('Balance error:', err.response?.data || err.message);
    res.status(500).send(`Balance error: ${err.message}`);
  }
});

// ✅ GET /positions
app.get('/positions', async (req, res) => {
  const path = `/api/v3/private/position/open`;
  try {
    const headers = signRequest('GET', path);
    const response = await axios.get(`${BASE_URL}${path}`, { headers });
    res.status(200).json(response.data);
  } catch (err) {
    console.error('Positions error:', err.response?.data || err.message);
    res.status(500).send(`Positions error: ${err.message}`);
  }
});

// ✅ Create order
async function createOrder(symbol, side, type, size, price) {
  const path = '/api/v3/order';
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
  console.log('📦 Placing order:', body);

  try {
    const response = await axios.post(`${BASE_URL}${path}`, body, { headers });
    return response.data;
  } catch (err) {
    console.error('❌ Order error:', err.response?.data || err.message);
    throw new Error(err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
  }
}

// ✅ POST /webhook
app.post('/webhook', async (req, res) => {
  try {
    const { market, order, size, price } = req.body;
    console.log('📩 Webhook received:', req.body);

    const orderType = price ? 'LIMIT' : 'MARKET';
    const result = await createOrder(market, order, orderType, size, price);

    console.log('✅ Order placed:', result);
    res.status(200).send('Order placed successfully');
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    res.status(500).send(`Order failed: ${err.message}`);
  }
});

// ✅ Root route
app.get('/', (req, res) => {
  res.send('🧊 ICE KING Webhook is live');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🧊 ICE KING running on port ${PORT}`);
});
