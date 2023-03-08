# 🏗️ Scrape
There is no API to get RDS end of life dates for either mysql or postgres.

This will scrape their docs for that data.

The data is then written to a yaml file with as front matter.

Then the data is used by the [endoflife.date](https://endoflife.date) project to provide programmatic access with a JSON API.

### 📃 Usage
1. npm i
2. npm start


#### Options
- you can run `npm run json` to output to a json file
- you can run `npm run minor` to include minor versions in a markdown file