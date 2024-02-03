import assert from 'assert'
import {Currencies, Currency, Language, Languages, PaymentMethod, PaymentMethods} from  './Constants.js'
import {pad, wrapWithElement} from './XMLUtils.js'
import {Seller} from './Seller.js'
import {Buyer} from './Buyer.js'
import {Item} from'./Item.js'

const defaultOptions = {
  paymentMethod: PaymentMethods.BankTransfer,
  currency: Currencies.Ft,
  language: Languages.Hungarian,
  exchangeRate: 0,
  exchangeBank: ''
}

export class Invoice {
  constructor (options) {
    this._options = {};
    this._options.issueDate = options.issueDate || new Date()
    this._options.fulfillmentDate = options.fulfillmentDate || new Date()
    this._options.dueDate = options.dueDate || new Date()
    this._options.paymentMethod = options.paymentMethod || defaultOptions.paymentMethod
    this._options.currency = options.currency || defaultOptions.currency
    this._options.language = options.language || defaultOptions.language
    this._options.exchangeRate = options.exchangeRate || defaultOptions.exchangeRate
    this._options.exchangeBank = options.exchangeBank || defaultOptions.exchangeBank
    this._options.seller = options.seller
    this._options.buyer = options.buyer
    this._options.items = options.items
    this._options.orderNumber = options.orderNumber
    this._options.proforma = options.proforma
    this._options.invoiceIdPrefix = options.invoiceIdPrefix
    this._options.paid = options.paid
    this._options.comment = options.comment
    this._options.logoImage = options.logoImage
    this._options.adjustmentInvoiceNumber = options.adjustmentInvoiceNumber
    this._options.prepaymentInvoice = options.prepaymentInvoice || false
  }

  _generateXML (indentLevel) {
    indentLevel = indentLevel || 0

    assert(this._options.issueDate instanceof Date,
      'Valid IssueDate field missing from invoice options')

    assert(this._options.fulfillmentDate instanceof Date,
      'Valid FulfillmentDate field missing from invoice options')

    assert(this._options.dueDate instanceof Date,
      'Valid DueDate field missing from invoice options')

    assert(this._options.paymentMethod instanceof PaymentMethod,
      'Valid PaymentMethod field missing from invoice options')

    assert(this._options.currency instanceof Currency,
      'Valid Currency field missing from invoice options')

    assert(this._options.language instanceof Language,
      'Valid Language field missing from invoice options')

    assert(typeof this._options.seller === 'undefined' || this._options.seller instanceof Seller,
      'The provided optional Seller field is invalid')

    assert(this._options.buyer instanceof Buyer,
      'Valid Buyer field missing from invoice options')

    assert(Array.isArray(this._options.items),
      'Valid Items array missing from invoice options')

      
  if (this._options.adjustmentInvoiceNumber !== null && this._options.adjustmentInvoiceNumber !== undefined) {
    assert(typeof this._options.adjustmentInvoiceNumber === 'string', '"adjustmentInvoiceNumber" should be a string')
    assert(this._options.adjustmentInvoiceNumber.length > 0, '"adjustmentInvoiceNumber" should be minimum 1 character')
    this._options.adjustmentInvoice = true
  }

    let o = wrapWithElement('fejlec', [
      [ 'keltDatum', this._options.issueDate ],
      [ 'teljesitesDatum', this._options.fulfillmentDate ],
      [ 'fizetesiHataridoDatum', this._options.dueDate ],
      [ 'fizmod', this._options.paymentMethod.value ],
      [ 'penznem', this._options.currency.value ],
      [ 'szamlaNyelve', this._options.language.value ],
      [ 'megjegyzes', this._options.comment ],
      [ 'arfolyamBank', this._options.exchangeBank ],
      [ 'arfolyam', this._options.exchangeRate ],
      [ 'rendelesSzam', this._options.orderNumber ],
      [ 'elolegszamla', this._options.prepaymentInvoice ],
      [ 'helyesbitoszamla', this._options.adjustmentInvoice ],
      [ 'helyesbitettSzamlaszam', this._options.adjustmentInvoiceNumber ],
      [ 'dijbekero', this._options.proforma ],
      [ 'logoExtra', this._options.logoImage ],
      [ 'szamlaszamElotag', this._options.invoiceIdPrefix ],
      [ 'fizetve', this._options.paid ]
    ], indentLevel)

    if (this._options.seller) {
      o += this._options.seller._generateXML(indentLevel)
    }

    o += this._options.buyer._generateXML(indentLevel)

    o += pad(indentLevel) + '<tetelek>\n'
    o += this._options.items.map(item => {
      assert(item instanceof Item, 'Element in Items array is not an instance of the Item class')
      return item._generateXML(indentLevel, this._options.currency)
    }).join('')
    o += pad(indentLevel) + '</tetelek>\n'

    return o
  }
}
