enum Species {
  Ankylo,
  Bronto,
  Raptor,
  Rex,
  Trice,
}

enum TraitType {
  Species,
}

type TraitValue = Species

export type Trait = {
  trait_type: string
  value: string
}

function containsAttribute(
  attributes: Trait[],
  type: TraitType,
  value: TraitValue
) {
  return attributes.some(
    (trait) =>
      trait.trait_type.toLowerCase() === type.toString().toLowerCase() &&
      trait.value.toLowerCase() === value.toString().toLowerCase()
  )
}

export function isRaptor(attributes: Trait[]) {
  return containsAttribute(attributes, TraitType.Species, Species.Raptor)
}

export function isRex(attributes: Trait[]) {
  return containsAttribute(attributes, TraitType.Species, Species.Rex)
}
