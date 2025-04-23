import {describe, it} from 'node:test'
import { expect } from 'chai'
import { join } from 'desm'
import https from 'node:https'
import { readFile } from 'node:fs/promises';
import {promisify} from 'node:util'

import initAxios from '../lib/InitAxios.js'

const certPath = join(import.meta.url, 'resources', 'cert.pem')
const keyPath = join(import.meta.url, 'resources', 'key.pem')

describe('initAxios', () => {
  it('should post request without cookie at the first call, but should set the JSESSIONID at 2nd call', async () => {
    let secondRequestCookieHeader
    let server

    try {
      server = await createTestServer([
        (req, res) => {
          res.setHeader('Set-Cookie', 'JSESSIONID=my-session-id');
          res.end();
        },
        (req, res) => {
          secondRequestCookieHeader = req.headers.cookie;
          res.end();
        },
      ])
      const serverInfo = server.address();
      const axios = initAxios({
        rejectUnauthorized: false,
        cert: await readFile(certPath),
        key: await readFile(keyPath),
      })
      await axios.post(`https://localhost:${serverInfo.port}/`)
      console.log(await axios.jar.getCookies(`https://localhost:${serverInfo.port}/`))
      await axios.post(`https://localhost:${serverInfo.port}/`)
      expect(secondRequestCookieHeader).equal('JSESSIONID=my-session-id')
    }
    finally {
      server?.close()
    }
  })

  it('every instance should use their own cookie jar', async () => {
    let firstRequestCookieHeader
    let secondRequestCookieHeader
    let thirdRequestCookieHeader
    let fourthRequestCookieHeader
    let server

    try {
      server = await createTestServer([
        (req, res) => {
          firstRequestCookieHeader = req.headers.cookie
          res.setHeader('Set-Cookie', 'JSESSIONID=my-session-id1');
          res.end();
        },
        (req, res) => {
          secondRequestCookieHeader = req.headers.cookie
          res.setHeader('Set-Cookie', 'JSESSIONID=my-session-id2');
          res.end();
        },
        (req, res) => {
          thirdRequestCookieHeader = req.headers.cookie
          res.end();
        },
        (req, res) => {
          fourthRequestCookieHeader = req.headers.cookie
          res.end();
        },
      ])
      const serverInfo = server.address();
      const axiosClient1 = initAxios({
        rejectUnauthorized: false,
      })
      const axiosClient2 = initAxios({
        rejectUnauthorized: false,
      })
      await axiosClient1.post(`https://localhost:${serverInfo.port}/`)
      await axiosClient2.post(`https://localhost:${serverInfo.port}/`)
      await axiosClient2.post(`https://localhost:${serverInfo.port}/`)
      await axiosClient1.post(`https://localhost:${serverInfo.port}/`)
      expect(firstRequestCookieHeader).equal(undefined)
      expect(secondRequestCookieHeader).equal(undefined)
      expect(thirdRequestCookieHeader).equal('JSESSIONID=my-session-id2')
      expect(fourthRequestCookieHeader).equal('JSESSIONID=my-session-id1')
    }
    finally {
      server?.close()
    }
  })
})

/**
 * @param {https.RequestListener[]} stories
 * @returns {Promise<https.Server<typeof IncomingMessage, typeof ServerResponse>>}
 */
async function createTestServer(stories) {
  const server = https.createServer({
    cert: await readFile(certPath),
    key: await readFile(keyPath),
  });

  await promisify(server.listen.bind(server)).apply(server);

  const serverInfo = server.address();
  if (serverInfo == null || typeof serverInfo === 'string') {
    throw new Error('Failed to setup a test server.');
  }

  server.on('request', (req, res) => {
    const listener = stories.shift();
    listener?.(req, res);
  });

  server.on('clientError', (err, socket) => {
    console.error(err);
    socket.end();
  });

  return server;
}
