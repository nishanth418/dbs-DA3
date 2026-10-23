const { verifyDatabase } = require('./database');

async function main() {
  console.log('=== VERIFYING NEO4J AURADB DATABASE ===\n');
  const result = await verifyDatabase();
  if (result.success) {
    console.log('Verification PASSED: All 18 application entities and graph relationships verified in Neo4j AuraDB.');
    process.exit(0);
  } else {
    console.error('Verification FAILED:', result);
    process.exit(1);
  }
}

main();
