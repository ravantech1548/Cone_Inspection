import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'textile_inspector',
  user: 'textile_user',
  password: 'textile_pass_123'
});

async function analyzeAndCleanup() {
  const client = await pool.connect();
  
  try {
    console.log('=== DATABASE ANALYSIS ===\n');
    
    // Get all tables
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log('Current tables in database:');
    tablesResult.rows.forEach(row => console.log(`  - ${row.tablename}`));
    console.log();
    
    // Analyze table usage
    const tableAnalysis = [
      { 
        table: 'users', 
        used: true, 
        purpose: 'Authentication and user management',
        query: 'SELECT COUNT(*) FROM users'
      },
      { 
        table: 'batches', 
        used: true, 
        purpose: 'Inspection batch tracking',
        query: 'SELECT COUNT(*) FROM batches'
      },
      { 
        table: 'images', 
        used: true, 
        purpose: 'Uploaded cone images with classification',
        query: 'SELECT COUNT(*) FROM images'
      },
      { 
        table: 'predictions', 
        used: true, 
        purpose: 'YOLO model predictions',
        query: 'SELECT COUNT(*) FROM predictions'
      },
      { 
        table: 'models', 
        used: true, 
        purpose: 'Model registry (YOLO model tracking)',
        query: 'SELECT COUNT(*) FROM models'
      },
      { 
        table: 'batch_metadata', 
        used: true, 
        purpose: 'Stores selected_good_class per batch',
        query: 'SELECT COUNT(*) FROM batch_metadata'
      },
      { 
        table: 'overrides', 
        used: false, 
        purpose: 'Manual classification overrides (not implemented in UI)',
        query: 'SELECT COUNT(*) FROM overrides'
      },
      { 
        table: 'prompts', 
        used: false, 
        purpose: 'Prompt registry (not used with YOLO)',
        query: 'SELECT COUNT(*) FROM prompts'
      },
      { 
        table: 'color_taxonomy', 
        used: false, 
        purpose: 'Color definitions (replaced by YOLO classes)',
        query: 'SELECT COUNT(*) FROM color_taxonomy'
      }
    ];
    
    console.log('=== TABLE USAGE ANALYSIS ===\n');
    
    for (const item of tableAnalysis) {
      try {
        const result = await client.query(item.query);
        const count = parseInt(result.rows[0].count);
        const status = item.used ? '✓ ACTIVE' : '✗ UNUSED';
        
        console.log(`${status} - ${item.table}`);
        console.log(`   Purpose: ${item.purpose}`);
        console.log(`   Records: ${count}`);
        console.log();
      } catch (err) {
        console.log(`? MISSING - ${item.table}`);
        console.log(`   Purpose: ${item.purpose}`);
        console.log();
      }
    }
    
    // Check for data in unused tables
    console.log('=== CLEANUP RECOMMENDATIONS ===\n');
    
    const unusedTables = tableAnalysis.filter(t => !t.used);
    const hasData = [];
    
    for (const table of unusedTables) {
      try {
        const result = await client.query(table.query);
        const count = parseInt(result.rows[0].count);
        if (count > 0) {
          hasData.push({ table: table.table, count });
        }
      } catch (err) {
        // Table doesn't exist
      }
    }
    
    if (hasData.length > 0) {
      console.log('⚠️  WARNING: Unused tables contain data:');
      hasData.forEach(item => {
        console.log(`   - ${item.table}: ${item.count} records`);
      });
      console.log();
    }
    
    console.log('Safe to remove (not used by current code):');
    console.log('  - color_taxonomy');
    console.log('  - prompts');
    console.log('  - overrides (unless you plan to implement manual overrides)');
    console.log();
    
    console.log('Must keep (actively used):');
    console.log('  - users');
    console.log('  - batches');
    console.log('  - images');
    console.log('  - predictions');
    console.log('  - models');
    console.log('  - batch_metadata');
    console.log();
    
    // Ask for confirmation
    console.log('=== CLEANUP OPTIONS ===\n');
    console.log('Run with --cleanup flag to remove unused tables:');
    console.log('  node cleanup-database.js --cleanup');
    console.log();
    
    if (process.argv.includes('--cleanup')) {
      console.log('Starting cleanup...\n');
      
      await client.query('BEGIN');
      
      try {
        // Drop unused tables
        await client.query('DROP TABLE IF EXISTS color_taxonomy CASCADE');
        console.log('✓ Dropped color_taxonomy');
        
        await client.query('DROP TABLE IF EXISTS prompts CASCADE');
        console.log('✓ Dropped prompts');
        
        await client.query('DROP TABLE IF EXISTS overrides CASCADE');
        console.log('✓ Dropped overrides');
        
        await client.query('COMMIT');
        console.log('\n✓ Cleanup completed successfully!');
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('\n✗ Cleanup failed:', err.message);
        throw err;
      }
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

analyzeAndCleanup().catch(console.error);
