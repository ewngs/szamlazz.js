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
  console.log(receipt._generateXML())

  done()
})

describe('Receipt', function () {
  describe('constructor', function () {
    it('should set _options property', function (done) {
      expect(receipt).to.have.property('_options').that.is.an('object')
      done()
    })

    it('should set items', function (done) {
      expect(receipt._options).to.have.property('items').that.is.an('array')
      done()
    })
  })
  describe('_generateXML', function () {
    it('should return valid XML', function (done) {
      parser.parseString('<wrapper>' + receipt._generateXML() + '</wrapper>', function (err, result) {
        if (!err) {
          expect(result).to.have.property('wrapper').that.is.an('object')
          done()
        }
      })
    })

    describe('generated XML', function () {
      let obj

      beforeEach(function (done) {
        parser.parseString('<wrapper>' + receipt._generateXML() + '</wrapper>', function (err, result) {
          if (!err) obj = result.wrapper
        })

        done()
      })

      it('should have `fejlec` node', function (done) {
        expect(obj).to.have.property('fejlec')
        done()
      })

      it('should have `tetelek` node', function (done) {
        expect(obj).to.have.property('tetelek')
        done()
      })
    })
  })
})
