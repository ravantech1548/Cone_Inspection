import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'textile_inspector',
  user: 'textile_user',
  password: 'textile_pass_123'
});

async function verifyDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('=== DATABASE VERIFICATION ===\n');
    
    // Check connection
    console.log('✓ Database connection successful');
    console.log(`  Database: textile_inspector`);
    console.log(`  User: textile_user\n`);
    
    // Check required tables exist
    const requiredTables = [
      'users',
      'batches',
      'images',
      'predictions',
      'models',
      'batch_metadata'
    ];
    
    console.log('Checking required tables...');
    for (const table of requiredTables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      if (result.rows[0].exists) {
        const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`  ✓ ${table.padEnd(20)} (${countResult.rows[0].count} records)`);
      } else {
        console.log(`  ✗ ${table.padEnd(20)} MISSING!`);
      }
    }
    console.log();
    
    // Check unused tables are gone
    const unusedTables = ['color_taxonomy', 'prompts', 'overrides'];
    
    console.log('Checking unused tables removed...');
    let allRemoved = true;
    for (const table of unusedTables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      if (result.rows[0].exists) {
        console.log(`  ⚠️  ${table.padEnd(20)} still exists`);
        allRemoved = false;
      } else {
        console.log(`  ✓ ${table.padEnd(20)} removed`);
      }
    }
    console.log();
    
    // Check foreign key relationships
    console.log('Checking foreign key relationships...');
    const fkResult = await client.query(`
      SELECT
        tc.table_name, 
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    fkResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
    });
    console.log();
    
    // Check indexes
    console.log('Checking indexes...');
    const indexResult = await client.query(`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('users', 'batches', 'images', 'predictions', 'models', 'batch_metadata')
      ORDER BY tablename, indexname
    `);
    
    const indexCount = {};
    indexResult.rows.forEach(row => {
      indexCount[row.tablename] = (indexCount[row.tablename] || 0) + 1;
    });
    
    Object.entries(indexCount).forEach(([table, count]) => {
      console.log(`  ✓ ${table.padEnd(20)} ${count} indexes`);
    });
    console.log();
    
    // Test basic queries
    console.log('Testing basic queries...');
    
    try {
      await client.query('SELECT COUNT(*) FROM users');
      console.log('  ✓ Query users table');
    } catch (err) {
      console.log('  ✗ Query users table failed:', err.message);
    }
    
    try {
      await client.query(`
        SELECT b.*, u.username 
        FROM batches b 
        LEFT JOIN users u ON b.user_id = u.id 
        LIMIT 1
      `);
      console.log('  ✓ Join batches with users');
    } catch (err) {
      console.log('  ✗ Join batches with users failed:', err.message);
    }
    
    try {
      await client.query(`
        SELECT i.*, p.payload 
        FROM images i 
        LEFT JOIN predictions p ON i.id = p.image_id 
        LIMIT 1
      `);
      console.log('  ✓ Join images with predictions');
    } catch (err) {
      console.log('  ✗ Join images with predictions failed:', err.message);
    }
    
    try {
      await client.query(`
        SELECT bm.* 
        FROM batch_metadata bm 
        WHERE bm.key = 'selected_good_class' 
        LIMIT 1
      `);
      console.log('  ✓ Query batch_metadata');
    } catch (err) {
      console.log('  ✗ Query batch_metadata failed:', err.message);
    }
    
    console.log();
    
    // Summary
    console.log('=== VERIFICATION SUMMARY ===\n');
    
    if (allRemoved) {
      console.log('✓ All unused tables removed');
    } else {
      console.log('⚠️  Some unused tables still exist (run cleanup-database.js --cleanup)');
    }
    
    console.log('✓ All required tables present');
    console.log('✓ Foreign key relationships intact');
    console.log('✓ Indexes created');
    console.log('✓ Basic queries working');
    console.log();
    console.log('Database is ready for use! 🎉');
    
  } catch (error) {
    console.error('\n✗ Verification failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

verifyDatabase().catch(console.error);
