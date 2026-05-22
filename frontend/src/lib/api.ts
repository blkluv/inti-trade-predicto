let clientToken: string | null = null

export function setClientToken(token: string | null) {
  clientToken = token
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return clientToken
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { ...headers, ...options?.headers as Record<string, string> },
    ...options,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export const api = {
  getMarkets: (params?: Record<string, string>) => fetchAPI(`/markets?${new URLSearchParams(params)}`),
  getMarket: (id: string) => fetchAPI(`/markets/${id}`),
  getMarketSignal: (id: string) => fetchAPI(`/markets/${id}/signal`),
  getMarketPrices: (id: string) => fetchAPI(`/markets/${id}/prices`),

  getSignals: (params?: Record<string, string>) => fetchAPI(`/signals?${new URLSearchParams(params)}`),
  getSignal: (id: string) => fetchAPI(`/signals/${id}`),
  executeSignal: (id: string) => fetchAPI(`/signals/${id}/execute`, { method: 'POST' }),

  getAccuracy: () => fetchAPI('/analytics/accuracy'),
  getModels: () => fetchAPI('/analytics/models'),
  getBacktest: (params?: Record<string, string>) => fetchAPI(`/analytics/backtest?${new URLSearchParams(params)}`),

  getPricing: () => fetchAPI('/pricing'),
  createSubscription: (tier: string) => fetchAPI('/subscriptions/create', { method: 'POST', body: JSON.stringify({ tier }) }),
  getSubscriptionStatus: () => fetchAPI('/subscriptions/status'),

  getBuilderFees: () => fetchAPI('/builder/fees'),

  register: (email: string, password: string) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) => fetchAPI<{ access_token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => fetchAPI('/users/me'),
}
