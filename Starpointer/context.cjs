const fs = require("fs");
const data = fs.readFileSync("app.js", "utf8");
const needle = "skydata/stars";
const idx = data.indexOf(needle);
console.log({ idx });
console.log(data.slice(Math.max(0, idx - 200), Math.min(data.length, idx + 200)));

