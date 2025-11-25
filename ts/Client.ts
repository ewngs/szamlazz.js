import assert from 'assert';
import merge from 'merge';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import FormData from 'form-data';
import xml2js from 'xml2js';
import { wrapWithElement, xml2obj } from './XMLUtils';
import { HttpsCookieAgent } from 'http-cookie-agent/http';
import tough from 'tough-cookie';
import { Buyer } from './Buyer';

// Custom error interface to include code property
interface CustomError extends Error {
  code?: string;
}

// Interface for Client options
interface ClientOptions {
  authToken?: string;
  user?: string;
  password?: string;
  eInvoice?: boolean;
  requestInvoiceDownload?: boolean;
  downloadedInvoiceCount?: number;
  responseVersion?: number;
  timeout?: number;
}

// Interface for getInvoiceData options
interface GetInvoiceDataOptions {
  invoiceId?: string;
  orderNumber?: string;
  pdf?: boolean;
}

// Interface for reverseInvoice options
interface ReverseInvoiceOptions {
  invoiceId: string;
  eInvoice: boolean;
  requestInvoiceDownload: boolean;
}

// Interface for response data
interface InvoiceResponse {
  invoiceId?: string;
  netTotal?: string;
  grossTotal?: string;
  customerAccountUrl?: string;
  pdf?: Buffer;
}

// Default options with type annotation
const defaultOptions: ClientOptions = {
  eInvoice: false,
  requestInvoiceDownload: false,
  downloadedInvoiceCount: 1,
  responseVersion: 1,
  timeout: 0,
};

export class Client {
  private _options: ClientOptions;
  private _cookieJar: tough.CookieJar;
  #axiosInstance: AxiosInstance;
  public useToken: boolean;

