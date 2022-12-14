import { Metaplex } from '@metaplex-foundation/js'
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js'
import { HYPERSPACE_URL } from '../constants'

import { AccountData, NftData, Trait } from '../types'
import {
  isRaptor,
  isRex,
  isBronto,
  isAnkylo,
  isTrice,
  isLayerZero,
  isApres,
  isStego,
  ROYALTY_ACCOUNT_ADDRESS,
} from './claynosaurz'
import { getSolPrice } from './solana'
import { uploadImage } from './twitter'

const connection = new Connection(clusterApiUrl('mainnet-beta'))
const metaplex = new Metaplex(connection)

function getDaoShoutout(attributes: Trait[] = []): string | undefined {
  const daoShoutouts: string[] = []

  if (isLayerZero(attributes)) {
    daoShoutouts.push('wen @NakedClayno? 🫣')
  }

  if (isApres(attributes)) {
    daoShoutouts.push('wen @ApresDAO? ⛷️')
  }

  // Species DAOs
  if (isRaptor(attributes)) {
    daoShoutouts.push('wen @RaptorsDAO? 👀')
  }

  if (isRex(attributes)) {
    daoShoutouts.push('wen @REXyDAO? 🦖')
  }

  if (isBronto(attributes)) {
    daoShoutouts.push('wen @BrontoSquad? 🦕')
  }

  if (isAnkylo(attributes)) {
    daoShoutouts.push('wen @AnkyloDAO? 🥺')
  }

  if (isTrice(attributes)) {
    daoShoutouts.push('wen @Trice_Dao? 🤩')
  }

  if (isStego(attributes)) {
    daoShoutouts.push('wen @StegoDAO? 🫡')
  }

  return daoShoutouts[Math.floor(Math.random() * daoShoutouts.length)]
}

function getRoyaltyMessage(accountData: AccountData[]) {
  const royaltyAccount = accountData.find(
    (data) => data?.account === ROYALTY_ACCOUNT_ADDRESS
  )
  const royaltyPaid = royaltyAccount?.nativeBalanceChange ?? 0
  const royaltyMessage =
    royaltyPaid > 0
      ? `◎${royaltyPaid / LAMPORTS_PER_SOL} paid in royalties 🤝`
      : 'Uh oh... someone forgot to pay royalties 😭'

  return royaltyMessage
}

export async function getSalesTweet(
  claynoName = 'A Claynosaur',
  amount: number,
  nftData: NftData
) {
  const salesTweet = [`${claynoName} sold for ◎${amount}`]

  // Add the USD price if available
  const solPrice = await getSolPrice()
  if (solPrice) {
    salesTweet.push(`($${(amount * solPrice).toFixed(2)} USD)`)
  }

  // Add the marketplace
  if (nftData.source) {
    const marketplace = nftData.source
      .split('_')
      .map((w: string) => w[0].toUpperCase() + w.substring(1).toLowerCase())
      .join(' ')
    salesTweet.push(`on ${marketplace}`)
  }

  return salesTweet.join(' ')
}

export async function buildTweet(
  nftPublicKey: string,
  nftData: NftData,
  accountData: AccountData[]
) {
  const amount = nftData.amount / LAMPORTS_PER_SOL
  const mintAddress = new PublicKey(nftPublicKey)
  const nft = await metaplex?.nfts()?.findByMint({ mintAddress })
  const { image, attributes, name } = nft?.json ?? {}

  const tweet = ['Welcome to Claynotopia! 🌋 #SeizeTheClay\n\n']

  // Build the main tweet which shares sales data
  tweet.push(await getSalesTweet(name, amount, nftData))

  const royaltyInfo = await getRoyaltyMessage(accountData)
  tweet.push(`\n\n${royaltyInfo}`)

  // Add DAO shoutout
  const daoShoutout = await getDaoShoutout(attributes as Trait[])
  if (daoShoutout) {
    tweet.push(`\n\n${daoShoutout}`)
  }

  // Add the Hyperspace link
  tweet.push(`\n\n${HYPERSPACE_URL}/token/${nft.address}`)

  // Upload an image if found
  let mediaId
  if (image) {
    mediaId = await uploadImage(image)
  }

  return { tweet, mediaId }
}
