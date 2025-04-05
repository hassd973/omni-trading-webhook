import BN from 'bn.js';

import { COLLATERAL_ASSET, COLLATERAL_ASSET_ID_BY_NETWORK_ID } from '../constants';
import { isoTimestampToEpochHours, nonceFromClientId, clientIdToNonce, assetToBaseQuantumNumber } from '../helpers'; // Fix import
import { getPedersenHash } from '../lib';
import { decToBn, hexToBn, intToBn } from '../lib/util';
import { NetworkId, StarkwareOrder } from '../types'; // Assuming types exist
import { TRANSFER_FEE_ASSET_ID_BN } from './constants'; // Simplified import
import { getCacheablePedersenHash } from './hashes';
import { StarkSignable } from './stark-signable';

const MAX_AMOUNT_FEE_BN = new BN(0); // Fees not supported assumption

const ORDER_PREFIX = 3; // Example value, adjust as per Starkware spec
const ORDER_PADDING_BITS = 81; // Example, adjust if needed

/**
 * Wrapper object to convert an order, and hash, sign, and verify its signature.
 */
export class SignableOrder extends StarkSignable<StarkwareOrder> {
  static fromOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    humanBaseAmount: string,
    humanQuoteAmount: string,
    limitFee: string,
    clientId: string,
    expirationIsoTimestamp: string,
    positionId: string,
    networkId: NetworkId
  ): SignableOrder {
    const nonce = nonceFromClientId(clientId);
    const baseAsset = symbol.split('-')[0]; // e.g., "BTC" from "BTC-USD"
    const quoteAsset = COLLATERAL_ASSET; // Assuming USDC
    const quantumsBase = assetToBaseQuantumNumber(baseAsset, humanBaseAmount, '1e10'); // Adjust quantum
    const quantumsQuote = assetToBaseQuantumNumber(quoteAsset, humanQuoteAmount, '1e6');
    const quantumsFee = assetToBaseQuantumNumber(quoteAsset, limitFee, '1e6');
    const expirationEpochHours = isoTimestampToEpochHours(expirationIsoTimestamp);

    return new SignableOrder(
      {
        positionId,
        baseAsset,
        quoteAsset,
        quantumsBase,
        quantumsQuote,
        quantumsFee,
        nonce,
        expirationEpochHours,
        side,
      },
      networkId
    );
  }

  constructor(message: StarkwareOrder, networkId: NetworkId) {
    super(message, networkId);
  }

  protected async calculateHash(): Promise<BN> {
    const positionIdBn = decToBn(this.message.positionId);
    const quantumsBaseBn = decToBn(this.message.quantumsBase);
    const quantumsQuoteBn = decToBn(this.message.quantumsQuote);
    const quantumsFeeBn = decToBn(this.message.quantumsFee);
    const nonceBn = decToBn(this.message.nonce);
    const expirationEpochHoursBn = intToBn(this.message.expirationEpochHours);

    // Bit length checks (adjust constants as needed)
    const FIELD_BIT_LENGTHS = {
      positionId: 64,
      quantumsAmount: 64,
      nonce: 32,
      expirationEpochHours: 32,
    };

    if (positionIdBn.bitLength() > FIELD_BIT_LENGTHS.positionId) {
      throw new Error('SignableOrder: positionId exceeds max value');
    }
    if (quantumsBaseBn.bitLength() > FIELD_BIT_LENGTHS.quantumsAmount) {
      throw new Error('SignableOrder: quantumsBase exceeds max value');
    }
    if (quantumsQuoteBn.bitLength() > FIELD_BIT_LENGTHS.quantumsAmount) {
      throw new Error('SignableOrder: quantumsQuote exceeds max value');
    }
    if (quantumsFeeBn.bitLength() > FIELD_BIT_LENGTHS.quantumsAmount) {
      throw new Error('SignableOrder: quantumsFee exceeds max value');
    }
    if (nonceBn.bitLength() > FIELD_BIT_LENGTHS.nonce) {
      throw new Error('SignableOrder: nonce exceeds max value');
    }
    if (expirationEpochHoursBn.bitLength() > FIELD_BIT_LENGTHS.expirationEpochHours) {
      throw new Error('SignableOrder: expirationEpochHours exceeds max value');
    }

    const assetIds = await getCacheablePedersenHash(
      hexToBn(COLLATERAL_ASSET_ID_BY_NETWORK_ID()),
      TRANSFER_FEE_ASSET_ID_BN
    );

    const orderPart1 = await getPedersenHash(
      assetIds,
      hexToBn(this.message.side === 'BUY' ? this.message.quoteAsset : this.message.baseAsset)
    );
    const orderPart2 = new BN(positionIdBn.toString(), 10)
      .iushln(FIELD_BIT_LENGTHS.positionId)
      .iadd(positionIdBn)
      .iushln(FIELD_BIT_LENGTHS.nonce)
      .iadd(nonceBn);
    const orderPart3 = new BN(ORDER_PREFIX)
      .iushln(FIELD_BIT_LENGTHS.quantumsAmount)
      .iadd(quantumsBaseBn)
      .iushln(FIELD_BIT_LENGTHS.quantumsAmount)
      .iadd(quantumsQuoteBn)
      .iushln(FIELD_BIT_LENGTHS.quantumsAmount)
      .iadd(quantumsFeeBn)
      .iushln(FIELD_BIT_LENGTHS.expirationEpochHours)
      .iadd(expirationEpochHoursBn)
      .iushln(ORDER_PADDING_BITS);

    return getPedersenHash(await getPedersenHash(orderPart1, orderPart2), orderPart3);
  }

  toStarkware(): StarkwareOrder {
    return this.message;
  }
}
