/* eslint-env mocha */

import xml2js from 'xml2js'
import {expect} from 'chai'

import {Buyer, Invoice, Item, Seller} from '../index.js'
import {SPECIAL_VATS} from '../lib/Item.js'
import {createSeller, createBuyer, createSoldItemNet, createSoldItemGross, createInvoice} from './resources/setup.js'

describe('Item', function () {

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
    it('should set _options property', function (done) {
      expect(soldItem1).to.have.property('_options').that.is.an('object')
      done()
    })

    it('should set label', function (done) {
      expect(soldItem1._options).to.have.property('label').that.is.a('string')
      done()
    })

    it('should set quantity', function (done) {
      expect(soldItem1._options).to.have.property('quantity').that.is.a('number')
      done()
    })

    it('should set unit', function (done) {
      expect(soldItem1._options).to.have.property('unit').that.is.a('string')
      done()
    })

    it('should set vat', function (done) {
      expect(soldItem1._options).to.have.property('vat').that.is.a('number')
      done()
    })

    it('should set netUnitPrice or grossUnitPrice', function (done) {
      let price = soldItem1._options.netUnitPrice || soldItem1._options.grossUnitPrice
      expect(price).is.a('number')
      done()
    })
  })

  describe('_generateXML', function () {
    it('should calculate netUnitPrice', function (done) {
      expect(soldItem1._options).to.have.property('netUnitPrice').that.is.a('number')
      done()
    })

    it ('should support 0 net unit price', async function () {
      const item = new Item({
        label: 'First item',
        quantity: 2,
        unit: 'qt',
        vat: 27, // can be a number
        netUnitPrice: 0, // calculates net values from per item net
        comment: 'An item'
      })

      const xml = item._generateXML(null, invoice._options.currency)
      const result = await xml2js.parseStringPromise('<wrapper>' + xml + '</wrapper>')

      const tetel = result.wrapper.tetel[0]
      // use '0' string comparison because the xml parses elements as string
      expect(tetel.nettoEgysegar).to.deep.equal(['0'])
      expect(tetel.nettoErtek).to.deep.equal(['0'])
      expect(tetel.bruttoErtek).to.deep.equal(['0'])
      expect(tetel.afaErtek).to.deep.equal(['0'])
    })

    it ('should support 0 gross unit price', async function () {
      const item = new Item({
        label: 'First item',
        quantity: 2,
        unit: 'qt',
        vat: 27, // can be a number
        grossUnitPrice: 0, // calculates gross values from per item net
        comment: 'An item'
      })

      const xml = item._generateXML(null, invoice._options.currency)
      const result = await xml2js.parseStringPromise('<wrapper>' + xml + '</wrapper>')

      const tetel = result.wrapper.tetel[0]
      // use '0' string comparison because the xml parses elements as string
      expect(tetel.nettoEgysegar).to.deep.equal(['0'])
      expect(tetel.nettoErtek).to.deep.equal(['0'])
      expect(tetel.bruttoErtek).to.deep.equal(['0'])
      expect(tetel.afaErtek).to.deep.equal(['0'])
    })

    it ('should support 0 net unit price in case of special vat', async function () {
      for (const specialVat of SPECIAL_VATS) {
        const item = new Item({
          label: 'First item',
          quantity: 2,
          unit: 'qt',
          vat: specialVat, // a special string
          netUnitPrice: 0, // calculates net values from per item net
          comment: 'An item'
        })

        const xml = item._generateXML(null, invoice._options.currency)
        const result = await xml2js.parseStringPromise('<wrapper>' + xml + '</wrapper>')

        const tetel = result.wrapper.tetel[0]
        // use '0' string comparison because the xml parses elements as string
        expect(tetel.nettoEgysegar).to.deep.equal(['0'])
        expect(tetel.nettoErtek).to.deep.equal(['0'])
        expect(tetel.bruttoErtek).to.deep.equal(['0'])
        expect(tetel.afaErtek).to.deep.equal(['0'])
      }
    })

    it ('should support 0 gross unit price in case of special vat', async function () {
      for (const specialVat of SPECIAL_VATS) {
        const item = new Item({
          label: 'First item',
          quantity: 2,
          unit: 'qt',
          vat: specialVat, // a special string
          grossUnitPrice: 0, // calculates gross values from per item net
          comment: 'An item'
        })

        const xml = item._generateXML(null, invoice._options.currency)
        const result = await xml2js.parseStringPromise('<wrapper>' + xml + '</wrapper>')

        const tetel = result.wrapper.tetel[0]
        // use '0' string comparison because the xml parses elements as string
        expect(tetel.nettoEgysegar).to.deep.equal(['0'])
        expect(tetel.nettoErtek).to.deep.equal(['0'])
        expect(tetel.bruttoErtek).to.deep.equal(['0'])
        expect(tetel.afaErtek).to.deep.equal(['0'])
      }
    })

    it('should calculate vatValue', function (done) {
      expect(soldItem1._options).to.have.property('vatValue').that.is.a('number')
      done()
    })

    it('should return valid XML', async function () {
      const result = await xml2js.parseStringPromise(soldItem1._generateXML(null, invoice._options.currency))
      expect(result).to.have.property('tetel').that.is.an('object')
    })

    describe('generated XML', function () {
      let obj

      beforeEach(async function () {
        const result = await xml2js.parseStringPromise(soldItem1._generateXML(null, invoice._options.currency))
        obj = result.tetel
      })

      it('should have `megnevezes` property', function (done) {
        expect(obj).to.have.property('megnevezes')
        done()
      })

      it('should have `mennyiseg` property', function (done) {
        expect(obj).to.have.property('mennyiseg')
        done()
      })

      it('should have `mennyisegiEgyseg` property', function (done) {
        expect(obj).to.have.property('mennyisegiEgyseg')
        done()
      })

      it('should have `nettoEgysegar` property', function (done) {
        expect(obj).to.have.property('nettoEgysegar')
        done()
      })
      it('should have `afakulcs` property', function (done) {
        expect(obj).to.have.property('afakulcs')
        done()
      })

      it('should have `nettoErtek` property', function (done) {
        expect(obj).to.have.property('nettoErtek')
        done()
      })

      it('should have `afaErtek` property', function (done) {
        expect(obj).to.have.property('afaErtek')
        done()
      })

      it('should have `bruttoErtek` property', function (done) {
        expect(obj).to.have.property('bruttoErtek')
        done()
      })
    })
  })
})
