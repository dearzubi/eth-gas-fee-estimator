import {ethers} from "ethers";
import {GasFee, GasFeeTracker} from "types";
import * as utils from "utils";

/**
 * This function returns the estimated gas fee to be paid for a transaction.
 * @param {ethers.JsonRpcProvider} provider EthersJs JsonRpcProvider
 * @param {boolean} legacy Set to true to return legacy gas fee (pre London-hardfork or pre EIP-1559)
 * @param {number} priorityFeeBufferPercent Percentage of maxPriorityFee to add to maxPriorityFee as a buffer.
 * Should be between 0 and 1
 * @returns {GasFee} Legacy gas fee (pre London-hardfork or pre EIP-1559) or EIP-1559 gas fee
 */
export async function gasFee(
  provider: ethers.JsonRpcProvider, 
  legacy = false,
  priorityFeeBufferPercent = 0,
): Promise<GasFee> {
  if (priorityFeeBufferPercent < 0 || priorityFeeBufferPercent > 1) {
    throw new Error("priorityFeeBufferPercent must be between 0 and 1");
  }
  /* eslint-disable prefer-const */
  let [legacyFee, block] = await Promise.all([
    provider.send("eth_gasPrice", []),
    provider.getBlock("latest"),
  ]);
  if (legacy) return BigInt(legacyFee);
  block = block as ethers.Block;
  if (block.baseFeePerGas) {
    const maxPriorityFee = (BigInt(legacyFee) - block.baseFeePerGas);
    return utils.getEIP1559GasFee(block.baseFeePerGas, maxPriorityFee, priorityFeeBufferPercent);
  }else{
    throw new Error("Block does not have baseFeePerGas. Please use legacy gas fee.");
  }
}

/**
  * This function returns the estimated gas fees to be paid for a transaction at slow, average, and fast speeds.
 * @param {ethers.JsonRpcProvider} provider EthersJs JsonRpcProvider
 * @param numberOfBlocks The number of blocks preceding the latest block to use in the calculation
 * @param percentilesList A monotonically increasing list of percentile values to sample from each block's effective priority fees per gas in ascending order.
 * Must have 3 elements and each element must be between 1 and 99.
 * @returns {GasFeeTracker} An object containing slow, average, and fast gas fees.
 * @Notice This functions is inspired from https://docs.alchemy.com/docs/how-to-build-a-gas-fee-estimator-using-eip-1559
 */

export async function gasFeeTracker(
  provider: ethers.JsonRpcProvider,
  numberOfBlocks = 10,
  percentilesList: number[] = [25, 50, 75]
): Promise<GasFeeTracker> {
  percentilesList = percentilesList.sort()
  utils.validatePercentiles(percentilesList, 3);
  let [history, block] = await Promise.all([
    provider.send("eth_feeHistory", [numberOfBlocks, "latest", percentilesList]),
    provider.getBlock("latest"),
  ]);
  history = utils.formatFeeHistory(history, numberOfBlocks);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const slowPriorityFee    = BigInt(utils.avg(history.map((b: any) => parseInt(b.priorityFeePerGas[0]))));
  const averagePriorityFee = BigInt(utils.avg(history.map((b: any) => parseInt(b.priorityFeePerGas[1]))));
  const fastPriorityFee    = BigInt(utils.avg(history.map((b: any) => parseInt(b.priorityFeePerGas[2]))));
  if (block?.baseFeePerGas) {
    const slow = utils.getEIP1559GasFee(block.baseFeePerGas, slowPriorityFee);
    const average = utils.getEIP1559GasFee(block.baseFeePerGas, averagePriorityFee);
    const fast = utils.getEIP1559GasFee(block.baseFeePerGas, fastPriorityFee);
    return {
      slow: slow,
      average: average,
      fast: fast,
    }
  }
}