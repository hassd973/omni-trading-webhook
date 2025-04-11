export interface OrderWithClientId {
  clientOrderId: string;
  clientId?: string;
  humanPrice?: string;
  humanSize?: string;
  limitFee?: string;
  symbol?: string;
  side?: string;
  expirationIsoTimestamp?: string;
  positionId?: string;
}
