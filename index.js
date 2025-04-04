require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();

app.use(express.json());

const BASE_URL = 'https://omni.apex.exchange/api';

console.log('🔑 API_KEY:', process.env.API_KEY ? '✔️' : '❌');
console.log('🔐 SECRET:', process.env.SECRET ? '✔️' : '❌');
console.log('🔒 PASSPHRASE:', process.env.PASSPHRASE ? '✔️' : '❌');
console.log('🔑 ETH_PRIVATE_KEY:', process.env.ETH_PRIVATE_KEY ? '✔️' : '❌');

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
    'APEX-TIMESTAMP': timestamp,
  };
}

app.get('/', (req, res) => {
  res.send('🚀 ICE KING Webhook is live');
});

// ✅ Get full account + balance info
app.get('/balance', async (req, res) => {
  const path = '/v3/account';
  const headers = signRequest('GET', path);

  try {
    const response = await axios.get(`${BASE_URL}${path}`, { headers });
    console.log('✅ Balance/account response:', response.data);
    res.json(response.data);
  } catch (err) {
    console.error('❌ Balance error:', err.response?.data || err.message);
    res.status(500).send('Balance fetch failed');
  }
});

// ✅ Get only active positions from account info
app.get('/positions', async (req, res) => {
  const path = '/v3/account';
  const headers = signRequest('GET', path);

  try {
    const response = await axios.get(`${BASE_URL}${path}`, { headers });
    const positions = response.data?.account?.positions || [];
    console.log('✅ Positions:', positions);
    res.json({ positions });
  } catch (err) {
    console.error('❌ Positions error:', err.response?.data || err.message);
    res.status(500).send('Positions fetch failed');
  }
});

// ✅ Test manual connection to Omni
app.get('/ping', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/v3/time`);
    res.send(`⏱ Omni Time: ${JSON.stringify(response.data)}`);
  } catch (err) {
    res.status(500).send('❌ Ping failed');
  }
});

// ✅ Port setup
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🧊 ICE KING running on port ${PORT}`);
});
