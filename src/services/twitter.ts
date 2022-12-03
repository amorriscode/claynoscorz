import fetch from 'node-fetch'
import crypto from 'crypto'
import OAuth from 'oauth-1.0a'
import querystring from 'query-string'

const MAX_FILE_CHUNK = 3 * 1024 * 1024

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

async function get(url: string, headers: any = {}) {
  const method = 'GET'
  const requestData = { url, method }
  const oauthClient = createOauthClient()

  const requestHeaders = {
    ...headers,
    ...oauthClient.toHeader(oauthClient.authorize(requestData, CONFIG.token)),
  }

  return await fetch(url, { method, headers: requestHeaders })
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

  console.log(`Attempting to post tweet: `, JSON.stringify(body))

  const response = await post(
    getTwitterUrl({ endpoint: 'statuses/update.json' }),
    body
  )
  if (!response.ok) {
    const data = await response.json()
    const errorCode = data?.errors?.[0]?.code
    const errorMessage = data?.errors?.[0]?.message ?? ''
    throw new Error(
      `${errorMessage}${errorCode && ' (' + errorCode + ')'}` ?? response.status
    )
  }

  return response
}

export async function uploadImage(sourceUrl: string) {
  try {
    const twitterUrl = getTwitterUrl({
      subdomain: 'upload',
      endpoint: 'media/upload.json',
    })
    const imageData = await fetch(sourceUrl)
    const imageBuffer = await imageData.buffer()
    const imageSize = Buffer.byteLength(imageBuffer)

    const initResponse = await post(twitterUrl, {
      command: 'INIT',
      total_bytes: Buffer.byteLength(imageBuffer),
      media_type: 'image/gif',
      media_category: 'tweet_gif',
    })
    const initData = await initResponse.json()
    const mediaId = initData.media_id_string

    console.log('Initialized Twitter media: ', JSON.stringify(initData))

    let offset = 0
    const partitions = []
    while (offset !== imageSize) {
      const data = imageBuffer.slice(offset, offset + MAX_FILE_CHUNK)
      partitions.push(data)
      offset += Buffer.byteLength(data)
    }
    const finalChunk = imageBuffer.slice(offset)
    partitions.push(finalChunk)

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

    const finalizeResponse = await post(twitterUrl, {
      command: 'FINALIZE',
      media_id: mediaId,
    })
    const finalizeData = await finalizeResponse.json()

    // Wait until Twitter is done processing the image
    let state = finalizeData?.processing_info?.state
    if (finalizeData.processing_info) {
      console.log(`Waiting for Twitter media to finish, state is: ${state}`)

      let checkAfter = finalizeData.check_after_secs
      while (state === 'pending' || state === 'in_progress') {
        // Sleep for N milliseconds
        await new Promise((resolve) => setTimeout(resolve, checkAfter * 1000))

        const statusResponse = await get(
          `${twitterUrl}?command=STATUS&media_id=${mediaId}`
        )
        const statusData = await statusResponse.json()

        state = statusData?.processing_info?.state ?? 'failed'
        checkAfter = statusData?.processing_info?.check_after_secs
      }

      console.log(`Finished processing Twitter image, final status: ${state}`)
    }

    return state === 'failed' ? null : mediaId
  } catch (error) {
    console.error('Failed to upload image to Twitter:', error)
  }

  return
}
