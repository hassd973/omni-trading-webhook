export function asEcKeyPair(data) {
  return { privateKey: data };
}

export function asSimpleKeyPair(data) {
  return { key: data };
}

export function stripHexPrefix(hex) {
  return hex.replace(/^0x/, '');
}

export function addOrderExpirationBufferHours(isoTimestamp, bufferHours = 1) {
  const date = new Date(isoTimestamp);
  date.setHours(date.getHours() + bufferHours);
  return date.toISOString();
}

export function isoTimestampToEpochHours(isoTimestamp) {
  const date = new Date(isoTimestamp);
  return Math.floor(date.getTime() / 1000 / 3600); // convert to epoch hours
}
export function addOrderExpirationBufferHours(hours) {
  return hours + 1;
}

export function isoTimestampToEpochHours(timestamp) {
  return Math.floor(new Date(timestamp).getTime() / (1000 * 60 * 60));
}

export const SignableOrder = {
  fromOrder(order, networkId) {
    return { ...order, signed: true, networkId };
  }
};


exports.addOrderExpirationBufferHours = function (timestamp, bufferHours = 2) {
  const date = new Date(timestamp);
  date.setHours(date.getHours() + bufferHours);
  return date.toISOString();
};

exports.isoTimestampToEpochHours = function (timestamp) {
  return Math.floor(new Date(timestamp).getTime() / 1000 / 3600);
};
