-- CreateEnum
CREATE TYPE "InterestType" AS ENUM ('fixed', 'floating');

-- CreateEnum
CREATE TYPE "FacilityType" AS ENUM ('term_loan', 'revolver', 'delayed_draw', 'bridge');

-- CreateEnum
CREATE TYPE "SecurityType" AS ENUM ('secured', 'unsecured');

-- CreateEnum
CREATE TYPE "SeniorityRank" AS ENUM ('senior', 'subordinated', 'mezzanine');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('pending', 'processing', 'parsed', 'error');

-- CreateEnum
CREATE TYPE "CovenantType" AS ENUM ('financial', 'affirmative', 'negative', 'reporting');

-- CreateEnum
CREATE TYPE "TestingFrequency" AS ENUM ('monthly', 'quarterly', 'annually');

-- CreateEnum
CREATE TYPE "CovenantStatus" AS ENUM ('compliant', 'warning', 'breach', 'pending');

-- CreateEnum
CREATE TYPE "KPIStatus" AS ENUM ('on_track', 'at_risk', 'missed', 'pending');

-- CreateEnum
CREATE TYPE "FormulaType" AS ENUM ('right', 'obligation', 'condition', 'trigger');

-- CreateEnum
CREATE TYPE "TokenPartition" AS ENUM ('PRIMARY', 'SECONDARY');

-- CreateEnum
CREATE TYPE "TokenizationStatus" AS ENUM ('pending', 'minted', 'trading', 'redeemed');

-- CreateEnum
CREATE TYPE "ParticipantType" AS ENUM ('bank', 'fund', 'insurance', 'pension', 'corporate', 'sovereign');

