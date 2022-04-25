import "./depends";
import { formatUnits } from "ethers/lib/utils";
import { task } from "hardhat/config";

task("staking-info", "Staking contract info")
  .setAction(async (taskArgs, hre) => {
    const staking = await hre.ethers.getContractAt("MaxStaking", process.env.STAKING_ADDRESS ?? "");
    const stakingToken = await hre.ethers.getContractAt("IERC20", process.env.PAIR_ADDRESS ?? "");
    const rewardToken = await hre.ethers.getContractAt("IERC20", process.env.MAXTOKEN_ADDRESS ?? "");

    console.log("tokenRewards contract: ", await staking.tokenRewards());
    console.log("tokenStake contract: ", await staking.tokenStake());
    console.log("rewardPeriod: ", (await staking.rewardPeriod()).toNumber(), "seconds");
    console.log("frozenPeriod: ", (await staking.frozenPeriod()).toNumber(), "seconds");
    
    console.log("rewardFor1TokenUnit: ", formatUnits(await staking.rewardFor1TokenUnit(), 18), "MAXT");
    console.log("tokenRewardDecimals: ", (await staking.tokenRewardDecimals()).toNumber());
    console.log("owner: ", await staking.owner());
    console.log("Staking contract UNI balance: ", formatUnits(await stakingToken.balanceOf(staking.address), 18));
    console.log("Staking contract MAXT balance: ", formatUnits(await rewardToken.balanceOf(staking.address), 18));
});