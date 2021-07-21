'use strict'

const assert = require('assert')
const Constants = require('./Constants').setup()
const XMLUtils = require('./XMLUtils')
const ReceiptItem = require('./ReceiptItem')
const ReceiptPayment = require('./ReceiptPayment')

const defaultOptions = {
  paymentMethod: Constants.PaymentMethod.BankTransfer,
  currency: Constants.Currency.Ft,
  language: Constants.Language.Hungarian,
  exchangeRate: 0,
  exchangeBank: ''
}

class Receipt {
  constructor (options) {
    this._options = {};
    this._options.requestId = options.requestId
    this._options.prefix = options.prefix
    this._options.paymentMethod = options.paymentMethod || defaultOptions.paymentMethod
    this._options.currency = options.currency || defaultOptions.currency
    this._options.exchangeBank = options.exchangeBank || defaultOptions.exchangeBank
    this._options.exchangeRate = options.exchangeRate || defaultOptions.exchangeRate
    this._options.comment = options.comment
    this._options.pdfTemplate = options.pdfTemplate
    this._options.generalLedgerId = options.generalLedgerId
    this._options.items = options.items
    this._options.payments = options.payments
  }

  _generateXML (indentLevel) {
    indentLevel = indentLevel || 0

    assert(this._options.paymentMethod instanceof Constants.Interface.PaymentMethod,
      'Valid PaymentMethod field missing from Receipt options')

    assert(this._options.currency instanceof Constants.Interface.Currency,
      'Valid Currency field missing from Receipt options')

    assert(Array.isArray(this._options.items),
      'Valid Items array missing from Receipt options')

    let o = XMLUtils.wrapWithElement('fejlec', [
      [ 'hivasAzonosito', this._options.requestId ],
      [ 'elotag', this._options.prefix ],
      [ 'fizmod', this._options.paymentMethod.value ],
      [ 'penznem', this._options.currency.value ],
      [ 'devizabank', this._options.exchangeBank ],
      [ 'devizaarf', this._options.exchangeRate ],
      [ 'megjegyzes', this._options.comment ],
      [ 'pdfSablon', this._options.pdfTemplate ],
      [ 'fokonyvVevo', this._options.generalLedgerId ],
    ], indentLevel)

    o += XMLUtils.pad(indentLevel) + '<tetelek>\n'
    o += this._options.items.map(item => {
      assert(item instanceof ReceiptItem, 'Element in items array is not an instance of the ReceiptItem class')
      return item._generateXML(indentLevel, this._options.currency)
    }).join('')
    o += XMLUtils.pad(indentLevel) + '</tetelek>\n'

    if (this._options.payments) {
      o += XMLUtils.pad(indentLevel) + '<kifizetesek>\n'
      o += this._options.items.map(item => {
        assert(item instanceof ReceiptPayment, 'Element in payments array is not an instance of the ReceiptPayment class')
        return item._generateXML(indentLevel)
      }).join('')
      o += XMLUtils.pad(indentLevel) + '</kifizetesek>\n'
    }

    return o
  }
}

module.exports = Receipt
