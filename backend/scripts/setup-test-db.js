#!/usr/bin/env node

/**
 * Test Database Setup Script
 * Creates the test database and runs migrations and seeds
 */

const { Client } = require('pg');
const { execSync } = require('child_process');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_USER = process.env.DB_USER || 'apms_user';
const DB_PASSWORD = process.env.DB_PASSWORD || 'apms_password';
const DB_NAME = 'apms_test';

async function setupTestDatabase() {
  console.log('🔧 Setting up test database...\n');

  // Connect to postgres database to create test database
  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: 'postgres'
  });

  try {
    await client.connect();
    console.log('✓ Connected to PostgreSQL server');

    // Drop existing test database if it exists
    console.log(`\n🗑️  Dropping existing database '${DB_NAME}' if exists...`);
    await client.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
    console.log('✓ Dropped existing database');

    // Create test database
    console.log(`\n🔨 Creating database '${DB_NAME}'...`);
    await client.query(`CREATE DATABASE ${DB_NAME}`);
    console.log('✓ Database created successfully');

    await client.end();

    // Run migrations
    console.log('\n📦 Running migrations...');
    execSync('npm run migrate:test', {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'test',
        DB_HOST,
        DB_PORT,
        DB_USER,
        DB_PASSWORD,
        DB_NAME
      }
    });
    console.log('✓ Migrations completed');

    // Run seeds
    console.log('\n🌱 Seeding database...');
    execSync('npm run seed:test', {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'test',
        DB_HOST,
        DB_PORT,
        DB_USER,
        DB_PASSWORD,
        DB_NAME
      }
    });
    console.log('✓ Seeding completed');

    console.log('\n✅ Test database setup complete!\n');
    console.log('You can now run tests with: npm test');

  } catch (error) {
    console.error('\n❌ Error setting up test database:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure PostgreSQL is running:');
      console.error('   - Docker: docker-compose up -d postgres');
      console.error('   - Linux: sudo service postgresql start');
      console.error('   - macOS: brew services start postgresql');
      console.error('   - Windows: Check Services or pg_ctl start');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n💡 Check your database credentials:');
      console.error(`   - User: ${DB_USER}`);
      console.error(`   - Password: ${DB_PASSWORD}`);
      console.error(`   - Host: ${DB_HOST}:${DB_PORT}`);
    } else if (error.message.includes('permission denied')) {
      console.error('\n💡 Make sure the database user has CREATE DATABASE permission:');
      console.error(`   psql -U postgres -c "ALTER USER ${DB_USER} CREATEDB;"`);
    }

    process.exit(1);
  }
}

setupTestDatabase();
