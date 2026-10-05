export interface RatePoint {
  date: string;
  rate: number;
}

export interface ExchangeRateHistory {
  /** False when the pair isn't covered by the free historical provider (currently only EUR/USD/GBP/CHF). */
  available: boolean;
  points: RatePoint[];
}
