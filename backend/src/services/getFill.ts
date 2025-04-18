import { HttpPrivateSign } from 'apexpro-connector-node';
import dotenv from 'dotenv';
dotenv.config();

const client = new HttpPrivateSign(
  process.env.API_URL!,
  { key: process.env.APEX_API_KEY!, secret: process.env.APEX_SECRET!, passphrase: process.env.APEX_PASSPHRASE! },
  { zk_seeds: process.env.OMNI_SEED!, zk_l2Key: process.env.APEX_L2KEY! }
);

export async function getFill() {
  const { data } = await client.get_account_balance_v3();
  return data;
}
