import fetch from 'node-fetch'
import crypto from 'crypto'
import OAuth from 'oauth-1.0a'
import querystring from 'query-string'
import { Readable } from 'stream'

const MAX_FILE_CHUNK = 5 * 1024 * 1024

const CONFIG = {
  consumerKey: process.env.TWITTER_API_KEY || '',
  consumerSecret: process.env.TWITTER_API_SECRET || '',
  token: {
    key: process.env.TWITTER_ACCESS_TOKEN || '',
    secret: process.env.TWITTER_ACCESS_TOKEN_SECRET || '',
  },
}

function getTwitterUrl({
  subdomain = 'api',
  endpoint,
}: {
  subdomain?: string
  endpoint: string
}) {
  return `https://${subdomain}.twitter.com/1.1/${endpoint}`
}

function createOauthClient() {
  const client = new OAuth({
    consumer: { key: CONFIG.consumerKey, secret: CONFIG.consumerSecret },
    signature_method: 'HMAC-SHA1',
    hash_function(baseString, key) {
      return crypto.createHmac('sha1', key).update(baseString).digest('base64')
    },
  })

  return client
}

async function post(url: string, data: any = {}, headers: any = {}) {
  const method = 'POST'
  const requestData = { url, method, data }
  const oauthClient = createOauthClient()

  const requestHeaders = {
    ...headers,
    ...oauthClient.toHeader(oauthClient.authorize(requestData, CONFIG.token)),
  }

  if (headers['Content-Type'] === 'application/x-www-form-urlencoded') {
    return await fetch(url, {
      method,
      headers: requestHeaders,
      body: querystring.stringify(data),
    })
  }

  return await fetch(`${url}?${querystring.stringify(data)}`, {
    method,
    headers: requestHeaders,
  })
}

export async function postTweet({
  status,
  mediaId,
}: {
  status: string
  mediaId?: string
}) {
  const body: { status: string; media_ids?: string } = { status }
  if (mediaId) {
    body.media_ids = mediaId
  }

  return await post(getTwitterUrl({ endpoint: 'statuses/update.json' }), body)
}

export async function uploadImage(sourceUrl: string) {
  try {
    const twitterUrl = getTwitterUrl({
      subdomain: 'upload',
      endpoint: 'media/upload.json',
    })
    const imageData = await fetch(sourceUrl)
    const imageBuffer = await imageData.buffer()

    const initResponse = await post(twitterUrl, {
      command: 'INIT',
      total_bytes: Buffer.byteLength(imageBuffer),
      media_type: 'image/gif',
      media_category: 'tweet_gif',
    })
    const data = await initResponse.json()
    const mediaId = data.media_id_string

    const readable = Readable.from(imageBuffer)
    let buf
    const partitions = []
    while (
      (buf = readable.read(Math.min(MAX_FILE_CHUNK, imageBuffer.length)))
    ) {
      partitions.push(buf)
    }

    for (let i = 0; i < partitions.length; i++) {
      await post(
        twitterUrl,
        {
          command: 'APPEND',
          media_id: mediaId,
          media_data: partitions[i].toString('base64'),
          segment_index: i,
        },
        {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Transfer-Encoding': 'base64',
        }
      )
    }

    await post(twitterUrl, {
      command: 'FINALIZE',
      media_id: mediaId,
    })

    return mediaId
  } catch (error) {
    console.error('Failed to upload image to Twitter:', error)
  }

  return
}
