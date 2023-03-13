/* global it, xit, describe */

/**
 * Module dependencies
 */

const m = require('multiline').stripIndent
const concat = require('concat-stream')
const read = require('fs').readFileSync
const cheerio = require('cheerio')
const join = require('path').join
const rm = require('rimraf').sync
const assert = require('assert')
const isUrl = require('is-url')
const sinon = require('sinon')
const Xray = require('..')

/**
 * URL
 *
 * We can be reasonably certain the issues list with that sorting will stay static,
 * since it is sorted by created date.
 */

const url = 'http://lapwinglabs.github.io/static/'
const pagedUrl = 'https://github.com/lapwinglabs/x-ray/issues?q=is%3Aissue%20sort%3Acreated-asc%20'

/**
 * Tests
 */

describe('Xray basics', function () {
  it('should work with the kitchen sink', function (done) {
    const x = Xray()
    x({
      title: 'title@text',
      image: x('#gbar a@href', 'title'),
      scoped_title: x('head', 'title'),
      inner: x('title', {
        title: '@text'
      })
    })('http://www.google.com/ncr', function (err, obj) {
      if (err) return done(err)
      assert.equal('Google', obj.title, '{ title: title@text }')
      assert.equal('Google Images', obj.image)
      assert.equal('Google', obj.scoped_title)
      assert.equal('Google', obj.inner.title)
      done()
    })
  })

  it('should work with embedded x-ray instances', function (done) {
    const x = Xray()

    x({
      list: x('body', {
        first: x('a@href', 'title')
      })
    })(url, function (err, obj) {
      if (err) return done(err)
      assert.deepEqual(obj, {
        list: {
          first: "Loripsum.net - The 'lorem ipsum' generator that doesn't suck."
        }
      })
      done()
    })
  })

  it('should work without passing a URL in the callback', function (done) {
    const x = Xray()
    x('http://google.com', {
      title: 'title'
    })(function (err, obj) {
      if (err) return done(err)
      assert.deepEqual(obj, {
        title: 'Google'
      })
      done()
    })
  })

  it('should work passing neither a valid URL nor valid HTML', function (done) {
    const x = Xray()
    x('garbageIn', {
      title: 'title'
    })(function (err, obj) {
      if (err) return done(err)
      assert.deepEqual(obj, {})
      done()
    })
  })

  it('should work with arrays', function (done) {
    const x = Xray()

    x(url, ['a@href'])(function (err, arr) {
      if (err) return done(err)
      assert.equal(50, arr.length)
      assert.equal('http://loripsum.net/', arr.pop())
      assert.equal('http://loripsum.net/', arr.pop())
      assert.equal('http://loripsum.net/', arr.pop())
      assert.equal('http://producthunt.com/', arr.pop())
      done()
    })
  })

  it('should work with an array without a url', function (done) {
    const x = Xray()

    x(['a@href'])(url, function (err, arr) {
      if (err) return done(err)
      assert.equal(50, arr.length)
      assert.equal('http://loripsum.net/', arr.pop())
      assert.equal('http://loripsum.net/', arr.pop())
      assert.equal('http://loripsum.net/', arr.pop())
      assert.equal('http://producthunt.com/', arr.pop())
      done()
    })
  })

  it('arrays should work with a simple selector', function (done) {
    const x = Xray()

    x('a', [{ link: '@href' }])(url, function (err, arr) {
      if (err) return done(err)
      assert.equal(50, arr.length)
      assert.deepEqual({ link: 'http://loripsum.net/' }, arr.pop())
      assert.deepEqual({ link: 'http://loripsum.net/' }, arr.pop())
      assert.deepEqual({ link: 'http://loripsum.net/' }, arr.pop())
      assert.deepEqual({ link: 'http://producthunt.com/' }, arr.pop())
      done()
    })
  })

  it('should select items with a scope', function (done) {
    const html = '<ul class="tags"><li>a</li><li>b</li><li>c</li></ul><ul class="tags"><li>d</li><li>e</li></ul>'
    const $ = cheerio.load(html)
    const x = Xray()
    x('.tags', ['li'])($, function (err, arr) {
      if (err) return done(err)
      assert.equal(5, arr.length)
      assert.equal('a', arr[0])
      assert.equal('b', arr[1])
      assert.equal('c', arr[2])
      assert.equal('d', arr[3])
      assert.equal('e', arr[4])
      done()
    })
  })

  it('should select lists separately too', function (done) {
    const html = '<ul class="tags"><li>a</li><li>b</li><li>c</li></ul><ul class="tags"><li>d</li><li>e</li></ul>'
    const $ = cheerio.load(html)
    const x = Xray()

    x('.tags', [['li']])($, function (err, arr) {
      if (err) return done(err)
      assert(arr[0].length === 3)
      assert(arr[0][0] === 'a')
      assert(arr[0][1] === 'b')
      assert(arr[0][2] === 'c')
      assert(arr[1].length === 2)
      assert(arr[1][0] === 'd')
      assert(arr[1][1] === 'e')
      done()
    })
  })

  it('should select collections within collections', function (done) {
    const html = m(function () { /*
      <div class="items">
        <div class="item">
          <h2>first item</h2>
          <ul class="tags">
            <li>a</li>
            <li>b</li>
            <li>c</li>
          </ul>
        </div>
        <div class="item">
          <h2>second item</h2>
          <ul class="tags">
            <li>d</li>
            <li>e</li>
          </ul>
        </div>
      </div>
    */}) // eslint-disable-line

    const $ = cheerio.load(html)
    const x = Xray()

    x($, '.item', [{
      title: 'h2',
      tags: x('.tags', ['li'])
    }])(function (err, arr) {
      if (err) return done(err)
      assert.deepEqual([
        { title: 'first item', tags: ['a', 'b', 'c'] },
        { title: 'second item', tags: ['d', 'e'] }
      ], arr)
      done()
    })
  })

  // TODO: Rewrite test, mat.io hasn't the same content.
  xit('should work with complex selections', function (done) {
    this.timeout(10000)
    const x = Xray()
    x('http://mat.io', {
      title: 'title',
      items: x('.item', [{
        title: '.item-content h2',
        description: '.item-content section'
      }])
    })(function (err, obj) {
      if (err) return done(err)
      assert(obj.title === 'mat.io')

      assert.deepEqual({
        title: "The 100 Best Children's Books of All Time",
        description: "Relive your childhood with TIME's list of the best 100 children's books of all time http://t.co/NEvBhNM4np http://ift.tt/1sk3xdM\n\n— TIME.com (@TIME) January 11, 2015"
      }, obj.items.pop())

      assert.deepEqual({
        title: 'itteco/iframely · GitHub',
        description: 'MatthewMueller starred itteco/iframely'
      }, obj.items.pop())

      assert.deepEqual({
        title: 'Republicans Expose Obama’s College Plan as Plot to Make People Smarter - The New Yorker',
        description: 'Republicans Expose Obama’s College Plan as Plot to Make People Smarter http://t.co/OsvoOgn8Tn\n\n— Assaf (@assaf) January 11, 2015'
      }, obj.items.pop())

      done()
    })
  })

  it('should apply filters', function (done) {
    const html = '<h3> All Tags </h3><ul class="tags"><li> a</li><li> b </li><li>c </li></ul><ul class="tags"><li>\nd</li><li>e</li></ul>'
    const $ = cheerio.load(html)
    const x = Xray({
      filters: {
        trim: function (value) {
          return typeof value === 'string' ? value.trim() : value
        },
        slice: function (value, limit) {
          return typeof value === 'string' ? value.slice(0, limit) : value
        },
        reverse: function (value) {
          return typeof value === 'string' ? value.split('').reverse().join('') : value
        }
      }
    })

    x($, {
      title: 'h3 | trim | reverse | slice:4',
      tags: ['.tags > li | trim']
    })(function (err, obj) {
      if (err) return done(err)
      assert.deepEqual(obj, {
        title: 'sgaT',
        tags: ['a', 'b', 'c', 'd', 'e']
      })
      done()
    })
  })

  // TODO: this could be tested better, need a static site
  // with pages
  it('should work with pagination & limits', function (done) {
    this.timeout(10000)
    const x = Xray()

    const xray = x('https://blog.ycombinator.com/', '.post', [{
      title: 'h1 a',
      link: '.article-title@href'
    }])
      .paginate('.nav-previous a@href')
      .limit(3)

    xray(function (err, arr) {
      if (err) return done(err)
      assert(arr.length, 'array should have a length')

      arr.forEach(function (item) {
        assert(item.title.length)
        assert.equal(true, isUrl(item.link))
      })
      done()
    })
  })

  it('should work with pagination & abort function checking returned object', function (done) {
    this.timeout(10000)
    const x = Xray()

    const xray = x(pagedUrl, '.js-issue-row', [{
      id: '@id',
      title: 'a.h4'
    }])
      .paginate('.next_page@href')
      .limit(3)
      .abort(function (result) {
        let i = 0

        // Issue 40 is on page 2 of our result set
        for (; i < result.length; i++) {
          if (result[i].id === 'issue_40') return true
        }

        return false
      })

    xray(function (err, arr) {
      if (err) return done(err)
      // 25 results per page
      assert.equal(50, arr.length)

      arr.forEach(function (item) {
        assert(item.id.length)
        assert(item.title.length)
      })
      done()
    })
  })

  it('should work with pagination & abort function checking next URL', function (done) {
    this.timeout(10000)
    const x = Xray()

    const xray = x(pagedUrl, '.js-issue-row', [{
      id: '@id',
      title: 'a.h4'
    }])
      .paginate('.next_page@href')
      .limit(3)
      .abort(function (result, url) {
        // Break after page 2
        if (url.indexOf('page=3') >= 0) return true

        return false
      })

    xray(function (err, arr) {
      if (err) return done(err)
      // 25 results per page
      assert.equal(50, arr.length)

      arr.forEach(function (item) {
        assert(item.id.length)
        assert(item.title.length)
      })
      done()
    })
  })

  it('should not call function twice when reaching the last page', function (done) {
    this.timeout(10000)
    setTimeout(done, 9000)
    let timesCalled = 0
    const x = Xray()

    x('https://github.com/lapwinglabs/x-ray/watchers', '.follow-list-item', [{
      fullName: '.vcard-username'
    }]).paginate('.next_page@href').limit(10)
    ;(function (err, arr) {
      timesCalled++
      assert.ifError(err)
      assert.equal(1, timesCalled, 'callback was called more than once')
    })
  })

  it('it should not encode non-latin HTML automatically when using `@html` selector', function (done) {
    const x = Xray()

    x('<div>你好</div>', 'div@html')(function (err, result) {
      assert.ifError(err)
      assert.equal(result, '你好')
      done()
    })
  })

  describe('.format()', function () {
    xit('should support adding formatters', function () {
      // TODO
    })
  })

  describe('.stream() === .write()', function () {
    it('write should work with streams', function (done) {
      const html = '<ul class="tags"><li>a</li><li>b</li><li>c</li></ul><ul class="tags"><li>d</li><li>e</li></ul>'
      const $ = cheerio.load(html)
      const x = Xray()

      const xray = x($, '.tags', [['li']])

      xray
        .stream()
        .pipe(concat(function (data) {
          const arr = JSON.parse(data.toString())
          assert(arr[0].length === 3)
          assert(arr[0][0] === 'a')
          assert(arr[0][1] === 'b')
          assert(arr[0][2] === 'c')
          assert(arr[1].length === 2)
          assert(arr[1][0] === 'd')
          assert(arr[1][1] === 'e')
          done()
        }))
    })

    it('write should work with pagination', function (done) {
      this.timeout(10000)
      const x = Xray()

      const xray = x('https://blog.ycombinator.com/', '.post', [{
        title: 'h1 a',
        link: '.article-title@href'
      }])
        .paginate('.nav-previous a@href')
        .limit(3)

      xray
        .stream()
        .pipe(concat(function (buff) {
          const arr = JSON.parse(buff.toString())

          assert(arr.length, 'array should have a length')

          arr.forEach(function (item) {
            assert(item.title.length)
            assert.equal(true, isUrl(item.link))
          })
          done()
        }))
    })
  })

  describe('.write(file)', function () {
    it('should stream to a file', function (done) {
      const path = join(__dirname, 'tags.json')
      const html = '<ul class="tags"><li>a</li><li>b</li><li>c</li></ul><ul class="tags"><li>d</li><li>e</li></ul>'
      const $ = cheerio.load(html)
      const x = Xray()

      x($, '.tags', [['li']]).write(path).on('finish', function () {
        const arr = JSON.parse(read(path, 'utf8'))
        assert(arr[0].length === 3)
        assert(arr[0][0] === 'a')
        assert(arr[0][1] === 'b')
        assert(arr[0][2] === 'c')
        assert(arr[1].length === 2)
        assert(arr[1][0] === 'd')
        assert(arr[1][1] === 'e')
        rm(path)
        done()
      })
    })
    it('stream to a file with pagination', function (done) {
      const path = join(__dirname, 'pagination.json')
      this.timeout(10000)
      const x = Xray()

      x('https://blog.ycombinator.com/', '.post', [{
        title: 'h1 a',
        link: '.article-title@href'
      }]).paginate('.nav-previous a@href').limit(3).write(path).on('finish', function () {
        const arr = JSON.parse(read(path, 'utf8'))
        assert(arr.length, 'array should have a length')
        arr.forEach(function (item) {
          assert(item.title.length)
          assert.equal(true, isUrl(item.link))
        })
        rm(path)
        done()
      })
    })
  })

  describe('.then(cb, err)', function () {
    const noop = function () { }
    const html = '<ul class="tags"><li>a</li><li>b</li><li>c</li></ul><ul class="tags"><li>d</li><li>e</li></ul>'
    const expected = [['a', 'b', 'c'], ['d', 'e']]
    const $ = cheerio.load(html)
    const x = Xray()

    it('should Promisify and pass cb to promise', function () {
      const resHandler = sinon.fake()
      const errorHandler = sinon.fake()

      const xray = x($, '.tags', [['li']])
      const promise = xray.then(resHandler, errorHandler)

      return promise.then(function () {
        assert(resHandler.calledOnce === true, 'result handler called once')
        assert.deepStrictEqual(resHandler.firstCall.args[0], expected)
        assert(errorHandler.called === false, 'error handler never called')
      })
    })

    it('should Promisify and pass rejections to promise', function () {
      const resHandler = sinon.fake()
      const errorHandler = sinon.fake()

      const xray = x('https://127.0.0.1:666/', '.tags', [['li']])
      process.once('unhandledRejection', noop)
      const promise = xray.then(resHandler, errorHandler)

      return promise.then(function () {
        process.removeListener('unhandledRejection', noop)
        assert(resHandler.called === false, 'result handler never called')
        assert(errorHandler.calledOnce === true, 'error handler called once')
        assert(errorHandler.firstCall.args[0] instanceof Error, 'called with error')
      })
    })
  })
})
