import { formatError } from './utils/error'

export async function getSkuById(ctx: any, next: () => Promise<any>) {
  const {
    clients: { catalog },
  } = ctx

  const { skuId } = ctx.vtex.route.params
  const data = await catalog.getSkuById(skuId.toString())

  ctx.status = 200
  ctx.body = data

  await next()
}

export async function getProductVariation(ctx: any, next: () => Promise<any>) {
  const {
    clients: { catalogApi },
  } = ctx

  const { productId } = ctx.vtex.route.params
  const data = await catalogApi.getProductVariations(ctx, productId)

  ctx.status = 200
  ctx.body = data

  await next()
}

export async function getSkuWithVariations(id: string, ctx: any) {
  const {
    clients: { catalog, catalogApi, logger },
  } = ctx
  let sku: any
  try {
    sku = await catalog.getSkuById(id.toString())
  } catch (e) {
    logger.error({
      message: 'GET-SKU',
      error: formatError(e),
    })
  }
  console.log('sku', sku)
  let variations: any
  try {
    variations = await catalogApi.getProductVariations(ctx, sku.ProductId)
  } catch (e) {
    logger.error({
      message: 'GET-PRODUCT-VARIATIONS',
      error: formatError(e),
    })
  }
  console.log('variations', variations)
  const existingSku = variations.skus.filter((sku: any) => {
    return sku.sku == id
  })

  return {
    sku,
    existingSku,
  }
}
