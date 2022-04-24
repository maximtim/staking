import * as hre from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { TransactionReceipt } from "@ethersproject/abstract-provider";

describe("MaxStaking", function () {
  let owner : SignerWithAddress,
     first: SignerWithAddress, 
     second: SignerWithAddress, 
     third : SignerWithAddress;
  let ownerAddr : string,
     firstAddr: string, 
     secondAddr: string, 
     thirdAddr : string;
  let tokenStake : Contract;
  let tokenReward : Contract;
  let staking : Contract;
  const decimals = 18;
  const supply = parseUnits("1000000", decimals);
  const stakingBank = parseUnits("10000", decimals);
  const name = "MaxToken";
  const symbol = "MAXT";
  const rewardPeriod = 57;
  const frozenPeriod = 305;
  const rewardFor1TokenUnit = parseUnits("0.002", decimals);;

  beforeEach(async () => {
    [ owner, first, second, third ] = await ethers.getSigners();
    ownerAddr = await owner.getAddress();
    firstAddr = await first.getAddress();
    secondAddr = await second.getAddress();
    thirdAddr = await third.getAddress();
    const MaxToken = await hre.ethers.getContractFactory("MaxToken");
    tokenStake = await MaxToken.deploy(supply, name, symbol, decimals);
    await tokenStake.deployed();
    tokenReward = await MaxToken.deploy(supply, name, symbol, decimals);
    await tokenReward.deployed();
    
    const Staking = await hre.ethers.getContractFactory("MaxStaking");
    staking = await Staking.deploy(tokenStake.address, tokenReward.address, rewardPeriod, frozenPeriod, rewardFor1TokenUnit, decimals);

    const tx = tokenReward.transfer(staking.address, stakingBank);
    await tx;
  });

  it("should deploy successfully",async () => {
    expect(staking.address).to.be.properAddress;
    expect(await staking.owner()).to.be.eq(ownerAddr);
    expect(await staking.tokenRewards()).to.be.eq(tokenReward.address);
    expect(await staking.tokenStake()).to.be.eq(tokenStake.address);
    expect(await staking.rewardPeriod()).to.be.eq(rewardPeriod);
    expect(await staking.frozenPeriod()).to.be.eq(frozenPeriod);
    expect(await staking.rewardFor1TokenUnit()).to.be.eq(rewardFor1TokenUnit);

    expect(await tokenReward.balanceOf(staking.address)).to.be.eq(stakingBank);
  });

  it("fails deploy when rewardPeriod=0",async () => {
    const Staking0 = await hre.ethers.getContractFactory("MaxStaking");
    const staking0Task = Staking0.deploy(tokenStake.address, tokenReward.address, 0, frozenPeriod, rewardFor1TokenUnit, decimals);

    await expect(staking0Task).to.be.revertedWith("Reward period should be > 0");
  });

  it("fails deploy when rewardPercent=0",async () => {
    const Staking0 = await hre.ethers.getContractFactory("MaxStaking");
    const staking0Task = Staking0.deploy(tokenStake.address, tokenReward.address, rewardPeriod, frozenPeriod, 0, decimals);

    await expect(staking0Task).to.be.revertedWith("Reward percent should be > 0");
  });

  // it("changeRewardPeriod success", async () => {
  //   await expect(staking.changeRewardPeriod(10)).to.not.be.reverted;
  //   expect(await staking.rewardPeriod()).to.be.eq(10);
  // });

  // it("changeRewardPeriod fails when not owner", async () => {
  //   await expect(staking.connect(first).changeRewardPeriod(10)).to.be.revertedWith("Only owner");
  // });

  // it("changeRewardPeriod fails when zero", async () => {
  //   await expect(staking.changeRewardPeriod(0)).to.be.revertedWith("Greater than zero only");
  // });

  it("changeFrozenPeriod success", async () => {
    await expect(staking.changeFrozenPeriod(10)).to.not.be.reverted;
    expect(await staking.frozenPeriod()).to.be.eq(10);
  });

  it("changeFrozenPeriod fails when not owner", async () => {
    await expect(staking.connect(first).changeFrozenPeriod(10)).to.be.revertedWith("Only owner");
  });

  it("changeRewardPercent success", async () => {
    await expect(staking.changeRewardFor1TokenUnit(10)).to.not.be.reverted;
    expect(await staking.rewardFor1TokenUnit()).to.be.eq(10);
  });

  it("changeRewardPercent fails when not owner", async () => {
    await expect(staking.connect(first).changeRewardFor1TokenUnit(10)).to.be.revertedWith("Only owner");
  });

  it("changeRewardPercent fails when zero", async () => {
    await expect(staking.changeRewardFor1TokenUnit(0)).to.be.revertedWith("Greater than zero only");
  });
  
  it("stakes successfully",async () => {
    const stakeAmount = parseUnits("1000", decimals);

    const txApprove = await tokenStake.approve(staking.address, stakeAmount);
    await txApprove.wait();

    expect(await tokenStake.allowance(ownerAddr, staking.address)).to.be.eq(stakeAmount);

    await makeStake(staking, stakeAmount.div(2), ownerAddr);
    await makeStake(staking, stakeAmount.div(2), ownerAddr);
  });

  it("fails stake if amount is zero",async () => {
    await expect(staking.stake(0)).to.be.revertedWith("Stake == 0");
  });

  it("fails stake if not enough allowance",async () => {
    const stakeAmount = parseUnits("1000", decimals);
    expect(await tokenStake.allowance(ownerAddr, staking.address)).to.be.eq(0);

    await expect(staking.stake(stakeAmount)).to.be.revertedWith("Not enough allowance to spend");
  });

  it("fails to claim if stake was not created",async () => {
    await expect(staking.claim()).to.be.revertedWith("Stake was not created");
  });

  it("fails to unstake if stake is empty",async () => {
    await expect(staking.unstake()).to.be.revertedWith("Nothing to unstake");
  });

  describe("Staking: after stake", function(){
    const stakeAmount = parseUnits("1003", decimals);

    beforeEach(async () => {
      const txApprove = await tokenStake.approve(staking.address, stakeAmount);
      await txApprove.wait();

      expect(await tokenStake.allowance(ownerAddr, staking.address)).to.be.eq(stakeAmount);

      await makeStake(staking, stakeAmount, ownerAddr);

      const stake = await staking.stakes(ownerAddr);
      expect(stake.reward).to.be.eq(0);
    });

    it("successfully claims reward after time",async () => {
      await ethers.provider.send("evm_increaseTime", [frozenPeriod + 10]);

      const balanceBefore = await tokenReward.balanceOf(ownerAddr) as BigNumber;
      const { expectedRewardsCount, expectedReward } = calcReward(frozenPeriod, rewardPeriod, stakeAmount, decimals, rewardFor1TokenUnit);

      const tx = await staking.claim();
      await tx;

      const stake = await staking.stakes(ownerAddr);
      expect(stake.reward).to.be.eq(0);
      expect(stake.rewardsCount).to.be.eq(expectedRewardsCount);

      const balanceAfter = await tokenReward.balanceOf(ownerAddr) as BigNumber;
      expect(balanceAfter.sub(balanceBefore)).to.be.eq(parseUnits(expectedReward.toString(), decimals));
    });

    it("fails to claim if time has not passed",async () => {
      await expect(staking.claim()).to.be.revertedWith("Frozen period is not over yet");
    });

    it("fails to claim if no reward",async () => {
      const txChange = await staking.changeFrozenPeriod(30);
      await txChange.wait();

      expect(await staking.frozenPeriod()).to.be.eq(30);

      await ethers.provider.send("evm_increaseTime", [31]);

      await expect(staking.claim()).to.be.revertedWith("No reward to claim");
    });

    it("successfully updates reward",async () => {
      await ethers.provider.send("evm_increaseTime", [frozenPeriod + 10]);

      const { expectedRewardsCount, expectedReward } = calcReward(frozenPeriod, rewardPeriod, stakeAmount, decimals, rewardFor1TokenUnit);

      const tx = await staking.update();
      await tx;

      const stake = await staking.stakes(ownerAddr);
      expect(stake.reward).to.be.eq(parseUnits(expectedReward.toString(), decimals));
      expect(stake.rewardsCount).to.be.eq(expectedRewardsCount);
    });

    it("doesn't update if no reward yet",async () => {
      const tx = await staking.update();
      await tx;

      const stake = await staking.stakes(ownerAddr);
      expect(stake.reward).to.be.eq(0);
      expect(stake.rewardsCount).to.be.eq(0);
    });

    it("successfully unstakes and updates reward",async () => {
      await ethers.provider.send("evm_increaseTime", [frozenPeriod + 10]);

      const balanceBefore = await tokenStake.balanceOf(ownerAddr) as BigNumber;

      const { expectedRewardsCount, expectedReward } = calcReward(frozenPeriod, rewardPeriod, stakeAmount, decimals, rewardFor1TokenUnit);

      const tx = await staking.unstake();
      await tx;

      const stake = await staking.stakes(ownerAddr);
      expect(stake.reward).to.be.eq(parseUnits(expectedReward.toString(), decimals));
      expect(stake.rewardsCount).to.be.eq(expectedRewardsCount);

      const balanceAfter = await tokenStake.balanceOf(ownerAddr) as BigNumber;
      expect(balanceAfter.sub(balanceBefore)).to.be.eq(stakeAmount);
    });

    it("successfully unstakes but doesn't update reward if frozen time not passed",async () => {
      const balanceBefore = await tokenStake.balanceOf(ownerAddr) as BigNumber;

      const tx = await staking.unstake();
      await tx;

      const stake = await staking.stakes(ownerAddr);
      expect(stake.reward).to.be.eq(0);
      expect(stake.rewardsCount).to.be.eq(0);

      const balanceAfter = await tokenStake.balanceOf(ownerAddr) as BigNumber;
      expect(balanceAfter.sub(balanceBefore)).to.be.eq(stakeAmount);
    });

    it("fails to unstake twice",async () => {
      const tx = await staking.unstake();
      await tx;

      await expect(staking.unstake()).to.be.revertedWith("Nothing to unstake");
      await tx;
    });
  });
});

function calcReward(frozenPeriod: number, rewardPeriod: number, stakeAmount: BigNumber, decimals: number, rewardFor1TokenUnit: BigNumber) {
  const expectedRewardsCount = Math.floor(frozenPeriod / rewardPeriod);
  const expectedReward = (parseFloat(formatUnits(stakeAmount, decimals)) * expectedRewardsCount * parseFloat(formatUnits(rewardFor1TokenUnit, decimals)));
  return { expectedRewardsCount, expectedReward };
}

async function makeStake(staking: Contract, stakeAmount : BigNumber, ownerAddr: string) {
  const stakeBefore = await staking.stakes(ownerAddr);

  const txStake = await staking.stake(stakeAmount);
  const txStakeRes = (await txStake.wait()) as TransactionReceipt;
  //await ethers.provider.send("evm_mine", [1]);
  const blockTime = (await hre.ethers.provider.getBlock(txStakeRes.blockNumber)).timestamp;

  const stake = await staking.stakes(ownerAddr);

  expect(stake.tokenAmount).to.be.eq(stakeAmount.add(stakeBefore.tokenAmount));
  // не работает, когда больше 1 вызова функции makeStake
  //expect(stake.creationTime).to.be.eq(blockTime);
}

