const { ethers } = require("hardhat");

async function main() {
  const celoNFT = await ethers.getContractFactory("CeloNFT");
  const deployedCeloNFT = await celoNFT.deploy();
  await deployedCeloNFT.deployed();

  console.log("Celo NFT deployed to: ", deployedCeloNFT.address);

  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
  const deployedNFTMarketplace = await NFTMarketplace.deploy();
  await deployedNFTMarketplace.deployed();

  console.log("NFT Marketplace deployed to: ", deployedNFTMarketplace.address);


}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })