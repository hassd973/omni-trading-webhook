import BN from 'bn.js';
import {
  addOrderExpirationBufferHours,
  isoTimestampToEpochHours,
  clientIdToNonce,
  assetToBaseQuantumNumber,
} from '../helpers';
import { getPedersenHash } from '../lib';
import { decToBn, hexToBn, intToBn } from '../lib/util';
import {
  OrderWithNonce,
  OrderWithNonceAndQuoteAmount,
  OrderWithClientId,
  OrderWithClientIdAndQuoteAmount,
  StarkwareOrder,
  StarkwareOrderType,
  NetworkId,
} from '../types';
import { ORDER_FIELD_BIT_LENGTHS } from './constants';
import { getCacheablePedersenHash } from './hashes';
import { StarkSignable } from './stark-signable';

const LIMIT_ORDER_WITH_FEES = 3;
const ORDER_PADDING_BITS = 17;

/**
 * Wrapper object to convert an order, and hash, sign, and verify its signature.
 */
export class SignableOrder extends StarkSignable<StarkwareOrder> {
  static fromOrder = SignableOrder.fromOrderWithClientId; // Alias.

  static fromOrderWithClientId(
    order: OrderWithClientId | OrderWithClientIdAndQuoteAmount,
    networkId: NetworkId,
  ): SignableOrder {
    // Make the nonce by hashing the client-provided ID.
    const nonce = clientIdToNonce(order.clientId).toString(); // Convert to string
    return SignableOrder.fromOrderWithNonce(
      {
        ...order,
        clientId: undefined,
        nonce,
      },
      networkId,
    );
  }

  static fromOrderWithNonce(order: OrderWithNonce | OrderWithNonceAndQuoteAmount, networkId: NetworkId): SignableOrder {
    const nonce = order.nonce;
    const positionId = order.positionId;

    // Within the Starkware system, there is currently only one order type.
    const orderType = StarkwareOrderType.LIMIT_ORDER_WITH_FEES;

    // Determine if the order is buying synthetic
    const isBuyingSynthetic = order.side === 'BUY';

    // Handle quantumsAmountSynthetic with a default if amount is undefined
    const quantumsAmountSynthetic = assetToBaseQuantumNumber(
      order.symbol,           // Asset identifier
      order.amount || '0',    // Default to '0' if amount is missing
      '1e6',                  // Precision (adjust based on asset)
    );

    // Handle quantumsAmountCollateral (use quoteAmount if available, converted to quantum units)
    const quantumsAmountCollateral = assetToBaseQuantumNumber(
      order.symbol,           // Assuming collateral is same asset or adjust accordingly
      order.quoteAmount || '0', // Default to '0' if not provided
      '1e6',                  // Precision (adjust based on asset)
    );

    // Provide defaults for asset IDs if not specified
    const assetIdSynthetic = order.assetIdSynthetic || '0x123';  // Placeholder synthetic asset ID
    const assetIdCollateral = order.assetIdCollateral || '0x456'; // Placeholder collateral asset ID

    // Calculate fee amount
    const quantumsAmountFee = assetToBaseQuantumNumber(
      order.symbol,           // Assuming fee is in the same asset as symbol
      order.limitFee,         // Human-readable limit fee
      '1e6',                  // Precision (adjust based on asset)
    );

    // Convert timestamp to expiration in hours with buffer
    const expirationEpochHours = addOrderExpirationBufferHours(isoTimestampToEpochHours(order.expirationIsoTimestamp));

    return new SignableOrder(
      {
        orderType,
        nonce,
        quantumsAmountSynthetic,
        quantumsAmountCollateral,
        quantumsAmountFee,
        assetIdSynthetic,
        assetIdCollateral,
        assetIdFee: assetIdCollateral, // Fee assumed to be in collateral asset
        positionId,
        isBuyingSynthetic,
        expirationEpochHours,
      },
      networkId,
    );
  }

