import puppeteer from "puppeteer";

(async () => {
  const url =
    "https://www.idp.com/universities-and-colleges/university-of-birmingham/msc-financial-management/PRG-UK-00121404/";

  // Launch Puppeteer
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Navigate to the page
  await page.goto(url, { waitUntil: "networkidle2" });

  // Extract the data
  const data = await page.evaluate(() => {
    // Helper function to extract text from elements
    const getText = (selector) => {
      const element = document.querySelector(selector);
      return element ? element.innerText.trim() : null;
    };

    // Extract main sections
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
    const courseInfoSections = courseInfoDiv.querySelectorAll("div.accordion");
    courseInfoSections.forEach((section) => {
      const title = section.querySelector("p.h3 button span")?.innerText.trim();
      const content = section
        .querySelector("div.faq-content")
        ?.innerText.trim();
      courseInfo[title] = content;
    });

    return {
      details,
      courseInfo,
    };
  });

  console.log(JSON.stringify(data, null, 2));

  // Close the browser
  await browser.close();
})();
