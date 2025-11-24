import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'textile_inspector',
  user: 'textile_user',
  password: 'textile_pass_123'
});

async function testReportQuery() {
  try {
    console.log('Testing report query...\n');
    
    // Get a batch ID to test with
    const batchResult = await pool.query('SELECT id FROM batches ORDER BY id DESC LIMIT 1');
    
    if (batchResult.rows.length === 0) {
      console.log('No batches found in database');
      return;
    }
    
    const batchId = batchResult.rows[0].id;
    console.log(`Testing with Batch ID: ${batchId}\n`);
    
    // Test the exact query from reports route
    console.log('1. Testing batch query...');
    const batch = await pool.query(
      `SELECT b.*, u.username
       FROM batches b
       LEFT JOIN users u ON b.user_id = u.id
       WHERE b.id = $1`,
      [batchId]
    );
    console.log(`✓ Batch query successful: ${batch.rows.length} rows`);
    
    // Test images query with timestamps
    console.log('\n2. Testing images query with timestamps...');
    const images = await pool.query(
      `SELECT i.id, i.filename, i.classification, i.hex_color, i.confidence, i.thumbnail,
              i.created_at,
              p.inference_time_ms, p.payload, p.created_at as prediction_time,
              m.name as model_name, m.version as model_version
       FROM images i
       LEFT JOIN predictions p ON i.id = p.image_id
       LEFT JOIN models m ON p.model_id = m.id
       WHERE i.batch_id = $1
       ORDER BY i.created_at`,
      [batchId]
    );
    console.log(`✓ Images query successful: ${images.rows.length} rows`);
    
    if (images.rows.length > 0) {
      const firstImage = images.rows[0];
      console.log('\nFirst image data:');
      console.log(`  Filename: ${firstImage.filename}`);
      console.log(`  Classification: ${firstImage.classification}`);
      console.log(`  Created At: ${firstImage.created_at}`);
      console.log(`  Prediction Time: ${firstImage.prediction_time}`);
      
      // Test timestamp formatting
      if (firstImage.created_at) {
        const formatted = new Date(firstImage.created_at).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        console.log(`  Formatted: ${formatted}`);
      }
    }
    
    // Test metadata query
    console.log('\n3. Testing metadata query...');
    const metadata = await pool.query(
      `SELECT value as selected_good_class
       FROM batch_metadata
       WHERE batch_id = $1 AND key = 'selected_good_class'`,
      [batchId]
    );
    console.log(`✓ Metadata query successful: ${metadata.rows.length} rows`);
    if (metadata.rows.length > 0) {
      console.log(`  Selected Good Class: ${metadata.rows[0].selected_good_class}`);
    }
    
    console.log('\n✓ All queries executed successfully!');
    console.log('\nIf backend is still showing errors, check:');
    console.log('  1. Backend console logs for specific error');
    console.log('  2. Network tab in browser for error details');
    console.log('  3. Restart backend service');
    
  } catch (error) {
    console.error('\n✗ Error during test:');
    console.error(`  Message: ${error.message}`);
    console.error(`  Code: ${error.code}`);
    if (error.stack) {
      console.error(`\nStack trace:\n${error.stack}`);
    }
  } finally {
    await pool.end();
  }
}

testReportQuery();
