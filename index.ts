import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { ApexClient } from './apex-sdk-node/src/pro/index.js';
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
  CHAIN_ID = '42161'
} = process.env;

console.log(`\n🔑 API_KEY: ${API_KEY ? '✔️' : '❌'}`);
console.log(`📡 SECRET: ${SECRET ? '✔️' : '❌'}`);
console.log(`📡 PASSPHRASE: ${PASSPHRASE ? '✔️' : '❌'}`);
console.log(`🔑 ETH_PRIVATE_KEY: ${ETH_PRIVATE_KEY ? '✔️' : '❌'}`);
console.log(`📡 ACCOUNT_ID: ${ACCOUNT_ID ? '✔️' : '❌'}`);
console.log(`🌍 OMNI_SEED: ${OMNI_SEED ? '✔️' : '❌'}`);
console.log(`🔑 L2KEY: ${L2KEY ? '✔️' : '❌'}`);
console.log(`🧬 CHAIN_ID: ${CHAIN_ID ? '✔️' : '❌'}\n`);

// Initialize ApexClient
const apexClient = new ApexClient({
  baseUrl: 'https://omni.apex.exchange/api/v3',
  apiKey: API_KEY,
  apiSecret: SECRET,
  passphrase: PASSPHRASE,
  networkId: parseInt(CHAIN_ID),
  ethPrivateKey: ETH_PRIVATE_KEY,
  seeds: OMNI_SEED,
  l2Key: L2KEY,
  accountId: ACCOUNT_ID
});

// Startup checks
(async () => {
  try {
    const time = await apexClient.publicApi.getTime();
    console.log('✅ Time Check:', time);

    const positions = await apexClient.privateApi.getPositions();
    console.log('✅ Positions:', positions);

    const balance = await apexClient.privateApi.getAccountBalance();
    console.log('✅ Balance:', balance);
  } catch (err) {
    console.error('❌ Startup Error:', err);
  }
})();

// In-memory state
let latestPositions = null;
let latestBalance = null;

// Auto-refresh every 30s
setInterval(async () => {
  try {
    latestPositions = await apexClient.privateApi.getPositions();
    latestBalance = await apexClient.privateApi.getAccountBalance();
  } catch (err) {
    console.error('❌ Refresh Error:', err);
  }
}, 30000);

// REST API for frontend
app.get('/api/positions', (req, res) => {
  res.json({ positions: latestPositions });
});

app.get('/api/balance', (req, res) => {
  res.json({ balance: latestBalance });
});

// Webhook for trading
app.post('/webhook', async (req, res) => {
  const { side, symbol, size, price } = req.body;
  const clientId = uuidv4();

  const orderParams = {
    symbol: symbol.replace('USD', '-USD'),
    orderType: price ? 'LIMIT' : 'MARKET',
    side: side.toUpperCase(),
    price: price ? parseFloat(price) : undefined,
    size: parseFloat(size),
    timeInForce: 'GTC',
    clientOrderId: clientId,
    maxFeeRate: '0.0005',
    reduceOnly: false
  };

  try {
    const orderRes = await apexClient.privateApi.createOrder(orderParams);
    console.log('Order Response:', orderRes);
    res.json(orderRes);
  } catch (err) {
    console.error('❌ Order Error:', err);
    res.json({ error: 'Order failed' });
  }
});

app.listen(PORT, () => {
  console.log(`🧊 ICE KING running on port ${PORT}`);
});
