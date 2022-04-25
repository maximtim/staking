import "./depends";
import { formatEther, parseUnits } from "ethers/lib/utils";
import { task } from "hardhat/config";
import { getGasCost } from "./depends";

task("staking-stake", "Stake tokens into MaxStaking contract")
  .addOptionalParam("needapprove", "Set to true if token needs approval to stake (default=true)", "true")
  .addParam("amount", "Tokens stake amount (in units)")
  .setAction(async ({amount, needapprove}, hre) => {
    const amountReal = parseUnits(amount, 18);
    const staking = await hre.ethers.getContractAt("MaxStaking", process.env.STAKING_ADDRESS ?? "");

    if (needapprove === "true"){
      const lpToken = await hre.ethers.getContractAt("IERC20", process.env.PAIR_ADDRESS ?? "");
      await lpToken.callStatic.approve(process.env.STAKING_ADDRESS, amountReal);
      const txApprove = await lpToken.approve(process.env.STAKING_ADDRESS, amountReal);
      const txRes = await txApprove.wait();
      console.log("Approved", amount, "tokens to stake");
      const gasCost = getGasCost(txRes);
      console.log("Gas cost: ", formatEther(gasCost), "ETH");
    }

    await staking.callStatic.stake(amountReal);
    console.log("CallStatic success");

    const tx = await staking.stake(amountReal);
    const txRes = await tx.wait();

    const gasCost = getGasCost(txRes);
    console.log("Gas cost: ", formatEther(gasCost), "ETH");
});