const fs = require('fs'),
      urllib = require('urllib'),
      promisify = require('bluebird').Promise.promisify,
      writeFile = promisify(require('fs').writeFile),
      readFile = promisify(require('fs').readFile);

const client = new urllib.HttpClient2();
const GoogleSupportedDevices = 'http://storage.googleapis.com/play_public/supported_devices.csv';

async function dl2file(url, local) {
  await client.request(url, {
    writeStream: fs.createWriteStream(local),
    timeout: 30000,
  });
}

async function main() {
  await dl2file(GoogleSupportedDevices, 'out/support_devices.csv');
  
}

try {
  main();
} catch (e) {
  console.log(e);
}
