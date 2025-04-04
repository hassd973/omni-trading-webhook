require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
const { ethers } = require('ethers');

const app = express();
app.use(express.json());
app.use(cors());

const BASE_URL = 'https://omni.apex.exchange';

console.log('🔑 API_KEY:', process.env.API_KEY ? '✔️' : '❌ Missing');
console.log('🔐 SECRET:', process.env.SECRET ? '✔️' : '❌ Missing');
console.log('🔒 PASSPHRASE:', process.env.PASSPHRASE ? '✔️' : '❌ Missing');
console.log('🔑 ETH_PRIVATE_KEY:', process.env.ETH_PRIVATE_KEY ? '✔️' : '❌ Missing');

function signRequest(method, path, body = {}) {
  const timestamp = Date.now().toString();
  const message = `${method}${path}${timestamp}${JSON.stringify(body)}`;
  const signature = crypto
    .createHmac('sha256', process.env.SECRET)
    .update(message)
    .digest('hex');

  return {
    'Content-Type': 'application/json',
    'APEX-API-KEY': process.env.API_KEY,
    'APEX-PASSPHRASE': process.env.PASSPHRASE,
    'APEX-SIGNATURE': signature,
    'APEX-TIMESTAMP': timestamp
  };
}

// ✅ Check balance
app.get('/balance', async (req, res) => {
  const path = `/api/v3/private/account/balances`;
  try {
    const headers = signRequest('GET', path);
    const response = await axios.get(`${BASE_URL}${path}`, { headers });
    res.status(200).json(response.data);
  } catch (err) {
    console.error('Balance error:', err.response?.data || err.message);
    res.status(500).send(`Balance error: ${err.message}`);
  }
});

// ✅ Check positions
app.get('/positions', async (req, res) => {
  const path = `/api/v3/private/position/open`;
  try {
    const headers = signRequest('GET', path);
    const response = await axios.get(`${BASE_URL}${path}`, { headers });
    res.status(200).json(response.data);
  } catch (err) {
    console.error('Positions error:', err.response?.data || err.message);
    res.status(500).send(`Positions error: ${err.message}`);
  }
});

// ✅ Create orders
async function createOrder(symbol, side, type, size, price) {
  const path = '/api/v3/order';
  const body = {
    symbol,
    side: side.toUpperCase(),
    type: type.toUpperCase(),
    size: parseFloat(size),
    ...(price && { price: parseFloat(price) }),
    timeInForce: 'GTC',
    clientOrderId: `webhook-${Date.now()}`,
    timestamp: Date.now()
  };

  const headers = signRequest('POST', path, body);
  console.log('📦 Sending order:', body);

  try {
    const response = await axios.post(`${BASE_URL}${path}`, body, { headers });
    return response.data;
  } catch (err) {
    console.error('Order error:', err.response?.data || err.message);
    throw new Error(err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
  }
}

// ✅ Handle webhooks
app.post('/webhook', async (req, res) => {
  try {
    const { market, order, size, price } = req.body;
    console.log('📩 Webhook received:', req.body);

    const orderType = price ? 'LIMIT' : 'MARKET';
    const result = await createOrder(market, order, orderType, size, price);

    res.status(200).send('Order placed successfully');
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    res.status(500).send(`Order failed: ${err.message}`);
  }
});

// ✅ Derive zkKey & register user
app.post('/init-user', async (req, res) => {
  try {
    const privateKey = process.env.ETH_PRIVATE_KEY;
    const chainId = parseInt(process.env.CHAIN_ID) || 9;

    const wallet = new ethers.Wallet(privateKey);
    const ethAddress = wallet.address;
    const pubKey = wallet._signingKey().publicKey;
    const l2Key = ethers.utils.keccak256(Buffer.from(pubKey));
    const seeds = ethers.utils.randomBytes(32).toString('hex');

    console.log('🧬 Derived zkKey:', { ethAddress, l2Key });

    // Get nonce
    const nonceRes = await axios.post(`${BASE_URL}/api/v3/nonce`, {
      l2Key,
      ethAddress,
      chainId
    });

    const nonce = nonceRes.data?.data?.nonce;
    console.log('🧠 Nonce:', nonce);

    // Simulate signature (for full security, use wallet.signMessage if needed)
    const signature = crypto
      .createHmac('sha256', process.env.SECRET)
      .update(nonce)
      .digest('hex');

    // Onboarding request
    const onboardRes = await axios.post(
      `${BASE_URL}/api/v3/onboarding`,
      {
        l2Key,
        ethereumAddress: ethAddress,
        seeds
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'APEX-SIGNATURE': signature,
          'APEX-ETHEREUM-ADDRESS': ethAddress
        }
      }
    );

    console.log('✅ Onboarded:', onboardRes.data);
    res.status(200).json(onboardRes.data);
  } catch (err) {
    console.error('❌ Onboarding failed:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Root
app.get('/', (req, res) => {
  res.send('🧊 ICE KING Webhook is live');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🧊 ICE KING running on port ${PORT}`);
});
