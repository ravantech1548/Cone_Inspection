import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'textile_inspector',
  user: 'textile_user',
  password: 'textile_pass_123'
});

async function resetBatchId() {
  const client = await pool.connect();
  
  try {
    console.log('=== RESETTING BATCH ID SEQUENCE ===\n');
    
    // Check current state
    const currentBatches = await client.query('SELECT COUNT(*) as count, MAX(id) as max_id FROM batches');
    const batchCount = parseInt(currentBatches.rows[0].count);
    const maxId = currentBatches.rows[0].max_id;
    
    console.log('Current state:');
    console.log(`  - Total batches: ${batchCount}`);
    console.log(`  - Highest ID: ${maxId || 'None'}`);
    console.log();
    
    if (batchCount > 0) {
      console.log('⚠️  WARNING: There are existing batches in the database!');
      console.log('   Resetting the ID sequence may cause conflicts.');
      console.log();
      console.log('   Options:');
      console.log('   1. Delete all batches first: node clear-all-data.js --confirm');
      console.log('   2. Continue anyway (not recommended)');
      console.log();
      console.log('   To delete all data and reset, run:');
      console.log('   node clear-all-data.js --confirm && node reset-batch-id.js --confirm');
      console.log();
      
      if (!process.argv.includes('--force')) {
        console.log('Aborting. Use --force to reset anyway (not recommended).');
        return;
      }
      
      console.log('⚠️  Forcing reset with existing data...\n');
    }
    
    // Get current sequence value
    const currentSeq = await client.query(`
      SELECT last_value FROM batches_id_seq
    `);
    
    console.log(`Current sequence value: ${currentSeq.rows[0].last_value}`);
    console.log();
    
    // Reset the sequence
    console.log('Resetting sequence to 1...');
    await client.query(`ALTER SEQUENCE batches_id_seq RESTART WITH 1`);
    
    // Verify
    const newSeq = await client.query(`
      SELECT last_value, is_called FROM batches_id_seq
    `);
    
    console.log('✓ Sequence reset successfully!');
    console.log(`  New sequence value: ${newSeq.rows[0].last_value}`);
    console.log(`  Is called: ${newSeq.rows[0].is_called}`);
    console.log();
    
    // Also reset other sequences for consistency
    console.log('Resetting other sequences...');
    
    await client.query(`ALTER SEQUENCE images_id_seq RESTART WITH 1`);
    console.log('✓ images_id_seq reset to 1');
    
    await client.query(`ALTER SEQUENCE predictions_id_seq RESTART WITH 1`);
    console.log('✓ predictions_id_seq reset to 1');
    
    await client.query(`ALTER SEQUENCE batch_metadata_id_seq RESTART WITH 1`);
    console.log('✓ batch_metadata_id_seq reset to 1');
    
    await client.query(`ALTER SEQUENCE models_id_seq RESTART WITH 1`);
    console.log('✓ models_id_seq reset to 1');
    
    console.log();
    console.log('=== RESET COMPLETE ===\n');
    console.log('✓ All ID sequences reset to 1');
    console.log('✓ Next batch will have ID: 1');
    console.log('✓ Next image will have ID: 1');
    console.log('✓ Next prediction will have ID: 1');
    console.log();
    
    if (batchCount === 0) {
      console.log('Database is clean. Ready to start fresh with ID 1! 🎉');
    } else {
      console.log('⚠️  Note: Existing records still have their old IDs.');
      console.log('   New records will start from ID 1, which may cause confusion.');
      console.log('   Consider deleting all data first for a clean start.');
    }
    
  } catch (error) {
    console.error('\n✗ Reset failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Confirmation check
const args = process.argv.slice(2);
if (!args.includes('--confirm') && !args.includes('--force')) {
  console.log('=== RESET BATCH ID SEQUENCE ===\n');
  console.log('This will reset the auto-increment ID for batches to start from 1.\n');
  console.log('⚠️  IMPORTANT:');
  console.log('   - This should only be done on a clean database');
  console.log('   - If you have existing batches, delete them first');
  console.log('   - Otherwise, you may get ID conflicts\n');
  console.log('Recommended workflow:');
  console.log('  1. Clear all data: node clear-all-data.js --confirm');
  console.log('  2. Reset IDs: node reset-batch-id.js --confirm\n');
  console.log('Or do both at once:');
  console.log('  node clear-all-data.js --confirm && node reset-batch-id.js --confirm\n');
  console.log('To proceed with reset, run:');
  console.log('  node reset-batch-id.js --confirm\n');
  console.log('To force reset even with existing data (not recommended):');
  console.log('  node reset-batch-id.js --force\n');
  process.exit(0);
}

resetBatchId().catch(console.error);
