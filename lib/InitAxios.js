import axios from 'axios'
import { HttpsCookieAgent } from 'http-cookie-agent/http'
import tough from 'tough-cookie'

/**
 * @param {import('https').AgentOptions} [options]
 * @returns {import('axios').AxiosInstance}
 */
export default function initAxios(options) {
  return  axios.create({
    httpsAgent: new HttpsCookieAgent({
      ...options,
      cookies: {
        jar: new tough.CookieJar(),
      },
    }),
  })
}
