import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { ApexClient } from './apex-sdk-node/src/pro/index.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

// Load env vars with explicit typing
const {
  API_KEY,
  SECRET,
  PASSPHRASE,
  ETH_PRIVATE_KEY,
  ACCOUNT_ID,
  OMNI_SEED,
  L2KEY,
  CHAIN_ID = '42161'
} = process.env as {
  API_KEY?: string;
  SECRET?: string;
  PASSPHRASE?: string;
  ETH_PRIVATE_KEY?: string;
  ACCOUNT_ID?: string;
  OMNI_SEED?: string;
  L2KEY?: string;
  CHAIN_ID?: string;
};

console.log(`\n🔑 API_KEY: ${API_KEY ? '✔️' : '❌'}`);
console.log(`📡 SECRET: ${SECRET ? '✔️' : '❌'}`);
console.log(`📡 PASSPHRASE: ${PASSPHRASE ? '✔️' : '❌'}`);
console.log(`🔑 ETH_PRIVATE_KEY: ${ETH_PRIVATE_KEY ? '✔️' : '❌'}`);
console.log(`📡 ACCOUNT_ID: ${ACCOUNT_ID ? '✔️' : '❌'}`);
console.log(`🌍 OMNI_SEED: ${OMNI_SEED ? '✔️' : '❌'}`);
console.log(`🔑 L2KEY: ${L2KEY ? '✔️' : '❌'}`);
console.log(`🧬 CHAIN_ID: ${CHAIN_ID ? '✔️' : '❌'}\n`);

// Initialize ApexClient with required fields
const apexClient = new ApexClient({
  networkId: parseInt(CHAIN_ID),
  apiKey: API_KEY!,
  apiSecret: SECRET!,
  passphrase: PASSPHRASE!,
  ethPrivateKey: ETH_PRIVATE_KEY!,
  seeds: OMNI_SEED!,
  l2Key: L2KEY!,
  accountId: ACCOUNT_ID!
});

// Type definitions for state
interface Position {
  [key: string]: any;
}
interface Balance {
  [key: string]: any;
}

// Startup checks
(async () => {
  try {
    const time = await apexClient.publicApi.getServerTime();
    console.log('✅ Time Check:', time);

    const positions = await apexClient.privateApi.getUserPositions();
    console.log('✅ Positions:', positions);

    const balance = await apexClient.privateApi.accountBalance();
    console.log('✅ Balance:', balance);
  } catch (err) {
    console.error('❌ Startup Error:', err);
  }
})();

// In-memory state with explicit types
let latestPositions: Position[] | null = null;
let latestBalance: Balance | null = null;

// Auto-refresh every 30s
setInterval(async () => {
  try {
    latestPositions = await apexClient.privateApi.getUserPositions();
    latestBalance = await apexClient.privateApi.accountBalance();
  } catch (err) {
    console.error('❌ Refresh Error:', err);
  }
}, 30000);

// REST API for frontend with typed request/response
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

  const orderParams = {
    symbol: symbol?.replace('USD', '-USD') || '',
    side: side?.toUpperCase() || '',
    type: price ? 'LIMIT' : 'MARKET',
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
      orderParams.maxFeeRate,
      undefined, // triggerPrice
      orderParams.reduceOnly,
      undefined, // trailingPercent
      undefined, // reduceOnlyPrice
      undefined  // tag
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
