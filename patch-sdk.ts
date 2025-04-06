// patch-sdk.ts
import { join } from 'path';
import { writeFileSync, readFileSync } from 'fs';

const filesToPatch = [
  'apex-sdk-node/src/pro/starkex-lib/signable/conditional-transfer.ts',
  'apex-sdk-node/src/pro/starkex-lib/signable/order.ts'
];

filesToPatch.forEach(file => {
  const filePath = join(process.cwd(), file);
  let content = readFileSync(filePath, 'utf8');
  
  if (file.includes('conditional-transfer.ts')) {
    content = content.replace(/amount: number/g, 'amount: string');
  }
  
  if (file.includes('order.ts')) {
    content = content.replace(
      /type OrderWithNonce = {[^}]*}/,
      `type OrderWithNonce = {
        nonce: string;
        amount?: string;
        quoteAmount?: string;
        assetIdSynthetic?: string;
        assetIdCollateral?: string;
        [key: string]: any;
      }`
    );
  }
  
  writeFileSync(filePath, content);
});

console.log('✅ SDK types patched successfully');
