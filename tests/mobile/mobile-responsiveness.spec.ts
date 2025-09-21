import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
  test('should load game without horizontal scroll on mobile', async ({ page }) => {
    await page.goto('/');

    // Check that page loads
    await expect(page.locator('#game-container')).toBeVisible();

    // Verify no horizontal scrollbar
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // Allow 1px tolerance
  });

  test('should have proper viewport scaling', async ({ page }) => {
    await page.goto('/');

    // Check viewport meta tag
    const viewportMeta = await page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toHaveAttribute('content', /viewport-fit=cover/);
  });

  test('should display fullscreen button on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000); // Wait for managers to initialize

    // Check if fullscreen button appears (may take a moment to initialize)
    const fullscreenButton = page.locator('.fullscreen-toggle-btn');
    await expect(fullscreenButton).toBeVisible({ timeout: 5000 });
  });

  test('should handle orientation changes gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get initial viewport dimensions
    const initialViewport = await page.viewportSize();

    // Simulate orientation change by rotating viewport
    if (initialViewport) {
      await page.setViewportSize({
        width: initialViewport.height,
        height: initialViewport.width
      });

      // Game should still be visible and functional
      await expect(page.locator('#game-container')).toBeVisible();
    }
  });

  test('should have touch-friendly button sizes', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000); // Wait for game to load

    // Check that interactive elements meet minimum touch target size (44px)
    const buttons = await page.locator('button, [role="button"]').all();

    for (const button of buttons) {
      if (await button.isVisible()) {
        const boundingBox = await button.boundingBox();
        if (boundingBox) {
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });
});

test.describe('Touch Input', () => {
  test('should respond to touch events', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try tapping the game area
    const gameContainer = page.locator('#game-container');
    await expect(gameContainer).toBeVisible();

    // Simulate touch event
    await gameContainer.tap();

    // Game should still be responsive
    await expect(gameContainer).toBeVisible();
  });

  test('should prevent page scrolling during gameplay', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check CSS touch-action properties
    const body = page.locator('body');
    const touchAction = await body.evaluate(el =>
      getComputedStyle(el).getPropertyValue('overscroll-behavior')
    );
    expect(touchAction).toBe('none');
  });
});

test.describe('Performance on Mobile', () => {
  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
  });

  test('should not consume excessive memory', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait a bit for game to initialize
    await page.waitForTimeout(3000);

    const memoryInfo = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      } : null;
    });

    if (memoryInfo) {
      // Memory usage should be reasonable (less than 50MB for a simple game)
      expect(memoryInfo.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024);
    }
  });
});