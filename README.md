# gsmarena-crawler
Node.js crawl device image from [gsmarena](http://www.gsmarena.com/) and generate metadata table with Google play supported devices table.

## Steps
1. `mkdir out && mkdir image`
2. `npm run metadata` to crawl devices metadata and image url.
3. `npm run dlimages` to download devices image.
4. `npm run match` to match devices image with **Google play supported devices table**.
