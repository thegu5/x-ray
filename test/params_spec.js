/* global it, describe */

/**
 * Module Dependencies
 */

const params = require('../lib/params')
const assert = require('assert')

/**
 * Tests
 */

describe('params', function () {
  describe('1 arguments', function () {
    it("should be a selector if it's a string", function () {
      const arg = params('#hi')
      assert.equal(null, arg.source)
      assert.equal(null, arg.context)
      assert.equal('#hi', arg.selector)
    })

    it("should be a selector if it's an object", function () {
      const arg = params({ hi: 'hi' })
      assert.equal(null, arg.source)
      assert.equal(null, arg.context)
      assert.deepEqual(arg.selector, {
        hi: 'hi'
      })
    })

    it("should be a selector if it's an array", function () {
      const arg = params(['hi'])
      assert.equal(null, arg.source)
      assert.equal(null, arg.context)
      assert.deepEqual(arg.selector, ['hi'])
    })
  })

  describe('2 arguments', function () {
    it('should support attribute selectors', function () {
      const arg = params('@attr', { hi: 'hi' })
      assert.equal(null, arg.source)
      assert.equal('@attr', arg.context)
      assert.deepEqual(arg.selector, {
        hi: 'hi'
      })
    })

    it('should support selectors', function () {
      const arg = params('.hi', { hi: 'hi' })
      assert.equal(null, arg.source)
      assert.equal('.hi', arg.context)
      assert.deepEqual(arg.selector, {
        hi: 'hi'
      })
    })

    it('should support urls with object selectors', function () {
      const arg = params('https://google.com', { hi: 'hi' })
      assert.equal('https://google.com', arg.source)
      assert.equal(null, arg.context)
      assert.deepEqual(arg.selector, {
        hi: 'hi'
      })
    })

    it('should support urls with string selectors', function () {
      const arg = params('https://google.com', 'hi')
      assert.equal('https://google.com', arg.source)
      assert.equal(null, arg.context)
      assert.deepEqual(arg.selector, 'hi')
    })

    it('should support urls with array selectors', function () {
      const arg = params('https://google.com', ['hi'])
      assert.equal('https://google.com', arg.source)
      assert.equal(null, arg.context)
      assert.deepEqual(arg.selector, ['hi'])
    })

    it('should support HTML strings with object selectors', function () {
      const arg = params('<h2>hi</h2>', { hi: 'hi' })
      assert.equal('<h2>hi</h2>', arg.source)
      assert.equal(null, arg.context)
      assert.deepEqual(arg.selector, {
        hi: 'hi'
      })
    })

    it('should support HTML strings with string selectors', function () {
      const arg = params('<h2>hi</h2>', 'hi')
      assert.equal('<h2>hi</h2>', arg.source)
      assert.equal(null, arg.context)
      assert.deepEqual(arg.selector, 'hi')
    })

    it('should support HTML strings with array selectors', function () {
      const arg = params('<h2>hi</h2>', ['hi'])
      assert.equal('<h2>hi</h2>', arg.source)
      assert.equal(null, arg.context)
      assert.deepEqual(arg.selector, ['hi'])
    })
  })

  describe('3 arguments', function () {
    it('should support a source, context, and selector', function () {
      const arg = params('http://google.com', '#hi', { hi: 'hi' })
      assert.equal('http://google.com', arg.source)
      assert.equal('#hi', arg.context)
      assert.deepEqual({ hi: 'hi' }, arg.selector)
    })
  })
})
