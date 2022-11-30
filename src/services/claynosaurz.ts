type TraitType = 'species'
type TraitValue = 'raptor' | 'rex'

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
