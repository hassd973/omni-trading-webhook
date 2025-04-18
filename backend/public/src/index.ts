import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

import { getAccount } from './services/getAccount';
import { getFill }    from './services/getFill';
import { getOrder }   from './services/getOrder';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Account info
app.get('/api/account', async (req, res) => {
  try {
    const acct = await getAccount();
    res.json(acct);
  } catch (e) {
    console.error('GET /api/account error:', e);
    res.status(500).json({ error: 'failed to fetch account' });
  }
});

// 2. Fills / PnL
app.get('/api/fills', async (req, res) => {
  try {
    const fills = await getFill();
    res.json(fills);
  } catch (e) {
    console.error('GET /api/fills error:', e);
    res.status(500).json({ error: 'failed to fetch fills' });
  }
});

// 3. Open orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await getOrder();
    res.json(orders);
  } catch (e) {
    console.error('GET /api/orders error:', e);
    res.status(500).json({ error: 'failed to fetch orders' });
  }
});

// Serve static front end
app.use('/', express.static(path.join(__dirname, '../public')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`🧊 ICE KING API & UI live on port ${PORT}`)
);
