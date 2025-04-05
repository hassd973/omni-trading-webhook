"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const deriveZkKey_1 = require("./deriveZkKey");
const ApexClient_1 = require("./ApexClient");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 10000;
const { API_KEY, SECRET, PASSPHRASE, ETH_PRIVATE_KEY, } = process.env;
if (!API_KEY || !SECRET || !PASSPHRASE || !ETH_PRIVATE_KEY) {
    console.error('🚨 Missing one or more required environment variables.');
    process.exit(1);
}
const zkKey = (0, deriveZkKey_1.deriveZkKey)(ETH_PRIVATE_KEY); // only 1 param
const client = (0, ApexClient_1.createApexClient)({
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
