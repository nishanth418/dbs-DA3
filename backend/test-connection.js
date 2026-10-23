const { testConnection, getHealthStatus } = require('./database');

async function testNeo4jConnection() {
  try {
    console.log('--- NEO4J AURADB CONNECTION TEST REPORT ---');
    console.log('Checking connection to Neo4j AuraDB...');
    const result = await testConnection();

    if (!result.connected) {
      console.log('1. Connection Result: FAILED');
      console.log('2. Server Status: Disconnected');
      console.log('3. Error Details:', result.error);
      console.log('-------------------------------------------');
      process.exit(1);
    }

    const health = await getHealthStatus();

    console.log('1. Connection Result: SUCCESSFUL');
    console.log('2. Server Status: Connected');
    console.log('   - Engine: Neo4j AuraDB');
    console.log(`   - Server Agent: ${result.details.agent}`);
    console.log(`   - Server Address: ${result.details.address}`);
    console.log(`   - Protocol Version: ${result.details.protocolVersion}`);
    console.log(`3. Total Nodes in Graph: ${health.graphMetrics?.totalNodes ?? 0}`);
    console.log(`4. Total Relationships: ${health.graphMetrics?.totalRelationships ?? 0}`);
    console.log(`5. Application Entities Verified: ${health.totalApplicationTables} / 18`);
    console.log('6. Errors: None');
    console.log('-------------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('Fatal connection error:', err.message);
    process.exit(1);
  }
}

testNeo4jConnection();
