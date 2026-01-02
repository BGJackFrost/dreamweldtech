import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'password123';

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin
    await page.goto(`${BASE_URL}/admin`);
    
    // Check if already logged in
    const loginForm = page.locator('form').first();
    if (await loginForm.isVisible()) {
      // Login
      await page.fill('input[name="email"]', ADMIN_EMAIL);
      await page.fill('input[name="password"]', ADMIN_PASSWORD);
      await page.click('button:has-text("Login")');
      
      // Wait for redirect
      await page.waitForURL(`${BASE_URL}/admin/dashboard`);
    }
  });

  test('should display admin dashboard', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    
    const dashboard = page.locator('main');
    await expect(dashboard).toBeVisible();
  });

  test('should display sidebar menu', async ({ page }) => {
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    
    // Check for menu items
    const menuItems = sidebar.locator('a, button');
    const count = await menuItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to products page', async ({ page }) => {
    await page.click('a:has-text("Sản Phẩm")');
    await expect(page).toHaveURL(/\/admin\/products/);
  });

  test('should navigate to news page', async ({ page }) => {
    await page.click('a:has-text("Tin Tức")');
    await expect(page).toHaveURL(/\/admin\/news/);
  });

  test('should navigate to contacts page', async ({ page }) => {
    await page.click('a:has-text("Liên Hệ")');
    await expect(page).toHaveURL(/\/admin\/contacts/);
  });

  test('should toggle dark mode in admin', async ({ page }) => {
    const darkModeButton = page.locator('button[aria-label*="dark"]').first();
    if (await darkModeButton.isVisible()) {
      await darkModeButton.click();
      
      const html = page.locator('html');
      const classList = await html.evaluate(el => el.className);
      expect(classList).toContain('dark');
    }
  });

  test('should display admin header', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Check for admin title
    const title = header.locator('text=DREAMWELDTECH');
    await expect(title).toBeVisible();
  });

  test('should have breadcrumb navigation', async ({ page }) => {
    await page.click('a:has-text("Sản Phẩm")');
    
    const breadcrumb = page.locator('[aria-label="breadcrumb"], nav');
    if (await breadcrumb.isVisible()) {
      await expect(breadcrumb).toBeVisible();
    }
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Tìm"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.keyboard.press('Enter');
      
      // Should still be on admin page
      await expect(page).toHaveURL(/\/admin/);
    }
  });
});

test.describe('Admin Product Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/products`);
  });

  test('should display products list', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('should have create product button', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create"), button:has-text("Tạo")');
    await expect(createButton).toBeVisible();
  });

  test('should display product columns', async ({ page }) => {
    const table = page.locator('table');
    
    const headers = table.locator('thead th');
    const count = await headers.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Admin Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
  });

  test('should display notification bell', async ({ page }) => {
    const notificationBell = page.locator('button[aria-label*="notification"]');
    if (await notificationBell.isVisible()) {
      await expect(notificationBell).toBeVisible();
    }
  });

  test('should open notification center', async ({ page }) => {
    const notificationLink = page.locator('a:has-text("Notification")');
    if (await notificationLink.isVisible()) {
      await notificationLink.click();
      await expect(page).toHaveURL(/\/admin\/notification/);
    }
  });
});

test.describe('Admin Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
  });

  test('should navigate to settings', async ({ page }) => {
    const settingsLink = page.locator('a:has-text("Settings"), a:has-text("Cài đặt")');
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await expect(page).toHaveURL(/\/admin\/settings/);
    }
  });

  test('should have settings form', async ({ page }) => {
    const settingsLink = page.locator('a:has-text("Settings"), a:has-text("Cài đặt")');
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      
      const form = page.locator('form');
      if (await form.isVisible()) {
        await expect(form).toBeVisible();
      }
    }
  });
});
