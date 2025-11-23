import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testAuth() {
  console.log('Testing authentication...\n');
  
  try {
    // Test database connection
    console.log('1. Testing database connection...');
    const connTest = await pool.query('SELECT current_database(), current_user');
    console.log('✓ Connected to database:', connTest.rows[0].current_database);
    console.log('✓ Connected as user:', connTest.rows[0].current_user);
    console.log();
    
    // Get users from database
    console.log('2. Fetching users from database...');
    const result = await pool.query('SELECT id, username, password_hash, role FROM users');
    console.log(`✓ Found ${result.rows.length} users\n`);
    
    // Test password for each user
    const testPassword = 'admin123';
    console.log(`3. Testing password "${testPassword}" for each user:\n`);
    
    for (const user of result.rows) {
      console.log(`Testing user: ${user.username} (${user.role})`);
      console.log(`  Hash in DB: ${user.password_hash.substring(0, 20)}...`);
      
      try {
        const isValid = await bcrypt.compare(testPassword, user.password_hash);
        
        if (isValid) {
          console.log(`  ✓ Password VALID for ${user.username}`);
        } else {
          console.log(`  ✗ Password INVALID for ${user.username}`);
        }
      } catch (error) {
        console.log(`  ✗ Error comparing password: ${error.message}`);
      }
      console.log();
    }
    
    // Generate a fresh hash for reference
    console.log('4. Generating fresh bcrypt hash for "admin123":');
    const freshHash = await bcrypt.hash('admin123', 10);
    console.log(`  New hash: ${freshHash}`);
    console.log();
    
    // Test the fresh hash
    console.log('5. Verifying fresh hash works:');
    const freshTest = await bcrypt.compare('admin123', freshHash);
    console.log(`  ✓ Fresh hash verification: ${freshTest ? 'PASS' : 'FAIL'}`);
    console.log();
    
    console.log('='.repeat(60));
    console.log('SUMMARY:');
    console.log('='.repeat(60));
    
    let allValid = true;
    for (const user of result.rows) {
      const isValid = await bcrypt.compare(testPassword, user.password_hash);
      const status = isValid ? '✓ PASS' : '✗ FAIL';
      console.log(`${status} - ${user.username} (${user.role})`);
      if (!isValid) allValid = false;
    }
    
    console.log('='.repeat(60));
    
    if (!allValid) {
      console.log('\n⚠ ISSUE DETECTED: Some passwords are not working!');
      console.log('\nTo fix, run this SQL in pgAdmin4:');
      console.log(`\nUPDATE users SET password_hash = '${freshHash}' WHERE username IN ('admin', 'inspector1');\n`);
    } else {
      console.log('\n✓ All authentication tests passed!');
      console.log('You can now login with:');
      console.log('  Username: admin');
      console.log('  Password: admin123\n');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

testAuth();
