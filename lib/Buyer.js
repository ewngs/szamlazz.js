import assert from 'assert'
import merge from 'merge'
import {wrapWithElement} from './XMLUtils.js'
import {TaxSubject, TaxSubjects} from './Constants.js'

const defaultOptions = {
  postAddress: {},
  taxSubject: TaxSubjects.Unknown
}

export class Buyer {
  constructor (options) {
    this._options = merge.recursive(true, defaultOptions, options || {})
    this._options.taxSubject = options.taxSubject || defaultOptions.taxSubject

    assert(this._options.taxSubject instanceof TaxSubject,
      'Valid TaxSubject field missing from buyer invoice options')

    assert(typeof this._options.name === 'string' && this._options.name.trim().length > 0,
      'Valid Name field missing from buyer options')

    assert(typeof this._options.zip === 'string',
      'Zip field missing from buyer options')

    assert(typeof this._options.city === 'string' && this._options.city.trim().length > 0,
      'Valid City field missing from buyer options')

    assert(typeof this._options.address === 'string' && this._options.address.trim().length > 0,
      'Valid Address field missing from buyer options')
  }

  _generateXML (indentLevel) {
    indentLevel = indentLevel || 0

    return wrapWithElement('vevo', [
      [ 'nev', this._options.name ],
      [ 'orszag', this._options.country ],
      [ 'irsz', this._options.zip ],
      [ 'telepules', this._options.city ],
      [ 'cim', this._options.address ],
      [ 'email', this._options.email ],
      [ 'sendEmail', this._options.sendEmail ],
      [ 'adoalany', this._options.taxSubject ],
      [ 'adoszam', this._options.taxNumber ],
      [ 'adoszamEU', this._options.taxNumberEU ],
      [ 'csoportazonosito', this._options.taxNumberGroup ],    
      [ 'postazasiNev', this._options.postAddress.name ],
      [ 'postazasiOrszag', this._options.postAddress.country ],
      [ 'postazasiIrsz', this._options.postAddress.zip ],
      [ 'postazasiTelepules', this._options.postAddress.city ],
      [ 'postazasiCim', this._options.postAddress.address ],
      [ 'azonosito', this._options.identifier ],
      [ 'alairoNeve', this._options.issuerName ],
      [ 'telefonszam', this._options.phone ],
      [ 'megjegyzes', this._options.comment ]
    ], indentLevel)
  }
}
