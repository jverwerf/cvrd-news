/**
 * One-time script to upload politician data + timeline files to Vercel Blob.
 * Run: cd web-portal && npx tsx scripts/upload-politicians-to-blob.ts
 *
 * Requires BLOB_READ_WRITE_TOKEN in .env.local
 */
import fs from 'fs';
import path from 'path';

// Load .env.local manually (no dotenv dependency needed)
const envFile = fs.readFileSync('.env.local', 'utf8');
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

import { put } from '@vercel/blob';

const POLITICIANS_DIR = path.resolve('public/data/politicians');
const DATA_DIR = path.resolve('public/data');

async function upload(blobPath: string, filePath: string, contentType: string) {
  const data = fs.readFileSync(filePath);
  const blob = await put(blobPath, data, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
  });
  console.log(`  ✓ ${blobPath} → ${blob.url}`);
  return blob.url;
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('Missing BLOB_READ_WRITE_TOKEN in .env.local');
    process.exit(1);
  }

  console.log('Uploading politician files to Vercel Blob...\n');

  const files = fs.readdirSync(POLITICIANS_DIR);
  let baseUrl = '';

  for (const file of files) {
    const filePath = path.join(POLITICIANS_DIR, file);
    if (!fs.statSync(filePath).isFile()) continue;

    const ext = path.extname(file);
    const contentType = ext === '.json' ? 'application/json' : ext === '.png' ? 'image/png' : 'application/octet-stream';
    const url = await upload(`politicians/${file}`, filePath, contentType);

    if (!baseUrl) {
      baseUrl = url.replace(`/politicians/${file}`, '');
    }
  }

  console.log('\nUploading timeline files...\n');

  const timelineFiles = ['timeline_archive.json', 'timeline_threads.json', 'today_last_year.json', 'today_ten_years_ago.json'];
  for (const file of timelineFiles) {
    const filePath = path.join(DATA_DIR, file);
    if (fs.existsSync(filePath)) {
      await upload(`data/${file}`, filePath, 'application/json');
    }
  }

  console.log(`\n✅ Done! Blob base URL: ${baseUrl}`);
  console.log(`\nAdd this to .env.local:\n  NEXT_PUBLIC_BLOB_BASE_URL=${baseUrl}`);
}

main().catch(e => { console.error(e); process.exit(1); });
