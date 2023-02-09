import { Metaplex } from '@metaplex-foundation/js'
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js'
import { HYPERSPACE_URL } from '../constants'

import { NftData } from '../types'
import { getSolPrice, getEthPrice } from './coingecko'
import { uploadImage } from './twitter'

const connection = new Connection(clusterApiUrl('mainnet-beta'))
const metaplex = new Metaplex(connection)

function roundedCryptoPrice(amount: number) {
  return Number(amount.toFixed(4))
}

export async function getPriceTweet(amount: number) {
  const priceTweet = [`${roundedCryptoPrice(amount)} SOL`]

  // Add the USD price if available
  const solUsdPrice = await getSolPrice()
  const ethUsdPrice = await getEthPrice()

  if (solUsdPrice) {
    const usdPrice = amount * solUsdPrice

    if (ethUsdPrice) {
      const ethPrice = usdPrice / ethUsdPrice
      priceTweet.push(`${roundedCryptoPrice(ethPrice)} ETH`)
    }

    priceTweet.push(`$${usdPrice.toFixed(2)}`)
  }

  return priceTweet.join(' | ')
}

export async function getMarketplaceTweet(
  claynoName = 'A Claynosaur',
  nftData: NftData
) {
  const marketplaceTweet = [`${claynoName} sold`]

  // Add the marketplace
  if (nftData.source) {
    const marketplace = nftData.source
      .split('_')
      .map((w: string) => w[0].toUpperCase() + w.substring(1).toLowerCase())
      .join(' ')
    marketplaceTweet.push(`on ${marketplace}`)
  }

  marketplaceTweet.push('for:\n\n')

  return marketplaceTweet.join(' ')
}

export async function buildTweet(nftPublicKey: string, nftData: NftData) {
  const amount = nftData.amount / LAMPORTS_PER_SOL
  const mintAddress = new PublicKey(nftPublicKey)
  const nft = await metaplex?.nfts()?.findByMint({ mintAddress })
  const { image, name = 'A Claynosaur' } = nft?.json ?? {}

  const tweet = []

  // Build the main tweet
  tweet.push(await getMarketplaceTweet(name, nftData))

  tweet.push(`\n\n${await getPriceTweet(amount)}`)

  tweet.push('\n\nWelcome to Claynotopia! 🌋\n\n#SeizeTheClay')

  // Add the Hyperspace link
  tweet.push(`\n\n${HYPERSPACE_URL}/token/${nft.address}`)

  // Upload an image if found
  let mediaId
  if (image) {
    mediaId = await uploadImage(image)
  }

  return { tweet, mediaId }
}
