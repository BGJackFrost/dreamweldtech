/**
 * Script khởi tạo vai trò mặc định và user admin
 * Chạy: node scripts/init-roles.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Schema imports
const adminRolesSchema = {
  id: "id",
  name: "name",
  description: "description",
  permissions: "permissions",
  isSystem: "isSystem",
};

// Default roles with permissions
const DEFAULT_ROLES = {
  super_admin: {
    name: "Super Admin",
    description: "Quyền cao nhất, có thể truy cập tất cả chức năng",
    permissions: [
      "dashboard.view", "dashboard.analytics",
      "products.view", "products.create", "products.edit", "products.delete", "products.categories",
      "news.view", "news.create", "news.edit", "news.delete", "news.publish",
      "contacts.view", "contacts.reply", "contacts.delete",
      "quotes.view", "quotes.reply", "quotes.delete",
      "applications.view", "applications.manage", "applications.delete",
      "jobs.view", "jobs.create", "jobs.edit", "jobs.delete",
      "casestudies.view", "casestudies.create", "casestudies.edit", "casestudies.delete",
      "newsletter.view", "newsletter.export", "newsletter.delete",
      "users.view", "users.create", "users.edit", "users.delete", "users.roles",
      "roles.view", "roles.create", "roles.edit", "roles.delete",
      "settings.view", "settings.edit", "settings.seo", "settings.security",
      "media.view", "media.upload", "media.delete",
      "reports.view", "reports.export", "reports.schedule",
      "system.logs", "system.backup", "system.maintenance",
    ],
    isSystem: "true",
  },
  admin: {
    name: "Admin",
    description: "Quản trị viên, có thể quản lý nội dung và người dùng",
    permissions: [
      "dashboard.view", "dashboard.analytics",
      "products.view", "products.create", "products.edit", "products.delete", "products.categories",
      "news.view", "news.create", "news.edit", "news.delete", "news.publish",
      "contacts.view", "contacts.reply", "contacts.delete",
      "quotes.view", "quotes.reply", "quotes.delete",
      "applications.view", "applications.manage", "applications.delete",
      "jobs.view", "jobs.create", "jobs.edit", "jobs.delete",
      "casestudies.view", "casestudies.create", "casestudies.edit", "casestudies.delete",
      "newsletter.view", "newsletter.export", "newsletter.delete",
      "users.view", "users.create", "users.edit",
      "settings.view", "settings.edit", "settings.seo",
      "media.view", "media.upload", "media.delete",
      "reports.view", "reports.export",
    ],
    isSystem: "true",
  },
  editor: {
    name: "Editor",
    description: "Biên tập viên, có thể quản lý nội dung",
    permissions: [
      "dashboard.view",
      "products.view", "products.create", "products.edit",
      "news.view", "news.create", "news.edit", "news.publish",
      "contacts.view", "contacts.reply",
      "quotes.view", "quotes.reply",
      "casestudies.view", "casestudies.create", "casestudies.edit",
      "media.view", "media.upload",
    ],
    isSystem: "true",
  },
  viewer: {
    name: "Viewer",
    description: "Chỉ có quyền xem",
    permissions: [
      "dashboard.view",
      "products.view",
      "news.view",
      "contacts.view",
      "quotes.view",
      "applications.view",
      "jobs.view",
      "casestudies.view",
      "newsletter.view",
      "media.view",
      "reports.view",
    ],
    isSystem: "true",
  },
};

async function main() {
  console.log("🚀 Bắt đầu khởi tạo vai trò và user admin...\n");

  // Get database URL from environment
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL không được cấu hình");
    process.exit(1);
  }

  // Parse database URL
  const url = new URL(dbUrl);
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  });

  try {
    // 1. Create default roles
    console.log("📋 Tạo vai trò mặc định...");
    
    for (const [key, roleData] of Object.entries(DEFAULT_ROLES)) {
      // Check if role exists
      const [existingRows] = await connection.execute(
        "SELECT id FROM admin_roles WHERE name = ?",
        [roleData.name]
      );

      if (existingRows.length === 0) {
        await connection.execute(
          "INSERT INTO admin_roles (name, description, permissions, isSystem) VALUES (?, ?, ?, ?)",
          [roleData.name, roleData.description, JSON.stringify(roleData.permissions), roleData.isSystem]
        );
        console.log(`  ✅ Tạo vai trò: ${roleData.name}`);
      } else {
        // Update permissions for existing system roles
        await connection.execute(
          "UPDATE admin_roles SET permissions = ?, description = ? WHERE name = ?",
          [JSON.stringify(roleData.permissions), roleData.description, roleData.name]
        );
        console.log(`  🔄 Cập nhật vai trò: ${roleData.name}`);
      }
    }

    // 2. Check if admin user exists
    console.log("\n👤 Kiểm tra user admin...");
    
    const [adminRows] = await connection.execute(
      "SELECT id, username, email, role FROM users WHERE role = 'admin' LIMIT 1"
    );

    if (adminRows.length > 0) {
      const admin = adminRows[0];
      console.log(`  ✅ Admin đã tồn tại: ${admin.username || admin.email}`);
      
      // Assign Super Admin role if not already assigned
      const [superAdminRole] = await connection.execute(
        "SELECT id FROM admin_roles WHERE name = 'Super Admin' LIMIT 1"
      );
      
      if (superAdminRole.length > 0) {
        const [existingAssignment] = await connection.execute(
          "SELECT id FROM user_admin_roles WHERE userId = ? AND roleId = ?",
          [admin.id, superAdminRole[0].id]
        );
        
        if (existingAssignment.length === 0) {
          await connection.execute(
            "INSERT INTO user_admin_roles (userId, roleId, assignedBy) VALUES (?, ?, ?)",
            [admin.id, superAdminRole[0].id, admin.id]
          );
          console.log(`  ✅ Gán vai trò Super Admin cho: ${admin.username || admin.email}`);
        } else {
          console.log(`  ℹ️ User đã có vai trò Super Admin`);
        }
      }
    } else {
      console.log("  ⚠️ Chưa có admin. Vui lòng tạo admin đầu tiên qua trang /admin/login");
    }

    console.log("\n✅ Hoàn thành khởi tạo!");
    
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
