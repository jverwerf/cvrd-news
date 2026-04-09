/**
 * One-time: upload all existing images from public/images/ to Blob.
 * Run: cd web-portal && npx tsx scripts/upload-images-to-blob.ts
 */
import fs from 'fs';
import path from 'path';

const envFile = fs.readFileSync('.env.local', 'utf8');
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

import { put } from '@vercel/blob';

const IMAGES_DIR = path.resolve('public/images');

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('Missing BLOB_READ_WRITE_TOKEN');
    process.exit(1);
  }

  // Upload all story images
  const storyFiles = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
  console.log(`Uploading ${storyFiles.length} story images...\n`);
  for (const file of storyFiles) {
    const data = fs.readFileSync(path.join(IMAGES_DIR, file));
    const blob = await put(`images/${file}`, data, {
      access: 'public', addRandomSuffix: false, allowOverwrite: true,
      contentType: file.endsWith('.png') ? 'image/png' : 'image/jpeg',
    });
    console.log(`  ✓ ${file} → ${blob.url}`);
  }

  // Upload thread images
  const threadsDir = path.join(IMAGES_DIR, 'threads');
  if (fs.existsSync(threadsDir)) {
    const threadFiles = fs.readdirSync(threadsDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
    console.log(`\nUploading ${threadFiles.length} thread images...\n`);
    for (const file of threadFiles) {
      const data = fs.readFileSync(path.join(threadsDir, file));
      const blob = await put(`images/threads/${file}`, data, {
        access: 'public', addRandomSuffix: false, allowOverwrite: true,
        contentType: file.endsWith('.png') ? 'image/png' : 'image/jpeg',
      });
      console.log(`  ✓ ${file} → ${blob.url}`);
    }
  }

  console.log('\n✅ Done!');
}

main().catch(e => { console.error(e); process.exit(1); });
