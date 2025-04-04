require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const { ethers } = require('ethers');

const app = express();
app.use(express.json());

const BASE_URL = 'https://omni.apex.exchange/api/v3';
const PORT = process.env.PORT || 10000;

// Env check
console.log('🔑 API_KEY:', process.env.API_KEY ? '✔️' : '❌');
console.log('🔐 SECRET:', process.env.SECRET ? '✔️' : '❌');
console.log('🔒 PASSPHRASE:', process.env.PASSPHRASE ? '✔️' : '❌');
console.log('🔑 ETH_PRIVATE_KEY:', process.env.ETH_PRIVATE_KEY ? '✔️' : '❌');
console.log('🔗 ACCOUNT_ID:', process.env.ACCOUNT_ID ? '✔️' : '❌');
console.log('🌍 OMNI_SEED:', process.env.OMNI_SEED ? '✔️' : '❌');
console.log('📡 L2KEY:', process.env.L2KEY ? '✔️' : '❌');

// Signature for private endpoints
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

// === GET ACCOUNT INFO ===
app.get('/account', async (req, res) => {
  const path = '/account';
  const params = { accountId: process.env.ACCOUNT_ID };
  const headers = signRequest('GET', path, params);
  try {
    const { data } = await axios.get(`${BASE_URL}${path}`, { headers, params });
    res.status(200).json(data);
  } catch (err) {
    console.error('❌ /account error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// === TRADE via WEBHOOK ===
app.post('/webhook', async (req, res) => {
  const { symbol, action, quantity, price } = req.body;
  const path = '/order';
  const params = {
    symbol: symbol.replace('USD', '-USD'),
    side: action.toUpperCase(),
    type: price ? 'LIMIT' : 'MARKET',
    size: parseFloat(quantity),
    ...(price && { price: parseFloat(price) }),
    timeInForce: 'GTC',
    accountId: process.env.ACCOUNT_ID,
    l2Key: process.env.L2KEY,
    clientOrderId: `webhook-${Date.now()}`,
    timestamp: Date.now()
  };
  const headers = signRequest('POST', path, params);

  try {
    const { data } = await axios.post(`${BASE_URL}${path}`, params, { headers });
    console.log('✅ Order placed:', data);
    res.status(200).send('✅ Order executed');
  } catch (err) {
    console.error('❌ Webhook trade error:', err.response?.data || err.message);
    res.status(500).send('❌ Failed to execute trade');
  }
});

// === Omni Live Check ===
app.get('/', async (_, res) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/time`);
    res.send(`⏱ Omni time: ${data.time}`);
  } catch {
    res.send('⚠️ Omni API unreachable');
  }
});

// Start server
app.listen(PORT, () => console.log(`🧊 ICE KING running on port ${PORT}`));
