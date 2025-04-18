const client = require('./client');

async function getAccount() {
  const resp = await client.get_account_v3();
  return resp.data || resp;
}

module.exports = getAccount;