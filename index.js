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

const {
  API_KEY,
  SECRET,
  PASSPHRASE,
  ETH_PRIVATE_KEY,
  ACCOUNT_ID,
  OMNI_SEED,
  L2KEY,
  CHAIN_ID = '42161'
} = process.env;

console.log(`🔑 API_KEY: ${API_KEY ? '✔️' : '❌'}`);
console.log(`📡 SECRET: ${SECRET ? '✔️' : '❌'}`);
console.log(`📡 PASSPHRASE: ${PASSPHRASE ? '✔️' : '❌'}`);
console.log(`🔑 ETH_PRIVATE_KEY: ${ETH_PRIVATE_KEY ? '✔️' : '❌'}`);
console.log(`📡 ACCOUNT_ID: ${ACCOUNT_ID ? '✔️' : '❌'}`);
console.log(`🌍 OMNI_SEED: ${OMNI_SEED ? '✔️' : '❌'}`);
console.log(`🔑 L2KEY: ${L2KEY ? '✔️' : '❌'}`);
console.log(`🧬 CHAIN_ID: ${CHAIN_ID ? '✔️' : '❌'}`);

const BASE_URL = 'https://omni.apex.exchange/api/v3';

function generateSignature(method, endpoint, timestamp, body = '') {
  const payload = `${method}${endpoint}${timestamp}${body}`;
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
}

async function privateRequest(method, path, data = {}) {
  const timestamp = Date.now().toString();
  const endpoint = path.startsWith('/') ? path : `/${path}`;
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
      url: `${BASE_URL}${endpoint}`,
      data: method === 'POST' ? data : undefined,
      headers
    });
    return res.data;
  } catch (err) {
    console.error(`❌ ${path} Fetch Error:`, err.response?.data || err.message);
    return null;
  }
}

// 🧬 Onboarding to Apex V3
async function onboardUser() {
  const payload = {
    ethPrivateKey: ETH_PRIVATE_KEY,
    chainId: CHAIN_ID,
    seeds: OMNI_SEED,
    l2Key: L2KEY,
    accountId: ACCOUNT_ID
  };
  const res = await privateRequest('POST', '/register_user_v3', payload);
  console.log('✅ Onboard Response:', res);
}

// ✅ Load account info
async function fetchAccount() {
  const res = await privateRequest('GET', '/account');
  console.log('✅ Account:', res);
  return res;
}

// ✅ Load open positions
async function fetchPositions() {
  const res = await privateRequest('GET', '/account/positions');
  console.log('✅ Positions:', res);
  return res;
}

// ✅ Load balance
async function fetchBalance() {
  const res = await privateRequest('GET', '/account/balance');
  console.log('✅ Balance:', res);
  return res;
}

// 🔁 In-memory cache
let latestBalance = null;
let latestPositions = null;

// 🔁 Refresh loop
async function refreshLoop() {
  latestBalance = await fetchBalance();
  latestPositions = await fetchPositions();
}
setInterval(refreshLoop, 30000); // 30s

// 🚀 Initial startup
(async () => {
  await onboardUser();
  await refreshLoop();
})();

// 🌐 REST API
app.get('/api/balance', (req, res) => res.json({ balance: latestBalance }));
app.get('/api/positions', (req, res) => res.json({ positions: latestPositions }));

// ⚡ Trade Webhook
app.post('/webhook', async (req, res) => {
  const { symbol, side, size, price } = req.body;
  const payload = {
    symbol: symbol.replace('USD', '-USD'),
    side: side.toUpperCase(),
    orderType: price ? 'LIMIT' : 'MARKET',
    price: price ? parseFloat(price) : undefined,
    size: parseFloat(size),
    timeInForce: 'GTC',
    clientOrderId: uuidv4(),
    accountId: ACCOUNT_ID,
    l2Key: L2KEY,
    chainId: CHAIN_ID,
    seeds: OMNI_SEED,
    reduceOnly: false,
    maxFeeRate: 0.0005,
    timestamp: Date.now()
  };

  const orderRes = await privateRequest('POST', '/order', payload);
  console.log('📦 Trade Order Result:', orderRes);
  res.json(orderRes || { error: 'Trade failed' });
});

app.listen(PORT, () => {
  console.log(`🧊 ICE KING running on port ${PORT}`);
});
