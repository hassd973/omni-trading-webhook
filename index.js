require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();

app.use(express.json());

const BASE_URL = 'https://omni.apex.exchange/api/v3';

// LOGGING KEYS
console.log('🔑 API_KEY:', process.env.API_KEY ? '✔️' : '❌');
console.log('🔐 SECRET:', process.env.SECRET ? '✔️' : '❌');
console.log('🔒 PASSPHRASE:', process.env.PASSPHRASE ? '✔️' : '❌');
console.log('🔑 ETH_PRIVATE_KEY:', process.env.ETH_PRIVATE_KEY ? '✔️' : '❌');
console.log('🔗 ACCOUNT_ID:', process.env.ACCOUNT_ID ? '✔️' : '❌');
console.log('🌍 OMNI_SEED:', process.env.OMNI_SEED ? '✔️' : '❌');
console.log('📡 L2KEY:', process.env.L2KEY ? '✔️' : '❌');

// SIGN REQUEST V3 FORMAT
function signRequest(method, path) {
  const timestamp = Date.now().toString();
  const message = `${method}${path}${timestamp}`;
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

// FETCH ACCOUNT DATA (V3)
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

// FETCH POSITIONS (same logic as account)
async function fetchPositions() {
  const path = '/positions';
  const headers = signRequest('GET', path);

  try {
    const response = await axios.get(`${BASE_URL}${path}`, { headers });
    console.log('✅ Open positions:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Positions error:', error.response?.data || error.message);
  }
}

// ORDER CREATION
async function createOrder(symbol, side, type, size, price) {
  const path = '/order';
  const timestamp = Date.now();

  const params = {
    symbol: symbol.replace('USD', '-USD'),
    side: side.toUpperCase(),
    type: type.toUpperCase(),
    size: parseFloat(size),
    ...(price && { price: parseFloat(price) }),
    timeInForce: 'GTC',
    accountId: process.env.ACCOUNT_ID,
    l2Key: process.env.L2KEY,
    clientOrderId: `webhook-${timestamp}`,
    timestamp
  };

  const message = `POST${path}${timestamp}${JSON.stringify(params)}`;
  const signature = crypto
    .createHmac('sha256', process.env.SECRET)
    .update(message)
    .digest('hex');

  const headers = {
    'Content-Type': 'application/json',
    'APEX-API-KEY': process.env.API_KEY,
    'APEX-PASSPHRASE': process.env.PASSPHRASE,
    'APEX-SIGNATURE': signature,
    'APEX-TIMESTAMP': timestamp.toString()
  };

  try {
    const response = await axios.post(`${BASE_URL}${path}`, params, { headers });
    console.log('✅ Order placed:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Order error:', error.response?.data || error.message);
    throw error;
  }
}

// WEBHOOK ENDPOINT
app.post('/webhook', async (req, res) => {
  try {
    const { symbol, action, quantity, price } = req.body;
    console.log('📩 Webhook received:', req.body);

    const result = await createOrder(
      symbol,
      action,
      price ? 'LIMIT' : 'MARKET',
      quantity,
      price
    );

    res.status(200).send('Order placed successfully');
  } catch (error) {
    res.status(500).send(`Webhook failed: ${error.message}`);
  }
});

// INIT
fetchAccount();
fetchPositions();

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🧊 ICE KING running on port ${PORT}`));
