const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/account', async (req, res) => {
  try {
    const { data } = await axios.get('https://omni-trading-webhook.onrender.com/balance');
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed to fetch account' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const { data } = await axios.get('https://omni-trading-webhook.onrender.com/positions');
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed to fetch positions' });
  }
});

app.get('/api/fills', async (req, res) => {
  try {
    const { data } = await axios.get('https://omni-trading-webhook.onrender.com/pnl');
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed to fetch pnl' });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => 
  console.log(`🧊 ICE KING API & UI live on port ${PORT}`)
);
