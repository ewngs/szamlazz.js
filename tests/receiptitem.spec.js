/* eslint-env mocha */
'use strict'

const xml2js = require('xml2js')
const parser = new xml2js.Parser()
const expect = require('chai').expect

const setup = require('./resources/setup')

let receiptItem1
let receiptItem2
let receipt

let Szamlazz

beforeEach(function (done) {
  Szamlazz = require('..')

  receiptItem1 = setup.createReceiptItem1(Szamlazz)
  receiptItem2 = setup.createReceiptItem2(Szamlazz)
  receipt = setup.createReceipt(Szamlazz, [ receiptItem1, receiptItem2 ])

  done()
})

describe('ReceiptItem', function () {
  describe('constructor', function () {
    it('should set _options property', function (done) {
      expect(receiptItem1).to.have.property('_options').that.is.an('object')
      done()
    })

    it('should set label', function (done) {
      expect(receiptItem1._options).to.have.property('label').that.is.a('string')
      done()
    })

    it('should set quantity', function (done) {
      expect(receiptItem1._options).to.have.property('quantity').that.is.a('number')
      done()
    })

    it('should set unit', function (done) {
      expect(receiptItem1._options).to.have.property('unit').that.is.a('string')
      done()
    })

    it('should set vat', function (done) {
      expect(receiptItem1._options).to.have.property('vat').that.is.a('number')
      done()
    })

    it('should set netUnitPrice or grossUnitPrice', function (done) {
      let price = receiptItem1._options.netUnitPrice || receiptItem1._options.grossUnitPrice
      expect(price).is.a('number')
      done()
    })
  })

  describe('_generateXML', function () {
    it('should calculate netUnitPrice', function (done) {
      expect(receiptItem1._options).to.have.property('netUnitPrice').that.is.a('number')
      done()
    })

    it('should calculate vatValue', function (done) {
      expect(receiptItem1._options).to.have.property('vatValue').that.is.a('number')
      done()
    })

    it('should return valid XML', function (done) {
      parser.parseString(receiptItem1._generateXML(null, receipt._options.currency), function (err, result) {
        if (!err) {
          expect(result).to.have.property('tetel').that.is.an('object')
          done()
        }
      })
    })

    describe('generated XML', function () {
      let obj

      beforeEach(function (done) {
        parser.parseString(receiptItem1._generateXML(null, receipt._options.currency), function (err, result) {
          if (!err) obj = result.tetel
        })

        done()
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

      it('should have `netto` property', function (done) {
        expect(obj).to.have.property('netto')
        done()
      })

      it('should have `afa` property', function (done) {
        expect(obj).to.have.property('afa')
        done()
      })

      it('should have `brutto` property', function (done) {
        expect(obj).to.have.property('brutto')
        done()
      })
    })
  })
})
