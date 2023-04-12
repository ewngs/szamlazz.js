import nock from 'nock'
import { expect } from 'chai'

import { Buyer } from '../lib/Buyer.js'
import {Client} from '../lib/Client.js'
import { Invoice } from '../lib/Invoice.js'
import { Item } from '../lib/Item.js'
import { Seller } from '../lib/Seller.js'
import {
  createBuyer,
  createInvoice,
  createSeller,
  createSoldItemGross,
  createSoldItemNet,
  createTokenClient,
  RESPONSE_FILE_PATHS
} from './resources/setup.js'

describe('Client should handle response version 2', () => {
  let seller
  let buyer
  let soldItem1
  let soldItem2
  let invoice

  before(() => {
    nock.disableNetConnect()
  })

  beforeEach(() => {
    seller = createSeller(Seller)
    buyer = createBuyer(Buyer)
    soldItem1 = createSoldItemNet(Item)
    soldItem2 = createSoldItemGross(Item)
    invoice = createInvoice(Invoice, seller, buyer, [soldItem1, soldItem2])

  })

  afterEach(() => {
    nock.cleanAll()
  })

  after(() => {
    nock.enableNetConnect()
  })

  it('valaszVerzio of the request should be 2', async () => {
    const scope = nock('https://www.szamlazz.hu')
      .post('/szamla/', /<valaszVerzio>2<\/valaszVerzio>/)
      .replyWithFile(
        200,
        RESPONSE_FILE_PATHS.SUCCESS_WITH_PDF
      )

    const tokenClient = createTokenClient(Client, {responseVersion: 2})
    await tokenClient.issueInvoice(invoice)

    scope.isDone()
  })

  it('response should have pdf property', async () => {
    const scope = nock('https://www.szamlazz.hu')
      .post('/szamla/')
      .replyWithFile(
        200,
        RESPONSE_FILE_PATHS.SUCCESS_WITH_PDF
      )

    const tokenClient = createTokenClient(Client, {responseVersion: 2})
    const response = await tokenClient.issueInvoice(invoice)

    scope.isDone()
    expect(response).to.have.property('pdf')
    expect(response.pdf).and.to.be.deep.equal(Buffer.from('AAAAZg==', 'base64'))
  })
})
