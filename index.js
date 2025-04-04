import express from 'express';
import dotenv from 'dotenv';
import { deriveZkKey, createApexClient } from './apex-sdk-node/src/pro/onboarding/index.js'; // adjust path if needed

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

const {
  API_KEY,
  SECRET,
  PASSPHRASE,
  ETH_PRIVATE_KEY,
  L2KEY,
  OMNI_SEED,
  ACCOUNT_ID,
  CHAIN_ID
} = process.env;

console.log('\n🧊 ICE KING INIT');
console.log(`🔑 API_KEY: ${!!API_KEY}`);
console.log(`🔐 ETH_PRIVATE_KEY: ${!!ETH_PRIVATE_KEY}`);
console.log(`🌱 SEEDS: ${!!OMNI_SEED}`);
console.log(`📡 L2KEY: ${!!L2KEY}`);
console.log(`🧬 CHAIN_ID: ${CHAIN_ID}\n`);

(async () => {
  const client = createApexClient({
    key: API_KEY,
    secret: SECRET,
    passphrase: PASSPHRASE,
    ethPrivateKey: ETH_PRIVATE_KEY,
    networkId: CHAIN_ID
  });

  try {
    const configs = await client.configs_v3();
    console.log('✅ Loaded Configs:', Object.keys(configs).length);

    const account = await client.get_account_v3();
    console.log('✅ Account Info:', account);

    const balance = await client.get_account_balance_v3();
    console.log('💰 Balance:', balance);

    const positions = await client.open_orders_v3();
    console.log('📈 Open Orders:', positions);
  } catch (e) {
    console.error('❌ Startup Error:', e.message || e);
  }
})();

app.get('/', (req, res) => {
  res.send('🧊 ICE KING backend is live');
});

app.listen(PORT, () => {
  console.log(`🧊 ICE KING running on port ${PORT}`);
});
