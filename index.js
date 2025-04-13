import express from 'express';
import dotenv from 'dotenv';
import { deriveZkKey } from './src/deriveZkKey';
import { createApexClient } from './src/ApexClient';

dotenv.config();
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 10000;

const { API_KEY, SECRET, PASSPHRASE, ETH_PRIVATE_KEY, L2KEY } = process.env;
if (!API_KEY || !SECRET || !PASSPHRASE || !ETH_PRIVATE_KEY || !L2KEY) {
    throw new Error('Missing required environment variables');
}

(async () => {
    // Use L2KEY directly or adjust deriveZkKey call
    const zkKey = deriveZkKey(ETH_PRIVATE_KEY); // Fix call
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
