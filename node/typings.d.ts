export interface OrderItem {
  uniqueId: string
  name: string
  refId: string
  productId: string
  id: string
  additionalInfo: { dimension: Dimension }
  measurementUnit: string
  tax: number
  price: number
  listPrice: number
  sellingPrice: number
  quantity: number
  imageUrl: string
  unitMultiplier: string
  priceTags: []
}

export interface Dimension {
  cubicweight: string
  weight: string
  height: string
  length: string
  width: string
}
export interface TaxName {
  name: string
  percentage: number
}

export interface AddressForm {
  corporateAddress?: string
  city?: string
  county?: string
}
