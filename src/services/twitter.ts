import fetch from 'node-fetch'
import crypto from 'crypto'
import OAuth from 'oauth-1.0a'
import querystring from 'query-string'

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
  const isFormData = headers['Content-Type'] === 'multipart/form-data'
  const requestData = { url, method, data }
  const oauthClient = createOauthClient()

  if (isFormData) {
    delete requestData.data
  }

  const requestHeaders = {
    ...headers,
    ...oauthClient.toHeader(oauthClient.authorize(requestData, CONFIG.token)),
  }

  if (isFormData) {
    console.log(data)
    return await fetch(url, {
      method,
      headers: requestHeaders,
      body: data,
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
  // if (mediaId) {
  //   body.media_ids = mediaId
  // }

  return await post(getTwitterUrl({ endpoint: 'statuses/update.json' }), body)
}

// TODO: debug image uploads
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

    const appendResponse = await post(
      twitterUrl,
      {
        command: 'APPEND',
        media_id: mediaId,
        media: imageBuffer,
        media_data: imageBuffer.toString('base64'),
        segment_index: 0,
      },
      { 'Content-Type': 'multipart/form-data' }
    )
    console.log(appendResponse)

    const finalizeResponse = await post(twitterUrl, {
      command: 'FINALIZE',
      media_id: mediaId,
    })
    console.log(finalizeResponse)

    return mediaId
  } catch (error) {
    console.error('Failed to upload image to Twitter:', error)
  }

  return
}
