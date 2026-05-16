"use client"

import { SessionProvider } from "next-auth/react"
import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { setClientToken } from "@/lib/api"

function TokenSync() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.backendToken) {
      setClientToken(session.backendToken)
    } else {
      setClientToken(null)
    }
  }, [session])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TokenSync />
      {children}
    </SessionProvider>
  )
}
