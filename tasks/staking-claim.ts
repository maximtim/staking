import { formatUnits, formatEther } from "ethers/lib/utils";
import { task } from "hardhat/config";
import { getGasCost } from "./depends";

task("staking-claim", "Claim reward tokens from MaxStaking contract")
  .setAction(async (taskArgs, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const staking = await hre.ethers.getContractAt("MaxStaking", process.env.STAKING_ADDRESS ?? "");
    const rewadToken = await hre.ethers.getContractAt("IERC20", process.env.MAXTOKEN_ADDRESS ?? "");

    const balanceBefore = await rewadToken.balanceOf(await signer.getAddress());
    console.log("Reward balance before:", formatUnits(balanceBefore, 18), "MAXT");
    
    await staking.callStatic.claim();
    console.log("CallStatic success");

    const tx = await staking.claim();
    const txRes = await tx.wait();

    const balanceAfter = await rewadToken.balanceOf(await signer.getAddress());
    console.log("Reward balance after:", formatUnits(balanceAfter, 18), "MAXT");

    const gasCost = getGasCost(txRes);
    console.log("Gas cost: ", formatEther(gasCost), "ETH");
});