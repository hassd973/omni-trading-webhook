"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApexClient = createApexClient;
const index_1 = require("../apex-sdk-node/src/pro/index");
function createApexClient(config) {
    const clientConfig = {
        account: {
            apiKey: config.apiKey,
            secret: config.secret,
            passphrase: config.passphrase,
            ethPrivateKey: config.ethPrivateKey,
            l2Key: config.zkKey,
        },
        env: {
            isProd: false, // set to true for mainnet
            chainId: 5, // Goerli
        },
    };
    return (0, index_1.createApexProClient)(clientConfig);
}
