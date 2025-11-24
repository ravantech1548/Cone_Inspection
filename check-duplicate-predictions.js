import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'textile_inspector',
  user: 'textile_user',
  password: 'textile_pass_123'
});

async function checkDuplicates() {
  try {
    console.log('Checking for duplicate predictions...\n');
    
    // Find images with multiple predictions
    const result = await pool.query(`
      SELECT 
        i.id as image_id,
        i.filename,
        i.batch_id,
        COUNT(p.id) as prediction_count
      FROM images i
      LEFT JOIN predictions p ON i.id = p.image_id
      GROUP BY i.id, i.filename, i.batch_id
      HAVING COUNT(p.id) > 1
      ORDER BY COUNT(p.id) DESC, i.batch_id, i.id
    `);
    
    if (result.rows.length === 0) {
      console.log('✓ No duplicate predictions found!');
    } else {
      console.log(`✗ Found ${result.rows.length} images with duplicate predictions:\n`);
      
      result.rows.forEach(row => {
        console.log(`  Image ID: ${row.image_id}`);
        console.log(`  Filename: ${row.filename}`);
        console.log(`  Batch ID: ${row.batch_id}`);
        console.log(`  Predictions: ${row.prediction_count}`);
        console.log('');
      });
      
      // Show details of one example
      if (result.rows.length > 0) {
        const exampleImageId = result.rows[0].image_id;
        console.log(`\nDetails for Image ID ${exampleImageId}:`);
        
        const details = await pool.query(`
          SELECT 
            p.id,
            p.created_at,
            p.inference_time_ms,
            p.payload->>'predicted_class' as predicted_class,
            m.name as model_name,
            m.version as model_version
          FROM predictions p
          LEFT JOIN models m ON p.model_id = m.id
          WHERE p.image_id = $1
          ORDER BY p.created_at
        `, [exampleImageId]);
        
        details.rows.forEach((pred, idx) => {
          console.log(`  Prediction ${idx + 1}:`);
          console.log(`    ID: ${pred.id}`);
          console.log(`    Created: ${pred.created_at}`);
          console.log(`    Predicted Class: ${pred.predicted_class}`);
          console.log(`    Inference Time: ${pred.inference_time_ms}ms`);
          console.log(`    Model: ${pred.model_name}:${pred.model_version}`);
          console.log('');
        });
      }
    }
    
    // Total statistics
    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT i.id) as total_images,
        COUNT(p.id) as total_predictions,
        COUNT(p.id)::float / NULLIF(COUNT(DISTINCT i.id), 0) as avg_predictions_per_image
      FROM images i
      LEFT JOIN predictions p ON i.id = p.image_id
    `);
    
    console.log('\nDatabase Statistics:');
    console.log(`  Total Images: ${stats.rows[0].total_images}`);
    console.log(`  Total Predictions: ${stats.rows[0].total_predictions}`);
    console.log(`  Avg Predictions per Image: ${parseFloat(stats.rows[0].avg_predictions_per_image).toFixed(2)}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDuplicates();
