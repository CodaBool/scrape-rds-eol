import jsdom from 'jsdom'
import axios from 'axios'
import matter from 'gray-matter'
import fs from 'fs'

const { JSDOM } = jsdom
const releases = []

function format(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

const dbs = {
  'mysql': 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/MySQL.Concepts.VersionMgmt.html',
  'postgres': 'https://docs.aws.amazon.com/AmazonRDS/latest/PostgreSQLReleaseNotes/postgresql-release-calendar.html',
}

for (const [db, url] of Object.entries(dbs)) {
  const html = await axios.get(url)
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
        // MySQL engine version
        console.log(db + " engine version", col.textContent.trim())
  
        release.releaseCycle = '"' + col.textContent.trim() + '"'
  
      } else if (index === 3) {
  
        // Community release date
        const date = format(new Date(col.textContent.trim()))
        console.log('Community release date', date)
  
      } else if (index === 5) {
  
        // RDS release date
        const date = format(new Date(col.textContent.trim()))
        console.log('RDS release date', date)
  
        release.releaseDate = date
  
      } else if (index === 7) {
  
        // RDS end of standard support date
        const date = format(new Date(col.textContent.trim()))
        console.log('RDS end of standard support date', date)
  
        release.eol = date
  
        // this is the final column and the release can be pushed
        releases.push(release)
      }
    }
  }
  
  // INFO: use this to generate the markdown easily and copy into the md const
  // console.log(matter.read('./markdown.yml'))
  
  // TODO: it would be nice to have a trailing 6 month - 1 year history of the deprecated versions
  // I would need to get this data from releases page. However, there is no great way to do this programmatically 🤔
  
  const md = "> AWS RDS " + db + " is an AWS implementation of the popular " + db + " database.\r\n" +
  '\r\n' +
  'Releases as well as deprecation dates do not match perfectly with source ' + db + ' releases (typically releasing about a month behind).\r\n' +
  '\r\n' +
  'For this reason a seperate service end of life API can be useful to provide accurate deprecation dates.'
  
  const yaml = matter.stringify(md, { title: 'RDS ' + db, category: 'db', iconSlug: db, permalink: '/rds-' + db, releasePolicyLink: url, releaseImage: 'https://docs.aws.amazon.com/assets/r/images/aws_logo_dark.png', activeSupportColumn: 'Active Support', releases })
  
  // gray-matter adds single quotes around the dates
  // according to endoflife these dates should have no quotes
  const noSingleQuotes = yaml.replace(/'/g, "")

  // endoflife suggests to have a new line before and after final the triple dash 
  let t = 0
  const newLinesAroundBtmMatter = noSingleQuotes.replace(/---/g, match => ++t === 2 ? '\n---\n' : match)
  
  fs.writeFileSync("rds-" + db + ".yml", newLinesAroundBtmMatter)
}