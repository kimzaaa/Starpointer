const fs = require("fs");
const data = fs.readFileSync("chunk-vendors.js", "utf8");
let idx = data.indexOf("addDataSource");
console.log({ idx });
console.log(data.slice(Math.max(0, idx - 200), Math.min(data.length, idx + 400)));

