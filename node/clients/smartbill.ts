/* eslint-disable  @typescript-eslint/no-explicit-any */
import type { InstanceOptions, IOContext } from '@vtex/api'
import { Apps, ExternalClient } from '@vtex/api'
import { validate } from 'validate.js'

export default class Smartbill extends ExternalClient {
  public async generateJson(order: any) {
    const settings = await this.getSettings()
    const todayDate = new Date().toISOString().slice(0, 10)
    const {
      clientProfileData: client,
      shippingData: { address },
    } = order

    const clientData: any = {
      country: 'Romania',
      email: client.email,
      name: `${client.lastName} ${client.firstName}`,
      address: `${address.street} ${address.number}`,
      city: `${address.city}`,
      county: `${address.state}`,
    }

    if (client.isCorporate) {
      clientData.vatCode = client.corporateDocument
      clientData.name = client.tradeName
    }

    return {
      client: clientData,
      companyVatCode: settings.smarbillVatCode,
      issueDate: todayDate,
      products: Smartbill.generateProducts(order, settings),
      seriesName: settings.smarbillSeriesName,
    }
  }

  private async validateSettings() {
    const settings = await this.getSettings()
    const rule = {
      presence: { allowEmpty: false },
    }

    const constraints = {
      smarbillApiToken: rule,
      smarbillSeriesName: rule,
      smarbillUsername: rule,
      smarbillVatCode: rule,
    }

    return validate(settings, constraints, { format: 'flat' })
  }

  public static generateProducts(order: any, settings: any) {
    const items = order.items.map((item: any) => {
      return {
        code: item.uniqueId,
        currency: order.storePreferencesData.currencyCode,
        isTaxIncluded: true,
        measuringUnitName: 'buc',
        name: item.name,
        price: item.sellingPrice,
        quantity: item.quantity,
        taxName: 'Normala',
        taxPercentage: 19,
      }
    })

    if (
      settings.invoiceShippingCost &&
      // eslint-disable-next-line no-prototype-builtins
      order.hasOwnProperty('shippingTotal') &&
      order.shippingTotal > 0
    ) {
      items.push({
        code: settings.invoiceShippingProductCode,
        currency: order.storePreferencesData.currencyCode,
        isTaxIncluded: true,
        measuringUnitName: 'buc',
        name: settings.invoiceShippingProductName,
        price: order.shippingTotal,
        quantity: 1,
        taxName: 'Normala',
        taxPercentage: 19,
        isService: true,
      })
    }

    return items
  }

  constructor(context: IOContext, options?: InstanceOptions) {
    super('http://ws.smartbill.ro/SBORO/api', context, options)
  }

  public async getSettings() {
    const apps = new Apps(this.context)
    const appId = process.env.VTEX_APP_ID as string

    return apps.getAppSettings(appId)
  }

  public async showInvoice(invoiceNumber: any): Promise<any> {
    const settings = await this.getSettings()

    // Create buffer object, specifying utf8 as encoding
    const bufferObj = Buffer.from(
      `${settings.smarbillUsername}:${settings.smarbillApiToken}`,
      'utf8'
    )

    // Encode the Buffer as a base64 string
    const smartBillAuthorization = bufferObj.toString('base64')

    return this.http.getStream(
      `/invoice/pdf?cif=${settings.smarbillVatCode}&seriesname=${settings.smarbillSeriesName}&number=${invoiceNumber}`,
      {
        headers: {
          Accept: 'application/octet-stream',
          'Content-Type': 'application/xml',
          'X-Vtex-Use-Https': true,
          Authorization: `Basic ${smartBillAuthorization}`,
        },
      }
    )
  }

  public async generateInvoice(body: any): Promise<any> {
    const errors = await this.validateSettings()

    if (errors) {
      throw new Error(JSON.stringify(errors))
    }

    const { order } = body
    const json = await this.generateJson(order)

    const settings = await this.getSettings()

    // Create buffer object, specifying utf8 as encoding
    const bufferObj = Buffer.from(
      `${settings.smarbillUsername}:${settings.smarbillApiToken}`,
      'utf8'
    )

    // Encode the Buffer as a base64 string
    const smartBillAuthorization = bufferObj.toString('base64')

    return this.http.post('/invoice', json, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Vtex-Use-Https': true,
        Authorization: `Basic ${smartBillAuthorization}`,
      },
    })
  }
}
