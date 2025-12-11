"use client"

import { SWRConfig } from "swr"
import type { ReactNode } from "react"

const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnMount: true,
  dedupingInterval: 2000,
  focusThrottleInterval: 60000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  provider: () => new Map(),
}

export function SWRProvider({ children }: { children: ReactNode }) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>
}
