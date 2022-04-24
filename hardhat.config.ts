import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import { formatEther, formatUnits, parseEther, parseUnits } from "ethers/lib/utils";
import { BigNumber } from "ethers";

dotenv.config();

function getGasCost(txRes: any) {
  return txRes.gasUsed.mul(txRes.effectiveGasPrice);
}

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address + " - " + formatEther(await account.getBalance()) + " ETH");
  }
});

// task("transfer", "", async (taskArgs, hre) => {
//   const signers = await hre.ethers.getSigners();

//   const tx = await signers[7].sendTransaction({
//     to: "0x069AfcBc2b655Ac8586F7fC6C60e45f4f4BBb6bB",
//     value: hre.ethers.utils.parseEther("0.1")
//   });

//   await tx.wait();

// });

task("create-wallet", "Create new ethereum wallet", async (taskArgs, hre) => {
  const wallet = hre.ethers.Wallet.createRandom();
  
  console.log("Address: ", wallet.address);
  console.log("Public key: ", wallet.publicKey);
  console.log("Private key: ", wallet.privateKey);
  console.log("Mnemonic: ", wallet.mnemonic);
});

task("add-liquidity-eth", "Create pool (WETH-MAXT) if it doesn't exist and add liquidity there")
  .addParam("amountweth")
  .addParam("amountmaxt")
  .setAction(async ({amountweth, amountmaxt}, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const uniRouter = await hre.ethers.getContractAt("IUniswapV2Router02", process.env.UNISWAP_ROUTER_ADDRESS ?? "");

    const [amountToken, amountETH, liquidity] = await uniRouter.callStatic.addLiquidityETH(
      process.env.MAXTOKEN_ADDRESS,
      parseUnits(amountmaxt, 18),
      0,
      0,
      await signer.getAddress(),
      Date.now() + 60*60*24,
      { value : parseEther(amountweth) }
    );BigNumber.from
    console.log("CallStatic returned:", 
          "\nMAXT:", formatUnits(amountToken, 18), 
          "\nWETH:", formatEther(amountETH),
          "\nLiquidity (UNI):", formatUnits(liquidity, 18));

    const tx = await uniRouter.addLiquidityETH(
      process.env.MAXTOKEN_ADDRESS,
      parseUnits(amountmaxt, 18),
      0,
      0,
      await signer.getAddress(),
      Date.now() + 60*60*24,
      { value : parseEther(amountweth) }
    );
    const txRes = await tx.wait();

    const gasCost = getGasCost(txRes);
    console.log("Gas cost: ", formatEther(gasCost), "ETH");
});

task("get-pair-address", "Get Uniswap pair address for two tokens addresses")
  .addParam("token1")
  .addParam("token2")
  .setAction(async ({token1, token2}, hre) => {
    const uniRouter = await hre.ethers.getContractAt("IUniswapV2Router02", process.env.UNISWAP_ROUTER_ADDRESS ?? "");
    const factoryAddr = (await uniRouter.factory());
    const uniFactory = await hre.ethers.getContractAt("IUniswapV2Factory", factoryAddr);

    const pair = await uniFactory.getPair(token1, token2);
    console.log("Pair address:", pair);
});

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

task("staking-getstake", "Get your stake info")
  .setAction(async (taskArgs, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const staking = await hre.ethers.getContractAt("MaxStaking", process.env.STAKING_ADDRESS ?? "");

    const [tokenAmount, creationTime, reward, rewardsCount] = await staking.stakes(await signer.getAddress());
    console.log("Token amount: ", formatUnits(tokenAmount, 18), "UNI");
    console.log("Creation time: ", new Date((creationTime).toNumber() * 1000).toLocaleString());
    console.log("Reward: ", formatUnits(reward, 18), "MAXT");
    console.log("Reward count: ", rewardsCount.toNumber());
});

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

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    rinkeby: {
      url: process.env.PROJECT_URL,
      accounts: JSON.parse(process.env.PRIVATE_KEYS_LIST !== undefined ? process.env.PRIVATE_KEYS_LIST : ""),
      gas: 5000_000,
      gasPrice: 8000000000
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
