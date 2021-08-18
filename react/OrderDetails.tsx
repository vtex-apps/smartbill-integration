import React, { Component } from 'react'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Collapsible,
  Dropdown,
  Input,
  Modal,
  Progress,
  SelectableCard,
  Spinner,
  Tag,
} from 'vtex.styleguide'
import { FormattedCurrency } from 'vtex.format-currency'
import PropTypes from 'prop-types'
import axios from 'axios'
import { defineMessages, FormattedMessage } from 'react-intl'

import settings from './settings'
import styles from './style.css'
import {
  addressTypePickUp,
  awbContent,
  awbSourceChannel,
  awbStatusNew,
  completedStep,
  defaultAWBFormat,
  defaultCountryCode,
  defaultEnvelopeCount,
  defaultPalettesCount,
  defaultServiceId,
  pickupServiceId,
  requestHeaders,
  serviceLockers,
  toDoStep,
} from './utils/constants'

const messages = defineMessages({
  order: { id: 'admin/order.order' },
  requestAwb: { id: 'admin/order.request-awb' },
  company: { id: 'admin/order.company' },
  tradeRegister: { id: 'admin/order.trade-register' },
  readyToHandle: { id: 'admin/order.status.ready-to-handle' },
  startHandling: { id: 'admin/order.status.start-handling' },
  automatic: { id: 'admin/order.automatic' },
  rate: { id: 'admin/order.rate' },
  rateVat: { id: 'admin/order.rate-vat' },
  service: { id: 'admin/order.service' },
  deliveryDays: { id: 'admin/order.delivery-days' },
  autoWeight: { id: 'admin/order.auto-weight-distribution' },
  numberParcels: { id: 'admin/order.number-of-parcels' },
  totalWeight: { id: 'admin/order.total-weight' },
  recipientSupport: { id: 'admin/order.recipient-support' },
  seeOrderDetails: { id: 'admin/order.see-order-details' },
  trackingNumberIs: { id: 'admin/order.tracking-number-is' },
  printLabel: { id: 'admin/order.print-label' },
  awbStatus: { id: 'admin/order.awb-status' },
  updateAwbStatus: { id: 'admin/order.update-awb-status' },
  paymentMethod: { id: 'admin/order.payment-method' },
  productId: { id: 'admin/order.product-id' },
  skuRefCode: { id: 'admin/order.sku-ref-code' },
  weight: { id: 'admin/order.weight' },
  moreDetails: { id: 'admin/order.more-details' },
  shippingTotal: { id: 'admin/order.shipping-total' },
  giftCard: { id: 'admin/order.gift-card' },
  totalOrderValue: { id: 'admin/order.total-order-value' },
  shippingInformation: { id: 'admin/order.shipping-information' },
  client: { id: 'admin/order.client' },
  phone: { id: 'admin/order.phone' },
  shippingStatus: { id: 'admin/order.shipping-status' },
  theOrderIs: { id: 'admin/order.the-order-is' },
  close: { id: 'admin/order.close' },
  errors: { id: 'admin/order.errors' },
})

function FormattedMessageFixed(props) {
  return <FormattedMessage {...props} />
}

class OrderDetails extends Component<any, any> {
  static propTypes = {
    order: PropTypes.object,
    intl: PropTypes.object,
    logError: PropTypes.func,
  }

  constructor(props: any) {
    super(props)
    this.state = {
      order: this.props.order,
      posted: false,
      errors: {},
      error: {},
      modalOpen: false,
      productsSpecs: [],
      changedItems: {},
      totalOrderDiscount: 0,
      giftCards: [],
      numberOfParcels: 1,
      totalWeight: 0,
      parcelWeights: [],
      quantityWeights: [],
      format: defaultAWBFormat,
      priceRates: [],
      shipmentPayment: 0,
      shipmentPaymentMethod: 1,
      selectedShippingCostCard: 'auto',
      courierId: null,
      canSubmit: true,
      parcelWeightsErrors: [],
      collapsibles: {},
    }

    this.handleOrder = this.handleOrder.bind(this)
    this.requestAWB = this.requestAWB.bind(this)
    this.updateInvoice = this.updateInvoice.bind(this)
    this.printAWB = this.printAWB.bind(this)
    this.closeModal = this.closeModal.bind(this)
    this.getAWBHistory = this.getAWBHistory.bind(this)
    this.updateAWBStatus = this.updateAWBStatus.bind(this)

    this.changeState = this.changeState.bind(this)
    this.changeWeight = this.changeWeight.bind(this)
    this.changeTotalWeight = this.changeTotalWeight.bind(this)
    this.automaticWeightDistribution = this.automaticWeightDistribution.bind(
      this
    )
    this.changeNumberOfParcels = this.changeNumberOfParcels.bind(this)

    this.getOrder = this.getOrder.bind(this)

    this.toggleShipmentPayment = this.toggleShipmentPayment.bind(this)
    this.getShipmentPriceRates = this.getShipmentPriceRates.bind(this)

    this.createOrderPayload = this.createOrderPayload.bind(this)

    this.collapse = this.collapse.bind(this)
  }

  collapse(itemId, state) {
    const { collapsibles } = this.state

    collapsibles[itemId] = state
    this.setState({ collapsibles })
  }

