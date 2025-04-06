import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const filesToPatch = [
  {
    path: 'apex-sdk-node/src/pro/onboarding/eth-signing/sign-off-chain-action.ts',
    fixes: [
      {
        search: /(function \w+\()([^)]+)(\))/g,
        replace: (match: string, p1: string, p2: string, p3: string) => {
          if (p2.includes('signature: string | { messageHash: string')) {
            return `${p1}${p2.replace(
              'signature: string | { messageHash: string; r: string; s: string; v: string; message?: string; signature: string; }',
              'signature: string'
            )}${p3}`;
          }
          return match;
        }
      }
    ]
  },
  {
    path: 'apex-sdk-node/src/pro/starkex-lib/signable/conditional-transfer.ts',
    fixes: [
      {
        search: /amount: number/g,
        replace: 'amount: string'
      }
    ]
  },
  {
    path: 'apex-sdk-node/src/pro/starkex-lib/signable/order.ts',
    fixes: [
      {
        search: /type OrderWithNonce = {[^}]*}/g,
        replace: `type OrderWithNonce = {
          nonce: string;
          amount: string;
          quoteAmount: string;
          assetIdSynthetic: string;
          assetIdCollateral: string;
          [key: string]: any;
        }`
      },
      {
        search: /type OrderWithNonceAndQuoteAmount = {[^}]*}/g,
        replace: `type OrderWithNonceAndQuoteAmount = {
          nonce: string;
          amount: string;
          quoteAmount: string;
          assetIdSynthetic: string;
          assetIdCollateral: string;
          [key: string]: any;
        }`
      }
    ]
  }
];

function patchFiles() {
  filesToPatch.forEach(({ path, fixes }) => {
    const fullPath = join(process.cwd(), path);
    let content = readFileSync(fullPath, 'utf8');
    
    fixes.forEach(({ search, replace }) => {
      content = content.replace(search, replace);
    });
    
    writeFileSync(fullPath, content);
    console.log(`✅ Patched ${path}`);
  });
}

patchFiles();
