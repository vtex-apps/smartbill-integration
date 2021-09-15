/* eslint-disable  @typescript-eslint/no-explicit-any */
// eslint-disable-next-line prettier/prettier
import type { ClientsConfig } from '@vtex/api'
import { LRUCache, method, Service } from '@vtex/api'

import { Clients } from './clients'
import { generateInvoice, showInvoice } from './middlewares/smartbill'
import {getProductVariation, getSkuById} from "./middlewares/catalog";

const TIMEOUT_MS = 5000

const memoryCache = new LRUCache<string, any>({ max: 5000 })

const clients: ClientsConfig<Clients> = {
  implementation: Clients,
  options: {
    default: {
      retries: 2,
      timeout: TIMEOUT_MS,
    },
    status: {
      memoryCache,
    },
  },
}

export default new Service({
  clients,
  routes: {
    generateInvoice: method({
      POST: generateInvoice,
    }),
    showInvoice: method({
      GET: showInvoice,
    }),
    getSkuById: method({
      GET: getSkuById,
    }),
    getProductVariation: method({
      GET: getProductVariation,
    }),
  },
})