  constructor(options: Partial<ClientOptions> = {}) {
    this._options = merge({}, defaultOptions, options) as ClientOptions;

    this.useToken = typeof this._options.authToken === 'string' && this._options.authToken.trim().length > 1;

    if (!this.useToken) {
      assert(typeof this._options.user === 'string' && this._options.user.trim().length > 1,
        'Valid User field missing from client options');

      assert(typeof this._options.password === 'string' && this._options.password.trim().length > 1,
        'Valid Password field missing from client options');
    }

    this._cookieJar = new tough.CookieJar();
    this.#axiosInstance = axios.create({
      httpsAgent: new HttpsCookieAgent({ cookies: { jar: this._cookieJar } }),
    });
  }

  async getInvoiceData(options: GetInvoiceDataOptions): Promise<any> {
    const hasInvoiceId = typeof options.invoiceId === 'string' && options.invoiceId.trim().length > 1;
    const hasOrderNumber = typeof options.orderNumber === 'string' && options.orderNumber.trim().length > 1;
    assert(hasInvoiceId || hasOrderNumber, 'Either invoiceId or orderNumber must be specified');

    const xml = this._getXmlHeader('xmlszamlaxml', 'agentxml') +
      wrapWithElement([
        ...this._getAuthFields(),
        ['szamlaszam', options.invoiceId],
        ['rendelesSzam', options.orderNumber],
        ['pdf', options.pdf],
      ]) +
      '</xmlszamlaxml>';

    const response = await this._sendRequest('action-szamla_agent_xml', xml);
    const parsedBody = await xml2js.parseStringPromise(response.data);

    return parsedBody.szamla;
  }

  async reverseInvoice(options: ReverseInvoiceOptions): Promise<InvoiceResponse> {
    assert(typeof options.invoiceId === 'string' && options.invoiceId.trim().length > 1, 'invoiceId must be specified');
    assert(options.eInvoice !== undefined, 'eInvoice must be specified');
    assert(options.requestInvoiceDownload !== undefined, 'requestInvoiceDownload must be specified');

    const xml = this._getXmlHeader('xmlszamlast', 'agentst') +
      wrapWithElement(
        'beallitasok', [
          ...this._getAuthFields(),
          ['eszamla', String(options.eInvoice)],
          ['szamlaLetoltes', String(options.requestInvoiceDownload)],
        ]) +
      wrapWithElement(
        'fejlec', [
          ['szamlaszam', options.invoiceId],
          ['keltDatum', new Date()],
        ]) +
      '</xmlszamlast>';

    const httpResponse = await this._sendRequest('action-szamla_agent_st', xml, true);

    const data: InvoiceResponse = {
      invoiceId: httpResponse.headers.szlahu_szamlaszam,
      netTotal: httpResponse.headers.szlahu_nettovegosszeg,
      grossTotal: httpResponse.headers.szlahu_bruttovegosszeg,
      customerAccountUrl: httpResponse.headers.szlahu_vevoifiokurl,
    };

    if (options.requestInvoiceDownload) {
      data.pdf = httpResponse.data;
    }

    return data;
  }

  async issueInvoice(invoice: Buyer): Promise<InvoiceResponse> {
    const xml = this._getXmlHeader('xmlszamla', 'agent') +
      wrapWithElement('beallitasok', [
        ...this._getAuthFields(),
        ['eszamla', this._options.eInvoice],
        ['szamlaLetoltes', this._options.requestInvoiceDownload],
        ['szamlaLetoltesPld', this._options.downloadedInvoiceCount],
        ['valaszVerzio', this._options.responseVersion],
      ], 1) +
      invoice._generateXML(1) +
      '</xmlszamla>';

    const httpResponse = await this._sendRequest('action-xmlagentxmlfile', xml, this._options.responseVersion === 1);

    const data: InvoiceResponse = {
      invoiceId: httpResponse.headers.szlahu_szamlaszam,
      netTotal: httpResponse.headers.szlahu_nettovegosszeg,
      grossTotal: httpResponse.headers.szlahu_bruttovegosszeg,
      customerAccountUrl: httpResponse.headers.szlahu_vevoifiokurl,
    };

    if (this._options.requestInvoiceDownload) {
      if (this._options.responseVersion === 1) {
        data.pdf = Buffer.from(httpResponse.data);
      } else if (this._options.responseVersion === 2) {
        const parsed = await xml2obj(httpResponse.data, { 'xmlszamlavalasz.pdf': 'pdf' });
        data.pdf = Buffer.from(parsed.pdf, 'base64');
      }
    }
    return data;
  }

  private _getXmlHeader(tag: string, dir: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <${tag} xmlns="http://www.szamlazz.hu/${tag}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="http://www.szamlazz.hu/${tag} https://www.szamlazz.hu/szamla/docs/xsds/${dir}/${tag}.xsd">\n`;
  }

  private _getAuthFields(): [string, string][] {
    if (this.useToken) {
      return [['szamlaagentkulcs', this._options.authToken!]];
    }

    return [
      ['felhasznalo', this._options.user!],
      ['jelszo', this._options.password!],
    ];
  }

  private async _sendRequest(fileFieldName: string, data: string, isBinaryDownload?: boolean): Promise<AxiosResponse> {
    const formData = new FormData();
    formData.append(fileFieldName, data, 'request.xml');

    const axiosOptions: any = {
      headers: {
        ...formData.getHeaders(),
      },
      jar: this._cookieJar,
      withCredentials: true,
      timeout: this._options.timeout,
    };

    if (isBinaryDownload) {
      axiosOptions.responseType = 'arraybuffer';
    }

    const httpResponse = await this.#axiosInstance.post('https://www.szamlazz.hu/szamla/', formData.getBuffer(), axiosOptions);
    if (httpResponse.status !== 200) {
      throw new Error(`${httpResponse.status} ${httpResponse.statusText}`);
    }

    if (httpResponse.headers.szlahu_error_code) {
      const err: CustomError = new Error(decodeURIComponent(httpResponse.headers.szlahu_error.replace(/\+/g, ' ')));
      err.code = httpResponse.headers.szlahu_error_code;
      throw err;
    }

    if (isBinaryDownload) {
      return httpResponse;
    }

    const parsedBody = await xml2js.parseStringPromise(httpResponse.data);

    if (parsedBody.xmlszamlavalasz && parsedBody.xmlszamlavalasz.hibakod) {
      const error: CustomError = new Error(parsedBody.xmlszamlavalasz.hibauzenet);
      error.code = parsedBody.xmlszamlavalasz.hibakod[0];
      throw error;
    }

    return httpResponse;
  }

  public setRequestInvoiceDownload(value: boolean): void {
    this._options.requestInvoiceDownload = value;
  }
}

// Type declarations for imported modules (minimal assumptions)
declare module './XMLUtils' {
  export function wrapWithElement(tag: string | [string, any][], elements?: [string, any][], indentLevel?: number): string;
  export function xml2obj(xml: string, mapping: { [key: string]: string }): Promise<any>;
}