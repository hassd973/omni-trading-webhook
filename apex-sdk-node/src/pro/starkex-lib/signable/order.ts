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

export class SignableOrder extends StarkSignable<StarkwareOrder> {
  static fromOrder = SignableOrder.fromOrderWithClientId;

  static fromOrderWithClientId(
    order: OrderWithClientId | OrderWithClientIdAndQuoteAmount,
    networkId: NetworkId,
  ): SignableOrder {
    const nonce = clientIdToNonce(order.clientId).toString();
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
    const orderType = StarkwareOrderType.LIMIT_ORDER_WITH_FEES;
    const isBuyingSynthetic = order.side === 'BUY';

    const quantumsAmountSynthetic = assetToBaseQuantumNumber(
      order.symbol,
      order.amount || '0',
      '1e6',
    );

    const quantumsAmountCollateral = assetToBaseQuantumNumber(
      order.symbol,
      'quoteAmount' in order ? order.quoteAmount : '0', // ✅ Fix applied here
      '1e6',
    );

    const assetIdSynthetic = order.assetIdSynthetic || '0x123';
    const assetIdCollateral = order.assetIdCollateral || '0x456';

    const quantumsAmountFee = assetToBaseQuantumNumber(
      order.symbol,
      order.limitFee,
      '1e6',
    );

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
        assetIdFee: assetIdCollateral,
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
      .iadd(positionIdBn)
      .iushln(ORDER_FIELD_BIT_LENGTHS.positionId)
      .iadd(positionIdBn)
      .iushln(ORDER_FIELD_BIT_LENGTHS.positionId)
      .iadd(positionIdBn)
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
