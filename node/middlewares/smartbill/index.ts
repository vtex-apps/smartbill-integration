/* eslint-disable  @typescript-eslint/no-explicit-any */
import { json } from 'co-body'

export async function generateInvoice(ctx: any, next: () => Promise<any>) {
  const body = await json(ctx.req)
  const {
    clients: { smartbill },
  } = ctx

  const response = await smartbill.generateInvoice(body)

  ctx.status = 200
  ctx.body = response

  await next()
}

export async function showInvoice(ctx: any, next: () => Promise<any>) {
  const {
    clients: { smartbill },
  } = ctx

  const { invoiceNumber } = ctx.vtex.route.params
  const response = await smartbill.showInvoice(invoiceNumber)

  ctx.status = 200

  ctx.body = response
  ctx.res.setHeader('Content-type', 'application/pdf')

  await next()
}
