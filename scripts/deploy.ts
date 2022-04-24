import hre from "hardhat";
import "@nomiclabs/hardhat-waffle";
const ethers = hre.ethers;
import mnm from "minimist";
import { formatEther } from "ethers/lib/utils";

async function main() {
  var argv = mnm(process.argv.slice(2),  { string: ['tokenStake', 'tokenRewards'] });

  const MaxStaking = await ethers.getContractFactory("MaxStaking");
  const staking = await MaxStaking.deploy(
    argv.tokenStake,
    argv.tokenRewards,
    argv.rewardPeriod,
    argv.frozenPeriod,
    argv.rewardPercent
  );

  const txRes = await ((await staking.deployed()).deployTransaction).wait();

  console.log("MaxStaking deployed to:", staking.address);
  const gasCost = txRes.gasUsed.mul(txRes.effectiveGasPrice);
  console.log("Gas cost: ", formatEther(gasCost), "ETH");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
