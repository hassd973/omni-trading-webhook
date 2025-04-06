// patch-sdk.ts
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const SDK_FILES = [
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
        search: /type OrderWithNonce = {[^}]*}/,
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
  try {
    SDK_FILES.forEach(({ path, fixes }) => {
      const fullPath = join(process.cwd(), path);
      if (!existsSync(fullPath)) {
        console.warn(`⚠️ File not found: ${path}`);
        return;
      }

      let content = readFileSync(fullPath, 'utf8');
      fixes.forEach(({ search, replace }) => {
        content = content.replace(search, replace);
      });
      writeFileSync(fullPath, content);
      console.log(`✅ Patched ${path}`);
    });
  } catch (error) {
    console.error('❌ Patching failed:', error);
    process.exit(1);
  }
}

patchFiles();
