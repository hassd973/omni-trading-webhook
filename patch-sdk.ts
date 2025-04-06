import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const filesToPatch = [
  {
    path: 'apex-sdk-node/src/pro/onboarding/eth-signing/sign-off-chain-action.ts',
    fixes: [
      {
        search: /(function \w+\()([^)]*signature: string \| \{ messageHash: string[^}]*\})([^)]*\))/g,
        replace: '$1$2: string$3'
      },
      {
        search: /(\.\w+\()([^)]*signature: string \| \{ messageHash: string[^}]*\})([^)]*\))/g,
        replace: '$1$2: string$3'
      }
    ]
  },
  {
    path: 'apex-sdk-node/src/pro/starkex-lib/signable/conditional-transfer.ts',
    fixes: [
      {
        search: /amount: number/g,
        replace: 'amount: string'
      },
      {
        search: /number \| string/g,
        replace: 'string'
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
    try {
      let content = readFileSync(fullPath, 'utf8');
      fixes.forEach(({ search, replace }) => {
        content = content.replace(search, replace);
      });
      writeFileSync(fullPath, content);
      console.log(`✅ Successfully patched ${path}`);
    } catch (err) {
      console.error(`❌ Failed to patch ${path}:`, err);
    }
  });
}

patchFiles();
