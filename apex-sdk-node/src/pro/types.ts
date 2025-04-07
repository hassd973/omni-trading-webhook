export interface OrderWithNonce {
  nonce: string;
  positionId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  expirationIsoTimestamp: string;
  limitFee: string;
  amount?: string;
  quoteAmount?: string;
  assetIdSynthetic?: string;
  assetIdCollateral?: string;
}

export interface OrderWithNonceAndQuoteAmount extends OrderWithNonce {
  quoteAmount?: string;
}

export interface OrderWithClientId {
  clientId: string;
  positionId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  expirationIsoTimestamp: string;
  limitFee: string;
  amount?: string;
  quoteAmount?: string;
  assetIdSynthetic?: string;
  assetIdCollateral?: string;
}

export interface OrderWithClientIdAndQuoteAmount extends OrderWithClientId {
  quoteAmount?: string;
}

export enum StarkwareOrderType {
  LIMIT_ORDER_WITH_FEES = 'LIMIT_ORDER_WITH_FEES',
}

export interface StarkwareOrder {
  orderType: StarkwareOrderType;
  nonce: string;
  quantumsAmountSynthetic: string;
  quantumsAmountCollateral: string;
  quantumsAmountFee: string;
  assetIdSynthetic: string;
  assetIdCollateral: string;
  assetIdFee: string;
  positionId: string;
  isBuyingSynthetic: boolean;
  expirationEpochHours: number;
}

export interface ConditionalTransferParams {
  senderPositionId: string;
  receiverPositionId: string;
  receiverPublicKey: string;
  humanAmount: string;
  clientId: string;
  expirationIsoTimestamp: string;
  fact: string;
}

export interface StarkwareConditionalTransfer {
  senderPositionId: string;
  receiverPositionId: string;
  receiverPublicKey: string;
  quantumsAmount: string;
  nonce: string;
  expirationEpochHours: string;
  condition: string;
}

export interface OffChainActionSignature {
  message: string;
}

export type NetworkId = number;
