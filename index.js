import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();
const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 10000;

const {
  API_KEY,
  SECRET,
  PASSPHRASE,
  ETH_PRIVATE_KEY,
  ACCOUNT_ID,
  OMNI_SEED,
  L2KEY,
  CHAIN_ID = '42161' // default Arbitrum
} = process.env;

const BASE_URL = 'https://omni.apex.exchange/api/v3';

// Debug startup
console.log(`\n🔑 API_KEY: ${API_KEY ? '✔️' : '❌'}`);
console.log(`📡 SECRET: ${SECRET ? '✔️' : '❌'}`);
console.log(`📡 PASSPHRASE: ${PASSPHRASE ? '✔️' : '❌'}`);
console.log(`🔑 ETH_PRIVATE_KEY: ${ETH_PRIVATE_KEY ? '✔️' : '❌'}`);
console.log(`📡 ACCOUNT_ID: ${ACCOUNT_ID ? '✔️' : '❌'}`);
console.log(`🌍 OMNI_SEED: ${OMNI_SEED ? '✔️' : '❌'}`);
console.log(`🔑 L2KEY: ${L2KEY ? '✔️' : '❌'}`);
console.log(`🧬 CHAIN_ID: ${CHAIN_ID}\n`);

// Sign requests
function signRequest(method, endpoint, timestamp, body = '') {
  const msg = `${method}${endpoint}${timestamp}${body}`;
  return crypto.createHmac('sha256', SECRET).update(msg).digest('hex');
}

// Generic request
async function privateRequest(method, path, data = {}) {
  const ts = Date.now().toString();
  const body = method === 'GET' ? '' : JSON.stringify(data);
  const sig = signRequest(method, path, ts, body);

  const headers = {
    'APEX-API-KEY': API_KEY,
    'APEX-API-PASSPHRASE': PASSPHRASE,
    'APEX-API-SIGNATURE': sig,
    'APEX-API-TIMESTAMP': ts,
    'Content-Type': 'application/json'
  };

  try {
    const res = await axios({
      method,
      url: `${BASE_URL}${path}`,
      data: method === 'GET' ? undefined : data,
      headers
    });
    return res.data;
  } catch (err) {
    console.error(`❌ ${path} Fetch Error:`, err.response?.data || err.message);
    return null;
  }
}

// -- INIT --
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
  return res;
}

async function getBalance() {
  const res = await privateRequest('GET', '/account/balance');
  console.log('✅ Balance:', res);
  return res;
}

async function getPositions() {
  const res = await privateRequest('GET', '/account/positions');
  console.log('✅ Positions:', res);
  return res;
}

// Store latest data
let latestBalance = null;
let latestPositions = null;

// Auto-refresh every 30s
setInterval(async () => {
  latestBalance = await getBalance();
  latestPositions = await getPositions();
}, 30000);

// API routes
app.get('/api/balance', (req, res) => res.json({ balance: latestBalance }));
app.get('/api/positions', (req, res) => res.json({ positions: latestPositions }));

// Webhook for order creation
app.post('/webhook', async (req, res) => {
  const { side, symbol, size, price } = req.body;

  const payload = {
    symbol: symbol.replace('USD', '-USD'),
    orderType: price ? 'LIMIT' : 'MARKET',
    side: side.toUpperCase(),
    price: price ? parseFloat(price) : undefined,
    size: parseFloat(size),
    timeInForce: 'GTC',
    clientOrderId: uuidv4(),
    accountId: ACCOUNT_ID,
    l2Key: L2KEY,
    maxFeeRate: 0.0005,
    reduceOnly: false,
    chainId: CHAIN_ID,
    seeds: OMNI_SEED,
    timestamp: Date.now()
  };

  const orderRes = await privateRequest('POST', '/order', payload);
  console.log('✅ Order Sent:', orderRes);
  res.json(orderRes || { error: 'Trade failed' });
});

// Start
app.listen(PORT, () => {
  console.log(`🧊 ICE KING running on port ${PORT}`);
  onboardUser();
  getBalance();
  getPositions();
});
