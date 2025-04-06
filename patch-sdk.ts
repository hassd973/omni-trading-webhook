import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const filesToPatch = [
  {
    path: 'apex-sdk-node/src/pro/onboarding/eth-signing/sign-off-chain-action.ts',
    fixes: [
      {
        search: /signature: string \| \{ messageHash: string; r: string; s: string; v: string; message\?: string; signature: string; \}/g,
        replace: 'signature: string'
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
          amount?: string;
          quoteAmount?: string;
          assetIdSynthetic?: string;
          assetIdCollateral?: string;
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
