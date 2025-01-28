import assert from 'assert'
import merge from 'merge'
import {wrapWithElement} from './XMLUtils.js'
import {PaymentMethod, PaymentMethods} from  './Constants.js'

const defaultOptions = {
  date: new Date(),
  paymentMethod: PaymentMethods.BankTransfer,
  amount: 0,
  description: '',
}

export class CreditEntry {
  constructor (options) {
    this._options = {};
    this._options.date = options.date || new Date()
    this._options.paymentMethod = options.paymentMethod || defaultOptions.paymentMethod
    this._options.amount = options.amount || defaultOptions.amount
    this._options.description = options.description || ''

    assert(this._options.paymentMethod instanceof PaymentMethod,
      'Valid PaymentMethod field missing from credit entry options')

    assert(this._options.date instanceof Date,
      'Valid Date field missing from credit entry options')

    assert(typeof this._options.amount === 'number' && this._options.amount !== 0,
      'Valid Amount value missing from credit entry options')

    assert(typeof this._options.description === 'string' || this._options.description === '',
      'Valid Description value missing from credit entry options')

  }

  _generateXML (indentLevel) {
    indentLevel = indentLevel || 0

    return wrapWithElement('kifizetes', [
      [ 'datum', this._options.date ],
      [ 'jogcim', this._options.paymentMethod.value ],
      [ 'osszeg', this._options.amount ],
      [ 'leiras', this._options.description ],
    ], indentLevel)
  }
}
