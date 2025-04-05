"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveZkKey = deriveZkKey;
function deriveZkKey(privateKey) {
    // Fake zkKey derivation for now
    return `zk-${privateKey.slice(2, 10)}`;
}
