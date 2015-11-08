/* global describe, it */
var assert = require('assert')
var parse = require('@mona/parse')
var core = require('@mona/core')
var comb = require('@mona/combinators')

describe('ParserError', function () {
  it('reports the line in which an error happened', function () {
    assert.throws(function () {
      parse(core.token(), '')
    }, /line 1/)
    assert.throws(function () {
      parse(comb.and(core.token(), core.token()), '\n')
    }, /line 2/)
  })
  it('reports the column in which an error happened', function () {
    assert.throws(function () {
      parse(core.fail(), '')
    }, /(line 1, column 0)/)
    assert.throws(function () {
      parse(comb.and(core.token(),
                     core.token(),
                     core.fail()),
      'aaa')
    }, /(line 1, column 2)/)
    var parser = comb.and(core.token(), core.token(), core.token(),
                          core.token(), core.fail())
    assert.throws(function () {
      parse(parser, '\na\nbcde')
    }, /(line 3, column 1)/)
  })
})
