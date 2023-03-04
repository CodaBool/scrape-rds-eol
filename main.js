import jsdom from 'jsdom'
import axios from 'axios'
import matter from 'gray-matter'
import { markdownTable } from 'markdown-table'
import fs from 'fs'

const { JSDOM } = jsdom

function format(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

const dbs = {
  'mysql': 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/MySQL.Concepts.VersionMgmt.html',
  'postgresql': 'https://docs.aws.amazon.com/AmazonRDS/latest/PostgreSQLReleaseNotes/postgresql-release-calendar.html',
}

for (const [db, url] of Object.entries(dbs)) {
  const html = await axios.get(url)
    .then(res => res.data)
    .catch(console.log)
  const dom = new JSDOM(html)
  
  // select all table tags
  const tables = dom.window.document.getElementsByTagName('table') 
  
  const majors = []
  const minors = []

  for (const [i, table] of Object.entries(tables)) {

    // first table is minor, second is major
    let minor = false
    if (i === '0') {
      console.log('Scraping', db, 'minor')
      minor = true
    } else {
      console.log('Scraping', db, 'major')
    }

    // select the table rows
    const rows = table.getElementsByTagName('tr')

    for (const row of rows) {
      // ignore rows which just contain a major version with no data
      if (row.childNodes.length === 3) continue
    
      const release = {}
      // console.log()

      for (let [num, col] of row.childNodes.entries()) {
        // ignore all nodes that are not Table Data
        if (col.tagName !== 'TD') continue

        // for some reason postgresql iteration is off by one
        if (db === 'postgresql' && i === '1') {
          num++
        }

        if (num === 1) {
          const lines = col.textContent.trim().split('\n')
          if (lines.length > 1) {
            const latestMinor = lines[1].replace(/[^0-9.]/g, '')
            // console.log('latest minor version', latestMinor)
            if (!latestMinor) {
              // console.log('no minor')
            }
            release.latest = '"' + latestMinor + '"'
          }
          const version = lines[0].replace(/[^0-9.]/g, '')
          // console.log('major version', version)
          release.releaseCycle = '"' + version + '"'
        } else if (num === 3) {
          // Community release date
          // console.log('Community release date', new Date(col.textContent.trim()))
        } else if (num === 5) {
          // RDS release date
          const date = format(new Date(col.textContent.trim()))
          // console.log('RDS release date', date)
          release.releaseDate = date
        } else if (num === 7) {
          
          // minor tables do not have a Community end of life column
          if (minor) {

            // RDS end of standard support date
            const date = format(new Date(col.textContent.trim()))
            // console.log('RDS end of standard support date', date)
            release.eol = date
            minors.push(release)
          } else {
            // Community end of life date
            // console.log('Community end of life date', new Date(col.textContent.trim()))
          }

        } else if (num === 9) {
          // RDS end of standard support date
          const date = format(new Date(col.textContent.trim()))
          // console.log('RDS end of standard support date', date)
          release.eol = date
          majors.push(release)
        }
      }
    }
  }

  let name = 'PostgreSQL'
  if (db === 'mysql') {
    name = 'MySQL'
  }

  // grab latest release date
  for (const major of majors) {
    for (const minor of minors) {
      if (major.latest === minor.releaseCycle) {
        major.latestReleaseDate = minor.releaseDate
      }
    }
  }

  write(name, { title: 'Amazon RDS for ' + name, category: 'db', iconSlug: db, permalink: '/rds-' + db, releasePolicyLink: url, releases: majors }, minors)
}

function write(name, obj, minors) {
  const tableInput = []
  tableInput.push(['Release', 'Security Support', 'RDS Release'])
  for (const r of minors) {
    tableInput.push([r.releaseCycle.replace(/"/g, ""), r.eol, r.releaseDate])
  }
  const table = markdownTable(tableInput)

  const md = `
> [Amazon RDS for ${name}](https://aws.amazon.com/rds/${name.toLowerCase()}) is a PaaS offering from Amazon for creating ${name} Databases on AWS. RDS makes it easier to set up, operate, and scale ${name} deployments on AWS cloud. ${name} runs against its source Community Edition.

**${name} recommends that all users run the latest available minor release for whatever major version is in use.**

- AWS will provide support for major releases 3 years after their RDS release date.

- AWS will provide support for minor versions 1 year after their RDS release date.

Keep in mind that by default minor versions are automatically upgraded during maintenance windows.

For more info on how RDS versions are deprecated see the AWS [documentation](https://aws.amazon.com/rds/faqs/#What_happens_when_an_Amazon_RDS_DB_engine_version_is_deprecated.3F).

Please follow [best practices](${name === 'MySQL' ? 'https://aws.amazon.com/blogs/database/best-practices-for-upgrading-amazon-rds-for-mysql-and-amazon-rds-for-mariadb' : 'https://aws.amazon.com/blogs/database/best-practices-for-upgrading-amazon-rds-to-major-and-minor-versions-of-postgresql'}) when performing upgrades to your RDS instance.

### Minor Version Support

${table}`

  const yaml = matter.stringify(md, obj)
  
  // gray-matter adds single quotes around the dates
  // according to endoflife these dates should have no quotes
  const noSingleQuotes = yaml.replace(/'/g, "")

  // endoflife suggests to have a new line before and after final the triple dash 
  let t = 0
  const newLinesAroundBtmMatter = noSingleQuotes.replace(/---/g, match => ++t === 2 ? '\n---' : match)

  const fileName = obj.permalink.slice(1)  + '.md'
  
  fs.writeFileSync(fileName, newLinesAroundBtmMatter)
}