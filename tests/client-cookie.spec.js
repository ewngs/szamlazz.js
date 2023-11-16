import nock from 'nock'

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

describe('Client cookie handling', () => {
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

  // http-cookie-agent does not intercept nock response
  it.skip('should post request without cookie at the first call, but should set the JSESSIONID at 2nd call', async () => {
    const scopeFirst = nock('https://www.szamlazz.hu')
      .post('/szamla/')
      .replyWithFile(
        200,
        RESPONSE_FILE_PATHS.SUCCESS_WITHOUT_PDF,
        {
          'Set-Cookie': 'JSESSIONID=my-session-id',
        })

    const tokenClient = createTokenClient(Client)
    await tokenClient.issueInvoice(invoice)
    scopeFirst.isDone()

    const scopeSecond = nock('https://www.szamlazz.hu', {
      reqheaders: {
        Cookie: 'JSESSIONID=my-session-id'
      }
    })
      .post('/szamla/')
      .replyWithFile(
        200,
        RESPONSE_FILE_PATHS.SUCCESS_WITHOUT_PDF,
        {
          'Set-Cookie': 'JSESSIONID=my-session-id',
        })

    await tokenClient.issueInvoice(invoice)
    scopeSecond.isDone()
  })

  it("2 client instance don't have to use their on session store", async () => {
    const scopeFirst = nock('https://www.szamlazz.hu', {
      badheaders: ['Cookie'],
    })
      .post('/szamla/')
      .replyWithFile(
        200,
        RESPONSE_FILE_PATHS.SUCCESS_WITHOUT_PDF,
        {
          'Set-Cookie': 'JSESSIONID=my-session-id',
        })

    const tokenClient1 = createTokenClient(Client)
    await tokenClient1.issueInvoice(invoice)
    scopeFirst.isDone()

    const scopeSecond = nock('https://www.szamlazz.hu', {
      badheaders: ['Cookie'],
    })
      .post('/szamla/')
      .replyWithFile(
        200,
        RESPONSE_FILE_PATHS.SUCCESS_WITHOUT_PDF,
        {
          'Set-Cookie': 'JSESSIONID=my-session-id',
        })

    const tokenClient2 = createTokenClient(Client)
    await tokenClient2.issueInvoice(invoice)
    scopeSecond.isDone()
  })
})
