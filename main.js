import jsdom from 'jsdom'
import axios from 'axios'
import matter from 'gray-matter'
import fs from 'fs'

const { JSDOM } = jsdom
const releases = []

const html = await axios.get('https://docs.aws.amazon.com/AmazonRDS/latest/PostgreSQLReleaseNotes/postgresql-release-calendar.html')
  .then(res => res.data)
  .catch(console.log)
const dom = new JSDOM(html)

// select all table tags
const allTables = dom.window.document.getElementsByTagName('table') 

// select only the first table node found
const table = allTables[0]

// select the table rows
const rows = table.getElementsByTagName('tr')

for (const row of rows) {
  // ignore rows which just contain a major version with no data
  if (row.childNodes.length === 3) continue

  const release = {}

  for (const [index, col] of row.childNodes.entries()) {
    // ignore all nodes that are not Table Data
    if (col.tagName !== 'TD') continue

    if (index === 1) {
      // PostgreSQL engine version
      console.log("PostgreSQL engine version", col.textContent.trim())
      release.releaseCycle = col.textContent.trim()
    } else if (index === 3) {
      // Community release date
      console.log('Community release date', new Date(col.textContent.trim()))
    } else if (index === 5) {
      // RDS release date
      console.log('RDS release date', new Date(col.textContent.trim()))
      release.releaseDate = new Date(col.textContent.trim())
    } else if (index === 7) {
      // RDS end of standard support date
      console.log('RDS end of standard support date', new Date(col.textContent.trim()))
      release.eol = new Date(col.textContent.trim())

      // this is the final column and the release can be pushed
      releases.push(release)
    }
  }
}

// INFO: use this to generate the markdown easily and copy into the md const
// console.log(matter.read('./markdown.yml'))

// TODO: it would be nice to have a trailing 6 month - 1 year history of the deprecated versions
// I would need to get this data from releases page. No way to do this programmatically

const md = "> [AWS RDS Postgres] is AWS's implementation of the popular postgres database.\r\n" +
'\r\n' +
'Releases as well as deprecation dates do not match perfectly with source postgres releases (typically releasing about a month behind).\r\n' +
'\r\n' +
'For this reason a seperate service end of life API can be useful to provide accurate deprecation dates.'

const yaml = matter.stringify(md, {title: 'RDS postgreSQL', category: 'db', iconSlug: 'postgresql', permalink: '/rds-postgres', alternate_urls: ['/rds-postgresql', '/rds-psql'], releasePolicyLink: 'https://docs.aws.amazon.com/AmazonRDS/latest/PostgreSQLReleaseNotes/postgresql-release-calendar.html', releaseImage: 'https://docs.aws.amazon.com/assets/r/images/aws_logo_dark.png', activeSupportColumn: 'Active Support', releases})

console.log(yaml)

fs.writeFileSync("rds-postgres.yml", yaml)