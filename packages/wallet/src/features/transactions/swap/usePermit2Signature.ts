import { PermitSingle } from '@uniswap/permit2-sdk'
import { TypedDataField } from 'ethers'
import { useCallback } from 'react'
import { useSigner } from 'uniswap/src/contexts/UniswapContext'
import { Permit } from 'uniswap/src/data/tradingApi/__generated__/index'
import { useAsyncData } from 'utilities/src/react/hooks'
import { signTypedData } from 'wallet/src/features/wallet/signing/signing'

export type PermitSignatureInfo = {
  signature: string
  permitMessage: PermitSingle
  nonce: number
  expiry: number
}

// Used to sign permit messages where we already have the domain, types, and values.
export function usePermit2SignatureWithData({ permitData, skip }: { permitData: Maybe<Permit>; skip?: boolean }): {
  isLoading: boolean
  signature: string | undefined
} {
  const signer = useSigner()

  const { domain, types, values } = permitData || {}

  const permitSignatureFetcher = useCallback(async () => {
    if (skip || !signer || !domain || !types || !values) {
      return
    }

    return await signTypedData(
      domain,
      types as Record<string, TypedDataField[]>,
      values as Record<string, unknown>,
      signer,
    )
  }, [domain, signer, skip, types, values])

  const { data, isLoading } = useAsyncData(permitSignatureFetcher)

  return {
    isLoading,
    signature: data,
  }
}
