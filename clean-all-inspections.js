import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';
const { Pool } = pg;

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'textile_inspector',
  user: 'textile_user',
  password: 'textile_pass_123'
});

async function cleanAllInspections() {
  const client = await pool.connect();
  
  try {
    console.log('========================================');
    console.log('Cleaning All Inspection Data');
    console.log('========================================\n');
    
    // Check current data
    console.log('Current Data:');
    const batchCount = await client.query('SELECT COUNT(*) FROM batches');
    const imageCount = await client.query('SELECT COUNT(*) FROM images');
    const predictionCount = await client.query('SELECT COUNT(*) FROM predictions');
    const metadataCount = await client.query('SELECT COUNT(*) FROM batch_metadata');
    
    console.log(`  Batches: ${batchCount.rows[0].count}`);
    console.log(`  Images: ${imageCount.rows[0].count}`);
    console.log(`  Predictions: ${predictionCount.rows[0].count}`);
    console.log(`  Batch Metadata: ${metadataCount.rows[0].count}`);
    
    if (batchCount.rows[0].count === '0') {
      console.log('\n✓ Database is already clean!');
      return;
    }
    
    console.log('\nStarting cleanup...\n');
    
    await client.query('BEGIN');
    
    // Delete in correct order (respecting foreign keys)
    console.log('1. Deleting predictions...');
    const deletedPredictions = await client.query('DELETE FROM predictions RETURNING id');
    console.log(`   ✓ Deleted ${deletedPredictions.rowCount} predictions`);
    
    console.log('2. Deleting batch metadata...');
    const deletedMetadata = await client.query('DELETE FROM batch_metadata RETURNING id');
    console.log(`   ✓ Deleted ${deletedMetadata.rowCount} metadata records`);
    
    console.log('3. Deleting images...');
    const deletedImages = await client.query('DELETE FROM images RETURNING id');
    console.log(`   ✓ Deleted ${deletedImages.rowCount} images`);
    
    console.log('4. Deleting batches...');
    const deletedBatches = await client.query('DELETE FROM batches RETURNING id');
    console.log(`   ✓ Deleted ${deletedBatches.rowCount} batches`);
    
    // Reset sequences
    console.log('\n5. Resetting ID sequences...');
    await client.query('ALTER SEQUENCE batches_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE images_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE predictions_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE batch_metadata_id_seq RESTART WITH 1');
    console.log('   ✓ All sequences reset to 1');
    
    await client.query('COMMIT');
    
    // Clean upload directories
    console.log('\n6. Cleaning upload directories...');
    try {
      const uploadsDir = './uploads';
      const entries = await fs.readdir(uploadsDir);
      
      let deletedDirs = 0;
      let deletedFiles = 0;
      
      for (const entry of entries) {
        const entryPath = path.join(uploadsDir, entry);
        
        // Skip references directory
        if (entry === 'references') {
          console.log('   ⊙ Skipping references directory');
          continue;
        }
        
        try {
          const stat = await fs.stat(entryPath);
          
          if (stat.isDirectory()) {
            // Delete batch directory
            await fs.rm(entryPath, { recursive: true, force: true });
            deletedDirs++;
          } else if (stat.isFile()) {
            // Delete loose file
            await fs.unlink(entryPath);
            deletedFiles++;
          }
        } catch (err) {
          console.log(`   ⚠ Could not delete ${entry}: ${err.message}`);
        }
      }
      
      console.log(`   ✓ Deleted ${deletedDirs} batch directories`);
      console.log(`   ✓ Deleted ${deletedFiles} loose files`);
    } catch (err) {
      console.log(`   ⚠ Error cleaning uploads: ${err.message}`);
    }
    
    // Verify cleanup
    console.log('\n7. Verifying cleanup...');
    const finalBatchCount = await client.query('SELECT COUNT(*) FROM batches');
    const finalImageCount = await client.query('SELECT COUNT(*) FROM images');
    const finalPredictionCount = await client.query('SELECT COUNT(*) FROM predictions');
    const finalMetadataCount = await client.query('SELECT COUNT(*) FROM batch_metadata');
    
    console.log(`   Batches: ${finalBatchCount.rows[0].count}`);
    console.log(`   Images: ${finalImageCount.rows[0].count}`);
    console.log(`   Predictions: ${finalPredictionCount.rows[0].count}`);
    console.log(`   Batch Metadata: ${finalMetadataCount.rows[0].count}`);
    
    console.log('\n========================================');
    console.log('✅ Cleanup Complete!');
    console.log('========================================');
    console.log('\nDatabase is now clean and ready for fresh inspections.');
    console.log('Users and models are preserved.');
    console.log('Reference images are preserved.');
    console.log('\nNext batch will start with ID: 1');
    console.log('Next image will start with ID: 1');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n✗ Error during cleanup:');
    console.error(`  ${error.message}`);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run cleanup
cleanAllInspections().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
