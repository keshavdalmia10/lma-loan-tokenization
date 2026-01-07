const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy ERC-3643 Infrastructure (Lightweight)
 *
 * Deploys contracts separately to stay under bytecode size limits:
 * 1. ClaimTopicsRegistry
 * 2. TrustedIssuersRegistry
 * 3. LoanTokenFactoryLight (references above)
 */

const CLAIM_TOPICS = {
  KYC: 1,
  ACCREDITATION: 2,
  JURISDICTION: 3,
  AML: 4,
  QUALIFIED_INVESTOR: 5,
};

async function main() {
  console.log("\n============================================");
  console.log("LMA Loan Tokenization - Light Deployment");
  console.log("============================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // ============ 1. Deploy ClaimTopicsRegistry ============
  console.log("1. Deploying ClaimTopicsRegistry...");
  const ClaimTopicsRegistry = await ethers.getContractFactory("ClaimTopicsRegistry");
  const claimTopicsRegistry = await ClaimTopicsRegistry.deploy();
  await claimTopicsRegistry.waitForDeployment();
  const claimTopicsRegistryAddress = await claimTopicsRegistry.getAddress();
  console.log("   ClaimTopicsRegistry:", claimTopicsRegistryAddress);

  // ============ 2. Deploy TrustedIssuersRegistry ============
  console.log("\n2. Deploying TrustedIssuersRegistry...");
  const TrustedIssuersRegistry = await ethers.getContractFactory("TrustedIssuersRegistry");
  const trustedIssuersRegistry = await TrustedIssuersRegistry.deploy();
  await trustedIssuersRegistry.waitForDeployment();
  const trustedIssuersRegistryAddress = await trustedIssuersRegistry.getAddress();
  console.log("   TrustedIssuersRegistry:", trustedIssuersRegistryAddress);

  // ============ 3. Deploy LoanTokenFactoryLight ============
  console.log("\n3. Deploying LoanTokenFactoryLight...");
  const LoanTokenFactoryLight = await ethers.getContractFactory("LoanTokenFactoryLight");
  const factory = await LoanTokenFactoryLight.deploy(
    claimTopicsRegistryAddress,
    trustedIssuersRegistryAddress
  );
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("   LoanTokenFactoryLight:", factoryAddress);

  // ============ 4. Configure ClaimTopicsRegistry ============
  console.log("\n4. Configuring ClaimTopicsRegistry...");
  for (const [name, topic] of Object.entries(CLAIM_TOPICS)) {
    try {
      const tx = await claimTopicsRegistry.addClaimTopic(topic);
      await tx.wait();
      console.log(`   Added claim topic: ${name} (${topic})`);
    } catch (error) {
      if (error.message.includes("TOPIC_ALREADY_EXISTS") || error.message.includes("TOPIC_EXISTS")) {
        console.log(`   Topic ${name} (${topic}) already exists`);
      } else {
        console.log(`   Warning: Could not add topic ${name}: ${error.message}`);
      }
    }
  }

  // ============ 5. Add Deployer as Trusted Issuer ============
  console.log("\n5. Adding deployer as trusted issuer...");
  const allTopics = Object.values(CLAIM_TOPICS);
  try {
    const tx = await trustedIssuersRegistry.addTrustedIssuer(deployer.address, allTopics);
    await tx.wait();
    console.log(`   Deployer added as trusted issuer for topics: [${allTopics.join(", ")}]`);
  } catch (error) {
    if (error.message.includes("ISSUER_EXISTS") || error.message.includes("ISSUER_ALREADY_EXISTS")) {
      console.log("   Deployer already registered as trusted issuer");
    } else {
      console.log(`   Warning: Could not add issuer: ${error.message}`);
    }
  }

  // ============ Save Deployment Info ============
  const deployments = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      LoanTokenFactory: factoryAddress,
      ClaimTopicsRegistry: claimTopicsRegistryAddress,
      TrustedIssuersRegistry: trustedIssuersRegistryAddress,
    },
    claimTopics: CLAIM_TOPICS,
  };

  const deploymentsPath = path.join(__dirname, "..", "deployments.json");
  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log("\n6. Saved deployment info to deployments.json");

  // ============ Output Environment Variables ============
  console.log("\n============================================");
  console.log("Deployment Complete!");
  console.log("============================================\n");
  console.log("Add these to your .env.local file:\n");
  console.log(`NEXT_PUBLIC_FACTORY_ADDRESS_BASE_SEPOLIA=${factoryAddress}`);
  console.log(`NEXT_PUBLIC_CLAIM_TOPICS_REGISTRY_BASE_SEPOLIA=${claimTopicsRegistryAddress}`);
  console.log(`NEXT_PUBLIC_TRUSTED_ISSUERS_REGISTRY_BASE_SEPOLIA=${trustedIssuersRegistryAddress}`);
  console.log(`NEXT_PUBLIC_DEPLOYER_ADDRESS=${deployer.address}`);
  console.log("");

  return deployments;
}

main()
  .then((deployments) => {
    console.log("All contracts deployed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
