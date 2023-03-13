const Xray = require('..')
const x = Xray()

x('http://google.com', {
  main: 'title',
  image: x('https://images.google.com', 'title')
})(console.log)
