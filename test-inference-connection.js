import https from 'https';

console.log('Testing connection to inference service...\n');

const url = 'https://localhost:5000/api/model-info';

// Create agent that allows self-signed certificates
const agent = new https.Agent({
  rejectUnauthorized: false
});

try {
  const response = await fetch(url, { agent });
  
  if (response.ok) {
    const data = await response.json();
    console.log('✓ Connection successful!\n');
    console.log('Model Info:');
    console.log('  Classes:', data.classes);
    console.log('  Num Classes:', data.num_classes);
    console.log('  Model Type:', data.model_type);
    console.log('\nThe inference service is working correctly.');
    console.log('If the frontend still shows "0 classes", restart the backend:');
    console.log('  1. Stop backend (Ctrl+C)');
    console.log('  2. cd app/backend');
    console.log('  3. npm start');
  } else {
    console.log('✗ Connection failed');
    console.log('Status:', response.status);
    console.log('Response:', await response.text());
  }
} catch (error) {
  console.log('✗ Connection error:', error.message);
  console.log('\nPossible issues:');
  console.log('  1. Inference service not running');
  console.log('  2. Wrong URL in .env');
  console.log('  3. Firewall blocking connection');
}
