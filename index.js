const urllib = require('urllib'),
      cheerio = require('cheerio'),
      promisify = require('bluebird').Promise.promisify,
      writeFile = promisify(require('fs').writeFile);

const URL = 'http://www.gsmarena.com';
const BrandsPage = 'makers.php3';

const client = new urllib.HttpClient2();
const brands = [];
let totalDeviceNum = 0;

async function getBrandsPages(uri) {
  const res = await client.request([URL, uri].join('/'));
  let $ = cheerio.load(res.data.toString());
  const pages = [uri];
  $('a', '.nav-pages').each((i, elem) => {
    pages.push($(elem).attr('href'));
  });
  return pages;
};

async function getBrands() {
  const res = await client.request([URL, BrandsPage].join('/'));
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
  console.log(totalDeviceNum);
  const brandsPages = await Promise.all(promises);
  for (index in brandsPages) {
    brands[index].pages = brandsPages[index];
  }
  return await writeFile('out/brands.json', JSON.stringify(brands, null, '\t'))
}


/* Step 3: save each device's detail */
/*
const getDevices = (brand) => {
  brand.path.forEach((path, index) => {
    request
    .get([URL, path].join('/'))
    .end((err, res) => {
      if (!res.ok) throw new Error(['Fail: brand path' + brand.name + path + res.status].join(' '));
      //console.log('OK: brand path ' + brand.name);
      let $ = cheerio.load(res.text);
      let devices = [];
      $('a', '.makers').each((i, elem) => {
        let device = {};
        device.name = $('span', elem).text();
        device.image = $('img', elem).attr('src');
        device.path = $(elem).attr('href');
        //getMoreDetails(device);
        devices.push(device);
      });
      fs.writeFile('out/devices/' + brand.name + '.json', JSON.stringify(devices, null, '\t'), err => {
        if (err) throw err;
        console.log('OK: ' + brand.name + ' write to file');
        get_device_number += devices.length;
        console.log('get_device_number: ' + get_device_number);
      });
    });
  })
};
*/

/*
const getMoreDetails = (device) => {
  request
  .get([URL, device.path].join('/'))
  .end((err, res) => {
    if (!res.ok) throw new Error(['Fail: device path' + device.name + res.status].join(' '));
    console.log('OK: device path ' + device.name);
    let $ = cheerio.load(res.text);
    $('a', '.ttl').each((i, elem) => {
      device.year = 1;
      device.os = 1;
    });
  });
};
*/

async function main() {
  await getBrands();
}

main();