  isPickupPointAddress() {
    const { order } = this.state

    return order.shippingData.address.addressType === settings.constants.pickup
  }

  validateParcelsWeight() {
    const {
      parcelWeights,
      totalWeight,
      parcelWeightsErrors,
      numberOfParcels,
    } = this.state

    for (let i = 1; i <= numberOfParcels; i++) {
      parcelWeightsErrors[i] = true
    }

    const totalParcelsWeight = parcelWeights.reduce(
      (result, parcelWeight, index) => {
        parcelWeightsErrors[index] = parcelWeight === 0
        result += parcelWeight

        return result
      },
      0
    )

    const hasErrors = parcelWeightsErrors.reduce((result, error) => {
      if (error) {
        result = error

        return result
      }
    }, false)

    const canSubmit =
      (totalParcelsWeight === totalWeight && !hasErrors) ||
      numberOfParcels === 1

    this.setState({ canSubmit, parcelWeightsErrors })
  }

  isCardSelected(opt) {
    return opt === this.state.selectedShippingCostCard
  }

  changeCard(opt) {
    const { priceRates } = this.state
    const courierId =
      opt === settings.constants.auto ? null : priceRates[opt].carrierId

    this.setState({ selectedShippingCostCard: opt, courierId })
  }

  createOrderPayload() {
    const {
      order,
      totalOrderDiscount,
      numberOfParcels,
      totalWeight,
      parcelWeights,
      shipmentPaymentMethod,
      courierId,
    } = this.state

    let weight = 0
    let { value } = order
    const parcels = [] as any

    if (totalWeight === 0) {
      order.items.reduce(
        (weight, item) =>
          weight + item.additionalInfo.dimension.weight * item.quantity
      )
    } else {
      weight = totalWeight
    }

    if (numberOfParcels > 1) {
      for (let i = 1; i <= numberOfParcels; i++) {
        parcels.push({
          sequenceNo: i,
          weight: parcelWeights[i],
          type: 2,
          reference1: `Parcel ${i}`,
          size: { width: 1, height: 1, length: 1 },
        })
      }
    } else {
      parcels.push({
        sequenceNo: 1,
        weight,
        type: 2,
        reference1: `Parcel 1`,
        size: { width: 1, height: 1, length: 1 },
      })
    }

    const { address } = order.shippingData
    const addressText = [
      address.street,
      address.number,
      address.neighborhood,
      address.complement,
      address.reference,
    ]
      .filter(Boolean)
      .join(', ')

    const { warehouseId } = order.shippingData.logisticsInfo[0].deliveryIds[0]
    const { firstDigits } = order.paymentData.transactions[0].payments[0]
    const paymentPromissory =
      order.paymentData.transactions[0].payments[0].group ===
      settings.constants.promissory

    value += totalOrderDiscount

    const payment =
      firstDigits || paymentPromissory
        ? 0
        : value / settings.constants.price_multiplier

    const payload = {
      serviceId: defaultServiceId,
      shipmentDate: new Date().toISOString(),
      addressFrom: null,
      addressTo: {
        name: address.receiverName,
        contactPerson: address.receiverName,
        country: defaultCountryCode,
        countyName: address.state,
        localityName: address.city,
        addressText,
        postalCode: address.postalCode,
        phone: order.clientProfileData.phone,
        email: order.clientProfileData.email,
      },
      payment: shipmentPaymentMethod,
      content: {
        envelopeCount: defaultEnvelopeCount,
        parcelsCount: numberOfParcels,
        palettesCount: defaultPalettesCount,
        totalWeight: weight,
        contents: awbContent,
        parcels,
      },
      externalClientLocation: warehouseId,
      externalOrderId: order.orderId,
      sourceChannel: awbSourceChannel,
      extra: {
        bankRepaymentAmount: payment,
      },
    } as any

    if (courierId) {
      payload.courierId = courierId
    }

    if (order.shippingData.address.addressType === settings.constants.pickup) {
      payload.serviceId = pickupServiceId
      payload.addressTo.fixedLocationId = order.shippingData.address.addressId

      payload.addressTo.localityId = order.shippingData.address.neighborhood
      payload.addressTo.countyName = order.shippingData.address.state
      payload.addressTo.localityName = order.shippingData.address.city
      payload.addressTo.addressText = order.shippingData.address.street
      payload.addressTo.postalCode = order.shippingData.address.postalCode
    }

    return payload
  }

