export interface OrderWithClientId {
  positionId: string;
  humanSize: string;
  limitFee: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  expirationIsoTimestamp: string;
  clientId: string;
  humanPrice: string;
}
