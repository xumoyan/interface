// Shares similarities with https://github.com/Uniswap/interface/blob/main/src/state/user/reducer.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CurrencyId } from 'uniswap/src/types/currency'

export interface TokensState {
  dismissedWarningTokens: {
    [currencyId: CurrencyId]: boolean
  }
}

export const initialTokensState: TokensState = {
  dismissedWarningTokens: {},
}

const slice = createSlice({
  name: 'tokens',
  initialState: initialTokensState,
  reducers: {
    addDismissedWarningToken: (state, action: PayloadAction<{ currencyId: CurrencyId }>) => {
      const { currencyId } = action.payload
      state.dismissedWarningTokens[currencyId] = true
    },
    resetDismissedWarnings: (state) => {
      state.dismissedWarningTokens = {}
    },
    resetTokens: () => initialTokensState,
  },
})

export const { resetTokens, addDismissedWarningToken, resetDismissedWarnings } = slice.actions

export const tokensReducer = slice.reducer
