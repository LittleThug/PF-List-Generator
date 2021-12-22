const puppeteer = require("puppeteer");
const fs = require("fs");

const email = "tommy-lee.davies@raywhite.com";
const pwd = "TommyL04";

let streetNumber = "12";
let streetName = "queens road";
let suburb = "melbourne";
let postCode = "3004";

const url =
  "https://www.pricefinder.com.au/portal/app?page=ExternalLogin&service=page";

bot();
async function bot() {
  const browser = await puppeteer.launch({
    headless: false,
    args: [`--window-size=1920,1080`],
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
  });

  const page = await browser.newPage();

  await page.goto(url);
  await page.type("#inputEmail", email, { delay: 100 });
  await page.type("#inputPassword", pwd, { delay: 100 });
  const [loginBtn] = await page.$x(
    "/html/body/div[1]/div[2]/div/div[2]/form/p[3]/button"
  );
  await loginBtn.click();
  await page.waitForNavigation();
  await page.waitForSelector("#ImageSubmit");

  const [acceptBtn] = await page.$x('//*[@id="ImageSubmit"]');
  await acceptBtn.click();
  await page.waitForNavigation();

  const [propspectingBtn] = await page.$x(
    "/html/body/div[3]/table/tbody/tr[2]/td[2]/table/tbody/tr/td/div[1]/div/div[5]/div/div/div[1]/ul/li[2]/div/a"
  );
  await propspectingBtn.click();
  await page.waitForSelector("#addressStreetNumberToInput_0");
  await page.type("#addressStreetNumberToInput_0", streetNumber, {
    delay: 100,
  });
  await page.type("#addressStreetNumberFromInput_0", streetNumber, {
    delay: 100,
  });
  await page.type("#addressStreetNameInput_0", streetName, { delay: 100 });
  await page.type("#addressSuburbNameInput_0", suburb, { delay: 100 });

  let [searchBtn] = await page.$x('//*[@id="aSubmitButton_0"]');
  await searchBtn.click();
  await page.waitForNavigation();

  const [queensBtn] = await page.$x('//*[@id="streetNameLink_319"]');
  await queensBtn.click();
  await page.waitForNavigation();

  const [includeNonOwnerCheckbox] = await page.$x(
    '//*[@id="includeNonOwnerOccupierInput"]'
  );
  await includeNonOwnerCheckbox.click();
  await page.select("#tenureSelect", "0");

  [searchBtn] = await page.$x('//*[@id="areaSearchButton"]');
  await searchBtn.click();

  await page.waitForNavigation();

  let addressesArr = await page.evaluate(() => {
    const elements = document.getElementsByClassName("streetText");
    let addresses = [];
    console.log(elements);
    for (let i = 0; i < elements.length; i++) {
      console.log(elements[i].innerHTML);
      addresses.push(elements[i].innerHTML);
    }

    return addresses;
  });
  console.log(addressesArr);

  await page.screenshot({ path: "buddy-screenshot.png", fullPage: true });

  await browser.close();
}
