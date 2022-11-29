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
import { SOLANA_FM_URL } from './constants'
import { getSolPrice } from './services/solana'

const HOST = process.env.HOST || 'http://localhost'
const PORT = process.env.PORT || 3000

const app = express()
app.use(express.json())

const postedTransactions = new Set()
const connection = new Connection(clusterApiUrl('mainnet-beta'))
const metaplex = new Metaplex(connection)

app.post('/helios', async (req, res) => {
  const webhooks = req.body || []
  const solPrice = await getSolPrice()

  for (const webhook of webhooks) {
    const nftData = webhook?.events?.nft
    if (!nftData) {
      break
    }

    // Very simple caching to ensure we don't double post sales
    if (postedTransactions.has(nftData.signatue)) {
      break
    }

    const amount = nftData.amount / LAMPORTS_PER_SOL
    const nftAddress = nftData?.nfts?.[0]?.mint || null
    const mintAddress = new PublicKey(nftAddress || '')
    const nft = await metaplex?.nfts()?.findByMint({ mintAddress })
    const nftImage = nft?.json?.image

    // Build the main tweet which shares sales data
    const tweet = [`RAAAWR 🦖\n\n${nft.json?.name} sold for ◎${amount}`]

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

    tweet.push(
      `#SeizeTheClay\n\nTransaction: ${SOLANA_FM_URL}/tx/${nftData.signature}`
    )

    // Add an image if found
    let mediaId
    if (nftImage) {
      mediaId = await uploadImage(nftImage)
    }

    try {
      await postTweet({ status: tweet.join(''), mediaId })
      postedTransactions.add(nftData.signature)
    } catch (error) {
      console.error(`Failed to post tweet for ${nftData.signature}`)
    } finally {
      console.log(`Succesfully posted tweet for ${nftData.signature}`)
    }
  }

  res.send('ok')
})

app.get('/health', (req, res) => {
  res.send('ok')
})

app.listen(PORT, () => {
  console.log(`🚀 Claynoscores listening on ${HOST}:${PORT}`)
})
