export const APP_NAME = 'Inti Trade Predicto';
export const APP_TAGLINE = 'Where intelligence meets prediction';
export const APP_DESCRIPTION = 'AI-powered prediction market intelligence';

export const SUBSCRIPTION_TIERS = {
  free: { name: 'Free', price: 0, signalsPerDay: 3, delay: '24h', portfolios: 1, api: false, reasoning: false },
  pro: { name: 'Pro', price: 9.99, signalsPerDay: -1, delay: 'Real-time', portfolios: 10, api: true, reasoning: true },
  enterprise: { name: 'Enterprise', price: 99.99, signalsPerDay: -1, delay: 'Real-time', portfolios: -1, api: true, reasoning: true },
} as const;

export const RISK_LEVELS = [
  { value: 'conservative', label: 'Conservative', maxBetPct: 0.02, kellyFraction: 0.15, description: 'Lower risk, steady returns' },
  { value: 'moderate', label: 'Moderate', maxBetPct: 0.05, kellyFraction: 0.25, description: 'Balanced risk-reward' },
  { value: 'aggressive', label: 'Aggressive', maxBetPct: 0.10, kellyFraction: 0.50, description: 'Higher risk, higher returns' },
] as const;

export const MARKET_CATEGORIES = [
  { value: 'politics', label: 'Politics', icon: '\u{1F3DB}\u{FE0F}' },
  { value: 'crypto', label: 'Crypto', icon: '\u20BF' },
  { value: 'economics', label: 'Economics', icon: '\u{1F4CA}' },
  { value: 'sports', label: 'Sports', icon: '\u26BD' },
  { value: 'technology', label: 'Technology', icon: '\u{1F4BB}' },
  { value: 'science', label: 'Science', icon: '\u{1F52C}' },
  { value: 'entertainment', label: 'Entertainment', icon: '\u{1F3AC}' },
  { value: 'weather', label: 'Weather', icon: '\u{1F324}\u{FE0F}' },
] as const;

export const EDGE_COLORS = {
  positive: 'text-green-400',
  negative: 'text-red-400',
  neutral: 'text-muted-foreground',
} as const;
