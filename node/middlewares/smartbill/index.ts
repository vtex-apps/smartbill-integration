/* eslint-disable  @typescript-eslint/no-explicit-any */
import { json } from 'co-body'
import SimpleCrypto from 'simple-crypto-js'

export async function generateInvoice(ctx: any, next: () => Promise<any>) {
  const body = await json(ctx.req)
  const {
    clients: { smartbill },
  } = ctx

  const settings = await smartbill.getSettings()
  const response = await smartbill.generateInvoice(body)

  const simpleCrypto = new SimpleCrypto(settings.smarbillApiToken)

  const cipherText = simpleCrypto.encrypt(response.number)

  response.encryptedNumber = Buffer.from(cipherText).toString('base64')
  ctx.status = 200
  ctx.body = response

  await next()
}

export async function showInvoice(ctx: any, next: () => Promise<any>) {
  const {
    clients: { smartbill },
  } = ctx

  const { invoiceNumber } = ctx.vtex.route.params
  const settings = await smartbill.getSettings()
  const simpleCrypto = new SimpleCrypto(settings.smarbillApiToken)
  const toDecrypt = Buffer.from(invoiceNumber, 'base64').toString('ascii')
  const plainNumber = simpleCrypto.decrypt(toDecrypt)
  const response = await smartbill.showInvoice(plainNumber.toString())

  ctx.status = 200

  ctx.body = response
  ctx.res.setHeader('Content-type', 'application/pdf')

  await next()
}
