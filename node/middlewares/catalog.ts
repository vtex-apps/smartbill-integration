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
