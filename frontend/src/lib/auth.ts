import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import type { NextAuthConfig } from "next-auth"

declare module "next-auth" {
  interface Session {
    backendToken?: string
  }
  interface JWT {
    backendToken?: string
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

export const config: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const avatarUrl =
          (profile as Record<string, string>).avatar_url ||
          (profile as Record<string, string>).picture ||
          ""
        try {
          const res = await fetch(`${API_URL}/auth/social-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: account.provider,
              provider_id: account.providerAccountId,
              email: profile.email || "",
              name: profile.name || "",
              avatar_url: avatarUrl,
            }),
          })
          if (res.ok) {
            const data = await res.json()
            token.backendToken = data.access_token
          }
        } catch (e) {
          console.error("Social login backend error:", e)
        }
      }
      return token
    },
    async session({ session, token }) {
      session.backendToken = token.backendToken as string
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
}

export const { handlers, signIn, signOut, auth } = NextAuth(config)
