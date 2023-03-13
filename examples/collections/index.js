const path = require('path')
const read = require('fs').readFileSync
const html = read(path.resolve(__dirname, 'index.html'))
const Xray = require('../..')
const x = Xray()

x(html, {
  title: '.title',
  image: 'img@src',
  tags: ['li']
})(console.log)
