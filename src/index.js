/*
 * Internals
 */
export function invokeParser (parser, parserState) {
  return Promise.resolve(parserState).then(parserState => {
    if (typeof parser !== 'function') {
      throw new Error('Parser needs to be a function, but got ' +
      parser + ' instead')
    }
    if (!parserState.isParserState) {
      throw new Error('parserState must be a ParserState')
    }
    return parser(parserState)
  })
}

export class ParserState {
  constructor (value, input, offset, userState,
               position, hasConsumed, error, failed) {
    this.value = value
    this.input = input
    this.offset = offset
    this.position = position
    this.userState = userState
    this.failed = failed
    this.error = error
  }
  copy () {
    return new ParserState(this.value,
                           this.input,
                           this.offset,
                           this.userState,
                           this.position,
                           this.hasConsumed,
                           this.error,
                           this.failed)
  }
}
ParserState.prototype.isParserState = true

/**
 * Represents a source location.
 * @typedef {Object} SourcePosition
 * @property {String} name - Optional sourcefile name.
 * @property {Integer} line - Line number, starting from 1.
 * @property {Integer} column - Column number in the line, starting from 1.
 * @memberof module:mona/api
 * @instance
 */
export class SourcePosition {
  constructor (name, line, column) {
    this.name = name
    this.line = line || 1
    this.column = column || 0
  }
  copy () {
    return new SourcePosition(this.name, this.line, this.column)
  }
}

/**
 * Information about a parsing failure.
 * @typedef {Object} ParserError
 * @property {api.SourcePosition} position - Source position for the error.
 * @property {Array} messages - Array containing relevant error messages.
 * @property {String} type - The type of parsing error.
 * @memberof module:mona/api
 */
export class ParserError extends Error {
  constructor (pos, messages, type, wasEof) {
    super()
    if (Error.captureStackTrace) {
      // For pretty-printing errors on node.
      Error.captureStackTrace(this, this)
    }
    this.position = pos
    this.messages = messages
    this.type = type
    this.wasEof = wasEof
    this.message = ('(line ' + this.position.line +
                    ', column ' + this.position.column + ') ' +
                    this.messages.join('\n'))
  }
  merge (err2) {
    const err1 = this
    if (!err1 || (!err1.messages.length && err2.messages.length)) {
      return err2
    } else if (!err2 || (!err2.messages.length && err1.messages.length)) {
      return err1
    } else {
      switch (comparePositions(err1.position, err2.position)) {
        case 'gt':
          return err1
        case 'lt':
          return err2
        case 'eq':
          var newMessages =
            (err1.messages.concat(err2.messages)).reduce((acc, x) => {
              return (~acc.indexOf(x)) ? acc : acc.concat([x])
            }, [])
          return new ParserError(err2.position,
                                 newMessages,
                                 err2.type,
                                 err2.wasEof || err1.wasEof)
        default:
          throw new Error('This should never happen')
      }
    }
  }
}

function comparePositions (pos1, pos2) {
  if (pos1.line < pos2.line) {
    return 'lt'
  } else if (pos1.line > pos2.line) {
    return 'gt'
  } else if (pos1.column < pos2.column) {
    return 'lt'
  } else if (pos1.column > pos2.column) {
    return 'gt'
  } else {
    return 'eq'
  }
}
