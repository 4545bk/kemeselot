const https = require('https');
const fs = require('fs');
const path = require('path');

const jarUrl = 'https://raw.githubusercontent.com/gradle/gradle/v8.10.2/gradle/wrapper/gradle-wrapper.jar';
const destDir = path.join(__dirname, 'android', 'gradle', 'wrapper');
const destFile = path.join(destDir, 'gradle-wrapper.jar');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

console.log('Downloading gradle-wrapper.jar...');

const file = fs.createWriteStream(destFile);

function download(url) {
  https.get(url, (response) => {
    if (response.statusCode === 301 || response.statusCode === 302) {
      download(response.headers.location);
      return;
    }
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      const stats = fs.statSync(destFile);
      console.log(`Done! Saved to: ${destFile} (${stats.size} bytes)`);
    });
  }).on('error', (err) => {
    fs.unlink(destFile, () => {});
    console.error('Download failed:', err.message);
    process.exit(1);
  });
}

download(jarUrl);
