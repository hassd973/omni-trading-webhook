export class SignableOrder {
  static fromOrder(order, networkId) {
    return {
      order,
      networkId,
      signed: true
    };
  }
}

export function genSimplifyOnBoardingSignature(data) {
  return `signed(${JSON.stringify(data)})`;
}
