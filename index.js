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

const APEX_BASE_URL = 'https://omni.apex.exchange/api'; // Adjusted base URL

// Signature generator (v3 auth)
function generateSignature(method, endpoint, expires, body = '') {
  const payload = method + endpoint + expires + body;
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
}

// Authenticated request
async function privateRequest(method, path, data = {}) {
  const timestamp = Date.now().toString();
  const endpoint = `/v3${path}`; // Ensure v3 prefix
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
      data: method === 'POST' ? data : undefined,
      headers
    });
    return res.data;
  } catch (err) {
    console.error(`❌ ${path} Fetch Error:`, err.response?.data || err.message);
    return null;
  }
}

// 🚀 Startup checks
(async () => {
  const time = await privateRequest('GET', '/time');
  console.log('✅ Time Check:', time);

  const positions = await privateRequest('GET', '/account/positions');
  console.log('✅ Positions:', positions);

  const balance = await privateRequest('GET', '/account/balance');
  console.log('✅ Balance:', balance);
})();

// 🧠 In-memory state
let latestPositions = null;
let latestBalance = null;

// 🔁 Auto-refresh every 30s
setInterval(async () => {
  latestPositions = await privateRequest('GET', '/account/positions');
  latestBalance = await privateRequest('GET', '/account/balance');
}, 30000);

// 📡 REST API for frontend
app.get('/api/positions', (req, res) => {
  res.json({ positions: latestPositions });
});

app.get('/api/balance', (req, res) => {
  res.json({ balance: latestBalance });
});

// ✅ Webhook for trading
app.post('/webhook', async (req, res) => {
  const { side, symbol, size, price } = req.body;
  const clientId = uuidv4();

  const payload = {
    symbol: symbol.replace('USD', '-USD'), // e.g., BTCUSD -> BTC-USD
    orderType: price ? 'LIMIT' : 'MARKET',
    side: side.toUpperCase(),
    price: price ? parseFloat(price) : undefined,
    size: parseFloat(size),
    timeInForce: 'GTC',
    clientOrderId: clientId,
    accountId: ACCOUNT_ID,
    l2Key: L2KEY,
    maxFeeRate: 0.0005, // Java-inspired default
    reduceOnly: false
  };

  const orderRes = await privateRequest('POST', '/order', payload);
  console.log('Order Response:', orderRes);
  res.json(orderRes || { error: 'Order failed' });
});

app.listen(PORT, () => {
  console.log(`🧊 ICE KING running on port ${PORT}`);
});
