import pg from 'pg';
import bcrypt from 'bcrypt';
const { Pool } = pg;

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'textile_inspector',
  user: 'textile_user',
  password: 'textile_pass_123'
});

async function testInspectorLogin() {
  try {
    console.log('Testing Inspector Login...\n');
    
    const username = 'inspector';
    const password = 'inspector123';
    
    // Query user from database
    console.log(`1. Checking if user '${username}' exists...`);
    const result = await pool.query(
      'SELECT id, username, password_hash, role, created_at FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      console.log(`✗ User '${username}' not found in database`);
      console.log('\nTo create the user, run:');
      console.log(`psql -U textile_user -d textile_inspector -h 127.0.0.1`);
      console.log(`INSERT INTO users (username, password_hash, role)`);
      console.log(`VALUES ('inspector', '$2b$10$YMTRnChBzuQEOxIsewMQCOFjvKLsbxD0Pl4i3fH2XSwQGXb3NRnAy', 'inspector');`);
      return;
    }
    
    const user = result.rows[0];
    console.log(`✓ User found in database`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Created: ${user.created_at}`);
    console.log(`  Password Hash: ${user.password_hash.substring(0, 20)}...`);
    
    // Test password
    console.log(`\n2. Testing password '${password}'...`);
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (isValid) {
      console.log(`✓ Password is CORRECT!`);
      console.log(`\n✅ Login Test PASSED`);
      console.log(`\nYou can login with:`);
      console.log(`  Username: ${username}`);
      console.log(`  Password: ${password}`);
    } else {
      console.log(`✗ Password is INCORRECT`);
      console.log(`\n❌ Login Test FAILED`);
      console.log(`\nThe password hash in database doesn't match '${password}'`);
      console.log(`\nTo fix, update the password hash:`);
      console.log(`psql -U textile_user -d textile_inspector -h 127.0.0.1`);
      console.log(`UPDATE users SET password_hash = '$2b$10$YMTRnChBzuQEOxIsewMQCOFjvKLsbxD0Pl4i3fH2XSwQGXb3NRnAy' WHERE username = 'inspector';`);
    }
    
    // Test all users
    console.log(`\n3. Listing all users in database...`);
    const allUsers = await pool.query(
      'SELECT id, username, role, created_at FROM users ORDER BY id'
    );
    
    console.log(`\nTotal users: ${allUsers.rows.length}`);
    allUsers.rows.forEach(u => {
      console.log(`  - ${u.username} (${u.role}) - ID: ${u.id}`);
    });
    
  } catch (error) {
    console.error('\n✗ Error during test:');
    console.error(`  ${error.message}`);
    if (error.code) {
      console.error(`  Error Code: ${error.code}`);
    }
  } finally {
    await pool.end();
  }
}

testInspectorLogin();
