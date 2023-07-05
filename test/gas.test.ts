import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "ethers";
import ganache, {Server as GanacheServer} from "ganache";
import {gasFee, gasFeeTracker, IGasFee, IGasFeeTracker} from "../src"
chai.use(chaiAsPromised)

describe("Gas Estimation", () => {

  let ganacheServer: GanacheServer;
  let provider: ethers.JsonRpcProvider;

  before(async () => {
    ganacheServer = ganache.server({
      logging: {
        quiet: true,
      },
    });
    await ganacheServer.listen(8545);
    provider = new ethers.JsonRpcProvider(`http://localhost:${ganacheServer.address().port}`);
  });

  after(async () => {
    await ganacheServer.close();
  });
  

  it("Should be able to get legacy gas fee",  async () => {
    const fee = await gasFee(provider, true) as bigint;
    expect(Number(fee)).to.greaterThan(0);
  });

  it("Should be able to get eip1559 gas fee",  async () => {
    const fee = await gasFee(provider) as IGasFee;
    expect(fee).to.have.property("maxFee");
    expect(fee).to.have.property("maxPriorityFee");
    expect(Number(fee.maxFee)).to.greaterThan(0);
    expect(Number(fee.maxPriorityFee)).to.greaterThan(0);
  });

  it("Should be able to add buffer to maxPriorityFee",  async () => {
    const gasFeeWithoutBuffer = await gasFee(provider) as IGasFee;
    const gasFeeWithBuffer = await gasFee(provider, false, 0.13) as IGasFee;
    expect(Number(gasFeeWithBuffer.maxFee)).to.greaterThan(Number(gasFeeWithoutBuffer.maxFee));
    expect(Number(gasFeeWithBuffer.maxPriorityFee)).to.greaterThan(Number(gasFeeWithoutBuffer.maxPriorityFee));
  });

  it("Invalid buffer percentage usage should throw an error",  async () => {
    const gasFeeWithBuffer = gasFee(provider, false, 5);
    await expect(gasFeeWithBuffer).to.eventually.be.rejectedWith("priorityFeeBufferPercent must be between 0 and 1");
  });

  it("Should be able get three (slow, average, fast) fee from tracker",  async () => {
    const [account1, account2] = await provider.listAccounts();
    for (let i = 0; i < 20; i++) {
      await account1.sendTransaction({to: account2.address, value: ethers.parseEther("1")});
    }
    const gasFee = await gasFeeTracker(provider) as IGasFeeTracker;
    expect(gasFee).to.have.property("slow");
    expect(gasFee).to.have.property("average");
    expect(gasFee).to.have.property("fast");
  });

  it("Should be able to change number of blocks to be used for gas tracker",  async () => {
    const [account1, account2] = await provider.listAccounts();
    for (let i = 0; i < 20; i++) {
      await account1.sendTransaction({to: account2.address, value: ethers.parseEther("1")});
    }
    const gasFee = await gasFeeTracker(provider, 4) as IGasFeeTracker;
    expect(gasFee).to.have.property("slow");
    expect(gasFee).to.have.property("average");
    expect(gasFee).to.have.property("fast");
  });

  it("Should be able to provide custom percentiles for gas tracker",  async () => {
    const [account1, account2] = await provider.listAccounts();
    for (let i = 0; i < 20; i++) {
      await account1.sendTransaction({to: account2.address, value: ethers.parseEther("1")});
    }
    const gasFee = await gasFeeTracker(provider, 10, [1,50,99]) as IGasFeeTracker;
    expect(gasFee).to.have.property("slow");
    expect(gasFee).to.have.property("average");
    expect(gasFee).to.have.property("fast");
  });

  it("Invalid percentiles should throw an error",  async () => {
    const gasFee = gasFeeTracker(provider, 10, [-1,80,1000]);
    await expect(gasFee).to.eventually.be.rejectedWith("percentilesList elements must be between 1 and 99");
  });

  it("Invalid number of percentiles should throw an error",  async () => {
    const gasFee = gasFeeTracker(provider, 10, [-1,80,1000,800]);
    await expect(gasFee).to.eventually.be.rejectedWith(/percentilesList must have [0-9]+ elements/i);
  });

});