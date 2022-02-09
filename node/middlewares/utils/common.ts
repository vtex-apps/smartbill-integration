/* eslint-disable no-console */

import type { OrderItem } from '../../typings'

export const mapItems = (
  sku: any,
  added: any,
  imageUrl: string
): OrderItem => ({
  uniqueId: sku.RefId,
  name: sku?.Name,
  refId: sku.RefId,
  productId: sku.ProductId,
  id: sku.Id,
  additionalInfo: {
    dimension: {
      cubicweight: sku.CubicWeight,
      weight: sku.WeightKg,
      height: sku.Height,
      length: sku.Length,
      width: sku.Width,
    },
  },
  measurementUnit: sku.MeasurementUnit,
  tax: 0,
  price: added.price,
  listPrice: added.price,
  sellingPrice: added.price,
  quantity: added.quantity,
  imageUrl,
  unitMultiplier: added.unitMultiplier,
  priceTags: [],
})

