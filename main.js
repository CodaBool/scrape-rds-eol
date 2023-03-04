import jsdom from 'jsdom'
import axios from 'axios'
import matter from 'gray-matter'
import fs from 'fs'

const { JSDOM } = jsdom

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
  const tables = dom.window.document.getElementsByTagName('table') 
  
  const majors = []
  const minors = []

  for (const [i, table] of Object.entries(tables)) {

    // first table is minor, second is major
    let minor = false
    if (i === '0') {
      console.log('\nScraping', db, 'minor')
      minor = true
    } else {
      console.log('\nScraping', db, 'major')
    }

    // select the table rows
    const rows = table.getElementsByTagName('tr')

    for (const row of rows) {
      // ignore rows which just contain a major version with no data
      if (row.childNodes.length === 3) continue
    
      const release = {}

      for (let [num, col] of row.childNodes.entries()) {
        // ignore all nodes that are not Table Data
        if (col.tagName !== 'TD') continue

        // for some reason postgres iteration is off by one
        if (db === 'postgres' && i === '1') {
          num++
        }

        if (num === 1) {
          let relevantLine = col.textContent.trim()
          if (col.textContent.includes('\n')) {
            relevantLine = col.textContent.trim().split('\n')[0]
          }
          const version = relevantLine.replace(/[^0-9.]/g, '')
          console.log('version', version)
          release.releaseCycle = '"' + version + '"'
        } else if (num === 3) {
          // Community release date
          // console.log('Community release date', new Date(col.textContent.trim()))
        } else if (num === 5) {
          // RDS release date
          const date = format(new Date(col.textContent.trim()))
          console.log('RDS release date', date)
          release.releaseDate = date
        } else if (num === 7) {
          
          // minor tables do not have a Community end of life column
          if (minor) {

            // RDS end of standard support date
            const date = format(new Date(col.textContent.trim()))
            console.log('RDS end of standard support date', date)
            release.eol = date
            minors.push(release)
          } else {
            // Community end of life date
            // console.log('Community end of life date', new Date(col.textContent.trim()))
          }

        } else if (num === 9) {
          // RDS end of standard support date
          const date = format(new Date(col.textContent.trim()))
          console.log('RDS end of standard support date', date)
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

  write(name, { title: 'Amazon RDS for ' + name, category: 'db', iconSlug: db, permalink: '/rds-' + db, alternate_urls: [`/rds-${db}-major`], releasePolicyLink: url, releaseImage: 'https://docs.aws.amazon.com/assets/r/images/aws_logo_dark.png', releases: majors }, false)
  write(name, { title: 'Amazon RDS for ' + name, category: 'db', iconSlug: db, permalink: `/rds-${db}-minor`, releasePolicyLink: url, releaseImage: 'https://docs.aws.amazon.com/assets/r/images/aws_logo_dark.png', releases: minors }, true)
}

function write(name, obj, minor) {
  const md = `
Amazon RDS for ${name} is a PaaS offering from Amazon for creating ${name} Databases on AWS.

RDS makes it easier to set up, operate, and scale ${name} deployments on AWS cloud.

${name} runs against it's source Community Edition.

This is a collection of ${minor ? 'minor' : 'major'} versions.`

  const yaml = matter.stringify(md, obj)
  
  // gray-matter adds single quotes around the dates
  // according to endoflife these dates should have no quotes
  const noSingleQuotes = yaml.replace(/'/g, "")

  // endoflife suggests to have a new line before and after final the triple dash 
  let t = 0
  const newLinesAroundBtmMatter = noSingleQuotes.replace(/---/g, match => ++t === 2 ? '\n---' : match)

  const fileName = obj.permalink.slice(1) + '.yml'
  
  fs.writeFileSync(fileName, newLinesAroundBtmMatter)
}