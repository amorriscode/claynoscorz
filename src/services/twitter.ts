import Twitter from 'twitter-lite'

const client = new Twitter({
  consumer_key: process.env.TWITTER_API_KEY || '',
  consumer_secret: process.env.TWITTER_API_SECRET || '',
  access_token_key: process.env.TWITTER_ACCESS_TOKEN || '',
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET || '',
})

export async function postTweet({
  status,
  in_reply_to_status_id,
}: {
  status: string
  in_reply_to_status_id?: string
}) {
  try {
    return await client.post('statuses/update', {
      status,
      in_reply_to_status_id,
      auto_populate_reply_metadata: true,
    })
  } catch (error) {
    console.error(`Failed to post tweet: ${JSON.stringify(error, null, 2)}`)
  }
}

export async function postThread({ tweets }: { tweets: string[] }) {
  try {
    let lastTweetId = ''
    for (const tweet of tweets) {
      const savedTweet = await postTweet({
        status: tweet,
        in_reply_to_status_id: lastTweetId,
      })
      lastTweetId = savedTweet?.id_str
    }
  } catch (error) {
    console.error(`Failed to post thread: ${JSON.stringify(error, null, 2)}`)
  }
}
