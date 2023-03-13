const path = require('path')
const read = require('fs').readFileSync
const html = read(path.resolve(__dirname, 'index.html'))
const Xray = require('../..')
const x = Xray()

x(html, '.item', [{
  title: 'h2',
  tags: x('.tags', ['li'])
}])(console.log)
