/* eslint-env mocha */

import xml2js from 'xml2js'
const parser = new xml2js.Parser()
import {expect} from 'chai'

import {Buyer, Invoice, Item, Seller} from '../index.js'
import {createSeller, createBuyer, createSoldItemNet, createSoldItemGross, createInvoice} from './resources/setup.js'

describe('Invoice', function () {
  let seller
  let buyer
  let soldItem1
  let soldItem2
  let invoice

  beforeEach(function () {
    seller = createSeller(Seller)
    buyer = createBuyer(Buyer)
    soldItem1 = createSoldItemNet(Item)
    soldItem2 = createSoldItemGross(Item)
    invoice = createInvoice(Invoice, seller, buyer, [ soldItem1, soldItem2 ])
  })

  describe('constructor', function () {
    it('should set _options property', function () {
      expect(invoice).to.have.property('_options').that.is.an('object')
    })

    it('should set seller', function () {
      expect(invoice._options).to.have.property('seller').to.be.an.instanceof(Seller)
    })

    it('should set buyer', function () {
      expect(invoice._options).to.have.property('buyer').to.be.an.instanceof(Buyer)
    })

    it('should set items', function () {
      expect(invoice._options).to.have.property('items').that.is.an('array')})
  })
  describe('_generateXML', function () {
    it('should return valid XML', function (done) {
      parser.parseString('<wrapper>' + invoice._generateXML() + '</wrapper>', function (err, result) {
        expect(result).to.have.property('wrapper').that.is.an('object')
        done()
      })
    })

    describe('generated XML', function () {
      let obj

      beforeEach(function (done) {
        parser.parseString('<wrapper>' + invoice._generateXML() + '</wrapper>', function (err, result) {
          if (!err) obj = result.wrapper

          done()
        })
      })

      it('should have `fejlec` node', function () {
        expect(obj).to.have.property('fejlec')
      })

      it('should have `elado` node', function () {
        expect(obj).to.have.property('elado')
      })

      it('should have `vevo` node', function () {
        expect(obj).to.have.property('vevo')
      })

      it('should have `tetelek` node', function () {
        expect(obj).to.have.property('tetelek')
      })
    })
  })
})
