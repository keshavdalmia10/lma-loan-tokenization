const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Seed Script for ERC-3643 Loan Tokenization
 *
 * This script:
 * 1. Creates a sample loan token via the factory
 * 2. Registers test investor identities
 * 3. Issues tokens to investors
 * 4. Executes a test transfer
 */

// Country codes (ISO 3166-1 numeric)
const COUNTRY_CODES = {
  US: 840,
  DE: 276,
  GB: 826,
  SG: 702,
};

async function main() {
  console.log("\n============================================");
  console.log("LMA Loan Tokenization - Chain Seeding");
  console.log("============================================\n");

  // Load deployment info
  const deploymentsPath = path.join(__dirname, "..", "deployments.json");
  if (!fs.existsSync(deploymentsPath)) {
    console.error("deployments.json not found. Run deploy.js first.");
    process.exit(1);
  }
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));

  const [deployer, investor1, investor2, investor3] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Investor 1 (Goldman):", investor1.address);
  console.log("Investor 2 (BlackRock):", investor2.address);
  console.log("Investor 3 (Deutsche):", investor3.address);

  // ============ Get Factory Contract ============
  const LoanTokenFactory = await ethers.getContractFactory("LoanTokenFactory");
  const factory = LoanTokenFactory.attach(deployments.contracts.LoanTokenFactory);

  // ============ Create Sample Loan Token ============
  console.log("\n1. Creating sample loan token...");

  const loanParams = {
    name: "Acme Industrial Loan Token",
    symbol: "LT-ACME",
    borrowerName: "Acme Industrial Holdings Ltd.",
    facilityAmount: ethers.parseUnits("250000000", 0), // $250M (no decimals for cent representation)
    interestRateBps: 475, // 4.75%
    maturityDate: Math.floor(new Date("2029-11-15").getTime() / 1000),
    nelProtocolId: "NEL-2024-DEMO001",
    documentHash: ethers.keccak256(ethers.toUtf8Bytes("acme_credit_agreement_2024.pdf")),
  };

  const tx = await factory.createLoanToken(
    loanParams.name,
    loanParams.symbol,
    loanParams.borrowerName,
    loanParams.facilityAmount,
    loanParams.interestRateBps,
    loanParams.maturityDate,
    loanParams.nelProtocolId,
    loanParams.documentHash
  );

  const receipt = await tx.wait();

  // Get token address from event
  const tokenCreatedEvent = receipt.logs.find(
    log => log.fragment && log.fragment.name === "LoanTokenCreated"
  );
  const tokenAddress = tokenCreatedEvent.args[0];

  console.log("   Loan token created at:", tokenAddress);

  // Get infrastructure addresses
  const [identityRegistryAddr, complianceAddr] = await factory.getTokenInfrastructure(tokenAddress);
  console.log("   Identity Registry:", identityRegistryAddr);
  console.log("   Compliance:", complianceAddr);

  // ============ Get Contract Instances ============
  const LoanToken = await ethers.getContractFactory("LoanToken");
  const loanToken = LoanToken.attach(tokenAddress);

  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = IdentityRegistry.attach(identityRegistryAddr);

  // ============ Register Investor Identities ============
  console.log("\n2. Registering investor identities...");

  const investors = [
    { signer: investor1, name: "Goldman Sachs", country: COUNTRY_CODES.US },
    { signer: investor2, name: "BlackRock", country: COUNTRY_CODES.US },
    { signer: investor3, name: "Deutsche Bank", country: COUNTRY_CODES.DE },
  ];

  for (const investor of investors) {
    // For simplicity, use the wallet address as the identity address
    // In production, this would be an ONCHAINID contract
    const identityAddress = investor.signer.address;

    try {
      const regTx = await identityRegistry.registerIdentity(
        investor.signer.address,
        identityAddress,
        investor.country
      );
      await regTx.wait();
      console.log(`   Registered ${investor.name}: ${investor.signer.address} (Country: ${investor.country})`);
    } catch (error) {
      if (error.message.includes("ALREADY_REGISTERED")) {
        console.log(`   ${investor.name} already registered`);
      } else {
        throw error;
      }
    }
  }

  // ============ Issue Tokens to Investors ============
  console.log("\n3. Issuing tokens to investors...");

  const PRIMARY_PARTITION = ethers.keccak256(ethers.toUtf8Bytes("PRIMARY"));

  const allocations = [
    { investor: investor1, units: 50 }, // 50%
    { investor: investor2, units: 30 }, // 30%
    { investor: investor3, units: 20 }, // 20%
  ];

  for (const allocation of allocations) {
    const issueTx = await loanToken.issue(
      allocation.investor.address,
      allocation.units,
      PRIMARY_PARTITION
    );
    await issueTx.wait();
    console.log(`   Issued ${allocation.units} units to ${allocation.investor.address}`);
  }

  // Verify total supply
  const totalSupply = await loanToken.totalSupply();
  console.log(`   Total supply: ${totalSupply} units`);

  // ============ Execute Test Transfer ============
  console.log("\n4. Executing test transfer (Goldman -> BlackRock: 10 units)...");

  // Transfer 10 units from investor1 (Goldman) to investor2 (BlackRock)
  const transferTx = await loanToken.connect(investor1).transferByPartition(
    PRIMARY_PARTITION,
    investor2.address,
    10,
    "0x" // empty data
  );
  const transferReceipt = await transferTx.wait();
  console.log("   Transfer successful! TxHash:", transferReceipt.hash);

  // ============ Verify Balances ============
  console.log("\n5. Verifying balances...");

  for (let i = 0; i < investors.length; i++) {
    const investor = investors[i];
    const balance = await loanToken.balanceOfByPartition(PRIMARY_PARTITION, investor.signer.address);
    const isVerified = await identityRegistry.isVerified(investor.signer.address);
    console.log(`   ${investor.name}: ${balance} units (Verified: ${isVerified})`);
  }

  // ============ Update Deployments ============
  deployments.sampleToken = {
    address: tokenAddress,
    name: loanParams.name,
    symbol: loanParams.symbol,
    nelProtocolId: loanParams.nelProtocolId,
    identityRegistry: identityRegistryAddr,
    compliance: complianceAddr,
  };
  deployments.investors = investors.map((inv, i) => ({
    name: inv.name,
    address: inv.signer.address,
    country: inv.country,
    initialAllocation: allocations[i].units,
  }));

  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log("\n6. Updated deployments.json with sample token and investors");

  // ============ Summary ============
  console.log("\n============================================");
  console.log("Chain Seeding Complete!");
  console.log("============================================\n");
  console.log("Sample Loan Token:");
  console.log(`  Address: ${tokenAddress}`);
  console.log(`  Symbol: ${loanParams.symbol}`);
  console.log(`  NEL ID: ${loanParams.nelProtocolId}`);
  console.log(`  Total Units: ${totalSupply}`);
  console.log("\nInvestor Balances (after transfer):");
  console.log("  Goldman Sachs: 40 units");
  console.log("  BlackRock: 40 units");
  console.log("  Deutsche Bank: 20 units");
  console.log("");
}

main()
  .then(() => {
    console.log("Seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
