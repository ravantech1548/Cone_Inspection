import pg from 'pg';
import fs from 'fs/promises';
const { Pool } = pg;

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'textile_inspector',
  user: 'textile_user',
  password: 'textile_pass_123'
});

async function fixDuplicates() {
  const client = await pool.connect();
  
  try {
    console.log('Starting duplicate predictions fix...\n');
    
    await client.query('BEGIN');
    
    // Step 1: Check current state
    const beforeCount = await client.query(`
      SELECT COUNT(*) as count FROM predictions
    `);
    console.log(`Total predictions before cleanup: ${beforeCount.rows[0].count}`);
    
    const duplicatesCount = await client.query(`
      SELECT COUNT(*) as count
      FROM (
        SELECT image_id, COUNT(*) as cnt
        FROM predictions
        GROUP BY image_id
        HAVING COUNT(*) > 1
      ) sub
    `);
    console.log(`Images with duplicate predictions: ${duplicatesCount.rows[0].count}\n`);
    
    // Step 2: Remove duplicates, keeping only the most recent one
    console.log('Removing duplicate predictions (keeping most recent)...');
    const deleteResult = await client.query(`
      WITH duplicates AS (
        SELECT 
          image_id,
          id,
          ROW_NUMBER() OVER (PARTITION BY image_id ORDER BY created_at DESC) as rn
        FROM predictions
      )
      DELETE FROM predictions
      WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
      )
      RETURNING id
    `);
    console.log(`✓ Removed ${deleteResult.rowCount} duplicate predictions\n`);
    
    // Step 3: Add unique constraint
    console.log('Adding unique constraint to prevent future duplicates...');
    try {
      await client.query(`
        ALTER TABLE predictions
        ADD CONSTRAINT predictions_image_id_unique UNIQUE (image_id)
      `);
      console.log('✓ Unique constraint added successfully\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✓ Unique constraint already exists\n');
      } else {
        throw error;
      }
    }
    
    // Step 4: Verify fix
    const afterCount = await client.query(`
      SELECT COUNT(*) as count FROM predictions
    `);
    console.log(`Total predictions after cleanup: ${afterCount.rows[0].count}`);
    
    const remainingDuplicates = await client.query(`
      SELECT COUNT(*) as count
      FROM (
        SELECT image_id, COUNT(*) as cnt
        FROM predictions
        GROUP BY image_id
        HAVING COUNT(*) > 1
      ) sub
    `);
    console.log(`Images with duplicate predictions: ${remainingDuplicates.rows[0].count}`);
    
    if (remainingDuplicates.rows[0].count === '0') {
      console.log('\n✓ All duplicates removed successfully!');
    }
    
    await client.query('COMMIT');
    console.log('\n✓ Migration completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n✗ Error during migration:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixDuplicates();
