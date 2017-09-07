#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const program = require('commander')

const { version } = require('../package.json')

// helpers

function ns(fn) {
  return function() {
    fn.apply(
      null,
      ['[solid-auth-client]'].concat(Array.prototype.slice.call(arguments))
    )
  }
}

const log = ns(console.log.bind(console))
const warn = ns(console.log.bind(console))

// CLI

program
  .version(version)
  .command('generate-popup <trusted-name> [filename]')
  .description(
    'build a secure login app named for your application.  ' +
      '<trusted-name> is required and is the name of your app.  ' +
      '[filename] defaults to "popup.html".'
  )
  .action(generatePopup)

program.parse(process.argv)

// Show help if called with no arguments
if (!process.argv.slice(2).length) {
  program.outputHelp()
}

// generatePopup command

function generatePopup(trustedName, filename = 'popup.html') {
  log(`Generating "${filename}" with trusted app name "${trustedName}".`)

  const templateFilename = path.resolve(
    __dirname,
    '..',
    'dist-popup/popup.html'
  )
  if (!fs.existsSync(templateFilename)) {
    const issueUrl = 'https://github.com/solid/solid-auth-client/issues'
    warn(
      `Could not find popup template. Expected it to be located at "${templateFilename}".  Please file a bug at ${issueUrl}`
    )
    return
  }

  let popupTemplateBuffer
  try {
    popupTemplateBuffer = fs.readFileSync(templateFilename)
  } catch (err) {
    warn(`Could not read the popup template`)
    console.error(err)
    return
  }

  const popupBuffer = popupTemplateBuffer
    .toString()
    .replace(/{{TRUSTED_APP_NAME}}/g, trustedName)

  try {
    fs.writeFileSync(filename, popupBuffer)
  } catch (err) {
    warn(`Could not write the popup to "${filename}".`)
    console.error(err)
    return
  }

  log(`Popup is generated and available at "${filename}"!`)
}
