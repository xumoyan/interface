import { useNavigation } from '@react-navigation/core'
import { default as React, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ListRenderItemInfo, SectionList, StyleSheet } from 'react-native'
import { FadeInDown, FadeOutUp } from 'react-native-reanimated'
import { SvgProps } from 'react-native-svg'
import { useDispatch } from 'react-redux'
import {
  OnboardingStackNavigationProp,
  SettingsStackNavigationProp,
  useSettingsStackNavigation,
} from 'src/app/navigation/types'
import {
  SettingsRow,
  SettingsSection,
  SettingsSectionItem,
  SettingsSectionItemComponent,
} from 'src/components/Settings/SettingsRow'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { APP_FEEDBACK_LINK } from 'src/constants/urls'
import { useBiometricContext } from 'src/features/biometrics/context'
import { useBiometricName, useDeviceSupportsBiometricAuth } from 'src/features/biometrics/hooks'
import { useWalletRestore } from 'src/features/wallet/hooks'
import { getFullAppVersion } from 'src/utils/version'
import { Button, Flex, IconProps, Text, TouchableArea, useDeviceInsets, useIsDarkMode, useSporeColors } from 'ui/src'
import { AVATARS_DARK, AVATARS_LIGHT } from 'ui/src/assets'
import BookOpenIcon from 'ui/src/assets/icons/book-open.svg'
import ContrastIcon from 'ui/src/assets/icons/contrast.svg'
import FaceIdIcon from 'ui/src/assets/icons/faceid.svg'
import FingerprintIcon from 'ui/src/assets/icons/fingerprint.svg'
import LockIcon from 'ui/src/assets/icons/lock.svg'
import MessageQuestion from 'ui/src/assets/icons/message-question.svg'
import UniswapIcon from 'ui/src/assets/icons/uniswap-logo.svg'
import {
  Chart,
  Coins,
  Feedback,
  Key,
  Language,
  LineChartDots,
  OSDynamicCloudIcon,
  RotatableChevron,
  ShieldQuestion,
} from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes, spacing } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { getCloudProviderName } from 'uniswap/src/utils/cloud-backup/getCloudProviderName'
import { isAndroid } from 'utilities/src/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { useCurrentAppearanceSetting } from 'wallet/src/features/appearance/hooks'
import { useAppFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import { useCurrentLanguageInfo } from 'wallet/src/features/language/hooks'
import { AccountType, BackupType, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import {
  useAccounts,
  useHideSmallBalancesSetting,
  useHideSpamTokensSetting,
  useSignerAccounts,
} from 'wallet/src/features/wallet/hooks'
import {
  resetWallet,
  setFinishedOnboarding,
  setHideSmallBalances,
  setHideSpamTokens,
} from 'wallet/src/features/wallet/slice'

export function SettingsScreen(): JSX.Element {
  const navigation = useNavigation<SettingsStackNavigationProp & OnboardingStackNavigationProp>()
  const dispatch = useDispatch()
  const colors = useSporeColors()
  const insets = useDeviceInsets()
  const { deviceSupportsBiometrics } = useBiometricContext()
  const { t } = useTranslation()

  const currencyConversionEnabled = useFeatureFlag(FeatureFlags.CurrencyConversion)

  // check if device supports biometric authentication, if not, hide option
  const { touchId: isTouchIdSupported, faceId: isFaceIdSupported } = useDeviceSupportsBiometricAuth()

  const biometricsMethod = useBiometricName(isTouchIdSupported)
  const currentAppearanceSetting = useCurrentAppearanceSetting()
  const currentFiatCurrencyInfo = useAppFiatCurrencyInfo()
  const { originName: currentLanguage } = useCurrentLanguageInfo()

  const hideSmallBalances = useHideSmallBalancesSetting()
  const onToggleHideSmallBalances = useCallback(() => {
    dispatch(setHideSmallBalances(!hideSmallBalances))
  }, [dispatch, hideSmallBalances])

  const hideSpamTokens = useHideSpamTokensSetting()
  const onToggleHideSpamTokens = useCallback(() => {
    dispatch(setHideSpamTokens(!hideSpamTokens))
  }, [dispatch, hideSpamTokens])

  // Signer account info
  const signerAccount = useSignerAccounts()[0]
  // We sync backup state across all accounts under the same mnemonic, so can check status with any account.
  const hasCloudBackup = signerAccount?.backups?.includes(BackupType.Cloud)
  const noSignerAccountImported = !signerAccount
  const { walletNeedsRestore } = useWalletRestore()

  const sections: SettingsSection[] = useMemo((): SettingsSection[] => {
    const svgProps: SvgProps = {
      color: colors.neutral2.get(),
      height: iconSizes.icon24,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeWidth: '2',
      width: iconSizes.icon24,
    }
    const iconProps: IconProps = {
      color: '$neutral2',
      size: '$icon.24',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }

    // Defining them inline instead of outside component b.c. they need t()
    return [
      {
        subTitle: t('settings.section.preferences'),
        data: [
          {
            screen: MobileScreens.SettingsAppearance,
            text: t('settings.setting.appearance.title'),
            currentSetting:
              currentAppearanceSetting === 'system'
                ? t('settings.setting.appearance.option.device.title')
                : currentAppearanceSetting === 'dark'
                  ? t('settings.setting.appearance.option.dark.title')
                  : t('settings.setting.appearance.option.light.title'),
            icon: <ContrastIcon {...svgProps} />,
          },

          ...(currencyConversionEnabled
            ? ([
                {
                  modal: ModalName.FiatCurrencySelector,
                  text: t('settings.setting.currency.title'),
                  currentSetting: currentFiatCurrencyInfo.code,
                  icon: <Coins {...iconProps} />,
                },
              ] as SettingsSectionItem[])
            : []),
          {
            modal: ModalName.LanguageSelector,
            text: t('settings.setting.language.title'),
            currentSetting: currentLanguage,
            icon: <Language {...iconProps} />,
          },
          {
            text: t('settings.setting.smallBalances.title'),
            icon: <Chart {...iconProps} />,
            isToggleEnabled: hideSmallBalances,
            onToggle: onToggleHideSmallBalances,
          },
          {
            text: t('settings.setting.unknownTokens.title'),
            icon: <ShieldQuestion {...iconProps} />,
            isToggleEnabled: hideSpamTokens,
            onToggle: onToggleHideSpamTokens,
          },
          {
            screen: MobileScreens.SettingsPrivacy,
            text: t('settings.setting.privacy.title'),
            icon: <LineChartDots {...iconProps} />,
          },
          // @TODO: [MOB-250] add back testnet toggle once we support testnets
        ],
      },
      {
        subTitle: t('settings.section.security'),
        isHidden: noSignerAccountImported,
        data: [
          ...(deviceSupportsBiometrics
            ? [
                {
                  screen: MobileScreens.SettingsBiometricAuth as MobileScreens.SettingsBiometricAuth,
                  isHidden: !isTouchIdSupported && !isFaceIdSupported,
                  text: isAndroid ? t('settings.setting.biometrics.title') : biometricsMethod,
                  icon: isTouchIdSupported ? <FingerprintIcon {...svgProps} /> : <FaceIdIcon {...svgProps} />,
                },
              ]
            : []),
          {
            screen: MobileScreens.SettingsViewSeedPhrase,
            text: t('settings.setting.recoveryPhrase.title'),
            icon: <Key {...iconProps} />,
            screenProps: { address: signerAccount?.address ?? '', walletNeedsRestore },
            isHidden: noSignerAccountImported,
          },
          {
            screen: walletNeedsRestore
              ? MobileScreens.OnboardingStack
              : hasCloudBackup
                ? MobileScreens.SettingsCloudBackupStatus
                : MobileScreens.SettingsCloudBackupPasswordCreate,
            screenProps: walletNeedsRestore
              ? {
                  screen: OnboardingScreens.RestoreCloudBackupLoading,
                  params: {
                    entryPoint: OnboardingEntryPoint.Sidebar,
                    importType: ImportType.Restore,
                  },
                }
              : { address: signerAccount?.address ?? '' },
            text: t('settings.setting.backup.selected', {
              cloudProviderName: getCloudProviderName(),
            }),
            icon: <OSDynamicCloudIcon color="$neutral2" size="$icon.24" />,
            isHidden: noSignerAccountImported,
          },
        ],
      },
      {
        subTitle: t('settings.section.support'),
        data: [
          {
            screen: MobileScreens.WebView,
            screenProps: {
              uriLink: APP_FEEDBACK_LINK,
              headerTitle: t('settings.action.feedback'),
            },
            text: t('settings.action.feedback'),
            icon: <Feedback color="$neutral2" size="$icon.24" />,
          },
          {
            screen: MobileScreens.WebView,
            screenProps: {
              uriLink: uniswapUrls.helpUrl,
              headerTitle: t('settings.action.help'),
            },
            text: t('settings.action.help'),
            icon: <MessageQuestion {...svgProps} />,
          },
        ],
      },
      {
        subTitle: t('settings.section.about'),
        data: [
          {
            screen: MobileScreens.WebView,
            screenProps: {
              uriLink: uniswapUrls.privacyPolicyUrl,
              headerTitle: t('settings.action.privacy'),
            },
            text: t('settings.action.privacy'),
            icon: <LockIcon {...svgProps} />,
          },
          {
            screen: MobileScreens.WebView,
            screenProps: {
              uriLink: uniswapUrls.termsOfServiceUrl,
              headerTitle: t('settings.action.terms'),
            },
            text: t('settings.action.terms'),
            icon: <BookOpenIcon {...svgProps} />,
          },
        ],
      },
      {
        subTitle: 'Developer settings',
        isHidden: !__DEV__,
        data: [
          {
            screen: MobileScreens.Dev,
            text: 'Dev options',
            icon: <UniswapIcon {...svgProps} />,
          },
          { component: <OnboardingRow iconProps={svgProps} /> },
        ],
      },
    ]
  }, [
    colors.neutral2,
    t,
    currentAppearanceSetting,
    currencyConversionEnabled,
    currentFiatCurrencyInfo.code,
    currentLanguage,
    hideSmallBalances,
    onToggleHideSmallBalances,
    hideSpamTokens,
    onToggleHideSpamTokens,
    noSignerAccountImported,
    deviceSupportsBiometrics,
    isTouchIdSupported,
    isFaceIdSupported,
    biometricsMethod,
    signerAccount?.address,
    walletNeedsRestore,
    hasCloudBackup,
  ])

  const renderItem = ({
    item,
  }: ListRenderItemInfo<SettingsSectionItem | SettingsSectionItemComponent>): JSX.Element | null => {
    if (item.isHidden) {
      return null
    }
    if ('component' in item) {
      return item.component
    }
    return <SettingsRow key={item.screen} navigation={navigation} page={item} />
  }

  return (
    <HeaderScrollScreen alwaysShowCenterElement centerElement={<Text variant="body1">{t('settings.title')}</Text>}>
      <Flex pb={insets.bottom - spacing.spacing16} pt="$spacing12" px="$spacing24">
        <SectionList
          ItemSeparatorComponent={renderItemSeparator}
          ListFooterComponent={<FooterSettings />}
          ListHeaderComponent={<WalletSettings />}
          initialNumToRender={20}
          keyExtractor={(_item, index): string => 'settings' + index}
          renderItem={renderItem}
          renderSectionFooter={(): JSX.Element => <Flex pt="$spacing24" />}
          renderSectionHeader={({ section: { subTitle } }): JSX.Element => (
            <Flex backgroundColor="$surface1" py="$spacing12">
              <Text color="$neutral2" variant="body1">
                {subTitle}
              </Text>
            </Flex>
          )}
          sections={sections.filter((p) => !p.isHidden)}
          showsVerticalScrollIndicator={false}
        />
      </Flex>
    </HeaderScrollScreen>
  )
}

const renderItemSeparator = (): JSX.Element => <Flex pt="$spacing8" />

function OnboardingRow({ iconProps }: { iconProps: SvgProps }): JSX.Element {
  const dispatch = useDispatch()
  const navigation = useSettingsStackNavigation()

  return (
    <TouchableArea
      onPress={(): void => {
        navigation.goBack()
        dispatch(resetWallet())
        dispatch(setFinishedOnboarding({ finishedOnboarding: false }))
      }}
    >
      <Flex row alignItems="center" justifyContent="space-between" py="$spacing4">
        <Flex row alignItems="center">
          <Flex centered height={32} width={32}>
            <UniswapIcon {...iconProps} />
          </Flex>
          <Text ml="$spacing12" variant="body1">
            Onboarding
          </Text>
        </Flex>
        <RotatableChevron color="$neutral3" direction="end" height={iconSizes.icon24} width={iconSizes.icon24} />
      </Flex>
    </TouchableArea>
  )
}

const DEFAULT_ACCOUNTS_TO_DISPLAY = 6

function WalletSettings(): JSX.Element {
  const { t } = useTranslation()
  const navigation = useSettingsStackNavigation()
  const addressToAccount = useAccounts()
  const [showAll, setShowAll] = useState(false)

  const allAccounts = useMemo(() => {
    const accounts = Object.values(addressToAccount)
    const _mnemonicWallets = accounts
      .filter((a): a is SignerMnemonicAccount => a.type === AccountType.SignerMnemonic)
      .sort((a, b) => {
        return a.derivationIndex - b.derivationIndex
      })
    const _viewOnlyWallets = accounts
      .filter((a) => a.type === AccountType.Readonly)
      .sort((a, b) => {
        return a.timeImportedMs - b.timeImportedMs
      })
    return [..._mnemonicWallets, ..._viewOnlyWallets]
  }, [addressToAccount])

  const toggleViewAll = (): void => {
    setShowAll(!showAll)
  }

  const handleNavigation = (address: string): void => {
    navigation.navigate(MobileScreens.SettingsWallet, { address })
  }

  return (
    <Flex mb="$spacing16">
      <Flex row justifyContent="space-between">
        <Text color="$neutral2" variant="body1">
          {t('settings.section.wallet.title')}
        </Text>
      </Flex>
      {allAccounts.slice(0, showAll ? allAccounts.length : DEFAULT_ACCOUNTS_TO_DISPLAY).map((account) => {
        const isViewOnlyWallet = account.type === AccountType.Readonly

        return (
          <TouchableArea
            key={account.address}
            pl="$spacing4"
            py="$spacing12"
            onPress={(): void => handleNavigation(account.address)}
          >
            <Flex row alignItems="center" justifyContent="space-between">
              <AddressDisplay
                showIconBackground
                address={account.address}
                captionVariant="subheading2"
                showViewOnlyBadge={isViewOnlyWallet}
                showViewOnlyLabel={isViewOnlyWallet}
                size={iconSizes.icon40}
                variant="body1"
              />
              <RotatableChevron color="$neutral3" direction="end" height={iconSizes.icon24} width={iconSizes.icon24} />
            </Flex>
          </TouchableArea>
        )
      })}
      {allAccounts.length > DEFAULT_ACCOUNTS_TO_DISPLAY && (
        <Button theme="tertiary" onPress={toggleViewAll}>
          <Text color="$neutral1" variant="buttonLabel4">
            {showAll ? t('settings.section.wallet.button.viewLess') : t('settings.section.wallet.button.viewAll')}
          </Text>
        </Button>
      )}
    </Flex>
  )
}

function FooterSettings(): JSX.Element {
  const { t } = useTranslation()
  const [showSignature, setShowSignature] = useState(false)
  const isDarkMode = useIsDarkMode()

  // Fade out signature after duration
  useTimeout(
    showSignature
      ? (): void => {
          setShowSignature(false)
        }
      : (): void => undefined,
    SIGNATURE_VISIBLE_DURATION,
  )

  return (
    <Flex gap="$spacing12">
      {showSignature ? (
        <AnimatedFlex alignItems="center" entering={FadeInDown} exiting={FadeOutUp} gap="$none" mt="$spacing16">
          <Flex gap="$spacing4">
            <Text color="$neutral3" textAlign="center" variant="body2">
              {t('settings.footer')}
            </Text>
          </Flex>
          {isDarkMode ? (
            <Image source={AVATARS_DARK} style={ImageStyles.responsiveImage} />
          ) : (
            <Image source={AVATARS_LIGHT} style={ImageStyles.responsiveImage} />
          )}
        </AnimatedFlex>
      ) : null}
      <Text
        color="$neutral3"
        mt="$spacing8"
        pb="$spacing24"
        variant="body2"
        onLongPress={(): void => {
          setShowSignature(true)
        }}
      >
        {t('settings.version', { appVersion: getFullAppVersion() })}
      </Text>
    </Flex>
  )
}

const ImageStyles = StyleSheet.create({
  responsiveImage: {
    aspectRatio: 135 / 76,
    height: undefined,
    width: '100%',
  },
})

const SIGNATURE_VISIBLE_DURATION = ONE_SECOND_MS * 10
