import assert from 'assert'
import merge from 'merge'
import {wrapWithElement} from './XMLUtils.js'

function round (value, exp) {
  if (exp < 1) {
    return Math.round(value)
  }

  const r = Math.pow(10, exp)

  return Math.round(value * r) / r
}

const defaultOptions = {
  quantity: 1,
  vatValue: 0
}

export class Item {
  constructor (options) {
    this._options = merge.recursive(true, defaultOptions, options || {})
  }

  _generateXML (indentLevel, currency) {
    assert(typeof this._options.label === 'string' && this._options.label.trim() !== '',
      'Valid Label value missing from item options')

    assert(typeof this._options.quantity === 'number' && this._options.quantity !== 0,
      'Valid Count value missing from item options')

    assert(typeof this._options.vat !== 'undefined' && this._options.vat !== '',
      'Valid Vat Percentage value missing from item options')

    if (typeof this._options.vat === 'number') {
      if (typeof this._options.netUnitPrice === 'number') {
        this._options.netValue = round(this._options.netUnitPrice * this._options.quantity, currency.roundPriceExp)
        this._options.vatValue = round(this._options.netValue * this._options.vat / 100, currency.roundPriceExp)
        this._options.grossValue = this._options.netValue + this._options.vatValue
      } else if (typeof this._options.grossUnitPrice === 'number') {
        this._options.grossValue = round(this._options.grossUnitPrice * this._options.quantity, currency.roundPriceExp)
        this._options.vatValue = round(this._options.grossValue / (this._options.vat + 100) * this._options.vat, currency.roundPriceExp)
        this._options.netValue = this._options.grossValue - this._options.vatValue
        this._options.netUnitPrice = round(this._options.netValue / this._options.quantity, 2)
      } else {
        throw new Error('Net or Gross Value is required for Item price calculation')
      }
    } else if (typeof this._options.vat === 'string') {
      if (['TAM', 'AAM', 'EU', 'EUK', 'MAA', 'ÁKK', 'TEHK', 'HO', 'KBAET'].includes(this._options.vat)) {
        if (typeof this._options.netUnitPrice === 'number') {
          this._options.netValue = round(this._options.netUnitPrice * this._options.quantity, currency.roundPriceExp)
          this._options.vatValue = 0
          this._options.grossValue = this._options.netValue + this._options.vatValue
        }
        else if (typeof this._options.grossUnitPrice === 'number') {
          this._options.grossValue = round(this._options.grossUnitPrice * this._options.quantity, currency.roundPriceExp)
          this._options.vatValue = 0
          this._options.netValue = this._options.grossValue - this._options.vatValue
          this._options.netUnitPrice = round(this._options.netValue / this._options.quantity, 2)
        }
        else {
          throw new Error('Net or Gross Value is required for Item price calculation')
        }
      }
    }

    indentLevel = indentLevel || 0

    return wrapWithElement('tetel', [
      [ 'megnevezes', this._options.label ],
      [ 'mennyiseg', this._options.quantity ],
      [ 'mennyisegiEgyseg', this._options.unit ],
      [ 'nettoEgysegar', this._options.netUnitPrice ],
      [ 'afakulcs', this._options.vat ],
      [ 'nettoErtek', this._options.netValue ],
      [ 'afaErtek', this._options.vatValue ],
      [ 'bruttoErtek', this._options.grossValue ],
      [ 'megjegyzes', this._options.comment ]
    ], indentLevel)
  }
}
