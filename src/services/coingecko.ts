import fetch from 'node-fetch'

import { SOLANA_PRICE_URL, ETHEREUM_PRICE_URL } from '../constants'
import { CoinGeckoPriceResponse, CoinGeckoCoin } from '../types'

export async function getCoinPrice(coin: CoinGeckoCoin, coinUrl: string) {
  try {
    const response = await fetch(coinUrl)
    const priceData = (await response.json()) as CoinGeckoPriceResponse
    return priceData?.[coin]?.usd
  } catch (error) {
    console.error(
      `Failed to fetch price from Coingecko: ${JSON.stringify(error, null, 2)}`
    )
  }
}

export async function getSolPrice() {
  return getCoinPrice('solana', SOLANA_PRICE_URL)
}

export async function getEthPrice() {
  return getCoinPrice('ethereum', ETHEREUM_PRICE_URL)
}
