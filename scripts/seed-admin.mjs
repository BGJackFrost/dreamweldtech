/**
 * Script để tạo admin user mặc định
 * Chạy: node scripts/seed-admin.mjs
 * 
 * Mặc định:
 * - Username: admin
 * - Password: Admin@123
 * - Email: admin@dreamweldtech.vn
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Default admin credentials
const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'Admin@123',
  name: 'Administrator',
  email: 'admin@dreamweldtech.vn',
};

async function seedAdmin() {
  console.log('🚀 Starting admin seed script...\n');

  // Parse DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set in .env file');
    process.exit(1);
  }

  // Parse MySQL connection string
  const url = new URL(databaseUrl);
  const config = {
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  };

  console.log(`📦 Connecting to database: ${config.database}@${config.host}:${config.port}`);

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Database connected\n');

    // Check if admin already exists
    const [existingAdmins] = await connection.execute(
      'SELECT id, username, email FROM users WHERE role = ?',
      ['admin']
    );

    if (existingAdmins.length > 0) {
      console.log('⚠️  Admin user already exists:');
      existingAdmins.forEach((admin) => {
        console.log(`   - ID: ${admin.id}, Username: ${admin.username}, Email: ${admin.email}`);
      });
      console.log('\n💡 If you want to reset the admin password, use the following SQL:');
      console.log(`   UPDATE users SET passwordHash = '<new_hash>' WHERE username = 'admin';`);
      console.log('\n   Or delete existing admin and run this script again.');
      return;
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 12);

    // Insert admin user
    console.log('👤 Creating admin user...');
    const [result] = await connection.execute(
      `INSERT INTO users (openId, username, passwordHash, name, email, loginMethod, role, createdAt, updatedAt, lastSignedIn)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
      [
        `local-admin-${Date.now()}`,
        DEFAULT_ADMIN.username,
        passwordHash,
        DEFAULT_ADMIN.name,
        DEFAULT_ADMIN.email,
        'local',
        'admin',
      ]
    );

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   📧 Username: ' + DEFAULT_ADMIN.username);
    console.log('   🔑 Password: ' + DEFAULT_ADMIN.password);
    console.log('   📬 Email:    ' + DEFAULT_ADMIN.email);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('   Login at: https://dreamweldtech.vn/admin/login');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n📦 Database connection closed');
    }
  }
}

// Run the script
seedAdmin();
