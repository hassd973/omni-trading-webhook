require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();

app.use(express.json());

// Log env variable presence
console.log('🔑 API_KEY:', process.env.API_KEY ? '✅' : '❌');
console.log('🔐 SECRET:', process.env.SECRET ? '✅' : '❌');
console.log('🔒 PASSPHRASE:', process.env.PASSPHRASE ? '✅' : '❌');
console.log('🔑 ETH_PRIVATE_KEY:', process.env.ETH_PRIVATE_KEY ? '✅' : '❌');

const BASE_URL = 'https://omni.apex.exchange/api/v3';

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

app.get('/', (req, res) => {
  res.send('🧊 ICE KING API is live — ready to rule the charts.');
});

app.get('/balance', async (req, res) => {
  const path = '/user';
  try {
    const headers = signRequest('GET', path);
    const response = await axios.get(`${BASE_URL}${path}`, { headers });
    const wallets = response.data?.account?.contractWallets || [];
    res.status(200).json({ wallets });
  } catch (error) {
    console.error('Balance error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.get('/positions', async (req, res) => {
  const path = '/user';
  try {
    const headers = signRequest('GET', path);
    const response = await axios.get(`${BASE_URL}${path}`, { headers });
    const positions = response.data?.account?.positions || [];
    res.status(200).json({ positions });
  } catch (error) {
    console.error('Positions error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`❄️ ICE KING running on port ${PORT}`);
});
