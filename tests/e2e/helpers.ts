import type { Page } from "@playwright/test";

/** The language control is a small menu button, not a select. */
export async function setLanguage(page: Page, value: "en" | "hi-Latn") {
  await page.getByRole("button", { name: "Language / Bhasha" }).click();
  await page.getByRole("menuitemradio", { name: value === "en" ? "English" : "Hinglish" }).click();
}

/** On phones the header links live in the menu panel. */
export async function openMenu(page: Page) {
  await page.getByTestId("menu-button").click();
}
