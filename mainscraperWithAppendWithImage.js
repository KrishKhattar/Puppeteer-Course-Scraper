// Import Puppeteer and filesystem module
import puppeteer from "puppeteer";
import fs from "fs";

// Helper function to append data to JSON file
function appendToJSONFile(fileName, data) {
  let existingData = [];
  try {
    if (fs.existsSync(fileName)) {
      const fileContent = fs.readFileSync(fileName, "utf8");
      existingData = fileContent ? JSON.parse(fileContent) : [];
    }
  } catch (error) {
    console.warn(`Failed to read or parse ${fileName}. Reinitializing.`);
    existingData = [];
  }

  existingData.push(data);
  fs.writeFileSync(fileName, JSON.stringify(existingData, null, 2));
}

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

  // Function to extract data from a single link
  async function extractDataFromLink(page, url) {
    await page.goto(url, { waitUntil: "networkidle2" });

    return await page.evaluate(() => {
      const detailsDiv = document.querySelector(
        "div.grid.grid-cols-2.px-\\[16px\\]"
      );
      const courseInfoDiv = document.querySelector("div.c-lg\\:col-span-3");

      // Extract details from the first grid
      const details = Array.from(
        detailsDiv.querySelectorAll("div.flex.flex-col")
      ).map((div) => {
        const label = div.querySelector("p.font-semibold")?.innerText.trim();
        const value = div.querySelector("p.text-heading-6")?.innerText.trim();
        return { [label]: value };
      });

      // Extract course information
      const courseInfo = {};
      const courseInfoSections =
        courseInfoDiv.querySelectorAll("div.accordion");
      courseInfoSections.forEach((section) => {
        const title = section
          .querySelector("p.h3 button span")
          ?.innerText.trim();
        const content = section
          .querySelector("div.faq-content")
          ?.innerText.trim();
        courseInfo[title] = content;
      });

      // Extract the image src
      const imgElement = document.querySelector(
        "img.h-\\[72px\\].p-\\[2px\\].object-contain.rounded-\\[12px\\].shadow-custom-10"
      );
      const imageSrc = imgElement ? imgElement.src : null;

      return {
        details,
        courseInfo,
        imageSrc, // Add the extracted image src to the result
      };
    });
  }

  // Launch Puppeteer
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  const baseUrl = "https://www.idp.com/find-a-course/?page=";
  const startPage = 6729;
  const endPage = 10000;
  const outputFile = "Finaldata.json";

  // Initialize data file
  if (!fs.existsSync(outputFile)) {
    fs.writeFileSync(outputFile, JSON.stringify([], null, 2));
  }

  for (let i = startPage; i <= endPage; i++) {
    console.log(`Scraping page ${i}...`);
    const pageUrl = `${baseUrl}${i}`;
    const links = await scrapeLinks(page, pageUrl);

    for (const link of links) {
      console.log(`Extracting data from: ${link}`);
      try {
        const data = await extractDataFromLink(page, link);
        appendToJSONFile(outputFile, { url: link, ...data });
        console.log(`Data from ${link} appended to ${outputFile}`);
      } catch (error) {
        console.error(`Failed to extract data from ${link}:`, error);
      }
    }
  }

  console.log(`Data scraping complete. Check the file ${outputFile}`);
  await browser.close();
})();
