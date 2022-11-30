type Species = 'raptor' | 'rex' | 'bronto' | 'ankylo' | 'trice'

type TraitType = 'species'
type TraitValue = Species

export type Trait = {
  trait_type: string
  value: TraitValue | string
}

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
