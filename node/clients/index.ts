import { IOClients } from '@vtex/api'
import { Catalog } from '@vtex/clients'

import CatalogApi from './catalog'
import Smartbill from './smartbill'

// Extend the default IOClients implementation with our own custom clients.
export class Clients extends IOClients {
  public get smartbill() {
    return this.getOrSet('smartbill', Smartbill)
  }

  public get catalog() {
    return this.getOrSet('catalog', Catalog)
  }

  public get catalogApi() {
    return this.getOrSet('catalogApi', CatalogApi)
  }
}
