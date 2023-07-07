# Ethereum Gas Fee Estimator

A small utility to estimate the gas fee for the Ethereum transactions. It supports legacy fee and EIP-1559 fee.

## Features
1. Prevents your transaction being underpriced in high network demand situations.
2. Ensures your transaction remains marketable for six consecutive 100% full blocks. (Read more at: [A Definitive Guide to Ethereum EIP-1559 Gas Fee Calculations: Base Fee, Priority Fee, Max Fee](https://www.blocknative.com/blog/eip-1559-fees))
 > Note: Beacause of this feature, the max gas fee estimation may be higher than the actual gas fee required/used by the transaction and displayed by other services like etherscan. The extra gas fee will be refunded to the sender's account after the transaction is mined.
3. Provides customizable gas tracker to get three different fee estimations. (slow, average and fast).
4. Gets the gas fee estimation from the blockchain nodes itself. (No third party API calls like etherscan).
5. Supports both legacy fee and EIP-1559 fee.
6. Options to add a percentage buffer to the maxPriorityFee.
7. Supports all EVM compatible blockchains e.g. Ethereum, Binance Smart Chain, Polygon, etc.

## Installation

You can install this package using npm:

`npm install ethereum-gas-fee-estimator`

or using yarn:

`yarn add ethereum-gas-fee-estimator`

## Usage

1. Using default gas fee estimation provided by the node.

```js
import { gasFee } from 'ethereum-gas-fee-estimator';

// provider = ethersJs JsonRpcProvider

// legacy = true for legacy fee estimation and false for EIP-1559 fee estimation. (Default is false)

// priorityFeeBufferPercent = Percentage of maxPriorityFee to add to maxPriorityFee as a buffer. Should be between 0 and 1. (Default is 0)

const fee = await gasFee(provider,legacy,priorityFeeBufferPercent);

// fee is either bigint or {
//   maxFee: bigint,
//   maxPriorityFee: bigint
//}
```

2. Using customizable gas tracker to get three different fee estimations. (slow, average and fast)

```js
import { gasFeeTracker } from 'ethereum-gas-fee-estimator';

// provider = ethersJs JsonRpcProvider

// numberOfBlocks = The number of blocks preceding the latest block to use in the calculation. (Default 10)

// percentilesList = A monotonically increasing list of percentile values to sample from each block's effective priority fees per gas in ascending order. Must have 3 elements and each element must be between 1 and 99. (Default is [25, 50, 75])

const fee = await gasFeeTracker(provider,numberOfBlocks,percentilesList);

// fee {
//   slow: {
//     maxFee: bigint,
//     maxPriorityFee: bigint
//   },
//   average: {
//     maxFee: bigint,
//     maxPriorityFee: bigint
//   },
//   fast: {
//     maxFee: bigint,
//     maxPriorityFee: bigint
//   }
//}
```