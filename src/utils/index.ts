import { IGasFee} from "types";

export const getEIP1559GasFee = (
  baseFee: bigint, 
  maxPriorityFee: bigint,
  priorityFeeBufferPercent: number = 0,
): IGasFee => {
  const buffer = Math.round((Number(maxPriorityFee) * priorityFeeBufferPercent));
  maxPriorityFee = maxPriorityFee + BigInt(buffer);
  //https://www.blocknative.com/blog/eip-1559-fees
  const maxFee = (2n * baseFee) + maxPriorityFee
  return { maxFee: maxFee, maxPriorityFee: maxPriorityFee };
}

export const validatePercentiles = (
  percentiles: number[],
  numElements = 3
) => {
  if (percentiles.length !== numElements){
    throw new Error(`percentilesList must have ${numElements} elements`);
  }
  percentiles.forEach((p) => {
    if (p < 1 || p > 99) throw new Error("percentilesList elements must be between 1 and 99");
  });
};

export const avg = (arr: number[]) => {
  const sum = arr.reduce((a, v) => a + v);
  return Math.round(sum/arr.length);
}

export const formatFeeHistory = (
  result: any, 
  numberOfBlocks: number,
) => {
  let blockNum = parseInt(result.oldestBlock);
  let index = 0;
  const blocks = [];
  while (blockNum < parseInt(result.oldestBlock) + numberOfBlocks) {
    blocks.push({
      number: blockNum,
      baseFeePerGas: BigInt(result.baseFeePerGas[index]),
      gasUsedRatio: Number(result.gasUsedRatio[index]),
      priorityFeePerGas: result.reward[index].map((x: bigint) => x),
    });
    blockNum += 1;
    index += 1;
  }
  return blocks;
}