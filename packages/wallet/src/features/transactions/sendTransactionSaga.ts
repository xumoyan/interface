import { providers } from 'ethers'
import { call, put } from 'typed-redux-saga'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { AccountMeta, AccountType } from 'uniswap/src/features/accounts/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { transactionActions } from 'uniswap/src/features/transactions/slice'
import {
  TransactionDetails,
  TransactionOptions,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { RPCType, WalletChainId } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'
import { getBaseTradeAnalyticsProperties } from 'wallet/src/features/transactions/swap/analytics'
import { createTransactionId, getSerializableTransactionRequest } from 'wallet/src/features/transactions/utils'
import { getProvider, getSignerManager } from 'wallet/src/features/wallet/context'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'
import { hexlifyTransaction } from 'wallet/src/utils/transaction'

export interface SendTransactionParams {
  // internal id used for tracking transactions before they're submitted
  // this is optional as an override in txDetail.id calculation
  txId?: string
  chainId: WalletChainId
  account: AccountMeta
  options: TransactionOptions
  typeInfo: TransactionTypeInfo
  transactionOriginType: TransactionOriginType
  analytics?: ReturnType<typeof getBaseTradeAnalyticsProperties>
}

// A utility for sagas to send transactions
// All outgoing transactions should go through here

export function* sendTransaction(params: SendTransactionParams) {
  const { chainId, account, options } = params
  const request = options.request

  logger.debug('sendTransaction', '', `Sending tx on ${UNIVERSE_CHAIN_INFO[chainId].label} to ${request.to}`)

  if (account.type === AccountType.Readonly) {
    throw new Error('Account must support signing')
  }

  // Sign and send the transaction
  const rpcType = options.submitViaPrivateRpc ? RPCType.Private : RPCType.Public
  const provider = yield* call(getProvider, chainId, rpcType)
  const signerManager = yield* call(getSignerManager)
  const { transactionResponse, populatedRequest } = yield* call(
    signAndSendTransaction,
    request,
    account,
    provider,
    signerManager,
  )
  logger.debug('sendTransaction', '', 'Tx submitted:', transactionResponse.hash)

  // Register the tx in the store
  yield* call(addTransaction, params, transactionResponse.hash, populatedRequest)
  return { transactionResponse }
}

export async function signAndSendTransaction(
  request: providers.TransactionRequest,
  account: AccountMeta,
  provider: providers.Provider,
  signerManager: SignerManager,
): Promise<{
  transactionResponse: providers.TransactionResponse
  populatedRequest: providers.TransactionRequest
}> {
  const signer = await signerManager.getSignerForAccount(account)
  const connectedSigner = signer.connect(provider)
  const hexRequest = hexlifyTransaction(request)
  const populatedRequest = await connectedSigner.populateTransaction(hexRequest)
  const signedTx = await connectedSigner.signTransaction(populatedRequest)
  const transactionResponse = await provider.sendTransaction(signedTx)
  return { transactionResponse, populatedRequest }
}

function* addTransaction(
  { chainId, typeInfo, account, options, txId, analytics, transactionOriginType }: SendTransactionParams,
  hash: string,
  populatedRequest: providers.TransactionRequest,
) {
  const id = txId ?? createTransactionId()
  const request = getSerializableTransactionRequest(populatedRequest, chainId)

  const transaction: TransactionDetails = {
    routing: Routing.CLASSIC,
    id,
    chainId,
    hash,
    typeInfo,
    from: account.address,
    addedTime: Date.now(),
    status: TransactionStatus.Pending,
    options: {
      ...options,
      request,
    },
    transactionOriginType,
  }

  if (transaction.typeInfo.type === TransactionType.Swap) {
    if (!analytics) {
      // Don't expect swaps from WC or Dapps to always provide analytics object
      if (transactionOriginType === TransactionOriginType.Internal) {
        logger.error(new Error('Missing `analytics` for swap when calling `addTransaction`'), {
          tags: { file: 'sendTransaction', function: 'addTransaction' },
          extra: { transaction },
        })
      }
    } else {
      yield* call(sendAnalyticsEvent, WalletEventName.SwapSubmitted, {
        routing: transaction.routing,
        transaction_hash: hash,
        ...analytics,
      })
    }
  }
  yield* put(transactionActions.addTransaction(transaction))
  logger.debug('sendTransaction', 'addTransaction', 'Tx added:', { chainId, ...typeInfo })
}