  protected async calculateHash(): Promise<BN> {
    const message = this.message;
    const assetIdSyntheticBn = hexToBn(message.assetIdSynthetic);
    const assetIdCollateralBn = hexToBn(message.assetIdCollateral);
    const assetIdFeeBn = hexToBn(message.assetIdFee);
    const quantumsAmountSyntheticBn = decToBn(message.quantumsAmountSynthetic);
    const quantumsAmountCollateralBn = decToBn(message.quantumsAmountCollateral);
    const quantumsAmountFeeBn = decToBn(message.quantumsAmountFee);
    const nonceBn = decToBn(message.nonce);
    const positionIdBn = decToBn(message.positionId);
    const expirationEpochHours = intToBn(message.expirationEpochHours);

    const [assetIdSellBn, assetIdBuyBn] = message.isBuyingSynthetic
      ? [assetIdCollateralBn, assetIdSyntheticBn]
      : [assetIdSyntheticBn, assetIdCollateralBn];
    const [quantumsAmountSellBn, quantumsAmountBuyBn] = message.isBuyingSynthetic
      ? [quantumsAmountCollateralBn, quantumsAmountSyntheticBn]
      : [quantumsAmountSyntheticBn, quantumsAmountCollateralBn];

    if (assetIdSyntheticBn.bitLength() > ORDER_FIELD_BIT_LENGTHS.assetIdSynthetic) {
      throw new Error('SignableOrder: assetIdSynthetic exceeds max value');
    }
    if (assetIdCollateralBn.bitLength() > ORDER_FIELD_BIT_LENGTHS.assetIdCollateral) {
      throw new Error('SignableOrder: assetIdCollateral exceeds max value');
    }
    if (assetIdFeeBn.bitLength() > ORDER_FIELD_BIT_LENGTHS.assetIdFee) {
      throw new Error('SignableOrder: assetIdFee exceeds max value');
    }
    if (quantumsAmountSyntheticBn.bitLength() > ORDER_FIELD_BIT_LENGTHS.quantumsAmount) {
      throw new Error('SignableOrder: quantumsAmountSynthetic exceeds max value');
    }
    if (quantumsAmountCollateralBn.bitLength() > ORDER_FIELD_BIT_LENGTHS.quantumsAmount) {
      throw new Error('SignableOrder: quantumsAmountCollateral exceeds max value');
    }
    if (quantumsAmountFeeBn.bitLength() > ORDER_FIELD_BIT_LENGTHS.quantumsAmount) {
      throw new Error('SignableOrder: quantumsAmountFee exceeds max value');
    }
    if (nonceBn.bitLength() > ORDER_FIELD_BIT_LENGTHS.nonce) {
      throw new Error('SignableOrder: nonce exceeds max value');
    }
    if (positionIdBn.bitLength() > ORDER_FIELD_BIT_LENGTHS.positionId) {
      throw new Error('SignableOrder: positionId exceeds max value');
    }
    if (expirationEpochHours.bitLength() > ORDER_FIELD_BIT_LENGTHS.expirationEpochHours) {
      throw new Error('SignableOrder: expirationEpochHours exceeds max value');
    }

    const orderPart1 = new BN(quantumsAmountSellBn.toString(), 10)
      .iushln(ORDER_FIELD_BIT_LENGTHS.quantumsAmount)
      .iadd(quantumsAmountBuyBn)
      .iushln(ORDER_FIELD_BIT_LENGTHS.quantumsAmount)
      .iadd(quantumsAmountFeeBn)
      .iushln(ORDER_FIELD_BIT_LENGTHS.nonce)
      .iadd(nonceBn);

    const orderPart2 = new BN(LIMIT_ORDER_WITH_FEES)
      .iushln(ORDER_FIELD_BIT_LENGTHS.positionId)
      .iadd(positionIdBn) // Repeat (1/3).
      .iushln(ORDER_FIELD_BIT_LENGTHS.positionId)
      .iadd(positionIdBn) // Repeat (2/3).
      .iushln(ORDER_FIELD_BIT_LENGTHS.positionId)
      .iadd(positionIdBn) // Repeat (3/3).
      .iushln(ORDER_FIELD_BIT_LENGTHS.expirationEpochHours)
      .iadd(expirationEpochHours)
      .iushln(ORDER_PADDING_BITS);

    const assetsBn = await getCacheablePedersenHash(
      await getCacheablePedersenHash(assetIdSellBn, assetIdBuyBn),
      assetIdFeeBn,
    );
    const hash = await getPedersenHash(await getPedersenHash(assetsBn, orderPart1), orderPart2);
    return hash;
  }

  toStarkware(): StarkwareOrder {
    return this.message;
  }
}
