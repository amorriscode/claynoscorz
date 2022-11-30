import * as dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Connection,
  clusterApiUrl,
} from '@solana/web3.js'
import { Metaplex } from '@metaplex-foundation/js'

import { postTweet, uploadImage } from './services/twitter'
import { HYPERSPACE_URL } from './constants'
import { getSolPrice } from './services/solana'
import { getSalesTweet } from './services/tweet'
import { Trait } from './services/claynosaurz'

const HOST = process.env.HOST || 'http://localhost'
const PORT = process.env.PORT || 3000

const app = express()
app.use(express.json())

const postedCache = new Set()
const connection = new Connection(clusterApiUrl('mainnet-beta'))
const metaplex = new Metaplex(connection)

app.post('/helius', async (req, res) => {
  const webhooks = req.body || []
  const solPrice = await getSolPrice()

  console.log('Received incoming webook...')

  for (const webhook of webhooks) {
    try {
      const nftData = webhook?.events?.nft
      if (!nftData) {
        console.log(`Missing NFT data! Skipping...`, webhook)
        break
      }

      if (postedCache.has(nftData.signature)) {
        console.log(`Skipping previously posted sale: ${nftData.signature}`)
        break
      }

      const nftAddress = nftData?.nfts?.[0]?.mint || null
      if (!nftAddress) {
        console.error(
          `Failed to get NFT address for ${webhook.signature}:`,
          nftData
        )
        break
      }

      const amount = nftData.amount / LAMPORTS_PER_SOL
      const mintAddress = new PublicKey(nftAddress)
      const nft = await metaplex?.nfts()?.findByMint({ mintAddress })
      const { image, attributes, name } = nft?.json ?? {}

      // Build the main tweet which shares sales data
      const tweet = getSalesTweet(name, amount, attributes as Trait[])

      // Add the USD price if available
      if (solPrice) {
        tweet.push(` ($${(amount * solPrice).toFixed(2)} USD)`)
      }

      // Add the marketplace
      if (nftData.source) {
        const marketplace = nftData.source
          .split('_')
          .map((w: string) => w[0].toUpperCase() + w.substring(1).toLowerCase())
          .join(' ')
        tweet.push(` on ${marketplace} `)
      }

      tweet.push(`#SeizeTheClay\n\n${HYPERSPACE_URL}/token/${nft.address}`)

      // Add an image if found
      let mediaId
      if (image) {
        mediaId = await uploadImage(image)
      }

      try {
        await postTweet({ status: tweet.join(''), mediaId })
        postedCache.add(nftData.signature)
        console.log(`Succesfully posted tweet for ${nftData.signature}`)
      } catch (error) {
        console.error(`Failed to post tweet for ${nftData.signature}:`, error)
      }
    } catch (error) {
      console.error('Failed to process webhook', error)
    }
  }

  console.log('Finished processing incoming webhook...')
  res.send('ok')
})

app.get('/health', (req, res) => {
  res.send('ok')
})

app.listen(PORT, () => {
  console.log(`🚀 Claynoscorz listening on ${HOST}:${PORT}`)
})
