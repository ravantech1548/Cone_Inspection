import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

// Test credentials (update if different)
const TEST_USER = {
  username: 'admin',
  password: 'admin123'
};

async function testReportsAPI() {
  console.log('=== TESTING REPORTS API ===\n');
  
  try {
    // Step 1: Login
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const { token } = await loginResponse.json();
    console.log('   ✓ Login successful\n');
    
    // Step 2: Get batches list
    console.log('2. Getting batches list...');
    const batchesResponse = await fetch(`${API_BASE}/batches`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!batchesResponse.ok) {
      throw new Error(`Get batches failed: ${batchesResponse.status}`);
    }
    
    const batches = await batchesResponse.json();
    console.log(`   ✓ Found ${batches.length} batches\n`);
    
    if (batches.length === 0) {
      console.log('   ⚠️  No batches found to test reports');
      return;
    }
    
    // Step 3: Get report for first batch
    const testBatch = batches[0];
    console.log(`3. Getting report for batch ${testBatch.id} (${testBatch.name})...`);
    
    const reportResponse = await fetch(`${API_BASE}/reports/batch/${testBatch.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!reportResponse.ok) {
      const errorText = await reportResponse.text();
      throw new Error(`Get report failed: ${reportResponse.status} - ${errorText}`);
    }
    
    const report = await reportResponse.json();
    console.log('   ✓ Report loaded successfully');
    console.log(`   - Batch: ${report.batch.name}`);
    console.log(`   - Inspector: ${report.batch.username}`);
    console.log(`   - Selected Good Class: ${report.batch.selected_good_class || 'Not set'}`);
    console.log(`   - Total Images: ${report.batch.total_images}`);
    console.log(`   - Good: ${report.batch.good_count}`);
    console.log(`   - Reject: ${report.batch.reject_count}`);
    console.log(`   - Images in report: ${report.images.length}`);
    console.log();
    
    // Step 4: Test CSV export
    console.log('4. Testing CSV export...');
    const csvResponse = await fetch(`${API_BASE}/reports/batch/${testBatch.id}/export?format=csv`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!csvResponse.ok) {
      const errorText = await csvResponse.text();
      throw new Error(`CSV export failed: ${csvResponse.status} - ${errorText}`);
    }
    
    const csvText = await csvResponse.text();
    const csvLines = csvText.split('\n');
    console.log('   ✓ CSV export successful');
    console.log(`   - Lines: ${csvLines.length}`);
    console.log(`   - Headers: ${csvLines[0]}`);
    console.log();
    
    // Step 5: Test JSON export
    console.log('5. Testing JSON export...');
    const jsonResponse = await fetch(`${API_BASE}/reports/batch/${testBatch.id}/export?format=json`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!jsonResponse.ok) {
      const errorText = await jsonResponse.text();
      throw new Error(`JSON export failed: ${jsonResponse.status} - ${errorText}`);
    }
    
    const jsonData = await jsonResponse.json();
    console.log('   ✓ JSON export successful');
    console.log(`   - Records: ${jsonData.length}`);
    console.log();
    
    // Summary
    console.log('=== TEST SUMMARY ===\n');
    console.log('✓ Login works');
    console.log('✓ Batches list works');
    console.log('✓ Report view works');
    console.log('✓ CSV export works');
    console.log('✓ JSON export works');
    console.log();
    console.log('All reports API endpoints are working correctly! 🎉');
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error('\nMake sure:');
    console.error('1. Backend is running (npm start in app/backend)');
    console.error('2. Database is accessible');
    console.error('3. Test credentials are correct');
    process.exit(1);
  }
}

testReportsAPI();
