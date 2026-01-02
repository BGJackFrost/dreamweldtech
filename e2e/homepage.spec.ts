import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('should load homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Dreamweldtech/);
    await expect(page.locator('h1')).toContainText('MÁY HÀN LASER');
  });

  test('should display banner slider', async ({ page }) => {
    const banner = page.locator('[data-testid="banner-slider"]');
    await expect(banner).toBeVisible();
  });

  test('should navigate to products page', async ({ page }) => {
    await page.click('a:has-text("PRODUCTS")');
    await expect(page).toHaveURL(/\/products/);
  });

  test('should navigate to about page', async ({ page }) => {
    await page.click('a:has-text("ABOUT US")');
    await expect(page).toHaveURL(/\/about/);
  });

  test('should navigate to contact page', async ({ page }) => {
    await page.click('a:has-text("CONTACT")');
    await expect(page).toHaveURL(/\/contact/);
  });

  test('should toggle dark mode', async ({ page }) => {
    const darkModeButton = page.locator('button[aria-label="Toggle dark mode"]');
    await expect(darkModeButton).toBeVisible();
    await darkModeButton.click();
    
    // Check if dark mode is applied
    const html = page.locator('html');
    const classList = await html.evaluate(el => el.className);
    expect(classList).toContain('dark');
  });

  test('should search for products', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Tìm kiếm"]');
    await searchInput.fill('laser');
    await page.keyboard.press('Enter');
    
    await expect(page).toHaveURL(/search|products/);
  });

  test('should display footer links', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    const links = footer.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Navigation', () => {
  test('should have working navigation menu', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const navItems = ['HOME', 'ABOUT US', 'PRODUCTS', 'PARTNERS', 'NEWS', 'CAREERS', 'CONTACT'];
    
    for (const item of navItems) {
      const navLink = page.locator(`a:has-text("${item}")`);
      await expect(navLink).toBeVisible();
    }
  });

  test('should have mobile hamburger menu', async ({ page, context }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    
    const hamburgerButton = page.locator('button[aria-label*="menu"]');
    await expect(hamburgerButton).toBeVisible();
    
    await hamburgerButton.click();
    const mobileMenu = page.locator('[role="navigation"]');
    await expect(mobileMenu).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    
    // Check if main content is visible
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    
    // Check if text is readable
    const heading = page.locator('h1');
    const boundingBox = await heading.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(375);
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL);
    
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should be responsive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(BASE_URL);
    
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});
