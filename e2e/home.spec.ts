import { test, expect } from "@playwright/test"

test.describe("Home Page", () => {
	test("should load the home page", async ({ page }) => {
		await page.goto("/")
		await expect(page).toHaveURL("/")
	})

	test("should have correct title", async ({ page }) => {
		await page.goto("/")
		await expect(page).toHaveTitle(/boilon/i)
	})

	test("should be accessible", async ({ page }) => {
		await page.goto("/")
		// Check that the page has a main landmark
		const main = page.locator("main")
		await expect(main).toBeVisible()
	})
})
