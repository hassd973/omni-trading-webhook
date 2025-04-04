require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();
app.use(express.json());

const BASE_URL = 'https://omni.apex.exchange/api/v3';

// ✅ Utility to sign requests
function signRequest(method, path, messageOverride = null) {
  const timestamp = Date.now().toString();
  const message = messageOverride ?? `${method}${path}${timestamp}`;
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

// ✅ Health check
app.get('/', (req, res) => {
  res.send('🔥 Omni Webhook is live');
});

// ✅ Fetch account info (patched signature logic)
async function fetchAccount() {
  const path = '/account';
  const headers = signRequest('GET', path); // no body in GET signing

  try {
    const response = await axios.get(`${BASE_URL}${path}`, {
      headers,
      params: { accountId: process.env.ACCOUNT_ID }
    });

    console.log('✅ Account info:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Account fetch error:', error.response?.data || error.message);
  }
}

// ✅ Create order logic
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

  const headers = signRequest('POST', path, JSON.stringify(params));
  try {
    const response = await axios.post(`${BASE_URL}${path}`, params, { headers });
    return response.data;
  } catch (error) {
    console.error('❌ Order error:', error.response?.data || error.message);
    throw new Error(error.response ? JSON.stringify(error.response.data) : error.message);
  }
}

// ✅ Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    const { symbol, action, quantity, price } = req.body;
    const orderType = price ? 'LIMIT' : 'MARKET';
    const result = await createOrder(symbol, action, orderType, quantity, price);
    console.log('✅ Order placed:', result);
    res.status(200).send('✅ Order placed');
  } catch (error) {
    res.status(500).send(`❌ Webhook error: ${error.message}`);
  }
});

// ✅ Start server + fetch account on launch
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log('🔑 API_KEY:', process.env.API_KEY ? '✔️' : '❌');
  console.log('🔐 SECRET:', process.env.SECRET ? '✔️' : '❌');
  console.log('🔒 PASSPHRASE:', process.env.PASSPHRASE ? '✔️' : '❌');
  console.log('🔑 ETH_PRIVATE_KEY:', process.env.ETH_PRIVATE_KEY ? '✔️' : '❌');
  console.log('🔗 ACCOUNT_ID:', process.env.ACCOUNT_ID ? '✔️' : '❌');
  console.log('🌍 OMNI_SEED:', process.env.OMNI_SEED ? '✔️' : '❌');
  console.log('📡 L2KEY:', process.env.L2KEY ? '✔️' : '❌');
  console.log(`🧊 ICE KING running on port ${PORT}`);

  fetchAccount(); // fetch once on startup
});
