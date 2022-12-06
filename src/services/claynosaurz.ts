import { Trait, TraitType, TraitValue } from '../types'

function containsAttribute(
  attributes: Trait[],
  type: TraitType,
  value: TraitValue
) {
  return attributes.some((trait) => {
    return (
      trait.trait_type.toLowerCase() === type.toString().toLowerCase() &&
      trait.value.toLowerCase() === value.toString().toLowerCase()
    )
  })
}

export function isRaptor(attributes: Trait[]) {
  return containsAttribute(attributes, 'species', 'raptor')
}

export function isRex(attributes: Trait[]) {
  return containsAttribute(attributes, 'species', 'rex')
}

export function isBronto(attributes: Trait[]) {
  return containsAttribute(attributes, 'species', 'bronto')
}

export function isAnkylo(attributes: Trait[]) {
  return containsAttribute(attributes, 'species', 'ankylo')
}

export function isTrice(attributes: Trait[]) {
  return containsAttribute(attributes, 'species', 'trice')
}

export function isLayerZero(attributes: Trait[]) {
  return containsAttribute(attributes, 'layer count', '0')
}

export function isApres(attributes: Trait[]) {
  return containsAttribute(attributes, 'skin', 'apres')
}
