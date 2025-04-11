export function deriveZkKey(privateKey: string): string {
  // Fake zkKey derivation for now
  return `zk-${privateKey.slice(2, 10)}`;
}
