/* eslint-env mocha */

import xml2js from 'xml2js'
const parser = new xml2js.Parser()
import chai from 'chai'
const expect = chai.expect

import {Seller} from '../index.js'
import {createSeller} from './resources/setup.js'

describe('Seller', function () {
  let seller

  beforeEach(function () {
    seller = createSeller(Seller)
  })

  describe('constructor', function () {
    it('should set _options property', function () {
      expect(seller).to.have.property('_options').that.is.an('object')
    })

    it('should not mutate options', function () {
      const seller = new Seller({})
      const expected = {
        _options: {
          bank: {},
          email: {}
        }
      }

      expect(seller).to.be.deep.equal(expected)
    })
  })

  describe('_generateXML', function () {
    it('should return valid XML', function (done) {
      parser.parseString(seller._generateXML(), function (err, result) {
        expect(result).to.have.property('elado').that.is.an('object')
        done()
      })
    })
  })
})
