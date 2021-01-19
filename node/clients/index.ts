import { IOClients } from '@vtex/api'

import Smartbill from './smartbill'

// Extend the default IOClients implementation with our own custom clients.
export class Clients extends IOClients {
  public get smartbill() {
    return this.getOrSet('smartbill', Smartbill)
  }
}
