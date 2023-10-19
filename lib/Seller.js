import merge from 'merge'
import {wrapWithElement} from './XMLUtils.js'

const defaultOptions = {
  bank: {},
  email: {}
}

export class Seller {
  constructor (options) {
    this._options = merge.recursive(true, defaultOptions, options || {})
  }

  _generateXML (indentLevel) {
    indentLevel = indentLevel || 0
    return wrapWithElement('elado', [
      [ 'bank', this._options.bank.name ],
      [ 'bankszamlaszam', this._options.bank.accountNumber ],
      [ 'emailReplyto', this._options.email.replyToAddress ],
      [ 'emailTargy', this._options.email.subject ],
      [ 'emailSzoveg', this._options.email.message ],
      [ 'alairoNeve', this._options.issuerName ]
    ], indentLevel)
  }
}
