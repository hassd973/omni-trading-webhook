import { ENV } from '../Constant';
import { SigningMethod, KeyPair } from './interface';

export async function genStarkKey(
  method: SigningMethod,
  account: string,
  env: ENV
): Promise<{ key: KeyPair; l2KeyHash: string }> {
  // Placeholder
  console.log(`Generating Stark key for ${account}`);
  return {
    key: { publicKey: '0x0', privateKey: '0x0' },
    l2KeyHash: '0x0'
  };
}

export async function genNonce(
  account: string,
  publicKey: string,
  env: ENV,
  options: { chainId: number }
): Promise<any> {
  // Placeholder
  console.log(`Generating nonce for ${account}`);
  return { data: { nonce: '123' } };
}

export async function basicOnboarding(
  env: ENV,
  nonce: string,
  method: SigningMethod,
  account: string,
  key: KeyPair,
  token?: 'USDC' | 'USDT'
): Promise<any> {
  // Placeholder
  console.log(`Basic onboarding for ${account}`);
  return { data: {} };
}

export async function simplifyOnboarding(
  env: ENV,
  nonce: string,
  method: SigningMethod,
  account: string,
  key: KeyPair,
  token?: 'USDC' | 'USDT'
): Promise<any> {
  // Placeholder
  console.log(`Simplified onboarding for ${account}`);
  return { data: {} };
}
