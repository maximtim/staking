import { task } from "hardhat/config";

task("create-wallet", "Create new ethereum wallet", async (taskArgs, hre) => {
  const wallet = hre.ethers.Wallet.createRandom();
  
  console.log("Address: ", wallet.address);
  console.log("Public key: ", wallet.publicKey);
  console.log("Private key: ", wallet.privateKey);
  console.log("Mnemonic: ", wallet.mnemonic);
});