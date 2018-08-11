#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const program = require('commander')

const { version } = require('../package.json')

// helpers

function ns(fn) {
  return function(...args) {
    fn('[solid-auth-client]', ...args)
  }
}

const log = ns(console.log)
const warn = ns(console.log)

const issueUrl = 'https://github.com/solid/solid-auth-client/issues'

// CLI

program
  .version(version)
  .command('generate-ui [app-name] [filename]')
  .description(
    'build a login UI named for your application.  ' +
      '[app-name] is the name of your app. (default host)  ' +
      '[filename] is the name of the html file. (default "login.html").'
  )
  .action(generateUI)

program.parse(process.argv)

// Show help if called with no arguments
if (!process.argv.slice(2).length) {
  program.outputHelp()
}

// generateUI command

function generateUI(appName = '', filename = 'login.html') {
  log(`Generating "${filename}" with app name "${appName}".`)

  const templateFilename = path.resolve(__dirname, '..', 'dist-ui/login.html')
  if (!fs.existsSync(templateFilename)) {
    warn(
      `Could not find login UI template. Expected it to be located at "${templateFilename}".  Please file a bug at ${issueUrl}`
    )
    return
  }

  let templateBuffer
  try {
    templateBuffer = fs.readFileSync(templateFilename)
  } catch (err) {
    warn(
      `Could not read the login UI template.  Please file a bug at ${issueUrl}`
    )
    console.error(err)
    return
  }

  const uiBuffer = templateBuffer
    .toString()
    .replace(/['"]{{APP_NAME}}['"]/g, JSON.stringify(appName))

  try {
    fs.writeFileSync(filename, uiBuffer)
  } catch (err) {
    warn(`Could not write the login UI to "${filename}".`)
    console.error(err)
    return
  }

  log(`HTML is generated and available at "${filename}"!`)
}
