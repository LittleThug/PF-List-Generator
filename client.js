let socket = io("http://localhost:3000");

document.getElementById("beginBtn").onclick = () => {
  document.getElementById("spinner").style.display = "block";
  document.getElementById("beginBtn").style.display = "none";

  let streetNum = document.getElementById("streetNumInput").value;
  let streetName = document.getElementById("streetNameInput").value;
  let city = document.getElementById("cityInput").value;
  let postCode = document.getElementById("postCodeInput").value;

  socket.emit("beginBot", {
    streetNum: streetNum,
    streetName: streetName,
    city: city,
    postCode: postCode,
  });
};

var buildingData = [];
socket.on("displayResults", (data) => {
  for (let i = 0; i < data.addresses.length; i++) {
    const broken = data.addresses[i].split("/");
    if (broken.length > 1) {
      const appNum = broken[0];
      const street = swapRdforRoad(broken[1]);

      buildingData.push({
        appNum: appNum,
        street: street,
        city: capitalizeFirstLetter(data.localities[i].toLowerCase()),
        state: "VIC",
        postCode: data.postCode,
      });
    }
  }

  saveToExcel();
});

// save as excel file
var wbout;
function saveToExcel() {
  // excel file setup
  var wb = XLSX.utils.book_new();
  wb.props = {
    Title: "Building List",
    Subject: "Building list file to assist Ray White Real Estate.",
  };
  wb.SheetNames.push("inital sheet");
  var ws_data = [["Apertment", "Building", "City", "State", "Postcode"]];

  // append all data to ws_data array
  for (let i = 0; i < buildingData.length; i++) {
    let broken = buildingData[i].appNum.split("");
    console.log(broken);
    if (!broken.includes("C") && !broken.includes("c")) {
      ws_data.push([
        buildingData[i].appNum,
        capitalizeFirstLetter(buildingData[i].street.toLowerCase()),
        capitalizeFirstLetter(buildingData[i].city.toLowerCase()),
        buildingData[i].state,
        buildingData[i].postCode,
      ]);
    }
  }
  var ws = XLSX.utils.aoa_to_sheet(ws_data);
  wb.Sheets["inital sheet"] = ws;
  wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });

  success();
}

function s2ab(s) {
  var buf = new ArrayBuffer(s.length);
  var view = new Uint8Array(buf);
  for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
  return buf;
}

document.getElementById("download-btn").onclick = () => {
  saveAs(
    new Blob([s2ab(wbout)], { type: "application/octet-stream" }),
    "buildingList.xlsx"
  );
};

function success() {
  document.getElementById("spinner").style.display = "none";
  document.getElementById("beginBtn").style.display = "block";

  document.getElementById("display-success-area").style.display = "block";
  document.getElementById("display-generate-area").style.display = "none";
}
function reset() {
  document.getElementById("display-success-area").style.display = "none";
  document.getElementById("display-generate-area").style.display = "block";
}

document.getElementById("reset-btn").onclick = () => {
  reset();
};

function capitalizeFirstLetter(string) {
  let broken = string.split(" ");
  let result = "";
  for (let i = 0; i < broken.length; i++) {
    broken[i] = broken[i].charAt(0).toUpperCase() + broken[i].slice(1) + " ";
    result += broken[i] + " ";
  }
  return result;
}
function swapRdforRoad(string) {
  let broken = string.split(" ");
  let result = "";
  for (let i = 0; i < broken.length; i++) {
    if (broken[i] == "rd" || broken[i] == "RD" || broken[i] == "Rd") {
      broken[i] = "Road";
    }
    result += broken[i] + " ";
  }
  return result;
}
