const fs = require('fs'),
      readline = require('readline'),
      urllib = require('urllib'),
      promisify = require('bluebird').Promise.promisify,
      writeFile = promisify(require('fs').writeFile),
      readFile = promisify(require('fs').readFile);

const client = new urllib.HttpClient2();
const GoogleSupportedDevices = 'http://storage.googleapis.com/play_public/supported_devices.csv';

const metaKeys = [];
const devices = [];

async function dl2file(url, local) {
  await client.request(url, {
    writeStream: fs.createWriteStream(local),
    timeout: 30000,
  });
}

async function genKeywords() {
  brands = JSON.parse(await readFile('out/metadata.json'));
  for (brand_index in brands) {
    const brand = brands[brand_index];
    for (device_index in brand.devices) {
      const device = {
        key: [],
        path: brand.devices[device_index].image.split('/').pop(),
      };
      device.key.push.apply(device.key, brand.devices[device_index].name.split(new RegExp([' ', '-'].join('|'), 'g')));
      device.key.push.apply(device.key, brand.devices[device_index].path.split('-')[0].split('_'));
      for (key_index in device.key) {
        device.key[key_index] = device.key[key_index].toLowerCase();
      }
      metaKeys.push(device);
    }
  }
  await writeFile('out/metakeys.json', JSON.stringify(metaKeys, null, '\t'));
}

async function genMapping() {
  const splitKeys = new RegExp([' ', '-', '_'].join('|'), 'g');
  const rl = readline.createInterface({
    input: fs.createReadStream('out/supported_devices.csv', {
      encoding: 'utf16le',
    }),
  });
  rl.on('line', (line) => {
    const device = {};
    lineArray = line.split(',');
    device.brand = lineArray[0];
    device.marketingName = lineArray[1];
    device.device = lineArray[2];
    device.model = lineArray[3];
    csvKeys = [];
    csvKeys.push.apply(csvKeys, device.brand.split(splitKeys));
    csvKeys.push.apply(csvKeys, device.marketingName.split(splitKeys));
    csvKeys.push.apply(csvKeys, device.device.split(splitKeys));
    csvKeys.push.apply(csvKeys, device.model.split(splitKeys));
    for (key_index in csvKeys) {
      csvKeys[key_index] = csvKeys[key_index].toLowerCase();
    }
    let maxPoint = 0;
    let maxPath = 'default.png';
    for (metaKeyIndex in metaKeys) {
      const metakeys = metaKeys[metaKeyIndex].key;
      let hitkey = 0;
      for (csvKeysIndex in csvKeys) {
        for (metakeysIndex in metakeys) {
          if (csvKeys[csvKeysIndex] == metakeys[metakeysIndex]) {
            hitkey++;
            break;
          }
        }
      }
      const point = hitkey / csvKeys.length;
      if (point > maxPoint) {
        maxPoint = point;
        maxPath = metaKeys[metaKeyIndex].path;
      }
    }
    device.path = maxPath;
    console.log(device);
    devices.push(device);
    console.log('genMapping of device : %d', devices.length);
  }).on('close', async () => {
    await writeFile('out/mapping.json', JSON.stringify(devices, null, '\t'));
    console.log('genMapping OK');
  });
}

async function main() {
  await genKeywords(); // need metadata.json
  await dl2file(GoogleSupportedDevices, 'out/supported_devices.csv');
  console.log('Download support_devices.csv OK');
  await genMapping(); // need supported_devices.csv
}

try {
  main();
} catch (e) {
  console.log(e);
}
