import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'textile_inspector',
  user: 'textile_user',
  password: 'textile_pass_123'
});

async function createInspectorUser() {
  try {
    console.log('Creating Inspector User...\n');
    
    // Check if user already exists
    const checkResult = await pool.query(
      'SELECT id, username FROM users WHERE username = $1',
      ['inspector']
    );
    
    if (checkResult.rows.length > 0) {
      console.log('✓ Inspector user already exists');
      console.log(`  ID: ${checkResult.rows[0].id}`);
      console.log(`  Username: ${checkResult.rows[0].username}`);
      console.log('\nUpdating password...');
      
      // Update password
      await pool.query(
        `UPDATE users 
         SET password_hash = $1 
         WHERE username = $2`,
        ['$2b$10$YMTRnChBzuQEOxIsewMQCOFjvKLsbxD0Pl4i3fH2XSwQGXb3NRnAy', 'inspector']
      );
      
      console.log('✓ Password updated successfully');
    } else {
      console.log('Creating new inspector user...');
      
      // Create user
      const result = await pool.query(
        `INSERT INTO users (username, password_hash, role)
         VALUES ($1, $2, $3)
         RETURNING id, username, role, created_at`,
        [
          'inspector',
          '$2b$10$YMTRnChBzuQEOxIsewMQCOFjvKLsbxD0Pl4i3fH2XSwQGXb3NRnAy',
          'inspector'
        ]
      );
      
      const user = result.rows[0];
      console.log('✓ Inspector user created successfully');
      console.log(`  ID: ${user.id}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Created: ${user.created_at}`);
    }
    
    console.log('\n✅ Inspector user is ready!');
    console.log('\nLogin Credentials:');
    console.log('  Username: inspector');
    console.log('  Password: inspector123');
    console.log('  Role: inspector');
    
  } catch (error) {
    console.error('\n✗ Error:');
    console.error(`  ${error.message}`);
  } finally {
    await pool.end();
  }
}

createInspectorUser();
