/**
 * Module Dependencies
 */

const debug = require('debug')('resolve')
const isArray = require('./util').isArray
const parse = require('x-ray-parse')

/**
 * Export `resolve`
 */

module.exports = resolve

/**
 * Initialize `resolve`
 *
 * @param {$} cheerio object
 * @param {String} scope
 * @param {String|Array} selector
 * @param {Object} filters
 * @return {Array|String}
 */

function resolve ($, scope, selector, filters) {
  debug('resolve($j, %j)', scope, selector)
  filters = filters || {}
  const array = isArray(selector)
  const obj = parse(array ? selector[0] : selector)
  obj.attribute = obj.attribute || 'text'

  if (!obj.selector) {
    obj.selector = scope
    scope = null
  }

  let value = find($, scope, array ? [obj.selector] : obj.selector, obj.attribute)
  debug('resolved($j, %j) => %j', scope, selector, value)
  // allow null
  if (value === null) return value
  if (array && typeof value.map === 'function') {
    value = value.map(function (v) {
      return filter(obj, $, scope, selector, v, filters)
    })
  } else {
    value = filter(obj, $, scope, selector, value, filters)
  }

  return value
}

/**
 * Find the node(s)
 *
 * @param {Cheerio} $
 * @param {String} scope
 * @param {String|Array} selector
 * @param {String} attr
 * @return {Array|String}
 */

function find ($, scope, selector, attr) {
  if (scope && isArray(selector)) {
    var $scope = select($, scope)
    var out = []
    $scope.map(function (i) {
      const $el = $scope.eq(i)
      const $children = select($el, selector[0])
      $children.map(function (i) {
        out.push(attribute($children.eq(i), attr))
      })
    })
    return out.length > 0 ? out : null
  } else if (scope) {
    $scope = select($, scope)
    const $result = $scope.find(selector).eq(0)
    return $result.length > 0 ? attribute($result, attr) : null
  } else {
    let $selector
    if (isArray(selector)) {
      $selector = select($, selector[0])
      out = []
      $selector.map(function (i) {
        out.push(attribute($selector.eq(i), attr))
      })
      return out.length > 0 ? out : null
    } else {
      $selector = select($, selector)
      const $result = $selector.eq(0)
      return $result.length > 0 ? attribute($result, attr) : null
    }
  }
}

/**
 * Selector abstraction, deals
 * with various instances of $
 *
 * @param {Cheerio} $
 * @param {String} selector
 * @return {Cheerio}
 */

function select ($, selector) {
  if ($.is && $.is(selector)) return $
  return $.find ? $.find(selector) : $(selector)
}

/**
 * Select the attribute based on `attr`
 *
 * @param {Cheerio} $
 * @param {String} attr
 * @return {String}
 */

function attribute ($el, attr) {
  switch (attr) {
    case 'html':
      return $el.html()
    case 'text':
      return $el.text()
    default:
      return $el.attr(attr)
  }
}

/**
 * Filter the value(s)
 *
 * @param {Object} obj
 * @param {Cheerio} $
 * @param {String} scope
 * @param {String|Array} selector
 * @param {Object} filters
 * @return {Array|String}
 */

function filter (obj, $, scope, selector, value, filters) {
  const ctx = { $: $, selector: obj.selector, attribute: obj.attribute }
  return (obj.filters || []).reduce(function (out, filter) {
    const fn = filters[filter.name]
    if (typeof fn === 'function') {
      const args = [out].concat(filter.args || [])
      const filtered = fn.apply(ctx, args)
      debug('%s.apply(ctx, %j) => %j', filter.name, args, filtered)
      return filtered
    } else {
      throw new Error('Invalid filter: ' + filter.name)
    }
  }, value)
}
