import React, { Component } from 'react'
import PropTypes from 'prop-types'

import OrderDetails from './OrderDetails'
import styles from './style.css'
import OrderLog from './OrderLog'
import InvoiceDetails from './InvoiceDetails'

export default class Details extends Component<any, any> {
  static propTypes = {
    data: PropTypes.object,
    intl: PropTypes.object,
  }

  constructor(props: any) {
    super(props)
    this.state = {
      order: null,
      log: [],
      tableIsLoading: true,
    }
  }

  componentDidMount() {
    this.getOrder()
  }

  getOrder = async () => {
    const orderId = this.props.data.params.id

    try {
      const getOrderResponse = await fetch(
        `/api/oms/pvt/orders/${orderId}/?_=${Date.now()}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      )

      const orderResponse = await getOrderResponse.json()

      this.setState({ order: orderResponse }, () => {
        this.getLogItems()
      })
    } catch (err) {
      this.setState({ tableIsLoading: false })
    }
  }

  async initMasterData() {
    const logSchema = {
      properties: {
        orderId: { type: 'string' },
        data: { type: 'object' },
        type: { type: 'string' },
      },
      'v-indexed': ['orderId', 'type'],
      'v-default-fields': ['id', 'orderId', 'data', 'createdIn', 'type'],
      'v-cache': false,
    }

    return await fetch(`/api/dataentities/vtex_smartbill/schemas/default`, {
      method: 'PUT',
      body: JSON.stringify(logSchema),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
  }

  getLogItems = async () => {
    const { order } = this.state

    await this.initMasterData()

    try {
      const logItemsResponse = await fetch(
        `/api/dataentities/vtex_smartbill/search?_fields=id,orderId,data,createdIn,type&_sort=createdIn DESC&orderId=${order.orderId}&type=error-log&_size=100`,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
        }
      )

      const logItems = await logItemsResponse.json()

      this.setState({ log: logItems, tableIsLoading: false })
    } catch (err) {
      this.setState({ tableIsLoading: false })
    }
  }

  logOrderError = (errors, source = 'smartbill-errors') => {
    let message

    if (errors.hasOwnProperty('message')) {
      source = 'change-seller/delete-product error'
      message = errors.message
    } else {
      message = Object.keys(errors)
        .map(function(key) {
          return errors[key][0]
        })
        .join('\n')
    }

    if (message) {
      const { order } = this.state

      const payload = {
        source,
        message,
      }

      try {
        fetch(`/api/oms/pvt/orders/${order.orderId}/interactions`, {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })
      } catch (err) {
        this.setState({ tableIsLoading: false })
      }

      try {
        this.initMasterData().then(() => {
          try {
            fetch(`/api/dataentities/vtex_smartbill/documents`, {
              method: 'POST',
              body: JSON.stringify({
                orderId: order.orderId,
                type: 'error-log',
                data: {
                  error: payload,
                },
              }),
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
            }).then(() => {
              setTimeout(() => {
                this.getLogItems()
              }, 1000)
            })
          } catch (err) {
            this.setState({ tableIsLoading: false })
          }
        })
      } catch (err) {
        this.setState({ tableIsLoading: false })
      }
    }
  }

  public render() {
    const { log, order, tableIsLoading } = this.state

    if (!order) {
      return null
    }

    return (
      <div className={`flex flex-row ${styles.flex1}`}>
        <div className={`flex flex-column ${styles.flex06}`}>
          <OrderDetails
            logError={this.logOrderError}
            order={this.state.order}
            intl={this.props.intl}
          />
        </div>
        <div className={`flex flex-column ${styles.flex04}`}>
          <InvoiceDetails
            logError={this.logOrderError}
            order={this.state.order}
            intl={this.props.intl}
          />
          <OrderLog
            log={log}
            tableIsLoading={tableIsLoading}
            getLogItems={this.getLogItems}
            order={this.state.order}
            intl={this.props.intl}
          />
        </div>
      </div>
    )
  }
}
