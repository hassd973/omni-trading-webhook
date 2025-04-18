const client = require('./client');

async function getPositions() {
  const account = await client.get_account_v3();
  return account.data.positions || [];
}

module.exports = getPositions;