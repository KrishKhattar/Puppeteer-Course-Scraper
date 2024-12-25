import puppeteer from "puppeteer";
import fs from "fs";

(async () => {
  // Function to scrape links from a single page
  async function scrapeLinks(page, url) {
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Extract links from the specified anchor tags
    return await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll(
          "a.h4.font-heading.text-grey.mt-\\[4px\\].mb-\\[4px\\].hover\\:text-primary-petal.group-hover\\:text-primary-petal.hover\\:no-underline.transition-all.text-truncate"
        )
      ).map((anchor) => anchor.href);
    });
  }

  // Launch Puppeteer
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const baseUrl = "https://www.idp.com/find-a-course/?page=";
  const totalPages = 5; // Change this to the number of pages you want to scrape
  const allLinks = [];

  for (let i = 1; i <= totalPages; i++) {
    console.log(`Scraping page ${i}...`);
    const pageUrl = `${baseUrl}${i}`;
    const links = await scrapeLinks(page, pageUrl);
    allLinks.push(...links);
  }

  // Save links to a JSON file
  fs.writeFileSync("links.json", JSON.stringify(allLinks, null, 2));
  console.log("Links saved to links.json");

  // Close the browser
  await browser.close();
})();
