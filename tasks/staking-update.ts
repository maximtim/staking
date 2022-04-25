import { formatEther, formatUnits } from "ethers/lib/utils";
import { task } from "hardhat/config";
import { getGasCost } from "./depends";

task("staking-update", "Update your stake info")
  .setAction(async (taskArgs, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const staking = await hre.ethers.getContractAt("MaxStaking", process.env.STAKING_ADDRESS ?? "");

    const tx = await staking.update();
    const txRes = await tx.wait();

    const gasCost = getGasCost(txRes);
    console.log("Gas cost: ", formatEther(gasCost), "ETH");

    const [tokenAmount, creationTime, reward, rewardsCount] = await staking.stakes(await signer.getAddress());
    console.log("Token amount: ", formatUnits(tokenAmount, 18), "UNI");
    console.log("Creation time: ", new Date((creationTime).toNumber() * 1000).toLocaleString());
    console.log("Reward: ", formatUnits(reward, 18), "MAXT");
    console.log("Reward count: ", rewardsCount.toNumber());
});