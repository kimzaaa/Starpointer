const fs = require("fs");
const data = fs.readFileSync("chunk-vendors.js", "utf8");
console.log(/addDataSource/.test(data));

