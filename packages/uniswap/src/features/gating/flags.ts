import { logger } from 'utilities/src/logger/logger'
import { isInterface } from 'utilities/src/platform'
/**
 * Feature flag names
 */
export enum FeatureFlags {
  // Shared
  ForAggregator,
  DisableFiatOnRampKorea,

  // Wallet
  PrivateRpc,
  PortionFields,
  TransactionDetailsSheet,
  OpenAIAssistant,
  UnitagsDeviceAttestation,
  UniswapX,

  // Mobile
  AATest,
  Datadog,
  ExtensionPromotionGA,
  FeedTab,
  OnboardingKeyring,
  Scantastic,
  UwULink,

  // Extension
  ExtensionAutoConnect,

  // Web
  AATestWeb,
  UniversalSwap,
  NavigationHotkeys,
  Eip6936Enabled,
  ExtensionLaunch,
  GqlTokenLists,
  LimitsFees,
  L2NFTs,
  MultichainUX,
  MultichainExplore,
  MultipleRoutingOptions,
  QuickRouteMainnet,
  Realtime,
  RestExplore,
  TraceJsonRpc,
  UniswapXSyntheticQuote,
  UniswapXv2,
  V2Everywhere,
  V4Everywhere,
  Zora,
  // TODO(WEB-3625): Remove these once we have a generalized system for outage banners.
  OutageBannerArbitrum,
  OutageBannerOptimism,
  OutageBannerPolygon,
}

// These names must match the gate name on statsig
export const WEB_FEATURE_FLAG_NAMES = new Map<FeatureFlags, string>([
  // Shared
  [FeatureFlags.ForAggregator, 'for_aggregator_web'],

  // Web Specific
  [FeatureFlags.NavigationHotkeys, 'navigation_hotkeys'],
  [FeatureFlags.Eip6936Enabled, 'eip6963_enabled'],
  [FeatureFlags.ExtensionLaunch, 'extension_launch'],
  [FeatureFlags.GqlTokenLists, 'gql_token_lists'],
  [FeatureFlags.LimitsFees, 'limits_fees'],
  [FeatureFlags.L2NFTs, 'l2_nfts'],
  [FeatureFlags.MultichainUX, 'multichain_ux'],
  [FeatureFlags.MultichainExplore, 'multichain_explore'],
  [FeatureFlags.MultipleRoutingOptions, 'multiple_routing_options'],
  [FeatureFlags.QuickRouteMainnet, 'enable_quick_route_mainnet'],
  [FeatureFlags.Realtime, 'realtime'],
  [FeatureFlags.RestExplore, 'rest_explore'],
  [FeatureFlags.TraceJsonRpc, 'traceJsonRpc'],
  [FeatureFlags.UniswapXSyntheticQuote, 'uniswapx_synthetic_quote'],
  [FeatureFlags.UniswapXv2, 'uniswapx_v2'],
  [FeatureFlags.V2Everywhere, 'v2_everywhere'],
  [FeatureFlags.V4Everywhere, 'v4_everywhere'],
  [FeatureFlags.Zora, 'zora'],
  [FeatureFlags.AATestWeb, 'aatest_web'],
  // TODO(WEB-3625): Remove these once we have a generalized system for outage banners.
  [FeatureFlags.OutageBannerArbitrum, 'outage_banner_feb_2024_arbitrum'],
  [FeatureFlags.OutageBannerOptimism, 'outage_banner_feb_2024_optimism'],
  [FeatureFlags.OutageBannerPolygon, 'outage_banner_feb_2024_polygon'],
  [FeatureFlags.UniversalSwap, 'universal_swap'],
])

// These names must match the gate name on statsig
export const WALLET_FEATURE_FLAG_NAMES = new Map<FeatureFlags, string>([
  // Shared
  [FeatureFlags.ForAggregator, 'for-aggregator'],
  [FeatureFlags.DisableFiatOnRampKorea, 'disable-fiat-onramp-korea'],

  // Wallet Specific
  [FeatureFlags.AATest, 'aatest1'],
  [FeatureFlags.Datadog, 'datadog'],
  [FeatureFlags.FeedTab, 'feed-tab'],
  [FeatureFlags.PrivateRpc, 'mev-blocker'],
  [FeatureFlags.OpenAIAssistant, 'openai-assistant'],
  [FeatureFlags.OnboardingKeyring, 'onboarding-keyring'],
  [FeatureFlags.PortionFields, 'portion-fields'],
  [FeatureFlags.Scantastic, 'scantastic'],
  [FeatureFlags.TransactionDetailsSheet, 'transaction-details-sheet'],
  [FeatureFlags.UnitagsDeviceAttestation, 'unitags-device-attestation'],
  [FeatureFlags.UwULink, 'uwu-link'],
  [FeatureFlags.UniswapX, 'uniswapx'],
  // Extension Specific
  [FeatureFlags.ExtensionAutoConnect, 'extension-auto-connect'],
])

export enum FeatureFlagClient {
  Web,
  Wallet,
}

const FEATURE_FLAG_NAMES = {
  [FeatureFlagClient.Web]: WEB_FEATURE_FLAG_NAMES,
  [FeatureFlagClient.Wallet]: WALLET_FEATURE_FLAG_NAMES,
}

export function getFeatureFlagName(flag: FeatureFlags, client?: FeatureFlagClient): string {
  const names =
    client !== undefined ? FEATURE_FLAG_NAMES[client] : isInterface ? WEB_FEATURE_FLAG_NAMES : WALLET_FEATURE_FLAG_NAMES
  const name = names.get(flag)
  if (!name) {
    const err = new Error(`Feature ${FeatureFlags[flag]} does not have a name mapped for this application`)

    logger.error(err, {
      tags: {
        file: 'flags.ts',
        function: 'getFeatureFlagName',
      },
    })

    throw err
  }

  return name
}
