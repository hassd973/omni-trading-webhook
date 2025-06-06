/**
 * Signatures on static messages for onboarding.
 *
 * These are used during onboarding. The signature must be deterministic based on the Ethereum key
 * because the signatures will be used for key derivation, and the keys should be recoverable:
 *   - The onboarding signature is used to derive the default API credentials, on the server.
 *   - The key derivation signature is used by the frontend app to derive the STARK key pair.
 *     Programmatic traders may optionally derive their STARK key pair in the same way.
 */
import Web3 from "web3";
import { hashString } from "./helpers";
import { SignOffChainAction } from "./sign-off-chain-action";
// On mainnet, include an extra onlySignOn parameter.
const EIP712_ONBOARDING_ACTION_STRUCT = [
    { type: "string", name: "action" },
    { type: "string", name: "onlySignOn" },
];
const EIP712_ONBOARDING_ACTION_STRUCT_STRING = "apex(" + "string action," + "string onlySignOn" + ")";
const EIP712_ONBOARDING_ACTION_STRUCT_TESTNET = [
    { type: "string", name: "action" },
];
const EIP712_ONBOARDING_ACTION_STRUCT_STRING_TESTNET = "apex(" + "string action" + ")";
export class SignOnboardingAction extends SignOffChainAction {
    constructor(web3, networkId) {
        // On mainnet, include an extra onlySignOn parameter.
        const eip712Struct = networkId === 1
            ? EIP712_ONBOARDING_ACTION_STRUCT
            : EIP712_ONBOARDING_ACTION_STRUCT;
        super(web3, networkId, eip712Struct);
    }
    getHash(message) {
        // On mainnet, include an extra onlySignOn parameter.
        const eip712StructString = this.networkId === 1
            ? EIP712_ONBOARDING_ACTION_STRUCT_STRING
            : EIP712_ONBOARDING_ACTION_STRUCT_STRING;
        const data = [
            { t: "bytes32", v: hashString(eip712StructString) },
            { t: "bytes32", v: hashString(message.action) },
        ];
        // On mainnet, include an extra onlySignOn parameter.
        if (this.networkId === 1) {
            if (!message.onlySignOn) {
                throw new Error("The onlySignOn is required when onboarding to mainnet");
            }
            data.push({ t: "bytes32", v: hashString(message.onlySignOn) });
        }
        else if (message.onlySignOn) {
            throw new Error("Unexpected onlySignOn when signing for non-mainnet network");
        }
        const structHash = Web3.utils.soliditySha3(...data);
        // Non-null assertion operator is safe, hash is null only on empty input.
        return this.getEIP712Hash(structHash);
    }
}
