import { TShirtSize } from './types';

export const VOTE_DURATION = 10; // seconds

export const SIZES: TShirtSize[] = [
  TShirtSize.XS,
  TShirtSize.S,
  TShirtSize.M,
  TShirtSize.L,
  TShirtSize.XL,
];

export const SIZES_MAP: Record<TShirtSize, number> = {
  [TShirtSize.XS]: 1,
  [TShirtSize.S]: 2,
  [TShirtSize.M]: 3,
  [TShirtSize.L]: 5,
  [TShirtSize.XL]: 8,
};
