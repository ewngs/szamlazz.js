/* eslint-env mocha */

import xml2js from 'xml2js'
const parser = new xml2js.Parser()
import { expect } from 'chai'

import {CreditEntry} from '../index.js'
import {createCreditEntry} from './resources/setup.js'

describe('CreditEntry', function () {
  let creditEntry

  beforeEach(function () {
    creditEntry = createCreditEntry(CreditEntry)
  })

  describe('constructor', function () {
    it('should set _options property', function () {
      expect(creditEntry).to.have.property('_options').that.is.an('object')
    })
  })

  describe('_generateXML', function () {
    it('should return valid XML', function (done) {
      parser.parseString(creditEntry._generateXML(), function (err, result) {
        if (!err) {
          expect(result).to.have.property('kifizetes').that.is.an('object')
          done()
        }
      })
    })

    describe('generated XML', function () {
      let obj

      beforeEach(function (done) {
        parser.parseString(creditEntry._generateXML(), function (err, result) {
          if (!err) obj = result.kifizetes

          done()
        })

      })

      it('should have `datum` property', function () {
        expect(obj).to.have.property('datum')
      })

      it('should have `jogcim` property', function () {
        expect(obj).to.have.property('jogcim')
      })

      it('should have `osszeg` property', function () {
        expect(obj).to.have.property('osszeg')
      })

      it('should have `leiras` property', function () {
        expect(obj).to.have.property('leiras')
      })
    })
  })
})
