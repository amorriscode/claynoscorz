import Twitter from 'twitter-lite'
import fetch from 'node-fetch'

const client = new Twitter({
  consumer_key: process.env.TWITTER_API_KEY || '',
  consumer_secret: process.env.TWITTER_API_SECRET || '',
  access_token_key: process.env.TWITTER_ACCESS_TOKEN || '',
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET || '',
})

export async function postTweet({
  status,
  parentId,
  mediaId = '',
}: {
  status: string
  parentId?: string
  mediaId?: string
}) {
  return await client.post('statuses/update', {
    status,
    in_reply_to_status_id: parentId,
    auto_populate_reply_metadata: true,
    media_ids: mediaId,
  })
}

export async function uploadImage(sourceUrl: string) {
  try {
    const imageData = await fetch(sourceUrl)
    const imageBlob = await imageData.blob()

    const mediaId = await client.post('media/upload.json', {
      command: 'INIT',
      total_bytes: imageBlob.size,
      media_type: 'image/gif',
    })

    await client.post('media/upload.json', {
      command: 'APPEND',
      media_id: mediaId,
      media_data: Buffer.from(await imageBlob.text()).toString('base64'),
      segment_index: 0,
    })

    await client.post('media/upload.json', {
      command: 'FINALIZE',
      media_id: mediaId,
    })

    return mediaId
  } catch (error) {
    console.error(
      `Failed to upload image to Twitter: ${JSON.stringify(error, null, 2)}`
    )
  }
}
