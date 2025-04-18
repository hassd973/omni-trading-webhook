const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const getAccount = require('./services/getAccount');
const getPositions = require('./services/getPositions');
const getTradeHistory = require('./services/getTradeHistory');

const app = express();
app.use(cors());
app.use(express.json());

// Account info
app.get('/api/account', async (req, res) => {
  try {
    const acct = await getAccount();
    res.json(acct);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed to fetch account' });
  }
});

// Open positions
app.get('/api/positions', async (req, res) => {
  try {
    const positions = await getPositions();
    res.json(positions);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed to fetch positions' });
  }
});

// Trade history / fills
app.get('/api/history', async (req, res) => {
  try {
    const history = await getTradeHistory();
    res.json(history);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed to fetch history' });
  }
});

// Serve static front end
app.use('/', express.static(path.join(__dirname, '../public')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🧊 ICE KING API & UI running on port ${PORT}`));