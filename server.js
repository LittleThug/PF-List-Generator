// var express = require('express');
// const PORT = process.env.PORT || 5000;
// const INDEX = "index.html";

// const server = express().use((req, res) => res.sendFile(INDEX, { root: __dirname })).listen(PORT, () => console.log('Listening on '+PORT));

// const io = require('socket.io')(server);
const io = require("socket.io")();
console.log("started");

const email = "tommy-lee.davies@raywhite.com";
const pwd = "TommyL04";

let streetNumber = "";
let streetName = "";
let suburb = "";
let postCode = "";

const url =
  "https://www.pricefinder.com.au/portal/app?page=ExternalLogin&service=page";

const e = require("express");
const puppeteer = require("puppeteer");

io.on("connection", function (socket) {
  console.log("User connected");

  socket.on("beginBot", function (data) {
    console.log(data.streetNum, data.streetName, data.city, data.postCode);
    streetNumber = data.streetNum;
    streetName = data.streetName;
    suburb = data.city;
    postCode = data.postCode;

    startBot();
  });
});

io.listen(3000);
//io.listen(PORT);

async function startBot() {
  const browser = await puppeteer.launch({
    headless: false,
    args: [`--window-size=1920,1080`, "--no-sandbox"],
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
  });

  const page = await browser.newPage();

  await page.goto(url);
  console.log("Arrived at page");
  await page.type("#inputEmail", email, { delay: 100 });
  await page.type("#inputPassword", pwd, { delay: 100 });
  const [loginBtn] = await page.$x(
    "/html/body/div[1]/div[2]/div/div[2]/form/p[3]/button"
  );
  await loginBtn.click();
  await page.waitForNavigation();
  console.log("Logged in");
  await page.waitForSelector("#ImageSubmit");

  const [acceptBtn] = await page.$x('//*[@id="ImageSubmit"]');
  await acceptBtn.click();
  await page.waitForNavigation();
  console.log("Accepted Ts and Cs");

  const [propspectingBtn] = await page.$x(
    "/html/body/div[3]/table/tbody/tr[2]/td[2]/table/tbody/tr/td/div[1]/div/div[5]/div/div/div[1]/ul/li[2]/div/a"
  );
  await propspectingBtn.click();
  await page.waitForSelector("#addressStreetNumberToInput_0");
  console.log("Arrived at prospecting page");
  await page.type("#addressStreetNumberToInput_0", streetNumber, {
    delay: 100,
  });
  await page.type("#addressStreetNumberFromInput_0", streetNumber, {
    delay: 100,
  });
  await page.type("#addressStreetNameInput_0", streetName, { delay: 100 });
  await page.type("#addressSuburbNameInput_0", suburb, { delay: 100 });
  await page.type("#addressPostcodeInput_0", postCode, { delay: 100 });

  let [searchBtn] = await page.$x('//*[@id="aSubmitButton_0"]');
  await searchBtn.click();
  await page.waitForNavigation();
  console.log("Entered search details");

  // remove 'street' or 'road' from end to search for correct link
  let streetWithoutClassification = "";
  const broken = streetName.split(" ");
  for (let i = 0; i < broken.length - 1; i++) {
    streetWithoutClassification += broken[i] + " ";
  }
  streetWithoutClassification = streetWithoutClassification.slice(0, -1);
  console.log(streetWithoutClassification);
  await page.evaluate((name) => {
    const elements = document.getElementsByClassName("sel_streetNameLink");
    for (let i = 0; i < elements.length; i++) {
      console.log(elements[i], name.toUpperCase());
      if (elements[i].innerHTML == name.toUpperCase()) {
        elements[i].click();
        break;
      }
    }
  }, streetWithoutClassification.toUpperCase());

  // const [queensBtn] = await page.$x('//*[@id="streetNameLink_319"]');
  // await queensBtn.click();
  await page.waitForNavigation();

  const [includeNonOwnerCheckbox] = await page.$x(
    '//*[@id="includeNonOwnerOccupierInput"]'
  );
  await includeNonOwnerCheckbox.click();
  await page.select("#tenureSelect", "0");

  [searchBtn] = await page.$x('//*[@id="areaSearchButton"]');
  await searchBtn.click();

  await page.waitForNavigation();
  await page.screenshot({ path: "buddy-screenshot.png", fullPage: true });

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

  let localityArr = await page.evaluate(() => {
    const elements = document.getElementsByClassName("localityText");
    let locality = [];
    console.log(elements);
    for (let i = 0; i < elements.length; i++) {
      console.log(elements[i].innerHTML);
      locality.push(elements[i].innerHTML);
    }

    return locality;
  });

  let finalPostCode = await page.evaluate(() => {
    return document.getElementById("addressPostcodeInput").value;
  });

  io.emit("displayResults", {
    addresses: addressesArr,
    localities: localityArr,
    postCode: finalPostCode,
  });
  console.log(addressesArr);

  await browser.close();
}
