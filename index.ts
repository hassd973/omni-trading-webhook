import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { ApexClient } from './apex-sdk-node/src/pro/ApexClient.js'; // 🔧 Point to actual file
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

interface Position {
  symbol: string;
  size: number;
  side: 'LONG' | 'SHORT';
}

interface Balance {
  freeCollateral: string;
  totalAccountValue: string;
}

interface OrderRequest {
  side?: string;
  symbol?: string;
  size?: string;
  price?: string;
  reduceOnly?: boolean;
}

interface OrderParams {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET';
  size: number;
  price?: number;
  timeInForce: 'GTC';
  clientOrderId: string;
  reduceOnly: boolean;
  maxFeeRate: string;
}

const {
  API_KEY,
  SECRET,
  PASSPHRASE,
  ETH_PRIVATE_KEY,
  ACCOUNT_ID,
  OMNI_SEED,
  L2KEY,
  CHAIN_ID = '42161',
  API_URL,
  NODE_ENV
} = process.env;

const requiredVars = ['API_KEY', 'SECRET', 'PASSPHRASE', 'ETH_PRIVATE_KEY', 'ACCOUNT_ID', 'L2KEY'];
const missingVars = requiredVars.filter(varname => !process.env[varname]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

console.log('\n=== Environment Variables Validation ===');
console.log(`🔑 API_KEY: ${API_KEY ? '✔️' : '❌'}`);
console.log(`🔒 SECRET: ${SECRET ? '✔️' : '❌'}`);
console.log(`🔑 PASSPHRASE: ${PASSPHRASE ? '✔️' : '❌'}`);
console.log(`🔑 ETH_PRIVATE_KEY: ${ETH_PRIVATE_KEY ? '✔️' : '❌'}`);
console.log(`🆔 ACCOUNT_ID: ${ACCOUNT_ID ? '✔️' : '❌'}`);
console.log(`🌱 OMNI_SEED: ${OMNI_SEED ? '✔️' : '❌'}`);
console.log(`🔑 L2KEY: ${L2KEY ? '✔️' : '❌'}`);
console.log(`🌐 CHAIN_ID: ${CHAIN_ID ? '✔️' : '❌'}`);
console.log(`🌍 API_URL: ${API_URL ? '✔️' : '❌ (using default)'}`);
console.log(`⚙️ NODE_ENV: ${NODE_ENV ? '✔️' : '❌ (defaulting to development)'}\n`);

const apexClient = new ApexClient({
  networkId: parseInt(CHAIN_ID),
  key: API_KEY!,
  secret: SECRET!,
  passphrase: PASSPHRASE!,
  starkKeyPair: {
    publicKey: L2KEY!,
    privateKey: OMNI_SEED || L2KEY!
  },
  accountId: ACCOUNT_ID!,
  ethPrivateKey: ETH_PRIVATE_KEY!,
  url: API_URL || 'https://api.pro.apex.exchange',
  isProd: NODE_ENV === 'production',
  registerChainId: parseInt(CHAIN_ID)
});

let latestPositions: Position[] | null = null;
let latestBalance: Balance | null = null;

async function startupChecks() {
  try {
    console.log('🚀 Performing startup checks...');
    const time = await apexClient.publicApi.getServerTime();
    console.log('✅ Server time check:', time);

    const positions = await apexClient.privateApi.getPositions({ accountId: ACCOUNT_ID! });
    console.log('✅ Initial positions loaded:', positions.length);

    const balance = await apexClient.privateApi.getAccount(ACCOUNT_ID!, 'USDC');
    console.log('✅ Initial balance loaded:', balance);

    return { positions, balance };
  } catch (err) {
    console.error('❌ Startup checks failed:', err);
    throw err;
  }
}

async function refreshState() {
  try {
    latestPositions = await apexClient.privateApi.getPositions({ accountId: ACCOUNT_ID! });
    latestBalance = await apexClient.privateApi.getAccount(ACCOUNT_ID!, 'USDC');
    console.log('🔄 State refreshed at:', new Date().toISOString());
  } catch (err) {
    console.error('❌ State refresh failed:', err);
  }
}

startupChecks()
  .then(({ positions, balance }) => {
    latestPositions = positions;
    latestBalance = balance;
    setInterval(refreshState, 30000);
  })
  .catch(err => {
    console.error('⚠️ Application may not function properly due to startup errors');
  });

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    lastUpdated: new Date().toISOString(),
    positionsCount: latestPositions?.length || 0,
    hasBalance: !!latestBalance
  });
});

app.get('/api/positions', (req, res) => {
  if (!latestPositions) {
    return res.status(503).json({ error: 'Positions not loaded yet' });
  }
  res.json({ positions: latestPositions });
});

app.get('/api/balance', (req, res) => {
  if (!latestBalance) {
    return res.status(503).json({ error: 'Balance not loaded yet' });
  }
  res.json({ balance: latestBalance });
});

app.post('/webhook', async (req, res) => {
  try {
    const { side, symbol, size, price, reduceOnly }: OrderRequest = req.body;
    
    if (!symbol || !size) {
      return res.status(400).json({ error: 'Missing required fields: symbol and size' });
    }

    const validSide = side?.toUpperCase() === 'BUY' ? 'BUY' : 'SELL' as const;
    const validSymbol = symbol.toUpperCase().includes('-USD') 
      ? symbol.toUpperCase() 
      : `${symbol.toUpperCase()}-USD`;

    const orderParams: OrderParams = {
      symbol: validSymbol,
      side: validSide,
      type: price ? 'LIMIT' : 'MARKET',
      size: parseFloat(size),
      price: price ? parseFloat(price) : undefined,
      timeInForce: 'GTC',
      clientOrderId: uuidv4(),
      reduceOnly: Boolean(reduceOnly),
      maxFeeRate: '0.0005'
    };

    console.log('📩 New order request:', orderParams);

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

    console.log('✅ Order executed:', orderRes);
    res.json(orderRes);
  } catch (err) {
    console.error('❌ Order failed:', err);
    res.status(500).json({ 
      error: 'Order failed',
      details: err instanceof Error ? err.message : String(err)
    });
  }
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('⚠️ Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: ${API_URL || 'default'}`);
});
