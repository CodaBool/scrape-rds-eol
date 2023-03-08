import jsdom from 'jsdom'
import axios from 'axios'
import matter from 'gray-matter'
import fs from 'fs'

const { JSDOM } = jsdom
const toJSON = process.argv.length === 3
const includeMinor = process.argv.length === 4
const allData = []

console.log('output =', toJSON ? 'json': 'markdown')
console.log('includeMinor =', includeMinor)

// writes a date in the iso format endoflife wants
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
            let latestMinor = lines[1].replace(/[^0-9.]/g, '')
            if (!latestMinor) {
              latestMinor = 'unknown'
            }
            release.latest = '"' + latestMinor + '"'
          }
          const version = lines[0].replace(/[^0-9.]/g, '')
          // TODO: research if I need to have double quotes?
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
          // due to different table column size a conditional is necessary
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
          // only major tables have this column
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

  // add latest data for majors
  for (const major of majors) {
    for (const minor of minors) {
      if (major.latest === minor.releaseCycle) {
        major.latestReleaseDate = minor.releaseDate
      }
    }
  }
  
  // add latest data for minors
  if (includeMinor) {
    for (const major of majors) {
      const majorVersion = major.releaseCycle.replace(/"/g, "")
      for (const minor of minors) {
        const minorVersion = minor.releaseCycle.replace(/"/g, "")
        const majorFromMinor = minorVersion.split('.').slice(0, -1).join('.')
        if (majorFromMinor === majorVersion) {
          minor.latest = major.latest
          minor.latestReleaseDate = major.latestReleaseDate
        }
      }
    }
  }

  if (toJSON) {
    for (const release of minors) {
      release.type = 'minor'
    }
    for (const release of majors) {
      release.type = 'major'
      release.latest =  release.latest.replace(/"/g, "")
    }
    const allVersions = [...minors, ...majors]
    for (const release of allVersions) {
      release.db = name.toLowerCase()
      release.releaseCycle =  release.releaseCycle.replace(/"/g, "")
    }
    allData.push(...allVersions)
  } else {
    const all = [...minors, ...majors]
    write(name, { title: 'Amazon RDS for ' + name, category: 'service', releaseDateColumn: true, iconSlug: 'amazonaws', permalink: '/amazon-rds-' + db, releasePolicyLink: url, releases: all })
  }
}

if (toJSON) {
  fs.writeFileSync('all.json', JSON.stringify(allData, null, 2))
}

function write(name, obj) {
  const md = `
> [Amazon RDS for ${name}](https://aws.amazon.com/rds/${name.toLowerCase()}) is a PaaS offering from Amazon for
> creating managed ${name} Community Edition databases. RDS makes it easier to set up, operate, and
> scale ${name} deployments on AWS cloud.

Version numbers on Amazon RDS for ${name} are identical to those of [${name}](/${name.toLowerCase()}). As a general
guidance, new versions of the ${name} engine become available on Amazon RDS within 5 months of their
general availability by Oracle.

Major versions (\`x.y\` in Amazon RDS terminology) are supported [until the ${name} Community
Edition end of life](/${name.toLowerCase()}), with a minimum of 3 years from their release date on Amazon RDS.
Minor versions (\`x.y.z\` in Amazon RDS terminology) are supported at least for 1 year after their
release date on Amazon RDS. Note that in some cases Amazon may deprecate specific major or minor
versions sooner, such as when there are security issues.

Depending on the configuration, the kind of version (major or minor) and their deprecation status,
[upgrades can be manual, automatic or forced](https://aws.amazon.com/rds/faqs/#How_do_I_control_if_and_when_the_engine_version_of_my_DB_instance_is_upgraded_to_new_supported_versions.3F).
When a minor release is deprecated, users are expected to upgrade within a 3 months period. This
period is increased to 6 months for major releases. Upgrades are performed during the configured
scheduled maintenance windows. These windows are initially set automatically by AWS but can be
overridden in the AWS console.

For the most up-to-date information about the Amazon RDS deprecation policy for ${name}, see [Amazon
RDS FAQs](http://aws.amazon.com/rds/faqs/).`


  const yaml = matter.stringify(md, obj)
  
  // gray-matter adds single quotes around the dates
  // according to endoflife these dates should have no quotes
  const noSingleQuotes = yaml.replace(/'/g, "")

  const spacing = noSingleQuotes.replace(/  - /g, "\n-   ")

  const noYamlNewLine = spacing.replace(/>-\n  /g, "")

  const rmReleaseNewLine = noYamlNewLine.replace(/releases:\n/g, "releases:")
  
  // endoflife suggests to have a new line before and after final the triple dash 
  let t = 0
  const newLinesAroundBtmMatter = rmReleaseNewLine.replace(/---/g, match => ++t === 2 ? '\n---' : match)
  
  const fileName = obj.permalink.slice(1)  + '.md'
  
  fs.writeFileSync(fileName, newLinesAroundBtmMatter)
}