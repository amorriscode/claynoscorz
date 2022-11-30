export type CoinGeckoPriceResponse = { solana: { usd: number } }

export type Species = 'raptor' | 'rex' | 'bronto' | 'ankylo' | 'trice'

export type TraitType = 'species'
export type TraitValue = Species

export type Trait = {
  trait_type: string
  value: TraitValue | string
}

type Nft = {
  mint: string
  tokenStandard: string
}

export type NftData = {
  amount: number
  nfts: Nft[]
  buyer: string
  seller: string
  signature: string
  source: string
  fee: number
}
