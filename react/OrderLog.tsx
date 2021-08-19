import React, { Component } from 'react'
import { Table, Box, Tag, Modal, Button, ButtonPlain } from 'vtex.styleguide'
import PropTypes from 'prop-types'
import { defineMessages } from 'react-intl'

const messages = defineMessages({
  errorLog: { id: 'admin/order.error-log' },
  data: { id: 'admin/order.data' },
  source: { id: 'admin/order.source' },
  message: { id: 'admin/order.message' },
  details: { id: 'admin/order.details' },
  close: { id: 'admin/order.close' },
})

export default class OrderLog extends Component<any, any> {
  static propTypes = {
    intl: PropTypes.object,
    order: PropTypes.object,
    getLogItems: PropTypes.func,
  }

  constructor(props: any) {
    super(props)
    this.state = {
      order: this.props.order,
      displayErrorMessage: null,
      modalOpen: false,
    }

    this.closeModal = this.closeModal.bind(this)
    this.openModal = this.openModal.bind(this)
  }

  private getSchema() {
    const { formatMessage } = this.props.intl

    return {
      properties: {
        createdIn: {
          title: formatMessage({ id: messages.data.id }),
          cellRenderer: ({ cellData }) => {
            return new Intl.DateTimeFormat('en-GB', {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              second: 'numeric',
            }).format(new Date(cellData))
          },
        },
        source: {
          title: formatMessage({ id: messages.source.id }),
          cellRenderer: ({ rowData }) => {
            return <Tag type="error">{rowData.data.error.source}</Tag>
          },
        },
        message: {
          title: formatMessage({ id: messages.message.id }),
          cellRenderer: ({ rowData }) => {
            return (
              <ButtonPlain
                onClick={() =>
                  this.openModal(
                    rowData.data.error.message,
                    new Intl.DateTimeFormat('en-GB', {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                      second: 'numeric',
                    }).format(new Date(rowData.createdIn)),
                    rowData.data.error.source
                  )
                }
              >
                {formatMessage({ id: messages.details.id })}
              </ButtonPlain>
            )
          },
        },
      },
    }
  }

  closeModal() {
    this.setState({
      modalOpen: false,
      displayErrorMessage: null,
      displayErrorDate: null,
      displayErrorType: null,
    })
  }

  openModal(message, date, type) {
    this.setState({
      modalOpen: true,
      displayErrorMessage: message,
      displayErrorDate: date,
      displayErrorType: type,
    })
  }

  public render() {
    const { formatMessage } = this.props.intl

    return (
      <div className={`pa6`}>
        <Box title={`${formatMessage({ id: messages.errorLog.id })}`}>
          <Table
            fullWidth
            density="high"
            disableHeader
            loading={this.props.tableIsLoading}
            items={this.props.log}
            schema={this.getSchema()}
          />
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
              <Tag type="error">{this.state.displayErrorType}</Tag>{' '}
              {this.state.displayErrorDate}
            </p>
            <ul>{this.state.displayErrorMessage}</ul>
          </div>
        </Modal>
      </div>
    )
  }
}
