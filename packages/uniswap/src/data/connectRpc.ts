/* eslint-disable no-restricted-imports */
import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import { createConnectTransport } from '@connectrpc/connect-web'
import { UseQueryResult } from '@tanstack/react-query'
import { exploreStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service-ExploreStatsService_connectquery'
import { ExploreStatsRequest, ExploreStatsResponse } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { uniswapUrls } from 'uniswap/src/constants/urls'

/**
 * connectRpc.ts
 *
 * This module provides shared utility functions for accessing Uniswap data from our backend.
 * It leverages the @connectrpc library for making queries with type safety from backend protobuffer
 * https://connectrpc.com/docs/web/getting-started
 * https://github.com/connectrpc/connect-query-es
 *
 * To add a new service, follow these steps:
 * 1. Add a new enum value to BackendDataServices
 * 2. Add the corresponding query function to ServiceToQueryFunction
 * 3. Add the corresponding request input and output types to ServiceMap
 */

export enum BackendDataServices {
  EXPLORE,
}

// Mapping of BackendDataServices to their respective query function generated by backend protobuffer
const ServiceToQueryFunction = {
  [BackendDataServices.EXPLORE]: exploreStats,
}

// Mapping of BackendDataServices to their respective input & output types generated by backend protobuffer
interface ServiceMap {
  [BackendDataServices.EXPLORE]: {
    input: PartialMessage<ExploreStatsRequest>
    output: ExploreStatsResponse
  }
}

const uniswapTransport = createConnectTransport({
  baseUrl: uniswapUrls.apiBaseUrlV2,
})

/**
 * A wrapper around `useQuery` that takes in the corresponding backend data service
 * and optional input parameters, and calls the corresponding backend REST library.
 *
 * @template K - The type of the backend data service.
 * @param {K} service - The backend data service to query.
 * @param {ServiceMap[K]['input']} [input] - Optional input parameters for the query.
 * @returns {UseQueryResult<ServiceMap[K]['output'], ConnectError>} The result of the query.
 * @throws {Error} If no known query function exists for the provided service.
 */
export function useBackendRestQuery<K extends keyof ServiceMap>(
  service: K,
  input?: ServiceMap[K]['input'],
): UseQueryResult<ServiceMap[K]['output'], ConnectError> {
  const query = ServiceToQueryFunction[service]

  if (!query) {
    throw new Error(`No known query for service: ${service}`)
  }

  return useQuery(query, input, { transport: uniswapTransport })
}
