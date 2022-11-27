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

import { postThread } from './services/twitter'
import { SOLANA_FM_URL } from './constants'

const HOST = process.env.HOST || 'http://localhost'
const PORT = process.env.PORT || 3000

const app = express()
app.use(express.json())

const postedTransactions = new Set()
const connection = new Connection(clusterApiUrl('mainnet-beta'))
const metaplex = new Metaplex(connection)

app.post('/helios', async (req, res) => {
  const webhooks = req.body || []

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
    const id =
      nftData.description.match(/(Claynosaurz #\d+)/)?.[0] || 'A Claynosaur'
    const nftAddress = nftData?.nfts?.[0]?.mint || null
    const mintAddress = new PublicKey(nftAddress || '')
    const nft = (await metaplex?.nfts()?.findByMint({ mintAddress })) ?? {}
    const nftImage = nft?.json?.image

    // Build the main tweet which shares sales data
    const saleTweet = [`RAAAWR 🦖\n\n${id} sold for ${amount} ◎`]

    // Add the marketplace
    if (nftData.source) {
      const marketplace = nftData.source
        .split('_')
        .map((w: string) => w[0].toUpperCase() + w.substring(1).toLowerCase())
        .join(' ')
      saleTweet.push(`on ${marketplace} `)
    }

    saleTweet.push('#SeizeTheClay')

    // Add an image if found
    if (nftImage) {
      saleTweet.push(`\n\n${nftImage}`)
    }

    // Build the second tweet which links to transactions and the token address
    const solanaFmTweet = []
    if (nftAddress) {
      solanaFmTweet.push(`Token: ${SOLANA_FM_URL}/token/${nftAddress}`)
    }
    solanaFmTweet.push(`Transaction: ${SOLANA_FM_URL}/tx/${nftData.signature}`)

    const tweets = [saleTweet.join(''), solanaFmTweet.join('\n')]

    try {
      await postThread({ tweets })
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
