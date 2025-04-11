export interface PerpetualContractObject {
  tickSize: string;
  stepSize: string;
  settleCurrencyId: string;
  underlyingCurrencyId: string;
  symbol: string;
  leverage?: number;
  contractId: string;
}

