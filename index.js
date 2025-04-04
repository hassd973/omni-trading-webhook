// index.js

import express from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 10000;

// Env Variables
const { API_KEY, SECRET, PASSPHRASE, ETH_PRIVATE_KEY, ACCOUNT_ID, OMNI_SEED, L2KEY, CHAIN_ID } = process.env;

// Confirm env vars
console.log(`\n🔑 API_KEY: ${API_KEY ? '✔️' : '❌'}`);
console.log(`📡 SECRET: ${SECRET ? '✔️' : '❌'}`);
console.log(`📡 PASSPHRASE: ${PASSPHRASE ? '✔️' : '❌'}`);
console.log(`🔑 ETH_PRIVATE_KEY: ${ETH_PRIVATE_KEY ? '✔️' : '❌'}`);
console.log(`📡 ACCOUNT_ID: ${ACCOUNT_ID ? '✔️' : '❌'}`);
console.log(`🌍 OMNI_SEED: ${OMNI_SEED ? '✔️' : '❌'}`);
console.log(`🔑 L2KEY: ${L2KEY ? '✔️' : '❌'}`);
console.log(`🧬 CHAIN_ID: ${CHAIN_ID ? '✔️' : '❌'}`);

const OMNI_ENDPOINT = 'https://api.apex.exchange';

// Store data in memory
let cachedData = {
  account: null,
  positions: null
};

const headers = () => {
  const timestamp = Date.now().toString();
  const signString = timestamp + 'GET' + '/v3/account';
  const signature = crypto.createHmac('sha256', SECRET).update(signString).digest('hex');

  return {
    'APEX-API-KEY': API_KEY,
    'APEX-PASSPHRASE': PASSPHRASE,
    'APEX-TIMESTAMP': timestamp,
    'APEX-SIGNATURE': signature,
    'Content-Type': 'application/json'
  };
};

const fetchAccountData = async () => {
  try {
    const res = await axios.get(`${OMNI_ENDPOINT}/v3/account`, { headers: headers() });
    cachedData.account = res.data;
    fs.writeFileSync('account.json', JSON.stringify(res.data, null, 2));
    console.log('✅ Account Data:', res.data);
  } catch (err) {
    console.error('❌ Account Fetch Error:', err.response?.data || err.message);
  }
};

const fetchPositionsData = async () => {
  try {
    const res = await axios.get(`${OMNI_ENDPOINT}/v3/positions`, { headers: headers() });
    cachedData.positions = res.data;
    fs.writeFileSync('positions.json', JSON.stringify(res.data, null, 2));
    console.log('✅ Positions Data:', res.data);
  } catch (err) {
    console.error('❌ Positions Fetch Error:', err.response?.data || err.message);
  }
};

// 🔁 Refresh every 60 seconds
setInterval(() => {
  fetchAccountData();
  fetchPositionsData();
}, 60 * 1000);

// ⚙️ REST API to get cached data
app.get('/api/account', (req, res) => {
  res.json({ data: cachedData.account });
});

app.get('/api/positions', (req, res) => {
  res.json({ data: cachedData.positions });
});

// ✅ Trade Webhook listener
app.post('/webhook/trade', async (req, res) => {
  const { side, symbol, size } = req.body;
  if (!side || !symbol || !size) return res.status(400).json({ error: 'Missing fields' });

  // Placeholder: Add real trading logic here
  console.log(`🚀 Received Trade Command: ${side} ${size} ${symbol}`);

  return res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`\n🧊 ICE KING running on port ${PORT}`);
  fetchAccountData();
  fetchPositionsData();
});
