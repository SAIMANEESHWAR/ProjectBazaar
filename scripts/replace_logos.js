import fs from 'fs';
let data = fs.readFileSync('data/preparationMockData.ts', 'utf8');
data = data.replace(/https:\/\/logo\.clearbit\.com\/([a-zA-Z0-9.-]+)/g, 'https://www.google.com/s2/favicons?domain=$1&sz=128');
fs.writeFileSync('data/preparationMockData.ts', data);
console.log('done replacing');
