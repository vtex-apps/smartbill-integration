import { ExternalClient, InstanceOptions, IOContext } from '@vtex/api'

export default class CatalogApi extends ExternalClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    super('', context, {
      ...options,
      headers: {
        ...(options?.headers ?? {}),
        'Content-Type': 'application/json',
        // tslint:disable-next-line:object-literal-sort-keys
        Accept: 'application/json',
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  public async getProductVariations(ctx: any, productId: any): Promise<any> {
    return this.http.get(
      `http://${ctx.vtex.account}.vtexcommercestable.com.br/api/catalog_system/pub/products/variations/${productId}`,
      {
        headers: {
          VtexIdclientAutCookie: ctx.vtex.authToken,
        },
      }
    )
  }

  public async getSkuId(ctx: any, skuId: any): Promise<any> {
    return this.http.get(
      `http://${ctx.vtex.account}.vtexcommerstable.com.br/api/catalog/pvt/stockkeepingunit/${skuId}`,
      {
        headers: {
          VtexIdclientAutCookie: ctx.vtex.authToken,
        },
      }
    )
  }
}
