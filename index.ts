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

// Initialize ApexClient with proper ENV type
const apexClient = new ApexClient({
  networkId: parseInt(CHAIN_ID || '42161'),
  key: API_KEY || '', // TS2353 fixed by adding 'key' to ENV in Constant.ts
  secret: SECRET || '',
  passphrase: PASSPHRASE || '',
  starkKeyPair: {
    publicKey: L2KEY || '',
    privateKey: OMNI_SEED || ''
  },
  accountId: ACCOUNT_ID || '',
  ethPrivateKey: ETH_PRIVATE_KEY || ''
});

// Startup checks
(async () => {
  try {
    const time = await apexClient.publicApi.getServerTime(); // TS2339 fixed by adding to PublicApi
    console.log('✅ Time Check:', time);

    const positions = await apexClient.privateApi.getPositions({ accountId: ACCOUNT_ID || '' }); // TS2339 fixed by adding to PrivateApi
    console.log('✅ Positions:', positions);

    const balance = await apexClient.privateApi.getAccount(ACCOUNT_ID || '', 'USDC');
    console.log('✅ Balance:', balance);
  } catch (err) {
    console.error('❌ Startup Error:', err);
  }
})();

// In-memory state
let latestPositions: any = null;
let latestBalance: any = null;

// Auto-refresh every 30s
setInterval(async () => {
  try {
    latestPositions = await apexClient.privateApi.getPositions({ accountId: ACCOUNT_ID || '' }); // TS2339 fixed by adding to PrivateApi
    latestBalance = await apexClient.privateApi.getAccount(ACCOUNT_ID || '', 'USDC');
  } catch (err) {
    console.error('❌ Refresh Error:', err);
  }
}, 30000);

// REST API for frontend
app.get('/api/positions', (req: express.Request, res: express.Response) => {
  res.json({ positions: latestPositions });
});

app.get('/api/balance', (req: express.Request, res: express.Response) => {
  res.json({ balance: latestBalance });
});

// Webhook for trading
app.post('/webhook', async (req: express.Request, res: express.Response) => {
  const { side, symbol, size, price } = req.body as {
    side?: string;
    symbol?: string;
    size?: string;
    price?: string;
  };
  const clientId = uuidv4();

  // TS2345 fix: Ensure side is 'BUY' or 'SELL'
  const validSide = side?.toUpperCase() === 'BUY' || side?.toUpperCase() === 'SELL'
    ? side.toUpperCase() as 'BUY' | 'SELL'
    : 'BUY'; // Default to 'BUY' if invalid

  const orderParams = {
    symbol: symbol?.replace('USD', '-USD') || '',
    side: validSide,
    type: price ? 'LIMIT' : 'MARKET' as 'LIMIT' | 'MARKET',
    size: size ? parseFloat(size) : 0,
    price: price ? parseFloat(price) : undefined,
    timeInForce: 'GTC' as const,
    clientOrderId: clientId,
    reduceOnly: false,
    maxFeeRate: '0.0005'
  };

  try {
    const orderRes = await apexClient.privateApi.createOrder(
      orderParams.symbol,
      orderParams.side,
      orderParams.type,
      orderParams.size,
      orderParams.timeInForce,
      orderParams.price,
      orderParams.clientOrderId,
      orderParams.maxFeeRate
    );
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