-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('pending', 'validating', 'approved', 'executed', 'settled', 'rejected');

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "nelId" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "borrowerName" TEXT NOT NULL,
    "facilityAmount" BIGINT NOT NULL,
    "interestRateBps" INTEGER NOT NULL,
    "interestType" "InterestType" NOT NULL,
    "spread" INTEGER,
    "referenceRate" TEXT,
    "maturityDate" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "facilityType" "FacilityType" NOT NULL,
    "securityType" "SecurityType" NOT NULL,
    "seniorityRank" "SeniorityRank" NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "DocumentStatus" NOT NULL,
    "hash" TEXT,
    "fileUrl" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Covenant" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "type" "CovenantType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION,
    "testingFrequency" "TestingFrequency" NOT NULL,
    "currentValue" DOUBLE PRECISION,
    "status" "CovenantStatus" NOT NULL,

    CONSTRAINT "Covenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LenderPosition" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "lenderName" TEXT NOT NULL,
    "commitment" BIGINT NOT NULL,
    "fundedAmount" BIGINT NOT NULL,
    "unfundedAmount" BIGINT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "isLeadArranger" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LenderPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ESGData" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "hasESGLinking" BOOLEAN NOT NULL,
    "sustainabilityCoordinator" TEXT,
    "marginAdjustment" INTEGER,

    CONSTRAINT "ESGData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ESGKPI" (
    "id" TEXT NOT NULL,
    "esgDataId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "current" DOUBLE PRECISION,
    "unit" TEXT NOT NULL,
    "status" "KPIStatus" NOT NULL,

    CONSTRAINT "ESGKPI_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NF2Formula" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FormulaType" NOT NULL,
    "description" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "isOnChain" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NF2Formula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tokenization" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "tokenAddress" TEXT,
    "tokenSymbol" TEXT NOT NULL,
    "totalUnits" INTEGER NOT NULL,
    "unitValue" BIGINT NOT NULL,
    "partition" "TokenPartition" NOT NULL,
    "status" "TokenizationStatus" NOT NULL,
    "mintedAt" TIMESTAMP(3),
    "blockchain" TEXT NOT NULL DEFAULT 'Hardhat',
    "chainId" INTEGER NOT NULL DEFAULT 31337,
    "identityRegistry" TEXT,
    "compliance" TEXT,

    CONSTRAINT "Tokenization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ParticipantType" NOT NULL,
    "walletAddress" TEXT,
    "kycStatus" "KYCStatus" NOT NULL,
    "accreditedInvestor" BOOLEAN NOT NULL DEFAULT false,
    "jurisdiction" TEXT NOT NULL,
    "lockupEndDate" TIMESTAMP(3),
    "identityContract" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityClaim" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "topic" INTEGER NOT NULL,
    "issuer" TEXT NOT NULL,
    "isValid" BOOLEAN NOT NULL,
    "signature" TEXT,
    "data" TEXT,
    "uri" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdentityClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenBalance" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "balance" INTEGER NOT NULL,
    "frozenAmount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "units" INTEGER NOT NULL,
    "pricePerUnit" BIGINT NOT NULL,
    "totalValue" BIGINT NOT NULL,
    "status" "TradeStatus" NOT NULL,
    "validation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),
    "txHash" TEXT,
    "settlementTime" DOUBLE PRECISION,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustedIssuer" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "claimTopics" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustedIssuer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Loan_nelId_key" ON "Loan"("nelId");

-- CreateIndex
CREATE INDEX "Loan_borrowerName_idx" ON "Loan"("borrowerName");

-- CreateIndex
CREATE INDEX "Loan_createdAt_idx" ON "Loan"("createdAt");

-- CreateIndex
CREATE INDEX "Document_loanId_idx" ON "Document"("loanId");

-- CreateIndex
CREATE INDEX "Covenant_loanId_idx" ON "Covenant"("loanId");

-- CreateIndex
CREATE INDEX "LenderPosition_loanId_idx" ON "LenderPosition"("loanId");

-- CreateIndex
CREATE UNIQUE INDEX "ESGData_loanId_key" ON "ESGData"("loanId");

-- CreateIndex
CREATE INDEX "ESGKPI_esgDataId_idx" ON "ESGKPI"("esgDataId");

-- CreateIndex
CREATE INDEX "NF2Formula_loanId_idx" ON "NF2Formula"("loanId");

-- CreateIndex
CREATE UNIQUE INDEX "Tokenization_loanId_key" ON "Tokenization"("loanId");

-- CreateIndex
CREATE INDEX "Tokenization_tokenAddress_idx" ON "Tokenization"("tokenAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_walletAddress_key" ON "Participant"("walletAddress");

-- CreateIndex
CREATE INDEX "Participant_walletAddress_idx" ON "Participant"("walletAddress");

-- CreateIndex
CREATE INDEX "Participant_name_idx" ON "Participant"("name");

-- CreateIndex
CREATE INDEX "IdentityClaim_participantId_idx" ON "IdentityClaim"("participantId");

-- CreateIndex
CREATE INDEX "IdentityClaim_topic_idx" ON "IdentityClaim"("topic");

-- CreateIndex
CREATE INDEX "TokenBalance_tokenAddress_idx" ON "TokenBalance"("tokenAddress");

-- CreateIndex
CREATE UNIQUE INDEX "TokenBalance_participantId_tokenAddress_key" ON "TokenBalance"("participantId", "tokenAddress");

-- CreateIndex
CREATE INDEX "Trade_loanId_idx" ON "Trade"("loanId");

-- CreateIndex
CREATE INDEX "Trade_status_idx" ON "Trade"("status");

-- CreateIndex
CREATE INDEX "Trade_createdAt_idx" ON "Trade"("createdAt");

-- CreateIndex
CREATE INDEX "Trade_tokenAddress_idx" ON "Trade"("tokenAddress");

-- CreateIndex
CREATE UNIQUE INDEX "TrustedIssuer_address_key" ON "TrustedIssuer"("address");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Covenant" ADD CONSTRAINT "Covenant_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LenderPosition" ADD CONSTRAINT "LenderPosition_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ESGData" ADD CONSTRAINT "ESGData_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ESGKPI" ADD CONSTRAINT "ESGKPI_esgDataId_fkey" FOREIGN KEY ("esgDataId") REFERENCES "ESGData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NF2Formula" ADD CONSTRAINT "NF2Formula_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tokenization" ADD CONSTRAINT "Tokenization_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityClaim" ADD CONSTRAINT "IdentityClaim_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenBalance" ADD CONSTRAINT "TokenBalance_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
