import BN from 'bn.js';
import elliptic from 'elliptic';
import { ApexAsset, OrderSide } from './main';

export enum NetworkId {
  MAINNET = 1,
  GOERLI = 5,
}

export enum StarkwareOrderType {
  LIMIT_ORDER_WITH_FEES = 'LIMIT_ORDER_WITH_FEES',
}

// TODO: De-dup with other definitions.

export type SyntheticAsset = Exclude<ApexAsset, ApexAsset.USDC>;

// Key pair, represented as hex strings, no 0x prefix.
export interface KeyPair {
  publicKey: string; // Required x-coordinate.
  publicKeyYCoordinate?: string; // Optional y-coordinate.
  privateKey: string;
}

export interface KeyPairWithYCoordinate extends KeyPair {
  publicKeyYCoordinate: string;
}

// Signature, represented as hex strings, no 0x prefix.
export interface SignatureStruct {
  r: string;
  s: string;
}

export type HashFunction = (a: BN, b: BN) => BN | Promise<BN>;
export type SigningFunction = (
  key: elliptic.ec.KeyPair,
  message: BN,
) => elliptic.ec.Signature | Promise<elliptic.ec.Signature>;
export type VerificationFunction = (
  key: elliptic.ec.KeyPair,
  message: BN,
  signature: SignatureStruct,
) => boolean | Promise<boolean>;

// ============ Withdrawal Parameters ============

interface WithdrawalParamsBase {
  positionId: string;
  humanAmount: string;
  expirationIsoTimestamp: string;
  fee?: number;
  ethAddress?: string;
}
interface WithClientId {
  clientId: string;
  nonce?: undefined;
}
interface WithNonce {
  clientId?: undefined;
  nonce: string;
}
export type WithdrawalWithClientId = WithdrawalParamsBase & WithClientId;
export type WithdrawalWithNonce = WithdrawalParamsBase & WithNonce;

export interface StarkwareWithdrawal {
  positionId: string;
  quantumsAmount: string;
  nonce: string; // For signature. A base-10 integer.
  expirationEpochHours: number;
  ethAddress: string;
}

// ============ Transfer and Conditional Transfer Parameters ============

export interface TransferParams {
  senderPositionId: string;
  receiverPositionId: string;
  receiverPublicKey: string;
  humanAmount: string;
  clientId: string;
  expirationIsoTimestamp: string;
  asset?: string;
  erc20Address?: string;
  chainId?: string | number;
  fee?: string | number;
  lpAccountId?: string;
}

export interface ConditionalTransferParams extends TransferParams {
  factRegistryAddress: string;
  fact: string;
}

export interface StarkwareTransfer {
  senderPositionId: string;
  receiverPositionId: string;
  receiverPublicKey: string;
  quantumsAmount: string;
  nonce: string; // For signature. A base-10 integer.
  expirationEpochHours: number;
}

export interface StarkwareConditionalTransfer extends StarkwareTransfer {
  condition: string;
}

// ============ Order Parameters ============

// The order must specify either quoteAmount or price.
interface OrderParamsBase {
  positionId: string;
  humanSize: string;
  limitFee: string; // Max fee fraction, e.g. 0.01 is a max 1% fee.
  symbol: string;
  side: OrderSide;
  expirationIsoTimestamp: string;
}
export interface WithPrice {
  humanPrice?: string; // Optional
  humanQuoteAmount?: undefined;
}
export interface WithQuoteAmount {
  humanPrice?: undefined;
  humanQuoteAmount?: string; // Optional
}
export type OrderWithClientId = OrderParamsBase & WithPrice & WithClientId;
export type OrderWithNonce = OrderParamsBase & WithPrice & WithNonce & {
  amount?: string; // Optional, alias for humanSize
  assetIdSynthetic?: string; // Optional
  assetIdCollateral?: string; // Optional
};

// FOR INTERNAL USE. Not recommended for external users.
export type OrderWithClientIdAndQuoteAmount = OrderParamsBase & WithQuoteAmount & WithClientId;
export type OrderWithNonceAndQuoteAmount = OrderParamsBase & WithQuoteAmount & WithNonce & {
  amount?: string; // Optional
  quoteAmount?: string; // Optional, alias for humanQuoteAmount
  assetIdSynthetic?: string; // Optional
  assetIdCollateral?: string; // Optional
};

export interface StarkwareAmounts {
  quantumsAmountSynthetic: string;
  quantumsAmountCollateral: string;
  assetIdSynthetic: string;
  assetIdCollateral: string;
  isBuyingSynthetic: boolean;
}

export interface StarkwareOrder extends StarkwareAmounts {
  orderType: StarkwareOrderType;
  quantumsAmountFee: string;
  assetIdFee: string;
  positionId: string;
  nonce: string; // For signature. A base-10 integer.
  expirationEpochHours: number;
}

// ============ API Request Parameters ============

export enum ApiMethod {
  POST = 'POST',
  PUT = 'PUT',
  GET = 'GET',
  DELETE = 'DELETE',
}

export interface ApiRequestParams {
  isoTimestamp: string;
  method: ApiMethod;
  requestPath: string;
  body: string;
}

// ============ Oracle Price Parameters ============

export interface OraclePriceWithAssetName {
  assetName: string;
  oracleName: string;
  humanPrice: string;
  isoTimestamp: string;
}

export interface OraclePriceWithMarket {
  symbol: string;
  oracleName: string;
  humanPrice: string;
  isoTimestamp: string;
}

export interface StarkwareOraclePrice {
  // Note: This ID is specific to oracle signing and differs from the normal Starkware asset ID.
  signedAssetId: string;
  signedPrice: string; // Fixed point with 18 decimals.
  expirationEpochSeconds: number;
}
