const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  console.log('🚀 Starting Stripe payment migration...\n');

  try {
    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'techhub_ecommerce',
    });

    console.log('✅ Connected to database');

    // Check if column already exists
    const [columns] = await connection.execute(
      `SHOW COLUMNS FROM orders LIKE 'stripe_payment_id'`
    );

    if (columns.length > 0) {
      console.log('⚠️  stripe_payment_id column already exists. Skipping migration.');
      await connection.end();
      return;
    }

    // Add stripe_payment_id column
    console.log('📝 Adding stripe_payment_id column to orders table...');
    await connection.execute(
      `ALTER TABLE orders ADD COLUMN stripe_payment_id VARCHAR(255) AFTER payment_reference`
    );
    console.log('✅ Column added successfully');

    // Create index for better performance
    console.log('📝 Creating index on stripe_payment_id...');
    await connection.execute(
      `CREATE INDEX idx_orders_stripe_payment_id ON orders(stripe_payment_id)`
    );
    console.log('✅ Index created successfully');

    await connection.end();
    console.log('\n✅ Migration completed successfully!\n');
    console.log('You can now use Stripe payments in your application.');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
runMigration();
