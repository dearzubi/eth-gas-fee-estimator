export interface IGasFee {
  maxFee: bigint;
  maxPriorityFee: bigint;
}

export interface IGasFeeTracker {
  slow: IGasFee;
  average: IGasFee;
  fast: IGasFee;
}

export type GasFee = IGasFee | bigint | undefined;
export type GasFeeTracker = IGasFeeTracker | undefined;