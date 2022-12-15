/* eslint-env mocha */

import xml2js from 'xml2js'
const parser = new xml2js.Parser()
import chai from 'chai'
const expect = chai.expect

import {Buyer} from '../index.js'
import {createBuyer} from './resources/setup.js'

describe('Buyer', function () {
  let buyer

  beforeEach(function () {
    buyer = createBuyer(Buyer)
  })

  describe('constructor', function () {
    it('should set _options property', function () {
      expect(buyer).to.have.property('_options').that.is.an('object')
    })
  })

  describe('_generateXML', function () {
    it('should return valid XML', function (done) {
      parser.parseString(buyer._generateXML(), function (err, result) {
        if (!err) {
          expect(result).to.have.property('vevo').that.is.an('object')
          done()
        }
      })
    })

    describe('generated XML', function () {
      let obj

      beforeEach(function (done) {
        parser.parseString(buyer._generateXML(), function (err, result) {
          if (!err) obj = result.vevo

          done()
        })

      })

      it('should have `nev` property', function () {
        expect(obj).to.have.property('nev')
      })

      it('should have `irsz` property', function () {
        expect(obj).to.have.property('irsz')
      })

      it('should have `telepules` property', function () {
        expect(obj).to.have.property('telepules')
      })

      it('should have `cim` property', function () {
        expect(obj).to.have.property('cim')
      })

      it('should have `adoszam` property', function () {
        expect(obj).to.have.property('adoszam')
      })

      it('should have `postazasiNev` property', function () {
        expect(obj).to.have.property('postazasiNev')
      })

      it('should have `postazasiIrsz` property', function () {
        expect(obj).to.have.property('postazasiIrsz')
      })

      it('should have `postazasiTelepules` property', function () {
        expect(obj).to.have.property('postazasiTelepules')
      })

      it('should have `postazasiCim` property', function () {
        expect(obj).to.have.property('postazasiCim')
      })

      it('should have `azonosito` property', function () {
        expect(obj).to.have.property('azonosito')
      })
    })
  })
})
