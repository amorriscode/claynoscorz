import { isRaptor, Trait } from './claynosaurz'

export function getSalesTweet(
  claynoName = 'A Claynosaur',
  amount: number,
  attributes: Trait[] = []
) {
  const header = isRaptor(attributes) ? '.@RaptorsDAO wen? 👀' : 'RAAAWR 🦖'
  return [`${header}\n\n${claynoName} sold for ◎${amount}`]
}
