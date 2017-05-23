const fs = require('fs'),
      urllib = require('urllib'),
      promisify = require('bluebird').Promise.promisify,
      writeFile = promisify(require('fs').writeFile),
      readFile = promisify(require('fs').readFile);

const URL = 'http://www.gsmarena.com';

const client = new urllib.HttpClient2();
let brands;
let deviceNum = 0;

async function dl2file(url, local) {
  try {
    await client.request(url, {
      writeStream: fs.createWriteStream(local),
      timeout: 30000,
    });
  } catch(e) {
    return await dl2file(url, local);
  }
}

async function dlimage() {
  let nowDevice = 0;
  for (brand_index in brands) {
    const promises = [];
    for (device_index in brands[brand_index].devices) {
      const device = brands[brand_index].devices[device_index];
      const filename = device.image.split('/').pop();
      promises.push(dl2file(device.image, 'image/' + filename));
    }
    await Promise.all(promises);
    nowDevice += Number(brands[brand_index].deviceNum);
    console.log('Image number: %d', nowDevice);
  }
}

async function main() {
  brands = JSON.parse(await readFile('out/metadata.json'));
  await dlimage();
  console.log('Image download finish');
}

try {
  main();
} catch (e) {
  console.log(e);
}
