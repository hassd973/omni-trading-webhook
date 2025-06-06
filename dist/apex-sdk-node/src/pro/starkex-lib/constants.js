import BN from 'bn.js';
import { keccak256 } from 'ethereum-cryptography/keccak';
import _ from 'lodash';
import { normalizeHex32 } from './lib';
import { getCurrency, ApexAsset, getPerpetual, getCurrencyV2 } from './main';
export const ALL_ASSETS = Object.values(ApexAsset);
export const COLLATERAL_ASSET = ApexAsset.USDC;
export const SYNTHETIC_ASSETS = _.without(ALL_ASSETS, COLLATERAL_ASSET);
/**
 * The resolution represents the number of decimals of precision used in the Starkware system.
 */
export const ASSET_RESOLUTION = {
    [ApexAsset.USDT]: 6,
    [ApexAsset.USDC]: 6,
    [ApexAsset.BTC]: 10,
    [ApexAsset.ETH]: 3,
    [ApexAsset.LINK]: 7,
    [ApexAsset.AAVE]: 8,
    [ApexAsset.UNI]: 7,
    [ApexAsset.SUSHI]: 7,
    [ApexAsset.SOL]: 7,
    [ApexAsset.YFI]: 10,
    [ApexAsset.ONEINCH]: 7,
    [ApexAsset.AVAX]: 7,
    [ApexAsset.SNX]: 7,
    [ApexAsset.CRV]: 6,
    [ApexAsset.UMA]: 7,
    [ApexAsset.DOT]: 7,
    [ApexAsset.DOGE]: 5,
    [ApexAsset.MATIC]: 6,
    [ApexAsset.MKR]: 9,
    [ApexAsset.FIL]: 7,
    [ApexAsset.ADA]: 6,
    [ApexAsset.ATOM]: 7,
    [ApexAsset.COMP]: 8,
    [ApexAsset.BCH]: 8,
    [ApexAsset.LTC]: 8,
    [ApexAsset.EOS]: 6,
    [ApexAsset.ALGO]: 6,
    [ApexAsset.ZRX]: 6,
    [ApexAsset.XMR]: 8,
    [ApexAsset.ZEC]: 8,
    [ApexAsset.ENJ]: 6,
    [ApexAsset.ETC]: 7,
    [ApexAsset.XLM]: 5,
    [ApexAsset.TRX]: 4,
    [ApexAsset.XTZ]: 6,
    [ApexAsset.HNT]: 7,
};
export const COLLATERAL_ASSET_ID_BY_NETWORK_ID = () => {
    const currentPerpetual = getPerpetual()?.toUpperCase?.();
    const currency = currentPerpetual ? getCurrencyV2() : getCurrency();
    let starkExAssetId = '';
    currency.map((item) => {
        if (item.id === (currentPerpetual || 'USDC')) {
            starkExAssetId = item.starkExAssetId;
        }
    });
    return starkExAssetId;
};
/**
 * Mapping from a synthetic asset to its asset ID.
 */
export const SYNTHETIC_ASSET_ID_MAP = _.chain(SYNTHETIC_ASSETS)
    .keyBy()
    .mapValues(makeSyntheticAssetId)
    .value();
/**
 * The smallest unit of the asset in the Starkware system, represented in canonical (human) units.
 */
export const ASSET_QUANTUM_SIZE = _.mapValues(ASSET_RESOLUTION, (resolution) => `1e-${resolution}`);
/**
 * Construct the asset ID (as a 0x-prefixed hex string) for the collateral asset, given the address.
 */
function makeCollateralAssetId(tokenAddress, quantization = 1) {
    const data = Buffer.concat([
        keccak256(Buffer.from('ERC20Token(address)')).slice(0, 4),
        Buffer.from(normalizeHex32(tokenAddress), 'hex'),
        Buffer.from(normalizeHex32(new BN(quantization).toString(16)), 'hex'),
    ]);
    const result = keccak256(Uint8Array.from(data)); // Fix: Convert Buffer to Uint8Array
    const resultBN = new BN(result, 16); // Directly use Uint8Array as hex
    resultBN.imaskn(250);
    return `0x${normalizeHex32(resultBN.toString(16))}`;
}
/**
 * Construct the asset ID (as a 0x-prefixed hex string) for a given synthetic asset.
 */
function makeSyntheticAssetId(asset) {
    const assetIdString = `${asset}-${ASSET_RESOLUTION[asset]}`;
    const assetIdHex = Buffer.from(assetIdString).toString('hex').padEnd(30, '0');
    return `0x${assetIdHex}`;
}
