import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { checkPermissionOrThrow, checkAnyPermissionOrThrow, withPermissionCheck } from "../permissionMiddleware";
import * as permissions from "../permissions";

// Mock the permissions module
vi.mock("../permissions", () => ({
  getUserPermissions: vi.fn(),
  hasPermission: vi.fn(),
  hasAnyPermission: vi.fn(),
  hasAllPermissions: vi.fn(),
  PERMISSIONS: {
    "products.create": "Tạo sản phẩm mới",
    "products.edit": "Chỉnh sửa sản phẩm",
    "products.delete": "Xóa sản phẩm",
    "products.view": "Xem sản phẩm",
    "news.create": "Tạo tin tức",
    "news.edit": "Chỉnh sửa tin tức",
  },
}));

describe("Permission Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkPermissionOrThrow", () => {
    it("should not throw when user has permission", async () => {
      vi.mocked(permissions.hasPermission).mockResolvedValue(true);

      await expect(
        checkPermissionOrThrow(1, "products.create")
      ).resolves.not.toThrow();

      expect(permissions.hasPermission).toHaveBeenCalledWith(1, "products.create");
    });

    it("should throw FORBIDDEN when user lacks permission", async () => {
      vi.mocked(permissions.hasPermission).mockResolvedValue(false);

      await expect(
        checkPermissionOrThrow(1, "products.delete")
      ).rejects.toThrow(TRPCError);

      try {
        await checkPermissionOrThrow(1, "products.delete");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("FORBIDDEN");
        expect((error as TRPCError).message).toContain("products.delete");
      }
    });
  });

  describe("checkAnyPermissionOrThrow", () => {
    it("should not throw when user has any of the permissions", async () => {
      vi.mocked(permissions.hasAnyPermission).mockResolvedValue(true);

      await expect(
        checkAnyPermissionOrThrow(1, ["products.edit", "products.create"])
      ).resolves.not.toThrow();

      expect(permissions.hasAnyPermission).toHaveBeenCalledWith(
        1,
        ["products.edit", "products.create"]
      );
    });

    it("should throw FORBIDDEN when user lacks all permissions", async () => {
      vi.mocked(permissions.hasAnyPermission).mockResolvedValue(false);

      await expect(
        checkAnyPermissionOrThrow(1, ["products.delete", "news.create"])
      ).rejects.toThrow(TRPCError);

      try {
        await checkAnyPermissionOrThrow(1, ["products.delete", "news.create"]);
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("FORBIDDEN");
      }
    });
  });

  describe("withPermissionCheck", () => {
    it("should throw UNAUTHORIZED when userId is undefined", async () => {
      await expect(
        withPermissionCheck(undefined, "products.view")
      ).rejects.toThrow(TRPCError);

      try {
        await withPermissionCheck(undefined, "products.view");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("UNAUTHORIZED");
      }
    });

    it("should return user permissions when user has required permission", async () => {
      const mockPermissions = ["products.view", "products.create", "news.view"];
      vi.mocked(permissions.getUserPermissions).mockResolvedValue(mockPermissions as any);

      const result = await withPermissionCheck(1, "products.view");

      expect(result).toEqual(mockPermissions);
      expect(permissions.getUserPermissions).toHaveBeenCalledWith(1);
    });

    it("should throw FORBIDDEN when user lacks required permission", async () => {
      const mockPermissions = ["products.view", "news.view"];
      vi.mocked(permissions.getUserPermissions).mockResolvedValue(mockPermissions as any);

      await expect(
        withPermissionCheck(1, "products.delete")
      ).rejects.toThrow(TRPCError);

      try {
        await withPermissionCheck(1, "products.delete");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("FORBIDDEN");
        expect((error as TRPCError).message).toContain("products.delete");
      }
    });
  });

  describe("Error messages", () => {
    it("should include permission name in error message", async () => {
      vi.mocked(permissions.hasPermission).mockResolvedValue(false);

      try {
        await checkPermissionOrThrow(1, "products.edit");
      } catch (error) {
        expect((error as TRPCError).message).toContain("products.edit");
      }
    });

    it("should include all permission names in any permission error", async () => {
      vi.mocked(permissions.hasAnyPermission).mockResolvedValue(false);

      try {
        await checkAnyPermissionOrThrow(1, ["news.create", "news.edit"]);
      } catch (error) {
        expect((error as TRPCError).message).toContain("news.create");
        expect((error as TRPCError).message).toContain("news.edit");
      }
    });
  });
});
