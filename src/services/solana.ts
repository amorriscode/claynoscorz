import fetch from 'node-fetch'

import { SOLANA_PRICE_URL } from '../constants'
import { CoinGeckoPriceResponse } from '../types'

export async function getSolPrice() {
  try {
    const response = await fetch(SOLANA_PRICE_URL)
    const priceData = (await response.json()) as CoinGeckoPriceResponse
    return priceData?.solana?.usd
  } catch (error) {
    console.error(
      `Failed to fetch Solana price from Coingeck: ${JSON.stringify(
        error,
        null,
        2
      )}`
    )
  }
}
