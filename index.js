import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

// ✅ ENV Vars
const {
  API_KEY,
  SECRET,
  PASSPHRASE,
  ETH_PRIVATE_KEY,
  ACCOUNT_ID,
  OMNI_SEED,
  L2KEY,
  CHAIN_ID = '42161', // Arbitrum default
} = process.env;

// ✅ Logging for Debug
console.log(`🔑 API_KEY: ${API_KEY ? '✔️' : '❌'}`);
console.log(`📡 SECRET: ${SECRET ? '✔️' : '❌'}`);
console.log(`📡 PASSPHRASE: ${PASSPHRASE ? '✔️' : '❌'}`);
console.log(`🔑 ETH_PRIVATE_KEY: ${ETH_PRIVATE_KEY ? '✔️' : '❌'}`);
console.log(`📡 ACCOUNT_ID: ${ACCOUNT_ID ? '✔️' : '❌'}`);
console.log(`🌍 OMNI_SEED: ${OMNI_SEED ? '✔️' : '❌'}`);
console.log(`🔑 L2KEY: ${L2KEY ? '✔️' : '❌'}`);
console.log(`🧬 CHAIN_ID: ${CHAIN_ID ? '✔️' : '❌'}`);
console.log(`🧊 ICE KING running on port ${PORT}\n`);

// ✅ Base URL for ApeX V3
const APEX_BASE = 'https://omni.apex.exchange/api/v3';

// ✅ Create V3 Signature
function signRequest(method, path, timestamp, body = '') {
  const payload = `${method}${path}${timestamp}${body}`;
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
}

// ✅ Authenticated V3 Request
async function privateRequest(method, path, data = {}) {
  const ts = Date.now().toString();
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  const bodyStr = method === 'GET' ? '' : JSON.stringify(data);
  const signature = signRequest(method, endpoint, ts, bodyStr);

  const headers = {
    'APEX-API-KEY': API_KEY,
    'APEX-API-SIGNATURE': signature,
    'APEX-API-TIMESTAMP': ts,
    'APEX-API-PASSPHRASE': PASSPHRASE,
    'Content-Type': 'application/json',
  };

  try {
    const res = await axios({
      method,
      url: `${APEX_BASE}${endpoint}`,
      headers,
      data: method === 'GET' ? undefined : data,
    });
    return res.data;
  } catch (err) {
    const msg = err.response?.data || err.message;
    console.error(`❌ ${path} Fetch Error:`, msg);
    return null;
  }
}

// ✅ Load Configs
async function loadConfigs() {
  const res = await privateRequest('GET', '/configs_v3');
  console.log('✅ Exchange Config:', res);
  return res;
}

// ✅ Get Account Info
async function getAccount() {
  const res = await privateRequest('GET', '/account_v3');
  console.log('✅ Account Info:', res);
  return res;
}

// ✅ Get Positions + Balances
async function getPositions() {
  const res = await privateRequest('GET', '/positions_v3');
  console.log('✅ Positions:', res);
  return res;
}
async function getBalance() {
  const res = await privateRequest('GET', '/balance_v3');
  console.log('✅ Balance:', res);
  return res;
}

// ✅ Memory cache
let latestPositions = null;
let latestBalance = null;

// 🔁 Auto-refresh every 30s
setInterval(async () => {
  latestPositions = await getPositions();
  latestBalance = await getBalance();
}, 30000);

// ✅ REST API for UI or dashboard
app.get('/api/balance', (req, res) => res.json(latestBalance || {}));
app.get('/api/positions', (req, res) => res.json(latestPositions || {}));

// ✅ Webhook trading logic
app.post('/webhook', async (req, res) => {
  const { side, symbol, size, price } = req.body;
  const clientOrderId = uuidv4();

  const orderPayload = {
    symbol: symbol.replace('USD', '-USD'),
    orderType: price ? 'LIMIT' : 'MARKET',
    side: side.toUpperCase(),
    size: parseFloat(size),
    price: price ? parseFloat(price) : undefined,
    clientOrderId,
    timeInForce: 'GTC',
    maxFeeRate: 0.0005,
    reduceOnly: false,
    accountId: ACCOUNT_ID,
    l2Key: L2KEY,
    seeds: OMNI_SEED,
    chainId: CHAIN_ID,
    timestamp: Date.now(),
  };

  const result = await privateRequest('POST', '/order_v3', orderPayload);
  console.log('📤 Order Sent:', result);
  res.json(result || { error: 'Order failed' });
});

// ✅ Boot up logic
(async () => {
  await loadConfigs();
  await getAccount();
  latestPositions = await getPositions();
  latestBalance = await getBalance();
})();

app.listen(PORT, () => {
  console.log(`🧊 ICE KING backend ready at http://localhost:${PORT}`);
});
