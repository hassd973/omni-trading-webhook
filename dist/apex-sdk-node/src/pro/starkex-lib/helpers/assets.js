import Big from 'big.js';
export const assetToBaseQuantumNumber = (asset, amount, quantum) => {
    return Big(amount).div(quantum).round(0, Big.roundDown).toString();
};
export const assetToNumberRoundDown = (asset, amount, quantum) => {
    return Big(amount).div(quantum).round(0, Big.roundDown).toString();
};
export const assetToNumberRoundUp = (asset, amount, quantum) => {
    return Big(amount).div(quantum).round(0, Big.roundUp).toString();
};
