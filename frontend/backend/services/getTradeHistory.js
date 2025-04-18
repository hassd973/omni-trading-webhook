const client = require('./client');

async function getTradeHistory() {
  try {
    const history = await client.get_fills_v3();
    return history.data || [];
  } catch (e) {
    return [];
  }
}

module.exports = getTradeHistory;