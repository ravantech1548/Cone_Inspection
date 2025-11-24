import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'textile_inspector',
  user: 'textile_user',
  password: 'textile_pass_123'
});

async function setTimezone() {
  try {
    console.log('Setting database timezone...\n');
    
    // Check current timezone
    const currentTz = await pool.query('SHOW timezone');
    console.log(`Current database timezone: ${currentTz.rows[0].TimeZone}`);
    
    // Set timezone to Singapore/Asia (UTC+8)
    await pool.query("SET timezone = 'Asia/Singapore'");
    console.log('✓ Session timezone set to Asia/Singapore\n');
    
    // Make it permanent for the database
    await pool.query("ALTER DATABASE textile_inspector SET timezone = 'Asia/Singapore'");
    console.log('✓ Database default timezone set to Asia/Singapore\n');
    
    // Verify
    const newTz = await pool.query('SHOW timezone');
    console.log(`New database timezone: ${newTz.rows[0].TimeZone}`);
    
    // Test timestamp conversion
    const testResult = await pool.query(`
      SELECT 
        NOW() as current_time,
        NOW()::timestamp as timestamp_no_tz,
        NOW() AT TIME ZONE 'Asia/Singapore' as singapore_time,
        TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS TZ') as formatted_time
    `);
    
    console.log('\nTimestamp Test:');
    console.log(`  Current Time: ${testResult.rows[0].current_time}`);
    console.log(`  Formatted: ${testResult.rows[0].formatted_time}`);
    
    console.log('\n✓ Database timezone configured successfully!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

setTimezone();
