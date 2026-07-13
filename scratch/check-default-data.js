// scratch/check-default-data.js
const fs = require('fs');

// Mock window object
global.window = {};

// Load defaultData.js
const code = fs.readFileSync('src/js/defaultData.js', 'utf8');
eval(code);

console.log("window.defaultTasksInit length:", window.defaultTasksInit.length);
console.log("First item:", JSON.stringify(window.defaultTasksInit[0]));
console.log("Has optionsList:", !!window.optionsList);
