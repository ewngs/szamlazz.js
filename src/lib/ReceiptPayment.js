'use strict'

const assert = require('assert')
const merge = require('merge')
const XMLUtils = require('./XMLUtils')

class ReceiptPayment {
  constructor (options) {
    this._options = options || {}
  }

  _generateXML (indentLevel) {
    assert(typeof this._options.paymentMethod === 'string' && this._options.paymentMethod.trim() !== '',
      'Valid Payment method value missing from payment options')

    assert(typeof this._options.amount === 'number' && this._options.amount !== 0,
      'Valid Amount value missing from payment options')

    indentLevel = indentLevel || 0

    return XMLUtils.wrapWithElement('kifizetes', [
      [ 'fizetoeszkoz', this._options.paymentMethod ],
      [ 'osszeg', this._options.amount ],
      [ 'leiras', this._options.description ],
    ], indentLevel)
  }
}
module.exports = ReceiptPayment
