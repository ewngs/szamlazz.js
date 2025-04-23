import {beforeEach, describe, it} from 'node:test';
import xml2js from 'xml2js'
import { expect } from 'chai'

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
    it('should return valid XML', async function () {
      const result = await xml2js.parseStringPromise(buyer._generateXML())

      expect(result).to.have.property('vevo').that.is.an('object')
    })

    describe('generated XML', function () {
      let obj

      beforeEach(async function () {
        const result = await xml2js.parseStringPromise(buyer._generateXML())
        obj = result.vevo
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
