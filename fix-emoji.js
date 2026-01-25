const fs = require('fs');
let lines = fs.readFileSync('components/MockAssessmentPage.tsx', 'utf8').split('\n');

// Fix line 4842 (index 4841) - use String.fromCodePoint for the emoji
if (lines[4841] && lines[4841].includes('Leaderboard</h2>')) {
  lines[4841] = '              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{String.fromCodePoint(0x1F3C6)} Leaderboard</h2>';
  console.log('Fixed line 4842');
}

// Also check for broken trophy emoji in empty state around line 4860
for (let i = 4855; i < 4870; i++) {
  if (lines[i] && lines[i].includes('text-6xl mb-4')) {
    lines[i] = '              <div className="text-6xl mb-4">{String.fromCodePoint(0x1F3C6)}</div>';
    console.log('Fixed empty state emoji at line', i+1);
    break;
  }
}

// Fix crown emoji around line 4897
for (let i = 4890; i < 4910; i++) {
  if (lines[i] && lines[i].includes('text-2xl mb-1') && !lines[i].includes('String.fromCodePoint')) {
    lines[i] = '                      <div className="text-2xl mb-1">{String.fromCodePoint(0x1F451)}</div>';
    console.log('Fixed crown emoji at line', i+1);
  }
}

// Fix any remaining broken person emojis
for (let i = 0; i < lines.length; i++) {
  if (lines[i] && lines[i].includes("|| '👤'") || lines[i].includes("|| 'ðŸ'¤'")) {
    lines[i] = lines[i].replace(/\|\| '.*?'/g, "|| String.fromCodePoint(0x1F464)");
    console.log('Fixed person emoji at line', i+1);
  }
}

fs.writeFileSync('components/MockAssessmentPage.tsx', lines.join('\n'), 'utf8');
console.log('Done');

