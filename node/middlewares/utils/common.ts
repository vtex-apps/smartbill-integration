/* eslint-disable no-console */
import SimpleCrypto from 'simple-crypto-js'

import type { AddressForm, OrderItem } from '../../typings'

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

export async function getEncryptedNumber(
  ctx: any,
  body: any,
  address?: AddressForm
) {
  const {
    clients: { smartbill },
  } = ctx

  const settings = await smartbill.getSettings()
  const response = await smartbill.generateInvoice(body, address)

  const simpleCrypto = new SimpleCrypto(settings.smarbillApiToken)

  const cipherText = simpleCrypto.encrypt(
    JSON.stringify({ number: response.number })
  )

  response.encryptedNumber = Buffer.from(cipherText).toString('base64')

  return response
}
