require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();

app.use(express.json());

const BASE_URL = 'https://omni.apex.exchange/api/v3';

function signRequest(method, path, params = {}) {
  const timestamp = Date.now().toString();
  const message = `${method}${path}${timestamp}${JSON.stringify(params)}`;
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

async function createOrder(symbol, side, type, size, price) {
  const path = '/order';
  const params = {
    symbol: symbol,
    side: side.toUpperCase(),
    type: type.toUpperCase(),
    size: parseFloat(size),
    ...(price && { price: parseFloat(price) }),
    timeInForce: 'GTC',
    accountId: process.env.ACCOUNT_ID,
    l2Key: process.env.L2KEY,
    clientOrderId: `webhook-${Date.now()}`,
    timestamp: Date.now()
  };

  const headers = signRequest('POST', path, params);

  try {
    const response = await axios.post(`${BASE_URL}${path}`, params, { headers });
    return response.data;
  } catch (error) {
    console.error('Order error:', error.response?.data || error.message);
    throw new Error(error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
  }
}

app.post('/webhook', async (req, res) => {
  try {
    const { market, order, size, price } = req.body;
    console.log('Received webhook:', req.body);

    const orderType = price ? 'LIMIT' : 'MARKET';

    const result = await createOrder(
      market,
      order,
      orderType,
      size,
      price
    );

    console.log('Order placed:', result);
    res.status(200).send('Order placed successfully');
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).send(`Order failed: ${error.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
