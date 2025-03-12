const hre = require("hardhat");

async function main() {
  //Para deploy local
  const [deployer] = await ethers.getSigners();

  console.log("Deployando com a conta:", deployer.address);

  // Verificar o saldo da conta do deployer
  const balance = await deployer.getBalance();
  console.log("Saldo da conta:", ethers.utils.formatEther(balance), "ETH");
    //---------------------
  const VaquinhaFactory = await hre.ethers.getContractFactory("VaquinhaFactory");
  const vaquinhaFactory = await VaquinhaFactory.deploy();

  await vaquinhaFactory.deployed();
  console.log("Contrato VaquinhaFactory deployado em:", vaquinhaFactory.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
})