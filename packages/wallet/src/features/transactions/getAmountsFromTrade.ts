import { TradeType } from '@uniswap/sdk-core'
import {
  ConfirmedSwapTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  isConfirmedSwapTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'

export function getAmountsFromTrade(
  typeInfo: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo | ConfirmedSwapTransactionInfo,
): { inputCurrencyAmountRaw: string; outputCurrencyAmountRaw: string } {
  if (isConfirmedSwapTypeInfo(typeInfo)) {
    const { inputCurrencyAmountRaw, outputCurrencyAmountRaw } = typeInfo
    return { inputCurrencyAmountRaw, outputCurrencyAmountRaw }
  }

  return typeInfo.tradeType === TradeType.EXACT_OUTPUT
    ? {
        inputCurrencyAmountRaw: typeInfo.expectedInputCurrencyAmountRaw,
        outputCurrencyAmountRaw: typeInfo.outputCurrencyAmountRaw,
      }
    : {
        inputCurrencyAmountRaw: typeInfo.inputCurrencyAmountRaw,
        outputCurrencyAmountRaw: typeInfo.expectedOutputCurrencyAmountRaw,
      }
}
