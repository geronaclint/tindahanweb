/**
 * Script: generate-admin-hash.ts
 * Run with: npx ts-node --project tsconfig.json scripts/generate-admin-hash.ts
 * 
 * Generates a bcrypt hash for the admin password that you can
 * insert directly into your Supabase database.
 */
const bcrypt = require('bcryptjs')

async function main() {
  const password = process.argv[2] || 'admin123'
  const hash = await bcrypt.hash(password, 10)
  console.log('\n== Admin Password Hash Generator ==')
  console.log(`Password: ${password}`)
  console.log(`Hash:     ${hash}`)
  console.log('\nSQL to insert:')
  console.log(`INSERT INTO users (username, password_hash) VALUES ('admin', '${hash}');`)
}

main()
