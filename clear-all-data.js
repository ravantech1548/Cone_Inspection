import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';

const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'textile_inspector',
  user: 'textile_user',
  password: 'textile_pass_123'
});

const UPLOADS_DIR = path.resolve('./uploads');
const REFERENCES_DIR = path.resolve('./uploads/references');

async function clearAllData() {
  const client = await pool.connect();
  
  try {
    console.log('=== CLEARING ALL DATA ===\n');
    console.log('⚠️  WARNING: This will delete ALL inspection data!\n');
    
    // Get counts before deletion
    const batchCount = await client.query('SELECT COUNT(*) FROM batches');
    const imageCount = await client.query('SELECT COUNT(*) FROM images');
    const predictionCount = await client.query('SELECT COUNT(*) FROM predictions');
    const metadataCount = await client.query('SELECT COUNT(*) FROM batch_metadata');
    
    console.log('Current data:');
    console.log(`  - Batches: ${batchCount.rows[0].count}`);
    console.log(`  - Images: ${imageCount.rows[0].count}`);
    console.log(`  - Predictions: ${predictionCount.rows[0].count}`);
    console.log(`  - Batch Metadata: ${metadataCount.rows[0].count}`);
    console.log();
    
    // Count reference images
    let referenceCount = 0;
    try {
      const entries = await fs.readdir(REFERENCES_DIR);
      for (const className of entries) {
        const classPath = path.join(REFERENCES_DIR, className);
        const stat = await fs.stat(classPath);
        if (stat.isDirectory()) {
          const files = await fs.readdir(classPath);
          referenceCount += files.filter(f => /\.(jpg|jpeg|png)$/i.test(f)).length;
        }
      }
      console.log(`  - Reference Images: ${referenceCount}`);
    } catch (err) {
      console.log(`  - Reference Images: 0 (directory not found)`);
    }
    console.log();
    
    console.log('Starting deletion...\n');
    
    await client.query('BEGIN');
    
    // Delete database records (cascade will handle related records)
    console.log('1. Deleting database records...');
    
    // Delete predictions (will be cascaded, but being explicit)
    const deletedPredictions = await client.query('DELETE FROM predictions RETURNING id');
    console.log(`   ✓ Deleted ${deletedPredictions.rows.length} predictions`);
    
    // Delete batch_metadata (will be cascaded, but being explicit)
    const deletedMetadata = await client.query('DELETE FROM batch_metadata RETURNING id');
    console.log(`   ✓ Deleted ${deletedMetadata.rows.length} batch metadata records`);
    
    // Delete images (will be cascaded, but being explicit)
    const deletedImages = await client.query('DELETE FROM images RETURNING id');
    console.log(`   ✓ Deleted ${deletedImages.rows.length} images`);
    
    // Delete batches
    const deletedBatches = await client.query('DELETE FROM batches RETURNING id');
    console.log(`   ✓ Deleted ${deletedBatches.rows.length} batches`);
    
    await client.query('COMMIT');
    console.log();
    
    // Delete uploaded image files
    console.log('2. Deleting uploaded image files...');
    try {
      const entries = await fs.readdir(UPLOADS_DIR);
      let deletedFiles = 0;
      
      for (const entry of entries) {
        const entryPath = path.join(UPLOADS_DIR, entry);
        const stat = await fs.stat(entryPath);
        
        // Skip references directory
        if (entry === 'references') continue;
        
        // Delete batch directories (numbered folders)
        if (stat.isDirectory() && /^\d+$/.test(entry)) {
          await fs.rm(entryPath, { recursive: true, force: true });
          deletedFiles++;
          console.log(`   ✓ Deleted batch folder: ${entry}`);
        }
      }
      
      if (deletedFiles === 0) {
        console.log('   ✓ No batch folders to delete');
      }
    } catch (err) {
      console.log(`   ⚠️  Could not delete files: ${err.message}`);
    }
    console.log();
    
    // Delete reference images
    console.log('3. Deleting reference images...');
    try {
      const entries = await fs.readdir(REFERENCES_DIR);
      let deletedClasses = 0;
      let deletedRefImages = 0;
      
      for (const className of entries) {
        const classPath = path.join(REFERENCES_DIR, className);
        const stat = await fs.stat(classPath);
        
        if (stat.isDirectory()) {
          const files = await fs.readdir(classPath);
          const imageFiles = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f));
          deletedRefImages += imageFiles.length;
          
          await fs.rm(classPath, { recursive: true, force: true });
          deletedClasses++;
          console.log(`   ✓ Deleted class "${className}" (${imageFiles.length} images)`);
        }
      }
      
      if (deletedClasses === 0) {
        console.log('   ✓ No reference images to delete');
      } else {
        console.log(`   ✓ Total: ${deletedRefImages} reference images from ${deletedClasses} classes`);
      }
    } catch (err) {
      console.log(`   ⚠️  Could not delete references: ${err.message}`);
    }
    console.log();
    
    // Verify deletion
    console.log('4. Verifying deletion...');
    const finalBatchCount = await client.query('SELECT COUNT(*) FROM batches');
    const finalImageCount = await client.query('SELECT COUNT(*) FROM images');
    const finalPredictionCount = await client.query('SELECT COUNT(*) FROM predictions');
    const finalMetadataCount = await client.query('SELECT COUNT(*) FROM batch_metadata');
    
    console.log(`   ✓ Batches: ${finalBatchCount.rows[0].count}`);
    console.log(`   ✓ Images: ${finalImageCount.rows[0].count}`);
    console.log(`   ✓ Predictions: ${finalPredictionCount.rows[0].count}`);
    console.log(`   ✓ Batch Metadata: ${finalMetadataCount.rows[0].count}`);
    console.log();
    
    console.log('=== CLEANUP COMPLETE ===\n');
    console.log('✓ All inspection data deleted');
    console.log('✓ All uploaded images deleted');
    console.log('✓ All reference images deleted');
    console.log();
    console.log('Database is now clean and ready for fresh data!');
    console.log();
    console.log('Note: User accounts are preserved.');
    console.log('      Models table is preserved.');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n✗ Cleanup failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Confirmation check
const args = process.argv.slice(2);
if (!args.includes('--confirm')) {
  console.log('⚠️  WARNING: This will delete ALL inspection data and reference images!\n');
  console.log('This includes:');
  console.log('  - All batches');
  console.log('  - All images and predictions');
  console.log('  - All uploaded files');
  console.log('  - All reference images');
  console.log();
  console.log('User accounts and models will be preserved.');
  console.log();
  console.log('To proceed, run:');
  console.log('  node clear-all-data.js --confirm');
  console.log();
  process.exit(0);
}

clearAllData().catch(console.error);
