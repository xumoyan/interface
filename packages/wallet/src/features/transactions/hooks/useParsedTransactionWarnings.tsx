import { useMemo } from 'react'
import { isWeb } from 'ui/src'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import {
  Warning,
  WarningAction,
  WarningColor,
  WarningLabel,
  WarningSeverity,
} from 'uniswap/src/features/transactions/WarningModal/types'
import { ParsedWarnings, WarningWithStyle } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useSwapFormContext } from 'wallet/src/features/transactions/contexts/SwapFormContext'
import { useSwapTxContext } from 'wallet/src/features/transactions/contexts/SwapTxContext'
import { isPriceImpactWarning, useSwapWarnings } from 'wallet/src/features/transactions/hooks/useSwapWarnings'
import { useTransactionGasWarning } from 'wallet/src/features/transactions/hooks/useTransactionGasWarning'

export function useParsedSwapWarnings(): ParsedWarnings {
  const account = useAccountMeta()
  const { derivedSwapInfo } = useSwapFormContext()
  const { gasFee } = useSwapTxContext()

  const swapWarnings = useSwapWarnings(derivedSwapInfo)

  const gasWarning = useTransactionGasWarning({
    account,
    derivedInfo: derivedSwapInfo,
    gasFee: gasFee.value,
  })

  const allWarnings = useMemo(() => {
    return !gasWarning ? swapWarnings : [...swapWarnings, gasWarning]
  }, [gasWarning, swapWarnings])

  return useFormattedWarnings(allWarnings)
}

/**
 * TODO: we need to accept warnings as a prop because some send logic exists outside wallet package.
 * When we move the useTransferContext hook to shared package refactor this hook to format warnings internally
 * and remove props.
 *
 * MOB-2563: https://linear.app/uniswap/issue/MOB-2563/consolidate-all-transfer-state-ext-mob
 */
export function useParsedSendWarnings(allSendWarnings: Warning[]): ParsedWarnings {
  return useFormattedWarnings(allSendWarnings)
}

// Format an array of warnings into the ParsedWarnings type
function useFormattedWarnings(warnings: Warning[]): ParsedWarnings {
  return useMemo(() => {
    const blockingWarning = warnings.find(
      (warning) => warning.action === WarningAction.DisableReview || warning.action === WarningAction.DisableSubmit,
    )

    const insufficientBalanceWarning = warnings.find((warning) => warning.type === WarningLabel.InsufficientFunds)
    const insufficientGasFundsWarning = warnings.find((warning) => warning.type === WarningLabel.InsufficientGasFunds)
    const priceImpactWarning = warnings.find((warning) => isPriceImpactWarning(warning))

    return {
      blockingWarning,
      insufficientBalanceWarning,
      insufficientGasFundsWarning,
      priceImpactWarning,
      formScreenWarning: getFormScreenWarning(warnings),
      reviewScreenWarning: getReviewScreenWarning(warnings),
      warnings,
    }
  }, [warnings])
}

function getReviewScreenWarning(warnings: Warning[]): ParsedWarnings['reviewScreenWarning'] | undefined {
  const reviewWarning = warnings.find((warning) => warning.severity >= WarningSeverity.Medium)

  if (!reviewWarning) {
    return undefined
  }

  return getWarningWithStyle({ warning: reviewWarning, displayedInline: true })
}

// This function decides which warning to show when there is more than one.
function getFormScreenWarning(warnings: Warning[]): ParsedWarnings['reviewScreenWarning'] | undefined {
  const insufficientBalanceWarning = warnings.find((warning) => warning.type === WarningLabel.InsufficientFunds)

  if (insufficientBalanceWarning) {
    return {
      warning: insufficientBalanceWarning,
      color: getAlertColor(WarningSeverity.Medium),
      Icon: null,
      displayedInline: !isWeb,
    }
  }

  const formWarning = warnings.find(
    (warning) => warning.type === WarningLabel.InsufficientFunds || warning.severity >= WarningSeverity.Low,
  )

  if (!formWarning) {
    return undefined
  }

  return getWarningWithStyle({
    warning: formWarning,
    displayedInline:
      formWarning.type !== WarningLabel.InsufficientGasFunds && (!isWeb || !isPriceImpactWarning(formWarning)),
  })
}

function getAlertColor(severity?: WarningSeverity): WarningColor {
  switch (severity) {
    case WarningSeverity.None:
      return {
        text: '$neutral2',
        background: '$neutral2',
        buttonTheme: 'secondary',
      }
    case WarningSeverity.Low:
      return {
        text: '$neutral2',
        background: '$surface2',
        buttonTheme: 'tertiary',
      }
    case WarningSeverity.High:
      return {
        text: '$statusCritical',
        background: '$DEP_accentCriticalSoft',
        buttonTheme: 'detrimental',
      }
    case WarningSeverity.Medium:
      return {
        text: '$statusCritical',
        background: '$DEP_accentWarningSoft',
        buttonTheme: 'warning',
      }
    default:
      return {
        text: '$neutral2',
        background: '$transparent',
        buttonTheme: 'tertiary',
      }
  }
}

function getWarningWithStyle({
  warning,
  displayedInline,
}: {
  warning: Warning
  displayedInline: boolean
}): WarningWithStyle {
  return {
    warning,
    displayedInline,
    color: getAlertColor(warning.severity),
    Icon: warning.icon ?? null,
  }
}
