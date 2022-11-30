import { Metaplex } from '@metaplex-foundation/js'
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js'
import { HYPERSPACE_URL } from '../constants'

import { Trait } from '../types'
import { isRaptor, isRex, isBronto, isAnkylo, isTrice } from './claynosaurz'
import { getSolPrice } from './solana'
import { uploadImage } from './twitter'

const connection = new Connection(clusterApiUrl('mainnet-beta'))
const metaplex = new Metaplex(connection)

function getTweetHeader(attributes: Trait[] = []) {
  if (isRaptor(attributes)) {
    return 'wen @RaptorsDAO? 👀'
  }

  if (isRex(attributes)) {
    return 'wen @REXyDAO? 🦖'
  }

  if (isBronto(attributes)) {
    return 'wen @BrontoSquad? 🦕'
  }

  if (isAnkylo(attributes)) {
    return 'wen @AnkyloDAO? 🥺'
  }

  if (isTrice(attributes)) {
    return 'wen @Trice_Dao? 🥺'
  }

  return 'Welcome to Claynotopia! 🌋'
}

export function getSalesTweet(
  claynoName = 'A Claynosaur',
  amount: number,
  attributes: Trait[] = []
) {
  return [`${getTweetHeader(attributes)}\n\n${claynoName} sold for ◎${amount}`]
}

export async function buildTweet(nftPublicKey: string, nftData: any) {
  const amount = nftData.amount / LAMPORTS_PER_SOL
  const mintAddress = new PublicKey(nftPublicKey)
  const nft = await metaplex?.nfts()?.findByMint({ mintAddress })
  const { image, attributes, name } = nft?.json ?? {}

  // Build the main tweet which shares sales data
  const tweet = getSalesTweet(name, amount, attributes as Trait[])

  // Add the USD price if available
  const solPrice = await getSolPrice()
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

  return { tweet, mediaId }
}
