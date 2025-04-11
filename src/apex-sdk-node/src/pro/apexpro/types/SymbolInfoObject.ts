export interface SymbolInfoObject {
  symbol: string;
  info: any; // <-- Required field
  pricePrecision?: number;
  priceStep?: number;
  sizePrecision?: number;
  sizeStep?: number;
  baseCoin?: string;
  currentCoin?: string;
  rankIdx?: number;
  baseCoinPrecision?: number;
  baseCoinRealPrecision?: number;
  currentCoinPrecision?: number;
  baseCoinIcon?: string;
  currentCoinIcon?: string;
}

