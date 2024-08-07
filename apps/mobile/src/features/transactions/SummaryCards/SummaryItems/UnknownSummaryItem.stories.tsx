import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { Routing } from 'wallet/src/data/tradingApi/__generated__/index'
import TransactionSummaryLayout from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionSummaryLayout'
import { UnknownSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/UnknownSummaryItem'
import {
  ClassicTransactionDetails,
  TransactionStatus,
  TransactionType,
  UnknownTransactionInfo,
} from 'wallet/src/features/transactions/types'

const meta: Meta<typeof UnknownSummaryItem> = {
  title: 'WIP/Activity Items',
}

export default meta

const baseUnknownTx: Omit<ClassicTransactionDetails, 'status'> & {
  typeInfo: UnknownTransactionInfo
} = {
  routing: Routing.CLASSIC,
  from: '0x76e4de46c21603545eaaf7daf25e54c0d06bafa9',
  addedTime: Date.now() - 30000,
  hash: '0x3ba4b82fb3bcb237cff0180b4fb4f94902cde2cfa56c57567b59b5608590d077',
  id: '0x3ba4b82fb3bcb237cff0180b4fb4f94902cde2cfa56c57567b59b5608590d077',
  options: { request: {} },
  chainId: 1,
  typeInfo: {
    type: TransactionType.Unknown,
  },
}

export const Unknown: StoryObj = {
  render: () => (
    <>
      <UnknownSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseUnknownTx,
          status: TransactionStatus.Pending,
        }}
      />
      <UnknownSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseUnknownTx,
          status: TransactionStatus.Failed,
        }}
      />
      <UnknownSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseUnknownTx,
          status: TransactionStatus.Success,
        }}
      />
      <UnknownSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseUnknownTx,
          chainId: UniverseChainId.Optimism,
          status: TransactionStatus.Success,
        }}
      />
    </>
  ),
}
