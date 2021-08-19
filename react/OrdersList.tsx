import type { FC } from 'react'
import React from 'react'
import { Layout, PageBlock, PageHeader } from 'vtex.styleguide'
import { useIntl } from 'react-intl'

import OrdersTable from './OrdersTable'

const OrdersList: FC = () => {
  const intl = useIntl()

  return (
    <Layout fullWidth pageHeader={<PageHeader title="Smartbill" />}>
      <PageBlock variation="full">
        <OrdersTable intl={intl} />
      </PageBlock>
    </Layout>
  )
}

export default OrdersList
