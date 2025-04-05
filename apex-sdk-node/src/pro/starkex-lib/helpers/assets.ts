import Big, { BigSource } from 'big.js';
// ... other imports

export const assetToBaseQuantumNumber = (
  asset: string,
  amount: BigSource,
  quantum: BigSource,
): string => {
  return Big(amount).div(quantum).round(0, Big.roundDown).toString();
};

export const assetToNumberRoundDown = (
  asset: string,
  amount: BigSource,
  quantum: BigSource,
): string => {
  return Big(amount).div(quantum).round(0, Big.roundDown).toString();
};

export const assetToNumberRoundUp = (
  asset: string,
  amount: BigSource,
  quantum: BigSource,
): string => {
  return Big(amount).div(quantum).round(0, Big.roundUp).toString();
};
