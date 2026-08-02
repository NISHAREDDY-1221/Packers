const { Client } = require('pg');

const regions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-east-1',
  'ap-south-1',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ca-central-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'sa-east-1'
];

async function findRegion() {
  for (const region of regions) {
    const url = `postgresql://postgres.xogdbhrpadxcqodquuoa:ERPPackers%402026@aws-0-${region}.pooler.supabase.com:6543/postgres?sslmode=require`;
    const client = new Client({ connectionString: url });
    try {
      console.log(`Trying ${region}...`);
      await client.connect();
      console.log(`SUCCESS! The region is ${region}`);
      await client.end();
      process.exit(0);
    } catch (err) {
      if (!err.message.includes('tenant/user') && !err.message.includes('ENOTFOUND')) {
        console.log(`POSSIBLE MATCH ${region}: ${err.message}`);
      }
    }
  }
  console.log("No regions matched.");
}

findRegion();
