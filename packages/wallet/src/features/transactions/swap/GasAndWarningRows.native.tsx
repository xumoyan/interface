import { useCallback, useState } from 'react'
import { Keyboard } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { Flex, Text, TouchableArea, useIsShortMobileDevice, useMedia } from 'ui/src'
import { Gas } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes } from 'ui/src/theme'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'
import { UniswapXFee } from 'wallet/src/components/network/NetworkFee'
import { useFormattedUniswapXGasFeeInfo } from 'wallet/src/components/network/hooks'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { InsufficientNativeTokenWarning } from 'wallet/src/features/transactions/InsufficientNativeTokenWarning/InsufficientNativeTokenWarning'
import { useSwapFormContext } from 'wallet/src/features/transactions/contexts/SwapFormContext'
import { useSwapTxContext } from 'wallet/src/features/transactions/contexts/SwapTxContext'
import { useParsedSwapWarnings } from 'wallet/src/features/transactions/hooks/useParsedTransactionWarnings'
import { GasAndWarningRowsProps } from 'wallet/src/features/transactions/swap/GasAndWarningRowsProps'
import { SwapWarningModal } from 'wallet/src/features/transactions/swap/SwapWarningModal'
import { useGasFeeHighRelativeToValue } from 'wallet/src/features/transactions/swap/hooks/useGasFeeHighRelativeToValue'
import { NetworkFeeWarning } from 'wallet/src/features/transactions/swap/modals/NetworkFeeWarning'
import { BlockedAddressWarning } from 'wallet/src/features/trm/BlockedAddressWarning'
import { useIsBlocked } from 'wallet/src/features/trm/hooks'

export function GasAndWarningRows({ renderEmptyRows }: GasAndWarningRowsProps): JSX.Element {
  const isShort = useMedia().short
  const isShortMobileDevice = useIsShortMobileDevice()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const account = useAccountMeta()
  const swapTxContext = useSwapTxContext()
  const { gasFee } = swapTxContext
  const { derivedSwapInfo } = useSwapFormContext()

  const { chainId, currencyAmountsUSDValue } = derivedSwapInfo
  const inputUSDValue = currencyAmountsUSDValue[CurrencyField.INPUT]
  const outputUSDValue = currencyAmountsUSDValue[CurrencyField.OUTPUT]

  const [showWarningModal, setShowWarningModal] = useState(false)

  const { isBlocked } = useIsBlocked(account?.address)

  const { formScreenWarning, insufficientGasFundsWarning, warnings } = useParsedSwapWarnings()
  const showFormWarning = formScreenWarning && formScreenWarning.displayedInline && !isBlocked

  const gasFeeUSD = useUSDValue(chainId, gasFee?.value)
  const gasFeeFormatted = convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatGasPrice)

  const uniswapXGasFeeInfo = useFormattedUniswapXGasFeeInfo(
    isUniswapX(swapTxContext) ? swapTxContext.gasFeeBreakdown : undefined,
    chainId,
  )

  // only show the gas fee icon and price if we have a valid fee
  const showGasFee = Boolean(gasFeeUSD)

  const onSwapWarningClick = useCallback(() => {
    if (!formScreenWarning?.warning.message) {
      // Do not show the modal if the warning doesn't have a message.
      return
    }

    Keyboard.dismiss()
    setShowWarningModal(true)
  }, [formScreenWarning?.warning.message])

  const gasFeeHighRelativeToValue = useGasFeeHighRelativeToValue(gasFeeUSD, outputUSDValue ?? inputUSDValue)
  const gasColor = gasFeeHighRelativeToValue ? '$statusCritical' : '$neutral2'

  return (
    <>
      {formScreenWarning && (
        <SwapWarningModal
          isOpen={showWarningModal}
          parsedWarning={formScreenWarning}
          onClose={(): void => setShowWarningModal(false)}
        />
      )}

      {/*
        Do not add any margins directly to this container, as this component is used in 2 different places.
        Adjust the margin in the parent component instead.
      */}
      <Flex gap={isShortMobileDevice ? '$spacing2' : isShort ? '$spacing8' : '$spacing16'}>
        {isBlocked && (
          // TODO: review design of this warning.
          <BlockedAddressWarning
            row
            alignItems="center"
            alignSelf="stretch"
            backgroundColor="$surface2"
            borderBottomLeftRadius="$rounded16"
            borderBottomRightRadius="$rounded16"
            flexGrow={1}
            px="$spacing16"
            py="$spacing12"
          />
        )}

        <Flex centered row>
          {showGasFee && (
            <NetworkFeeWarning
              gasFeeHighRelativeToValue={gasFeeHighRelativeToValue}
              tooltipTrigger={null}
              uniswapXGasFeeInfo={uniswapXGasFeeInfo}
            >
              <AnimatedFlex centered row entering={FadeIn} gap="$spacing4">
                {uniswapXGasFeeInfo ? (
                  <UniswapXFee
                    gasFee={gasFeeFormatted}
                    preSavingsGasFee={uniswapXGasFeeInfo.preSavingsGasFeeFormatted}
                  />
                ) : (
                  <>
                    <Gas color={gasColor} size="$icon.16" />
                    <Text color={gasColor} variant="body3">
                      {gasFeeFormatted}
                    </Text>
                  </>
                )}
              </AnimatedFlex>
            </NetworkFeeWarning>
          )}
        </Flex>

        {showFormWarning && (
          <TouchableArea onPress={onSwapWarningClick}>
            <AnimatedFlex centered row entering={FadeIn} exiting={FadeOut} gap="$spacing8" px="$spacing24">
              {formScreenWarning.Icon && (
                <formScreenWarning.Icon
                  color={formScreenWarning.color.text}
                  size={iconSizes.icon16}
                  strokeWidth={1.5}
                />
              )}
              <Flex row>
                <Text color={formScreenWarning.color.text} textAlign="center" variant="body3">
                  {formScreenWarning.warning.title}
                </Text>
              </Flex>
            </AnimatedFlex>
          </TouchableArea>
        )}

        <InsufficientNativeTokenWarning flow="swap" gasFee={gasFee} warnings={warnings} />

        {/*
        When there is no gas or no warning, we render an empty row to keep the layout consistent when calculating the container height.
        This is used when calculating the size of the `DecimalPad`.
        */}

        {!gasFeeUSD && renderEmptyRows && <EmptyRow />}
        {!showFormWarning && !insufficientGasFundsWarning && renderEmptyRows && <EmptyRow />}
      </Flex>
    </>
  )
}

function EmptyRow(): JSX.Element {
  return (
    <Flex centered gap="$spacing8" height={iconSizes.icon16}>
      <Text variant="body3"> </Text>
    </Flex>
  )
}