  async getShipmentPriceRates() {
    const { order } = this.state

    if (order.shippingData.address.addressType != addressTypePickUp) {
      this.setState({ priceRates: [] })

      const payload = this.createOrderPayload()

      return await fetch('/innoship/request-price-rates', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          ...requestHeaders,
          'X-Vtex-Use-Https': 'true',
        },
      })
        .then(res => res.json())
        .then(json => {
          if (json.hasOwnProperty('response')) {
            this.setState(
              {
                errors: json.response.data.errors,
                modalOpen: true,
                posted: false,
              },
              () => {
                this.props.logError(json.response.data.errors)
              }
            )
          } else {
            const priceRates = json.rates.reduce((result, item) => {
              if (
                order.shippingData.address.addressType !== addressTypePickUp
              ) {
                if (item.service !== serviceLockers) {
                  result.push(item)
                }
              } else {
                result.push(item)
              }

              return result
            }, [])

            this.setState({ priceRates })
          }
        })
    }
  }

  toggleShipmentPayment() {
    let { shipmentPayment } = this.state

    shipmentPayment = !shipmentPayment
    const shipmentPaymentMethod = shipmentPayment ? 2 : 1

    this.setState({ shipmentPayment, shipmentPaymentMethod }, () => {
      this.getShipmentPriceRates().then(() => {
        this.changeCard('auto')
      })
    })
  }

  changeNumberOfParcels(value) {
    this.setState(
      { numberOfParcels: value, parcelWeights: [], parcelWeightsErrors: [] },
      () => {
        this.validateParcelsWeight()
        this.getShipmentPriceRates()
      }
    )
  }

  automaticWeightDistribution() {
    const {
      totalWeight,
      numberOfParcels,
      parcelWeights,
      quantityWeights,
    } = this.state

    const values = [] as any

    quantityWeights.map((w, q) => {
      for (let i = 1; i <= q; i++) {
        values.push(w / q)
      }
    })

    const distributions = this.splitWeights(
      totalWeight,
      numberOfParcels,
      values
    )

    if (distributions) {
      distributions.map((d, i) => {
        parcelWeights[i + 1] = d
      })

      this.setState({ parcelWeights })
    }
  }

  splitWeights(totalWeight, parts, values) {
    const distribution = [] as any

    const pp = totalWeight / parts

    let index = 0

    for (let i = 0; i < parts; i++) {
      let sum = 0

      do {
        sum += values[index]
        index++
      } while (sum < pp && index < values.length)

      distribution.push(parseFloat(sum.toFixed(2)))
    }

    return distribution
  }

  initOrderChangesAndDiscounts() {
    const { order, changedItems, giftCards } = this.state
    let { totalOrderDiscount } = this.state

    if (order.paymentData.giftCards.length) {
      totalOrderDiscount += order.paymentData.transactions[0].payments.reduce(
        function(result, it) {
          if (it.redemptionCode) {
            result -= it.value
            giftCards.push({
              code: it.redemptionCode,
              value: -it.value / settings.constants.price_multiplier,
            })
          }

          return result
        },
        0
      )

      this.setState({ totalOrderDiscount, giftCards })
    }

    if (order.changesAttachment) {
      order.changesAttachment.changesData.map(item => {
        if (item.itemsAdded.length) {
          if (item.incrementValue === 0) {
            totalOrderDiscount += item.itemsAdded.reduce(function(result, it) {
              result += it.price * it.quantity

              return result
            }, 0)
          }

          item.itemsAdded.map(added => {
            let val = 0

            if (added.id in changedItems) {
              val = changedItems[added.id]
            }

            changedItems[added.id] = val + added.quantity
          })
        }

        if (item.itemsRemoved.length) {
          if (item.discountValue === 0) {
            totalOrderDiscount -= item.itemsRemoved.reduce(function(
              result,
              it
            ) {
              result += it.price * it.quantity

              return result
            },
            0)
          }

          item.itemsRemoved.map(removed => {
            let val = 0

            if (removed.id in changedItems) {
              val = changedItems[removed.id]
            }

            changedItems[removed.id] = val - removed.quantity
          })
        }
      })

      this.setState({ changedItems, totalOrderDiscount })
    }
  }

  initOrderWeight() {
    const { order } = this.state

    let trackingNumber

    if (
      order.packageAttachment.packages &&
      order.packageAttachment.packages.length
    ) {
      const packageItem = order.packageAttachment.packages[0]

      trackingNumber = packageItem.trackingNumber
    }

    if (!trackingNumber && order.status === settings.constants.invoiced) {
      const totalWeight = order.items.reduce(function(result, item) {
        result += item.additionalInfo.dimension.weight * item.quantity

        return result
      }, 0)

      this.setState({ totalWeight }, () => {
        this.getShipmentPriceRates()
      })
    }
  }

  componentDidMount() {
    this.initOrderChangesAndDiscounts()
    this.initOrderWeight()
  }

  async getOrder() {
    const { order } = this.state

    return await fetch(
      `/api/oms/pvt/orders/${order.orderId}/?_=${Date.now()}`,
      {
        headers: requestHeaders,
      }
    )
      .then(res => res.json())
      .then(json => this.setState({ order: json }))
  }

  async updateAWBStatus(data) {
    const { order } = this.state
    let invoiceNumber = null

    if (order.status === settings.constants.invoiced) {
      const packageItem = order.packageAttachment.packages[0]

      invoiceNumber = packageItem.invoiceNumber
    }

    if (data.length && data[0].hasOwnProperty('history') && invoiceNumber) {
      const { history } = data[0]

      const events = history.map(event => {
        return {
          description: event.clientStatusDescription,
          date: event.eventDate,
        }
      })

      const payload = { events }

      try {
        await fetch(
          `/api/oms/pvt/orders/${order.orderId}/invoice/${invoiceNumber}/tracking`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: requestHeaders,
          }
        )

        window.setTimeout(() => {
          window.location.reload()
        }, 2000)
      } catch (err) {
        this.setState({ posted: false })
      }
    } else {
      this.setState({ posted: false })
    }
  }

  getAWBHistory() {
    this.setState({ posted: true })
    let courier = null
    let trackingNumber = null
    const { order } = this.state

    if (
      order.packageAttachment.packages &&
      order.packageAttachment.packages.length
    ) {
      const packageItem = order.packageAttachment.packages[0]

      trackingNumber = packageItem.trackingNumber
      courier = packageItem.courier
    }

    if (!courier || !trackingNumber) {
      return
    }

    const payload = {
      awbList: [trackingNumber],
    }

    try {
      fetch('/innoship/request-awb-history', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          ...requestHeaders,
          'X-Vtex-Use-Https': 'true',
        },
      })
        .then(res => res.json())
        .then(json => {
          if (json.hasOwnProperty('response')) {
            this.setState(
              {
                errors: json.response.data.errors,
                modalOpen: true,
                posted: false,
              },
              () => {
                this.props.logError(json.response.data.errors)
              }
            )
          } else {
            this.updateAWBStatus(json)
          }
        })
    } catch (err) {
      this.setState({ error: err, modalOpen: true, posted: false }, () => {
        this.props.logError(err)
      })
    }
  }

  closeModal() {
    this.setState({ modalOpen: false, errors: {}, error: {}, posted: false })
  }

  async updateInvoice() {
    const { order } = this.state
    let invoiceNumber = null
    let trackingNumber = null

    if (order.status === settings.constants.invoiced) {
      const packageItem = order.packageAttachment.packages[0]

      invoiceNumber = packageItem.invoiceNumber
      trackingNumber = packageItem.trackingNumber
    }

    if (
      this.state.hasOwnProperty('awb') &&
      invoiceNumber !== null &&
      !trackingNumber
    ) {
      if (!this.state.awb.hasOwnProperty('errors')) {
        const { awb } = this.state
        const data = {
          trackingNumber: awb.courierShipmentId,
          trackingUrl: awb.trackPageUrl,
          courier: settings.carriers[awb.courier],
          dispatchedDate: awb.calculatedDeliveryDate,
        }

        try {
          await fetch(
            `/api/oms/pvt/orders/${order.orderId}/invoice/${invoiceNumber}`,
            {
              method: 'PATCH',
              body: JSON.stringify(data),
              headers: requestHeaders,
            }
          )

          window.setTimeout(() => {
            window.location.reload()
          }, 10000)
        } catch (err) {
          this.setState({ error: err, modalOpen: true, posted: false }, () => {
            this.props.logError(err)
          })
        }
      }
    }
  }

  handleOrder() {
    this.setState({ posted: true })
    try {
      const { order } = this.state

      axios
        .post(`/api/oms/pvt/orders/${order.orderId}/start-handling`)
        .then(() => {
          window.location.reload()
        })
    } catch (err) {
      this.setState({ posted: false })
    }
  }

  changeState(newState) {
    this.setState({ posted: true })
    try {
      const { order } = this.state

      axios
        .post(`/api/oms/pvt/orders/${order.orderId}/changestate/${newState}`)
        .then(() => {
          window.location.reload()
        })
    } catch (err) {
      this.setState({ posted: false })
    }
  }

  requestAWB() {
    this.setState({ posted: true })
    this.getOrder().then(() => {
      const { order } = this.state

      if (
        order.packageAttachment.packages &&
        order.packageAttachment.packages.length
      ) {
        const packageItem = order.packageAttachment.packages[0]

        if (packageItem.trackingNumber) {
          window.location.reload()

          return
        }
      }

      const payload = this.createOrderPayload()

      try {
        fetch('/innoship/request-awb', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            ...requestHeaders,
            'X-Vtex-Use-Https': 'true',
          },
        })
          .then(res => res.json())
          .then(json =>
            this.setState({ awb: json }, () => {
              if (json.hasOwnProperty('response')) {
                this.setState(
                  { errors: json.response.data.errors, modalOpen: true },
                  () => {
                    this.props.logError(json.response.data.errors)
                  }
                )
              } else {
                this.updateInvoice()
              }
            })
          )
      } catch (err) {
        this.setState({ error: err, modalOpen: true, posted: false }, () => {
          this.props.logError(err)
        })
      }
    })
  }

  printAWB(event) {
    let courier = null
    let trackingNumber = null
    const { order, format } = this.state

    if (
      order.packageAttachment.packages &&
      order.packageAttachment.packages.length
    ) {
      const packageItem = order.packageAttachment.packages[0]

      trackingNumber = packageItem.trackingNumber
      courier = packageItem.courier
    }

    if (!courier || !trackingNumber) {
      return
    }

    // const reverseCourier = Object.assign(
    //   {},
    //   ...Object.entries(settings.carriers).map(([a, b]) => ({ [b]: a }))
    // );
    //
    // axios
    //   .get(
    //     `/innoship/get-label/${reverseCourier[courier]}/${trackingNumber}/${format}`
    //   )
    //   .then(function(response) {
    //     const buffer = new Buffer(response.data.contents, 'base64');
    //     const blob = new Blob([buffer], { type: 'application/pdf' });
    //     const link = document.createElement('a');
    //
    //     link.href = window.URL.createObjectURL(blob);
    //     link.download = `${trackingNumber}.pdf`;
    //     document.body.appendChild(link);
    //     link.click();
    //     document.body.removeChild(link)
    //   });

    event.preventDefault()
  }

  changeTotalWeight(value) {
    const totalWeight = isNaN(value) ? 0 : value

    this.setState({ totalWeight }, () => {
      this.validateParcelsWeight()
      this.getShipmentPriceRates()
    })
  }

  changeWeight(index, value) {
    const { parcelWeights } = this.state

    parcelWeights[index] = isNaN(value) ? 0 : value
    this.setState({ parcelWeights }, () => {
      this.validateParcelsWeight()
      this.getShipmentPriceRates()
    })
  }

  public render() {
    const {
      order,
      errors,
      error,
      totalOrderDiscount,
      giftCards,
      parcelWeights,
      quantityWeights,
      priceRates,
      collapsibles,
    } = this.state

    let { totalWeight } = this.state
    const { formatMessage } = this.props.intl

    if (!order.hasOwnProperty('error')) {
      let button
      let trackingNumber = null
      let trackingUrl = null
      let invoiceNumber = ''
      let steps = [toDoStep, toDoStep]
      let shipping = 0
      let awbStatus = awbStatusNew
      let displayError
      let parcelsDropdown
      const weightObjects = [] as any
      let distributionButton
      let weightDifference
      let setWeight = 0
      let priceRatesSimulation
      let displayShippingInformation
      let displayCorporateInformation

      const orderValue = order.value

      displayShippingInformation = (
        <div className={`${styles.shippingInformationHolder}`}>
          <span>
            {order.shippingData.address.street},{' '}
            {order.shippingData.address.number}
          </span>
          <span>
            {order.shippingData.address.city},{' '}
            {order.shippingData.address.state},{' '}
            {order.shippingData.address.postalCode}
          </span>
        </div>
      )

      if (order.shippingData.address.addressType == 'pickup') {
        displayShippingInformation = (
          <div className={`${styles.shippingInformationHolder}`}>
            <span className={`${styles.bold}`}>
              {order.shippingData.logisticsInfo[0].pickupStoreInfo.friendlyName}
            </span>
            <span>
              {order.shippingData.address.street},{' '}
              {order.shippingData.address.number}
            </span>
            <span>
              {order.shippingData.address.city},{' '}
              {order.shippingData.address.state},{' '}
              {order.shippingData.address.postalCode}
            </span>
          </div>
        )
      }

      if (order.clientProfileData.isCorporate) {
        displayCorporateInformation = (
          <div className={`${styles.corporateInformationHolder}`}>
            <span className={`${styles.bold}`}>
              {formatMessage({ id: messages.company.id })}:{' '}
              {order.clientProfileData.corporateName}
            </span>
            <span className={`${styles.bold}`}>
              {formatMessage({ id: messages.tradeRegister.id })}:{' '}
              {order.clientProfileData.corporateDocument}
            </span>
          </div>
        )
      }

      const ship = order.totals.filter(function(item) {
        return item.id === settings.constants.shipping
      })

      if (ship.length) {
        shipping = ship[0].value
      }

      if (this.state.error.hasOwnProperty('message')) {
        displayError = <li>{error.message}</li>
      }

      if (
        order.packageAttachment.packages &&
        order.packageAttachment.packages.length
      ) {
        const packageItem = order.packageAttachment.packages[0]

        trackingNumber = packageItem.trackingNumber
        trackingUrl = packageItem.trackingUrl
        invoiceNumber = packageItem.invoiceNumber

        if (
          packageItem.courierStatus &&
          packageItem.courierStatus.data.length
        ) {
          awbStatus = packageItem.courierStatus.data[0].description
        }
      }

      if (invoiceNumber.length) {
        steps = [completedStep, toDoStep]
      }

      const messageId = `admin/order.status.${order.status}`
      let extraStatusMessage
      let tagColor =
        order.status === settings.constants.invoiced ? 'blue' : 'green'

      if (order.status === settings.constants.window_to_cancel) {
        button = (
          <Button
            onClick={() => this.changeState('ready-for-handling')}
            isLoading={this.state.posted}
            variation="primary"
            block
          >
            {formatMessage({ id: messages.readyToHandle.id })}
          </Button>
        )
      } else if (order.status === settings.constants.ready_for_handling) {
        button = (
          <Button
            onClick={() => this.handleOrder()}
            isLoading={this.state.posted}
            variation="primary"
            block
          >
            {formatMessage({ id: messages.startHandling.id })}
          </Button>
        )
      } else if (
        !trackingNumber &&
        order.status === settings.constants.invoiced
      ) {
        const qOptions = [] as any

        for (let i = 1; i <= 10; i++) {
          qOptions.push({ value: i, label: i })
        }

        if (
          order.shippingData.address.addressType === settings.constants.pickup
        ) {
          priceRatesSimulation = null
        } else if (!priceRates.length) {
          priceRatesSimulation = (
            <Card>
              <Spinner />
            </Card>
          )
        } else {
          priceRatesSimulation = (
            <div className={`pa5 flex justify-center`}>
              <div className={`mr4`}>
                <SelectableCard
                  hasGroupRigth
                  selected={this.isCardSelected('auto')}
                  onClick={() => this.changeCard('auto')}
                >
                  <div className={`${styles.height6}`}>
                    <h3 className={`mt0 mb6`}>
                      {formatMessage({ id: messages.automatic.id })}
                    </h3>
                  </div>
                </SelectableCard>
              </div>
              {priceRates.map((item, i) => {
                return (
                  <div key={i} className={`mr4`}>
                    <SelectableCard
                      hasGroupRigth
                      selected={this.isCardSelected(i)}
                      onClick={() => this.changeCard(i)}
                    >
                      <div className={`${styles.height6}`}>
                        <h3 className={`mt0 mb4`}>{item.carrier}</h3>
                        <p className={`gray ma0 ${styles.fontSmall}`}>
                          {formatMessage({ id: messages.rate.id })}
                          {': '} {item.rateAmount} {item.rateCurrency}
                        </p>
                        <p className={`gray ma0 ${styles.fontSmall}`}>
                          {formatMessage({ id: messages.rateVat.id })}
                          {': '} {item.rateVatAmount} {item.rateCurrency}
                        </p>
                        <p className={`gray ma0 ${styles.fontSmall}`}>
                          {formatMessage({ id: messages.service.id })}
                          {': '} {item.service}
                        </p>
                        <p className={`gray ma0 ${styles.fontSmall}`}>
                          {formatMessage({ id: messages.deliveryDays.id })}
                          {': '} {item.deliveryDays}
                        </p>
                      </div>
                    </SelectableCard>
                  </div>
                )
              })}
            </div>
          )
        }

        if (this.state.numberOfParcels > 1) {
          setWeight = 0

          for (let i = 1; i <= this.state.numberOfParcels; i++) {
            const w = parcelWeights[i] !== undefined ? parcelWeights[i] : 0

            setWeight += w
            weightObjects.push(
              <div key={i} className={`mr3`}>
                <Input
                  key={i}
                  type="number"
                  value={w}
                  min={0}
                  max={totalWeight}
                  step={0.1}
                  label={`Parcel ${i} weight`}
                  disabled={this.state.posted}
                  onChange={e =>
                    this.changeWeight(i, parseFloat(e.target.value))
                  }
                  errorMessage={this.state.parcelWeightsErrors[i]}
                />
              </div>
            )
          }

          const color =
            setWeight - totalWeight === 0
              ? `bg-success--faded hover-bg-success-faded active-bg-success-faded c-success hover-c-success active-c-success b--success hover-b-success active-b-success`
              : `bg-danger--faded hover-bg-danger-faded active-bg-danger-faded c-danger hover-c-danger active-c-danger b--danger hover-b-danger active-b-danger`

          weightDifference = (
            <div
              className={`mt6 pa3 br2 dib mr5 mv0 ba ${color} ${styles.height25}`}
            >
              {setWeight - totalWeight}kg
            </div>
          )

          distributionButton = (
            <div className={`ml6 mt6 flex flex-row ${styles.flex02}`}>
              <Button
                variation="primary"
                size="small"
                onClick={() => this.automaticWeightDistribution()}
              >
                {formatMessage({ id: messages.autoWeight.id })}
              </Button>
            </div>
          )
        } else {
          weightDifference = null
        }

        parcelsDropdown = (
          <div className={`mb4`}>
            <div className={`mb4`}>
              <Card>
                <div className={`mb4 mt4 flex flex-row ${styles.flex1}`}>
                  <div className={`flex flex-column ${styles.flex02}`}>
                    <Dropdown
                      label={formatMessage({ id: messages.numberParcels.id })}
                      options={qOptions}
                      onChange={(_, v) =>
                        this.changeNumberOfParcels(parseInt(v))
                      }
                      value={this.state.numberOfParcels}
                      disabled={this.state.posted}
                    />
                  </div>
                  <div className={`ml4 flex flex-column ${styles.flex02}`}>
                    <Input
                      type="number"
                      value={totalWeight}
                      onChange={e =>
                        this.changeTotalWeight(parseFloat(e.target.value))
                      }
                      min={0}
                      step={0.1}
                      label={formatMessage({ id: messages.totalWeight.id })}
                      disabled={this.state.posted}
                    />
                  </div>
                  <div className={`ml4 mt7 flex flex-column ${styles.flex05}`}>
                    <Checkbox
                      checked={this.state.shipmentPayment}
                      id="option-0"
                      label={formatMessage({
                        id: messages.recipientSupport.id,
                      })}
                      name="default-checkbox-group"
                      onChange={() => this.toggleShipmentPayment()}
                      value="option-0"
                      disabled={this.isPickupPointAddress()}
                    />
                  </div>
                </div>
                <div className={`mb4 mt4 flex flex-row`}>
                  <div className={`flex flex-row`}>
                    {weightObjects.map(item => {
                      return item
                    })}
                    {weightDifference}
                  </div>
                </div>
              </Card>
            </div>
            <div>{priceRatesSimulation}</div>
          </div>
        )

        button = (
          <Button
            onClick={() => this.requestAWB()}
            disabled={!this.state.canSubmit}
            isLoading={this.state.posted}
            variation="primary"
            block
          >
            {formatMessage({ id: messages.requestAwb.id })}
          </Button>
        )
        tagColor = 'orange'
        extraStatusMessage = ` - ${formatMessage({
          id: messages.requestAwb.id,
        })}`
      } else if (trackingNumber) {
        button = (
          <Button
            target="_blank"
            href={`/admin/checkout/#/orders/${order.orderId}`}
            variation="primary"
            block
          >
            {formatMessage({ id: messages.seeOrderDetails.id })}
          </Button>
        )
        steps = [completedStep, completedStep]
      }

      let displayTrackingNumber

      if (trackingNumber) {
        displayTrackingNumber = (
          <div>
            <p>
              {formatMessage({ id: messages.trackingNumberIs.id })}{' '}
              <span className={`${styles.bold}`}>{trackingNumber}</span>
            </p>
            <div className={`flex flex-row justify-center`}>
              <div className={`flex`}>
                <Button
                  onClick={event => this.printAWB(event)}
                  variation="primary"
                  size="small"
                >
                  {formatMessage({ id: messages.printLabel.id })}
                </Button>
              </div>
              <div className={`ml2 flex`}>
                <Dropdown
                  options={[
                    { value: 'A4', label: 'A4' },
                    { value: 'A6', label: 'A6' },
                  ]}
                  size="small"
                  onChange={(_, v) => this.setState({ format: v })}
                  value={this.state.format}
                />
              </div>
            </div>
          </div>
        )
      }

      let displayTrackinUrl

      if (trackingUrl) {
        displayTrackinUrl = (
          <a target="_blank" href={trackingUrl} rel="noreferrer">
            {trackingUrl}
          </a>
        )
      }

      let displayTrackingUpdate

      if (trackingNumber) {
        displayTrackingUpdate = (
          <div>
            <p>
              {formatMessage({ id: messages.awbStatus.id })}
              {': '} <span className={`${styles.bold}`}>{awbStatus}</span>
            </p>
            <Button
              onClick={() => this.getAWBHistory()}
              isLoading={this.state.posted}
              variation="primary"
              size="small"
            >
              {formatMessage({ id: messages.updateAwbStatus.id })}
            </Button>
          </div>
        )
      }

      return (
        <div className={`pa6 ${styles.flex05}`}>
          <Box
            title={`${formatMessage({ id: messages.order.id })}#${
              order.orderId
            }`}
          >
            <div className={`flex flex-row ${styles.flex1}`}>
              <div>
                <Tag bgColor={tagColor} color="#fff">
                  <span className="nowrap">
                    <FormattedMessageFixed id={messageId} />
                    {extraStatusMessage}
                  </span>
                </Tag>
              </div>
              <div className={`ml2`}>
                <Tag bgColor="green" color="#fff">
                  <span className={`nowrap`}>
                    {formatMessage({ id: messages.paymentMethod.id })} -{' '}
                    {
                      order.paymentData.transactions[0].payments[0]
                        .paymentSystemName
                    }
                  </span>
                </Tag>
              </div>
            </div>

            <div className={`mt4 ${styles.orderDetailsCard}`}>
              <Card>
                <div className={`flex flex-row ${styles.flex1}`}>
                  <div className={`flex flex-column ${styles.flex08}`}>
                    <div>
                      {order.items.map((item, i) => {
                        const qOptions = [] as any
                        const { sellingPrice } = item
                        const taxPrice = item.tax

                        const { weight } = item.additionalInfo.dimension
                        let { quantity } = item

                        if (item.id in this.state.changedItems) {
                          quantity += this.state.changedItems[item.id]
                          if (!quantity) {
                            return false
                          }
                        }

                        for (let i = 1; i <= quantity; i++) {
                          qOptions.push({ value: i, label: i })
                        }

                        totalWeight += weight * quantity
                        const { productsSpecs } = this.state

                        fetch(
                          `/api/catalog_system/pvt/products/${item.productId}/specification`
                        )
                          .then(res => res.json())
                          .then(json => {
                            const specs = json.reduce((result, item) => {
                              if (item.Value[0] !== '') {
                                result = (
                                  <div>
                                    {result}
                                    <span className={`${styles.productSpec}`}>
                                      {item.Name}: {item.Value[0]}
                                    </span>
                                  </div>
                                )
                              }

                              return result
                            }, null)

                            if (productsSpecs[item.productId] === undefined) {
                              productsSpecs[item.productId] = specs
                              quantityWeights[quantity] = weight * quantity
                              this.setState({ productsSpecs, quantityWeights })
                            }
                          })

                        return (
                          <div
                            key={i}
                            className={`pa2 flex flex-row ${styles.flex1}`}
                          >
                            <div className={`${styles.flex01}`}>
                              <img src={item.imageUrl} alt={'Image'} />
                            </div>

                            <div
                              className={`flex flex-column ${styles.flex05}`}
                            >
                              <span
                                className={`${styles.productInfo} ${styles.bold}`}
                              >
                                {formatMessage({ id: messages.productId.id })}
                                {': '} #{item.productId}
                              </span>
                              <span
                                className={`${styles.productInfo} ${styles.bold}`}
                              >
                                {formatMessage({ id: messages.skuRefCode.id })}
                                {': '} #{item.refId}
                              </span>
                              <span className={`${styles.productInfo}`}>
                                {item.name}
                              </span>
                              <span className={`${styles.productInfo}`}>
                                {formatMessage({ id: messages.weight.id })}
                                {': '} {weight}kg x {quantity}
                                {item.measurementUnit} = {weight * quantity}kg
                              </span>
                              <div className={`${styles.productInfo}`}>
                                {productsSpecs[item.productId] ? (
                                  <Collapsible
                                    header={
                                      <span>
                                        {formatMessage({
                                          id: messages.moreDetails.id,
                                        })}
                                      </span>
                                    }
                                    onClick={e =>
                                      this.collapse(
                                        item.productId,
                                        e.target.isOpen
                                      )
                                    }
                                    isOpen={
                                      collapsibles.hasOwnProperty(
                                        item.productId
                                      )
                                        ? collapsibles[item.productId]
                                        : false
                                    }
                                    caretColor="primary"
                                  >
                                    {productsSpecs[item.productId]}
                                  </Collapsible>
                                ) : null}
                              </div>
                              <span className={`${styles.productInfo}`}>
                                {quantity} {item.measurementUnit}
                              </span>
                              <span className={`${styles.productInfo}`}>
                                <FormattedCurrency
                                  value={
                                    (sellingPrice + taxPrice) /
                                    settings.constants.price_multiplier
                                  }
                                />
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div
                      className={`flex flex-column ${styles.orderDetailsTotals}`}
                    >
                      <span>
                        {formatMessage({ id: messages.shippingTotal.id })}
                        {': '}
                        <FormattedCurrency
                          value={shipping / settings.constants.price_multiplier}
                        />
                      </span>
                      {giftCards.map((item, i) => {
                        return (
                          <span key={i}>
                            {formatMessage({ id: messages.giftCard.id })}
                            {': '} <FormattedCurrency value={item.value} /> (
                            {item.code})
                          </span>
                        )
                      })}
                      <span>
                        {formatMessage({ id: messages.totalOrderValue.id })}
                        {': '}
                        <FormattedCurrency
                          value={
                            (orderValue + totalOrderDiscount) /
                            settings.constants.price_multiplier
                          }
                        />
                      </span>
                    </div>
                  </div>
                  <div className={`flex flex-column ${styles.flex03}`}>
                    <span
                      className={`${styles.shippingInfoTitle} ${styles.bold}`}
                    >
                      {formatMessage({ id: messages.shippingInformation.id })}
                    </span>
                    <span className={`${styles.shippingInfoText}`}>
                      {formatMessage({ id: messages.client.id })}
                      {': '} {order.shippingData.address.receiverName}
                    </span>
                    <span className={`${styles.shippingInfoText}`}>
                      {formatMessage({ id: messages.phone.id })}
                      {': '} {order.clientProfileData.phone}
                    </span>
                    {displayShippingInformation}
                    {displayCorporateInformation}
                  </div>
                </div>
              </Card>
            </div>

            <div className="mb4 mt4">
              {parcelsDropdown}
              {button}
            </div>

            <h1>{formatMessage({ id: messages.shippingStatus.id })}</h1>

            <div className={`mb4 mt4 ${styles.textCenter}`}>
              <h2>
                <FormattedMessageFixed id={messageId} />
              </h2>
            </div>

            <Progress type="steps" steps={steps} />

            <div className={`mb4 mt4 ${styles.textCenter}`}>
              <span>
                {formatMessage({ id: messages.theOrderIs.id })}{' '}
                <FormattedMessageFixed id={messageId} />
              </span>
            </div>

            <div className={`mb4 mt4 ${styles.textCenter}`}>
              {displayTrackingUpdate}
            </div>
            <div className={`mb4 mt4 ${styles.textCenter}`}>
              {displayTrackingNumber}
            </div>
            <div className={`mb4 mt4 ${styles.textCenter}`}>
              {displayTrackinUrl}
            </div>
          </Box>

          <Modal
            centered
            isOpen={this.state.modalOpen}
            onClose={this.closeModal}
            bottomBar={
              <div className="nowrap">
                <span className={`mr4`}>
                  <Button
                    variation="danger"
                    size="small"
                    onClick={this.closeModal}
                  >
                    {formatMessage({ id: messages.close.id })}
                  </Button>
                </span>
              </div>
            }
          >
            <div>
              <p className={`f3 f3-ns fw3 gray`}>
                {formatMessage({ id: messages.errors.id })}
              </p>
              <ul>
                {Object.keys(errors).map(function(key) {
                  if (errors[key].hasOwnProperty('details')) {
                    return errors[key].details.map(msg => {
                      return <li key={key}>{msg}</li>
                    })
                  }

                  return <li key={key}>{errors[key][0]}</li>
                })}
                {displayError}
              </ul>
            </div>
          </Modal>
        </div>
      )
    }

    return null
  }
}

export default OrderDetails
