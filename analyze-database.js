import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function analyzeDatabase() {
  console.log('=' .repeat(70));
  console.log('DATABASE SCHEMA ANALYSIS');
  console.log('=' .repeat(70));
  console.log();
  
  try {
    // Get all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`📊 Total Tables: ${tablesResult.rows.length}\n`);
    
    for (const { table_name } of tablesResult.rows) {
      console.log('-'.repeat(70));
      console.log(`TABLE: ${table_name}`);
      console.log('-'.repeat(70));
      
      // Get row count
      const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table_name}`);
      const rowCount = countResult.rows[0].count;
      
      // Get columns
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table_name]);
      
      console.log(`Rows: ${rowCount}`);
      console.log('\nColumns:');
      columnsResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
      });
      
      // Get indexes
      const indexesResult = await pool.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = $1
      `, [table_name]);
      
      if (indexesResult.rows.length > 0) {
        console.log('\nIndexes:');
        indexesResult.rows.forEach(idx => {
          console.log(`  - ${idx.indexname}`);
        });
      }
      
      // Get foreign keys
      const fkResult = await pool.query(`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = $1
      `, [table_name]);
      
      if (fkResult.rows.length > 0) {
        console.log('\nForeign Keys:');
        fkResult.rows.forEach(fk => {
          console.log(`  - ${fk.column_name} → ${fk.foreign_table_name}(${fk.foreign_column_name})`);
        });
      }
      
      console.log();
    }
    
    // Usage analysis
    console.log('='.repeat(70));
    console.log('USAGE ANALYSIS');
    console.log('='.repeat(70));
    console.log();
    
    const usageAnalysis = [
      { table: 'users', used: true, purpose: 'Authentication and RBAC' },
      { table: 'batches', used: true, purpose: 'Inspection sessions' },
      { table: 'images', used: true, purpose: 'Scanned cone images with classification' },
      { table: 'predictions', used: true, purpose: 'YOLO inference results and metadata' },
      { table: 'models', used: true, purpose: 'Model registry (best.pt tracking)' },
      { table: 'prompts', used: false, purpose: 'LLM prompts (not used in current flow)' },
      { table: 'color_taxonomy', used: false, purpose: 'Color definitions (replaced by YOLO classes)' },
      { table: 'overrides', used: false, purpose: 'Manual classification changes (not implemented)' },
      { table: 'batch_metadata', used: false, purpose: 'Additional batch data (not used yet)' },
      { table: 'migrations', used: true, purpose: 'Database migration tracking' }
    ];
    
    console.log('ACTIVELY USED TABLES:');
    console.log('-'.repeat(70));
    usageAnalysis.filter(t => t.used).forEach(t => {
      console.log(`✓ ${t.table.padEnd(20)} - ${t.purpose}`);
    });
    
    console.log('\nUNUSED TABLES (Can be removed):');
    console.log('-'.repeat(70));
    usageAnalysis.filter(t => !t.used).forEach(t => {
      console.log(`✗ ${t.table.padEnd(20)} - ${t.purpose}`);
    });
    
    console.log();
    console.log('='.repeat(70));
    console.log('RECOMMENDATIONS');
    console.log('='.repeat(70));
    console.log();
    console.log('1. Keep: users, batches, images, predictions, models, migrations');
    console.log('2. Optional: overrides (if you want manual override feature)');
    console.log('3. Remove: color_taxonomy, prompts, batch_metadata (not used)');
    console.log();
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

analyzeDatabase();
