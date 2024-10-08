import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { logContextUpdate } from 'utilities/src/logger/contextEnhancer'

export enum SwapScreen {
  SwapForm,
  SwapReview,
}

type SwapScreenContextState = {
  screen: SwapScreen
  screenRef: React.MutableRefObject<SwapScreen>
  setScreen: (screen: SwapScreen) => void
}

export const SwapScreenContext = createContext<SwapScreenContextState | undefined>(undefined)

export function SwapScreenContextProvider({ children }: { children: ReactNode }): JSX.Element {
  const screenRef = useRef<SwapScreen>(SwapScreen.SwapForm)
  const [screen, setScreen] = useState<SwapScreen>(SwapScreen.SwapForm)

  const datadogEnabled = useFeatureFlag(FeatureFlags.Datadog)

  const wrappedSetScreen = useCallback(
    (_screen: SwapScreen) => {
      screenRef.current = _screen
      setScreen(_screen)
      logContextUpdate('SwapScreenContext', { screen: _screen }, datadogEnabled)
    },
    [setScreen, datadogEnabled],
  )

  const state = useMemo<SwapScreenContextState>(
    (): SwapScreenContextState => ({
      screen,
      screenRef,
      setScreen: wrappedSetScreen,
    }),
    [screen, wrappedSetScreen],
  )

  return <SwapScreenContext.Provider value={state}>{children}</SwapScreenContext.Provider>
}

export const useSwapScreenContext = (): SwapScreenContextState => {
  const swapContext = useContext(SwapScreenContext)

  if (swapContext === undefined) {
    throw new Error('`useSwapScreenContext` must be used inside of `SwapScreenContextProvider`')
  }

  return swapContext
}
