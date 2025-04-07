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
      order.quoteAmount || '0',
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
    const expirationEpochHours = intToBn(message.expirationEpochHour
