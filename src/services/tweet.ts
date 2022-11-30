import {
  isRaptor,
  isRex,
  isBronto,
  isAnkylo,
  isTrice,
  Trait,
} from './claynosaurz'

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
