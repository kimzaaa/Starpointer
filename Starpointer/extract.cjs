const fs = require("fs");
const data = fs.readFileSync("app.js", "utf8");
const matches = data.match(/https?:[^"\s)]+/g) || [];
const uniq = [...new Set(matches)];
console.log(uniq.length);
console.log(uniq.slice(0, 50).join("\n"));

