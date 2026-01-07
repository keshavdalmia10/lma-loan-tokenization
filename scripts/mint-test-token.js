const { ethers } = require("hardhat");

/**
 * Mint a test loan token on Base Sepolia
 *
 * This script deploys a LoanToken with its required infrastructure
 * and registers it with the LoanTokenFactoryLight.
 */

async function main() {
  console.log("\n============================================");
  console.log("Minting Test Loan Token on Base Sepolia");
  console.log("============================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Get deployed addresses from environment
  const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS_BASE_SEPOLIA;
  const claimTopicsRegistryAddress = process.env.NEXT_PUBLIC_CLAIM_TOPICS_REGISTRY_BASE_SEPOLIA;
  const trustedIssuersRegistryAddress = process.env.NEXT_PUBLIC_TRUSTED_ISSUERS_REGISTRY_BASE_SEPOLIA;

  console.log("Using deployed contracts:");
  console.log("  Factory:", factoryAddress);
  console.log("  ClaimTopicsRegistry:", claimTopicsRegistryAddress);
  console.log("  TrustedIssuersRegistry:", trustedIssuersRegistryAddress);

  // ============ 1. Deploy IdentityRegistry for this token ============
  console.log("\n1. Deploying IdentityRegistry...");
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy(
    claimTopicsRegistryAddress,
    trustedIssuersRegistryAddress
  );
  await identityRegistry.waitForDeployment();
  const identityRegistryAddress = await identityRegistry.getAddress();
  console.log("   IdentityRegistry:", identityRegistryAddress);

  // ============ 2. Deploy Compliance for this token ============
  console.log("\n2. Deploying Compliance...");
  const Compliance = await ethers.getContractFactory("Compliance");
  const compliance = await Compliance.deploy();
  await compliance.waitForDeployment();
  const complianceAddress = await compliance.getAddress();
  console.log("   Compliance:", complianceAddress);

  // ============ 3. Deploy LoanToken ============
  console.log("\n3. Deploying LoanToken...");

  const tokenParams = {
    name: "Acme Corp Loan Token",
    symbol: "LT-ACME",
    borrowerName: "Acme Corporation",
    facilityAmount: ethers.parseUnits("10000000", 0), // $10M
    interestRateBps: 550, // 5.5%
    maturityDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year
    nelProtocolId: "nel-test-001",
    documentHash: ethers.keccak256(ethers.toUtf8Bytes("test-document-hash")),
  };

  const LoanToken = await ethers.getContractFactory("LoanToken");
  const loanToken = await LoanToken.deploy(
    tokenParams.name,
    tokenParams.symbol,
    tokenParams.borrowerName,
    tokenParams.facilityAmount,
    tokenParams.interestRateBps,
    tokenParams.maturityDate,
    tokenParams.nelProtocolId,
    tokenParams.documentHash,
    identityRegistryAddress,
    complianceAddress
  );
  await loanToken.waitForDeployment();
  const tokenAddress = await loanToken.getAddress();
  console.log("   LoanToken:", tokenAddress);

  // ============ 4. Bind Compliance to Token ============
  console.log("\n4. Binding compliance to token...");
  const bindTx = await compliance.bindToken(tokenAddress);
  await bindTx.wait();
  console.log("   Compliance bound to token");

  // ============ 5. Register deployer in Identity Registry ============
  console.log("\n5. Registering deployer identity...");
  // For testing, we use deployer as their own identity contract
  try {
    const registerTx = await identityRegistry.registerIdentity(
      deployer.address,
      deployer.address, // Using deployer as identity contract for testing
      840 // US country code
    );
    await registerTx.wait();
    console.log("   Deployer registered in IdentityRegistry");
  } catch (error) {
    if (error.message.includes("IDENTITY_ALREADY_EXISTS")) {
      console.log("   Deployer already registered");
    } else {
      throw error;
    }
  }

  // ============ 6. Set KYC and Accreditation for deployer ============
  console.log("\n6. Setting compliance status for deployer...");
  const kycTx = await loanToken.setKYCStatus(deployer.address, true);
  await kycTx.wait();
  console.log("   KYC status set to true");

  const accreditedTx = await loanToken.setAccreditedStatus(deployer.address, true);
  await accreditedTx.wait();
  console.log("   Accredited status set to true");

  // ============ 7. Issue initial tokens to deployer ============
  console.log("\n7. Issuing initial tokens...");
  const PRIMARY_PARTITION = "0x5052494d415259000000000000000000000000000000000000000000000000000";
  const issueTx = await loanToken.issue(deployer.address, 100, PRIMARY_PARTITION);
  await issueTx.wait();
  console.log("   Issued 100 tokens to deployer");

  // ============ 8. Register token with factory ============
  console.log("\n8. Registering token with factory...");
  const LoanTokenFactoryLight = await ethers.getContractFactory("LoanTokenFactoryLight");
  const factory = LoanTokenFactoryLight.attach(factoryAddress);

  const registerTokenTx = await factory.registerLoanToken(
    tokenAddress,
    tokenParams.nelProtocolId,
    identityRegistryAddress,
    complianceAddress
  );
  await registerTokenTx.wait();
  console.log("   Token registered with factory");

  // ============ Verify ============
  console.log("\n============================================");
  console.log("Test Token Minted Successfully!");
  console.log("============================================\n");

  console.log("Token Details:");
  console.log("  Address:", tokenAddress);
  console.log("  Name:", tokenParams.name);
  console.log("  Symbol:", tokenParams.symbol);
  console.log("  Borrower:", tokenParams.borrowerName);
  console.log("  Facility:", "$10,000,000");
  console.log("  Interest Rate:", "5.5%");
  console.log("  NEL Protocol ID:", tokenParams.nelProtocolId);
  console.log("");
  console.log("Infrastructure:");
  console.log("  IdentityRegistry:", identityRegistryAddress);
  console.log("  Compliance:", complianceAddress);
  console.log("");
  console.log("View on BaseScan:");
  console.log(`  https://sepolia.basescan.org/address/${tokenAddress}`);
  console.log("");

  // Check balance
  const balance = await loanToken.balanceOfByPartition(PRIMARY_PARTITION, deployer.address);
  console.log(`Deployer balance: ${balance} tokens`);

  return {
    tokenAddress,
    identityRegistryAddress,
    complianceAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Minting failed:", error);
    process.exit(1);
  });
