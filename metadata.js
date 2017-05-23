const urllib = require('urllib'),
      cheerio = require('cheerio'),
      promisify = require('bluebird').Promise.promisify,
      writeFile = promisify(require('fs').writeFile);

const URL = 'http://www.gsmarena.com';

const client = new urllib.HttpClient2();
const brands = [];
let totalPages = 0;
let totalDeviceNum = 0;

async function getBrandsPages(uri) {
  const res = await client.request([URL, uri].join('/'), {
    timeout: 30000,
  });
  let $ = cheerio.load(res.data.toString());
  const pages = [uri];
  $('a', '.nav-pages').each((i, elem) => {
    pages.push($(elem).attr('href'));
  });
  totalPages += pages.length;
  return pages;
};

async function getBrands() {
  const BrandsPage = 'makers.php3';
  const res = await client.request([URL, BrandsPage].join('/'), {
    timeout: 30000,
  });
  const $ = cheerio.load(res.data.toString());
  const promises = [];
  $('a', '.st-text').each((i, elem) => {
    const brand = {};
    brand.pages = $(elem).attr('href');
    promises.push(getBrandsPages(brand.pages));
    brand.deviceNum = $('span', elem).text().split(' ')[0];
    totalDeviceNum += parseInt(brand.deviceNum);
    $('span', elem).remove();
    brand.name = $(elem).text();
    brands.push(brand);
  });
  console.log('Total Devices: %d', totalDeviceNum);
  const brandsPages = await Promise.all(promises);
  console.log('Total Pages: %d', totalPages);
  for (index in brandsPages) {
    brands[index].pages = brandsPages[index];
  }
  return await writeFile('out/metadata.json', JSON.stringify(brands, null, '\t'))
}

async function getDevicesOnePage(uri) {
  const res = await client.request([URL, uri].join('/'), {
    timeout: 30000,
  });
  const $ = cheerio.load(res.data.toString());
  const devices = [];
  $('a', '.makers').each((i, elem) => {
    const device = {};
    device.name = $('span', elem).text();
    device.image = $('img', elem).attr('src');
    device.path = $(elem).attr('href');
    devices.push(device);
  });
  return devices;
}

async function getDevices() {
  let nowPage = 0;
  for (brand_index in brands) {
    const promises = [];
    for (page_index in brands[brand_index].pages) {
      promises.push(getDevicesOnePage(brands[brand_index].pages[page_index]));
    }
    const devicesArray = await Promise.all(promises);
    brands[brand_index].devices = [];
    for (devices_index in devicesArray) {
      brands[brand_index].devices.push.apply(brands[brand_index].devices, devicesArray[devices_index]);
    }
    nowPage += devicesArray.length;
    console.log('%d/%d : %s', nowPage, totalPages, brands[brand_index].name);
  }
}

async function main() {
  await getBrands();
  await getDevices();

  await writeFile('out/metadata.json', JSON.stringify(brands, null, '\t'));
}

try {
  main();
} catch (e) {
  console.log(e);
}
