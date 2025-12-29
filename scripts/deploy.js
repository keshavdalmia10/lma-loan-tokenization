const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy ERC-3643 Loan Tokenization Infrastructure
 *
 * This script deploys:
 * 1. LoanTokenFactory - Creates ERC-3643 compliant loan tokens
 *    (Factory auto-deploys shared ClaimTopicsRegistry and TrustedIssuersRegistry)
 * 2. Configures claim topics (KYC, Accreditation, Jurisdiction)
 * 3. Adds deployer as trusted issuer for testing
 */

// Claim topics for ERC-3643 compliance
const CLAIM_TOPICS = {
  KYC: 1,
  ACCREDITATION: 2,
  JURISDICTION: 3,
  AML: 4,
  QUALIFIED_INVESTOR: 5,
};

async function main() {
  console.log("\n============================================");
  console.log("LMA Loan Tokenization - Contract Deployment");
  console.log("============================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // ============ Deploy LoanTokenFactory ============
  console.log("1. Deploying LoanTokenFactory...");
  const LoanTokenFactory = await ethers.getContractFactory("LoanTokenFactory");
  const factory = await LoanTokenFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("   LoanTokenFactory deployed to:", factoryAddress);

  // Get shared infrastructure addresses (auto-deployed by factory)
  const claimTopicsRegistryAddress = await factory.sharedClaimTopicsRegistry();
  const trustedIssuersRegistryAddress = await factory.sharedTrustedIssuersRegistry();
  console.log("   ClaimTopicsRegistry:", claimTopicsRegistryAddress);
  console.log("   TrustedIssuersRegistry:", trustedIssuersRegistryAddress);

  // ============ Configure ClaimTopicsRegistry ============
  console.log("\n2. Configuring ClaimTopicsRegistry...");
  const ClaimTopicsRegistry = await ethers.getContractFactory("ClaimTopicsRegistry");
  const claimTopicsRegistry = ClaimTopicsRegistry.attach(claimTopicsRegistryAddress);

  // Add claim topics
  for (const [name, topic] of Object.entries(CLAIM_TOPICS)) {
    try {
      const tx = await claimTopicsRegistry.addClaimTopic(topic);
      await tx.wait();
      console.log(`   Added claim topic: ${name} (${topic})`);
    } catch (error) {
      if (error.message.includes("TOPIC_EXISTS")) {
        console.log(`   Topic ${name} (${topic}) already exists`);
      } else {
        throw error;
      }
    }
  }

  // ============ Add Deployer as Trusted Issuer ============
  console.log("\n3. Adding deployer as trusted issuer (for testing)...");
  const TrustedIssuersRegistry = await ethers.getContractFactory("TrustedIssuersRegistry");
  const trustedIssuersRegistry = TrustedIssuersRegistry.attach(trustedIssuersRegistryAddress);

  // Add deployer as trusted issuer for all claim topics
  const allTopics = Object.values(CLAIM_TOPICS);
  try {
    const tx = await trustedIssuersRegistry.addTrustedIssuer(deployer.address, allTopics);
    await tx.wait();
    console.log(`   Deployer added as trusted issuer for topics: [${allTopics.join(", ")}]`);
  } catch (error) {
    if (error.message.includes("ISSUER_EXISTS")) {
      console.log("   Deployer already registered as trusted issuer");
    } else {
      throw error;
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
  console.log("\n4. Saved deployment info to deployments.json");

  // ============ Output Environment Variables ============
  console.log("\n============================================");
  console.log("Deployment Complete!");
  console.log("============================================\n");
  console.log("Add these to your .env.local file:\n");
  console.log(`NEXT_PUBLIC_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`NEXT_PUBLIC_CLAIM_TOPICS_REGISTRY=${claimTopicsRegistryAddress}`);
  console.log(`NEXT_PUBLIC_TRUSTED_ISSUERS_REGISTRY=${trustedIssuersRegistryAddress}`);
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
