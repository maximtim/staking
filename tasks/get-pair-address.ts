import { task } from "hardhat/config";

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