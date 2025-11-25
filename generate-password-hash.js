import bcrypt from 'bcrypt';

async function generateHash() {
  const password = 'inspector123';
  const saltRounds = 10;
  
  try {
    console.log('Generating bcrypt hash for password: inspector123\n');
    
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('Generated Hash:');
    console.log(hash);
    console.log('\nSQL Command to update user:');
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE username = 'inspector';`);
    console.log('\nSQL Command to create new user:');
    console.log(`INSERT INTO users (username, password_hash, role)`);
    console.log(`VALUES ('inspector', '${hash}', 'inspector');`);
    
    // Verify the hash works
    console.log('\nVerifying hash...');
    const isValid = await bcrypt.compare(password, hash);
    console.log(`Hash verification: ${isValid ? '✓ Valid' : '✗ Invalid'}`);
    
  } catch (error) {
    console.error('Error generating hash:', error.message);
  }
}

generateHash();
