export interface KeyPair {
  privateKey: string;
}

export interface SimpleKeyPair {
  key: string;
}

export interface Order {
  [key: string]: any;
}

export function asEcKeyPair(data: string): KeyPair {
  return { privateKey: data };
}

export function asSimpleKeyPair(data: string): SimpleKeyPair {
  return { key: data };
}

export function stripHexPrefix(hex: string): string {
  return hex.replace(/^0x/, '');
}

export function addOrderExpirationBufferHours(isoTimestamp: string, bufferHours: number = 1): string {
  const date = new Date(isoTimestamp);
  date.setHours(date.getHours() + bufferHours);
  return date.toISOString();
}

export function isoTimestampToEpochHours(isoTimestamp: string): number {
  const date = new Date(isoTimestamp);
  return Math.floor(date.getTime() / 1000 / 3600);
}

export const SignableOrder = {
  fromOrder(order: Order, networkId: number): Order {
    return { ...order, signed: true, networkId };
  }
};
