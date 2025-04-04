require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();
app.use(express.json());

console.log('API_KEY:', process.env.API_KEY);
console.log('PASSPHRASE:', process.env.PASSPHRASE);
console.log('SECRET:', process.env.SECRET);
console.log('ACCOUNT_ID:', process.env.ACCOUNT_ID);
console.log('ETHEREUM_ADDRESS:', process.env.ETHEREUM_ADDRESS);
console.log('OMNI_SEED:', process.env.OMNI_SEED);
console.log('L2KEY:', process.env.L2KEY);

const BASE_URL = 'https://omni.apex.exchange/api/v3';

async function testApi() {
    try {
        const response = await axios.get(`${BASE_URL}/time`);
        console.log('Manual API test successful:', response.data);
    } catch (error) {
        console.error('Manual API test failed:', error.message);
        if (error.response) console.error('Test response data:', error.response.data);
    }
}

function signRequest(method, path, params = {}) {
    const timestamp = Date.now().toString();
    const message = `${method}${path}${timestamp}${JSON.stringify(params)}`;
    const signature = crypto
        .createHmac('sha256', process.env.SECRET)
        .update(message)
        .digest('hex');
    return {
        'APEX-API-KEY': process.env.API_KEY,
        'APEX-PASSPHRASE': process.env.PASSPHRASE,
        'APEX-SIGNATURE': signature,
        'APEX-TIMESTAMP': timestamp
    };
}

async function fetchPositions() {
    const path = '/account/positions';
    const headers = signRequest('GET', path);
    try {
        const response = await axios.get(`${BASE_URL}${path}`, { headers });
        console.log('Positions:', response.data);
        return response.data;
    } catch (error) {
        console.error('Positions error:', error.response ? error.response.data : error.message);
        return null;
    }
}

async function fetchBalance() {
    const path = '/account/balance';
    const headers = signRequest('GET', path);
    try {
        const response = await axios.get(`${BASE_URL}${path}`, { headers });
        console.log('Balance:', response.data);
        return response.data;
    } catch (error) {
        console.error('Balance error:', error.response ? error.response.data : error.message);
        return null;
    }
}

async function createOrder(symbol, side, type, size, price) {
    const path = '/order';
    const params = {
        symbol: symbol.replace('USD', '-USD'),
        side: side.toUpperCase(),
        type: type.toUpperCase(),
        size: parseFloat(size),
        ...(price && { price: parseFloat(price) }),
        timeInForce: 'GTC',
        accountId: process.env.ACCOUNT_ID,
        l2Key: process.env.L2KEY,
        clientOrderId: `webhook-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        maxFeeRate: 0.0005,
        reduceOnly: false,
        timestamp: Date.now()
    };

    const headers = signRequest('POST', path, params);
    console.log('Sending order request:', { params, headers });
    try {
        const response = await axios.post(`${BASE_URL}${path}`, params, { headers });
        console.log('Order response:', response.data);
        return response.data;
    } catch (error) {
        throw new Error(error.response ? JSON.stringify(error.response.data) : error.message);
    }
}

testApi();
fetchPositions();
fetchBalance();

app.post('/webhook', async (req, res) => {
    try {
        const { symbol, action, quantity, price } = req.body;
        console.log('Received webhook:', req.body);
        const order = await createOrder(
            symbol,
            action,
            price ? 'LIMIT' : 'MARKET',
            quantity,
            price
        );
        console.log('Order placed:', order);
        res.status(200).send('Order placed successfully');
    } catch (error) {
        console.error('Webhook error:', error.message);
        res.status(500).send(`Error placing order: ${error.message}`);
    }
});

const PORT = process.env.PORT || 3000; // Render uses PORT env
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
