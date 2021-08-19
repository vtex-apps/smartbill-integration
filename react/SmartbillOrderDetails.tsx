import type { FC } from 'react'
import React from 'react'
import { Layout, PageHeader } from 'vtex.styleguide'
import { useIntl } from 'react-intl'

import Details from './Details'

const SmartbillOrderDetails: FC = (props) => {
  const intl = useIntl()

  return (
    <Layout fullWidth pageHeader={<PageHeader title="Smartbill" />}>
       <Details data={props} intl={intl} />
    </Layout>
  )
}

export default SmartbillOrderDetails
