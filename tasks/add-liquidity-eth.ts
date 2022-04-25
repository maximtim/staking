import { BigNumber } from "ethers";
import { parseUnits, parseEther, formatUnits, formatEther } from "ethers/lib/utils";
import { task } from "hardhat/config";
import { getGasCost } from "./depends";

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