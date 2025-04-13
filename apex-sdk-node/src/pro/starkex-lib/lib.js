class KeyPair {
  constructor(publicKey, privateKey) {
    this.publicKey = publicKey;
    this.privateKey = privateKey;
  }
}

function setConfig(config) {
  console.log('Set config:', config);
}

function setConfigV2(config) {
  console.log('Set config V2:', config);
}

function setCurrency(currency) {
  console.log('Set currency:', currency);
}

function setCurrencyV2(currency) {
  console.log('Set currency V2:', currency);
}

function setPerpetual(perpetual) {
  console.log('Set perpetual:', perpetual);
}

function setSymbols(symbols) {
  console.log('Set symbols:', symbols);
}

function setSymbolsV2(symbols) {
  console.log('Set symbols V2:', symbols);
}

function genSimplifyOnBoardingSignature(data) {
  return '0x' + Buffer.from(JSON.stringify(data)).toString('hex');
}

function keyPairFromData(data) {
  return new KeyPair(
    '0x' + Buffer.from(data).toString('hex'),
    data
  );
}

module.exports = {
  setConfig,
  setConfigV2,
  setCurrency,
  setCurrencyV2,
  setPerpetual,
  setSymbols,
  setSymbolsV2,
  genSimplifyOnBoardingSignature,
  keyPairFromData,
  KeyPair
};
