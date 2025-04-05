import express from 'express';
import dotenv from 'dotenv';
import { deriveZkKey } from './deriveZkKey';
import { createApexClient } from './ApexClient';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

const {
  API_KEY,
  SECRET,
  PASSPHRASE,
  ETH_PRIVATE_KEY,
} = process.env;

if (!API_KEY || !SECRET || !PASSPHRASE || !ETH_PRIVATE_KEY) {
  console.error('🚨 Missing one or more required environment variables.');
  process.exit(1);
}

const zkKey = deriveZkKey(ETH_PRIVATE_KEY); // only 1 param

const client = createApexClient({
  apiKey: API_KEY,
  secret: SECRET,
  passphrase: PASSPHRASE,
  ethPrivateKey: ETH_PRIVATE_KEY,
  zkKey,
});

app.get('/', (req, res) => {
  res.send('🌍 ICE KING Webhook is up and running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
