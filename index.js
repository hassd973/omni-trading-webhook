// index.js - ApeX Omni Webhook Backend (Node.js)
import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import axios from 'axios';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

// Load env vars
const {
  API_KEY,
  SECRET,
  PASSPHRASE,
  ETH_PRIVATE_KEY,
  ACCOUNT_ID,
  OMNI_SEED,
  L2KEY,
  CHAIN_ID
} = process.env;

console.log(`\n🔑 API_KEY: ${API_KEY ? '✔️' : '❌'}`);
console.log(`📡 SECRET: ${SECRET ? '✔️' : '❌'}`);
console.log(`📡 PASSPHRASE: ${PASSPHRASE ? '✔️' : '❌'}`);
console.log(`🔑 ETH_PRIVATE_KEY: ${ETH_PRIVATE_KEY ? '✔️' : '❌'}`);
console.log(`📡 ACCOUNT_ID: ${ACCOUNT_ID ? '✔️' : '❌'}`);
console.log(`🌍 OMNI_SEED: ${OMNI_SEED ? '✔️' : '❌'}`);
console.log(`🔑 L2KEY: ${L2KEY ? '✔️' : '❌'}`);
console.log(`🧬 CHAIN_ID: ${CHAIN_ID ? '✔️' : '❌'}\n`);

const APEX_BASE_URL = 'https://api.omni.apex.exchange';

// Signature generator (for v3 auth)
function generateSignature(method, endpoint, expires, body = '') {
  const payload = method + endpoint + expires + body;
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
}

// Authenticated request
async function privateRequest(method, path, data = {}) {
  const timestamp = Date.now().toString();
  const endpoint = `/v3${path}`;
  const bodyStr = method === 'GET' ? '' : JSON.stringify(data);
  const signature = generateSignature(method, endpoint, timestamp, bodyStr);

  const headers = {
    'APEX-API-KEY': API_KEY,
    'APEX-API-PASSPHRASE': PASSPHRASE,
    'APEX-API-SIGNATURE': signature,
    'APEX-API-TIMESTAMP': timestamp,
    'Content-Type': 'application/json'
  };

  try {
    const res = await axios({
      method,
      url: `${APEX_BASE_URL}${endpoint}`,
      data,
      headers
    });
    return res.data;
  } catch (err) {
    console.error(`❌ ${path} Fetch Error:`, err.response?.data || err.message);
    return null;
  }
}

// 🚀 Startup check - Fetch Account Info
(async () => {
  const account = await privateRequest('GET', '/account');
  console.log('✅ Account Info:', account);

  const positions = await privateRequest('GET', '/positions');
  console.log('✅ Positions:', positions);
})();

// 🧠 In-memory state
let latestAccount = null;
let latestPositions = null;

// 🔁 Auto-refresh every 30s
setInterval(async () => {
  latestAccount = await privateRequest('GET', '/account');
  latestPositions = await privateRequest('GET', '/positions');
}, 30000);

// 📡 REST API for frontend
app.get('/api/account', (req, res) => {
  res.json({ account: latestAccount });
});

app.get('/api/positions', (req, res) => {
  res.json({ positions: latestPositions });
});

// ✅ Sample webhook for trading
app.post('/webhook', async (req, res) => {
  const { side, symbol, size, price } = req.body;
  const clientId = uuidv4();

  const payload = {
    symbol,
    orderType: 'LIMIT',
    side,
    price,
    size,
    timeInForce: 'GTC',
    clientOrderId: clientId
  };

  const orderRes = await privateRequest('POST', '/orders', payload);
  res.json(orderRes);
});

app.listen(PORT, () => {
  console.log(`🧊 ICE KING running on port ${PORT}`);
});
