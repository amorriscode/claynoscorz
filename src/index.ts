import * as dotenv from 'dotenv'
dotenv.config()
import express from 'express'

import { postTweet } from './services/twitter'
import { buildTweet } from './services/tweet'
import Cache from './services/cache'

const HOST = process.env.HOST ?? 'http://localhost'
const PORT = process.env.PORT ?? 3000

const app = express()
app.use(express.json())

const postedCache = new Cache()

app.post('/helius', async (req, res) => {
  const webhooks = req.body || []

  console.log('Received incoming webook...')

  let status = 200
  for (const webhook of webhooks) {
    try {
      const nftData = webhook?.events?.nft
      if (!nftData) {
        console.log(`Missing NFT data! Skipping...`, webhook)
        break
      }

      if (await postedCache.get(nftData.signature)) {
        console.log(`Skipping previously posted sale: ${nftData.signature}`)
        break
      }

      const nftPublicKey = nftData?.nfts?.[0]?.mint || null
      if (!nftPublicKey) {
        console.error(
          `Failed to get NFT public key for ${webhook.signature}:`,
          nftData
        )
        break
      }

      const { tweet, mediaId } = await buildTweet(nftPublicKey, nftData)

      try {
        const status = tweet.join('')
        await postTweet({ status, mediaId })
        await postedCache.set(nftData.signature, status)
        console.log(`Succesfully posted tweet for ${nftData.signature}`)
      } catch (error) {
        console.error(`Failed to post tweet for ${nftData.signature}:`, error)
        status = 500
      }
    } catch (error) {
      console.error('Failed to process webhook', error)
      status = 500
    }
  }

  console.log('Finished processing incoming webhook...')
  res.status(status)
  res.send('ok')
})

app.get('/health', (req, res) => {
  res.send('ok')
})

app.listen(PORT, () => {
  console.log(`🚀 Claynoscorz listening on ${HOST}:${PORT}`)
})
