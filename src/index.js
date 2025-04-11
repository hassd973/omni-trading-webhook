import express from 'express';
import dotenv from 'dotenv';
import { deriveZkKey } from './deriveZkKey';
import { createApexClient } from './src/ApexClient';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;
// Load your API credentials from environment
const { API_KEY, SECRET, PASSPHRASE, ETH_PRIVATE_KEY, L2KEY } = process.env;
if (!API_KEY || !SECRET || !PASSPHRASE || !ETH_PRIVATE_KEY || !L2KEY) {
    throw new Error('Missing required environment variables');
}
(async () => {
    const zkKey = deriveZkKey(ETH_PRIVATE_KEY, L2KEY);
    const client = await createApexClient({
        apiKey: API_KEY,
        apiSecret: SECRET,
        apiPassphrase: PASSPHRASE,
        ethPrivateKey: ETH_PRIVATE_KEY,
        l2Key: zkKey
    });
    app.get('/', (_req, res) => {
        res.send('Omni Trading Webhook is running ✅');
    });
    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
})();
