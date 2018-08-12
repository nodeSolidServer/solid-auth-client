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
  .command('generate-popup [app-name] [filename]')
  .description(
    'build a secure login app named for your application.  ' +
      '[app-name] is the name of your app. (default "the application")  ' +
      '[filename] is the name of the popup html file. (default "popup.html").'
  )
  .action(generatePopup)

program.parse(process.argv)

// Show help if called with no arguments
if (!process.argv.slice(2).length) {
  program.outputHelp()
}

// generatePopup command

function generatePopup(appName = '', filename = 'popup.html') {
  log(`Generating "${filename}" with app name "${appName}".`)

  const templateFilename = path.resolve(
    __dirname,
    '..',
    'dist-popup/popup-template.html'
  )
  if (!fs.existsSync(templateFilename)) {
    warn(
      `Could not find popup template. Expected it to be located at "${templateFilename}".  Please file a bug at ${issueUrl}`
    )
    return
  }

  let popupTemplateBuffer
  try {
    popupTemplateBuffer = fs.readFileSync(templateFilename)
  } catch (err) {
    warn(`Could not read the popup template.  Please file a bug at ${issueUrl}`)
    console.error(err)
    return
  }

  const popupBuffer = popupTemplateBuffer
    .toString()
    .replace(/['"]{{APP_NAME}}['"]/g, JSON.stringify(appName))

  try {
    fs.writeFileSync(filename, popupBuffer)
  } catch (err) {
    warn(`Could not write the popup to "${filename}".`)
    console.error(err)
    return
  }

  log(`Popup is generated and available at "${filename}"!`)
}
