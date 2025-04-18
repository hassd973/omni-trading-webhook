const { HttpPrivateSign, APEX_OMNI_HTTP_MAIN, NETWORKID_MAIN } = require('apexpro-connector-node');
require('dotenv').config();

const client = new HttpPrivateSign(
  process.env.API_URL || APEX_OMNI_HTTP_MAIN,
  process.env.NETWORK_ID ? parseInt(process.env.NETWORK_ID) : NETWORKID_MAIN,
  { zk_seeds: process.env.ZKLINK_SEED, zk_l2Key: process.env.ZKLINK_SEED },
  { key: process.env.API_KEY, secret: process.env.API_SECRET, passphrase: process.env.APAPASSPHRASE }
);

module.exports = client;