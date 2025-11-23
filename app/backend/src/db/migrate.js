import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const runMigrations = async () => {
  try {
    console.log('Running database migrations...');
    
    // Create migrations table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get executed migrations
    const executedResult = await query('SELECT filename FROM migrations');
    const executed = new Set(executedResult.rows.map(r => r.filename));
    
    // Read migration files
    const migrationsDir = path.resolve(__dirname, '../../../db/migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
    
    for (const file of sqlFiles) {
      if (executed.has(file)) {
        console.log(`Skipping ${file} (already executed)`);
        continue;
      }
      
      console.log(`Executing ${file}...`);
      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf-8');
      
      await query('BEGIN');
      try {
        await query(sql);
        await query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
        await query('COMMIT');
        console.log(`✓ ${file} executed successfully`);
      } catch (error) {
        await query('ROLLBACK');
        throw error;
      }
    }
    
    // Run seeds if needed
    const seedsDir = path.resolve(__dirname, '../../../db/seeds');
    try {
      const seedFiles = await fs.readdir(seedsDir);
      const sqlSeeds = seedFiles.filter(f => f.endsWith('.sql')).sort();
      
      for (const file of sqlSeeds) {
        if (executed.has(`seed_${file}`)) {
          console.log(`Skipping seed ${file} (already executed)`);
          continue;
        }
        
        console.log(`Executing seed ${file}...`);
        const sql = await fs.readFile(path.join(seedsDir, file), 'utf-8');
        
        await query('BEGIN');
        try {
          await query(sql);
          await query('INSERT INTO migrations (filename) VALUES ($1)', [`seed_${file}`]);
          await query('COMMIT');
          console.log(`✓ Seed ${file} executed successfully`);
        } catch (error) {
          await query('ROLLBACK');
          console.error(`Error executing seed ${file}:`, error.message);
        }
      }
    } catch (error) {
      console.log('No seeds directory found, skipping seeds');
    }
    
    console.log('Migrations complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();
