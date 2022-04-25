import { formatUnits, formatEther } from "ethers/lib/utils";
import { task } from "hardhat/config";
import { getGasCost } from "./depends";

task("staking-unstake", "Unstake tokens from staking contract")
  .setAction(async (taskArgs, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const staking = await hre.ethers.getContractAt("MaxStaking", process.env.STAKING_ADDRESS ?? "");
    const stakingToken = await hre.ethers.getContractAt("IERC20", process.env.PAIR_ADDRESS ?? "");

    const balanceBefore = await stakingToken.balanceOf(await signer.getAddress());
    console.log("Token balance before:", formatUnits(balanceBefore, 18), "UNI");
    
    await staking.callStatic.unstake();
    console.log("CallStatic success");

    const tx = await staking.unstake();
    const txRes = await tx.wait();

    const balanceAfter = await stakingToken.balanceOf(await signer.getAddress());
    console.log("Token balance after:", formatUnits(balanceAfter, 18), "UNI");

    const gasCost = getGasCost(txRes);
    console.log("Gas cost: ", formatEther(gasCost), "ETH");
});