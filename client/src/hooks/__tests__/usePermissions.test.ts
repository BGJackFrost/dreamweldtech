import { describe, it, expect } from "vitest";
import { MENU_PERMISSIONS, PERMISSION_LABELS } from "../usePermissions";

describe("usePermissions", () => {
  describe("PERMISSION_LABELS", () => {
    it("should have labels for all permission types", () => {
      const expectedPermissions = [
        "dashboard.view",
        "dashboard.analytics",
        "products.view",
        "products.create",
        "products.edit",
        "products.delete",
        "products.categories",
        "news.view",
        "news.create",
        "news.edit",
        "news.delete",
        "news.publish",
        "contacts.view",
        "contacts.reply",
        "contacts.delete",
        "quotes.view",
        "quotes.reply",
        "quotes.delete",
        "applications.view",
        "applications.manage",
        "applications.delete",
        "jobs.view",
        "jobs.create",
        "jobs.edit",
        "jobs.delete",
        "casestudies.view",
        "casestudies.create",
        "casestudies.edit",
        "casestudies.delete",
        "newsletter.view",
        "newsletter.export",
        "newsletter.delete",
        "users.view",
        "users.create",
        "users.edit",
        "users.delete",
        "users.roles",
        "roles.view",
        "roles.create",
        "roles.edit",
        "roles.delete",
        "settings.view",
        "settings.edit",
        "settings.seo",
        "settings.security",
        "media.view",
        "media.upload",
        "media.delete",
        "reports.view",
        "reports.export",
        "reports.schedule",
        "system.logs",
        "system.backup",
        "system.maintenance",
      ];

      expectedPermissions.forEach((permission) => {
        expect(PERMISSION_LABELS).toHaveProperty(permission);
        expect(typeof PERMISSION_LABELS[permission as keyof typeof PERMISSION_LABELS]).toBe("string");
        expect(PERMISSION_LABELS[permission as keyof typeof PERMISSION_LABELS].length).toBeGreaterThan(0);
      });
    });

    it("should have Vietnamese labels", () => {
      // Check some key labels are in Vietnamese
      expect(PERMISSION_LABELS["dashboard.view"]).toBe("Xem dashboard");
      expect(PERMISSION_LABELS["products.create"]).toBe("Tạo sản phẩm mới");
      expect(PERMISSION_LABELS["users.delete"]).toBe("Xóa người dùng");
    });
  });

  describe("MENU_PERMISSIONS", () => {
    it("should have permission mappings for admin routes", () => {
      expect(MENU_PERMISSIONS["/admin"]).toContain("dashboard.view");
      expect(MENU_PERMISSIONS["/admin/products"]).toContain("products.view");
      expect(MENU_PERMISSIONS["/admin/news"]).toContain("news.view");
      expect(MENU_PERMISSIONS["/admin/contacts"]).toContain("contacts.view");
      expect(MENU_PERMISSIONS["/admin/users"]).toContain("users.view");
      expect(MENU_PERMISSIONS["/admin/roles"]).toContain("roles.view");
    });

    it("should have permission mappings for security routes", () => {
      expect(MENU_PERMISSIONS["/admin/security/2fa"]).toContain("settings.security");
      expect(MENU_PERMISSIONS["/admin/security/sessions"]).toContain("settings.security");
      expect(MENU_PERMISSIONS["/admin/security/dashboard"]).toContain("settings.security");
    });

    it("should have permission mappings for system routes", () => {
      expect(MENU_PERMISSIONS["/admin/activity-log"]).toContain("system.logs");
      expect(MENU_PERMISSIONS["/admin/backup"]).toContain("system.backup");
    });

    it("should return arrays for all menu items", () => {
      Object.values(MENU_PERMISSIONS).forEach((permissions) => {
        expect(Array.isArray(permissions)).toBe(true);
        expect(permissions.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Permission categories", () => {
    it("should cover all major admin sections", () => {
      const categories = [
        "dashboard",
        "products",
        "news",
        "contacts",
        "quotes",
        "applications",
        "jobs",
        "casestudies",
        "newsletter",
        "users",
        "roles",
        "settings",
        "media",
        "reports",
        "system",
      ];

      categories.forEach((category) => {
        const categoryPermissions = Object.keys(PERMISSION_LABELS).filter((p) =>
          p.startsWith(`${category}.`)
        );
        expect(categoryPermissions.length).toBeGreaterThan(0);
      });
    });

    it("should have CRUD permissions for main entities", () => {
      const entities = ["products", "news", "jobs", "casestudies"];

      entities.forEach((entity) => {
        expect(PERMISSION_LABELS).toHaveProperty(`${entity}.view`);
        expect(PERMISSION_LABELS).toHaveProperty(`${entity}.create`);
        expect(PERMISSION_LABELS).toHaveProperty(`${entity}.edit`);
        expect(PERMISSION_LABELS).toHaveProperty(`${entity}.delete`);
      });
    });
  });
});
