const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
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

  getPricing: () => fetchAPI('/pricing'),
  createSubscription: (tier: string) => fetchAPI('/subscriptions/create', { method: 'POST', body: JSON.stringify({ tier }) }),
  getSubscriptionStatus: () => fetchAPI('/subscriptions/status'),

  getBuilderFees: () => fetchAPI('/builder/fees'),
};
