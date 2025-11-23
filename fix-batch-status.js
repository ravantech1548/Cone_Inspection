import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'textile_inspector',
  user: 'textile_user',
  password: 'textile_pass_123'
});

async function fixBatchStatus() {
  const client = await pool.connect();
  
  try {
    console.log('=== FIXING BATCH STATUS ===\n');
    
    // Find batches stuck in 'uploading' status that have images
    const stuckBatches = await client.query(`
      SELECT b.id, b.name, b.status, COUNT(i.id) as image_count
      FROM batches b
      LEFT JOIN images i ON b.id = i.batch_id
      WHERE b.status = 'uploading'
      GROUP BY b.id, b.name, b.status
      HAVING COUNT(i.id) > 0
      ORDER BY b.id
    `);
    
    if (stuckBatches.rows.length === 0) {
      console.log('✓ No batches need fixing - all statuses are correct!\n');
      return;
    }
    
    console.log(`Found ${stuckBatches.rows.length} batches stuck in 'uploading' status:\n`);
    
    stuckBatches.rows.forEach(batch => {
      console.log(`  - Batch ${batch.id}: "${batch.name}" (${batch.image_count} images)`);
    });
    
    console.log('\nFixing batch statuses...\n');
    
    // Update all stuck batches
    const result = await client.query(`
      UPDATE batches
      SET status = 'classified',
          total_images = (SELECT COUNT(*) FROM images WHERE batch_id = batches.id),
          good_count = (SELECT COUNT(*) FROM images WHERE batch_id = batches.id AND classification = 'good'),
          reject_count = (SELECT COUNT(*) FROM images WHERE batch_id = batches.id AND classification = 'reject')
      WHERE status = 'uploading'
        AND id IN (
          SELECT b.id 
          FROM batches b
          JOIN images i ON b.id = i.batch_id
          GROUP BY b.id
          HAVING COUNT(i.id) > 0
        )
      RETURNING id, name, status, total_images, good_count, reject_count
    `);
    
    console.log(`✓ Fixed ${result.rows.length} batches:\n`);
    
    result.rows.forEach(batch => {
      console.log(`  ✓ Batch ${batch.id}: "${batch.name}"`);
      console.log(`    Status: uploading → ${batch.status}`);
      console.log(`    Images: ${batch.total_images} (${batch.good_count} good, ${batch.reject_count} reject)`);
      console.log();
    });
    
    console.log('=== FIX COMPLETE ===\n');
    console.log('All batches with images now have correct status!');
    console.log('Refresh your browser to see the updated statuses.');
    
  } catch (error) {
    console.error('\n✗ Fix failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixBatchStatus().catch(console.error);
