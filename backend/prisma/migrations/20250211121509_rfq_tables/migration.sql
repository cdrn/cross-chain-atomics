-- CreateTable
CREATE TABLE "Solver" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "supportedPairs" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Solver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQRequest" (
    "id" TEXT NOT NULL,
    "baseAsset" VARCHAR(10) NOT NULL,
    "quoteAsset" VARCHAR(10) NOT NULL,
    "baseChain" VARCHAR(20) NOT NULL,
    "quoteChain" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "direction" VARCHAR(4) NOT NULL,
    "timeToLive" INTEGER NOT NULL,
    "requesterAddress" TEXT NOT NULL,
    "status" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFQRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQQuote" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "solverId" TEXT NOT NULL,
    "baseAmount" DECIMAL(36,18) NOT NULL,
    "quoteAmount" DECIMAL(36,18) NOT NULL,
    "premium" DECIMAL(36,18) NOT NULL,
    "expiryTime" INTEGER NOT NULL,
    "signature" TEXT,
    "status" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFQQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQOrder" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "solverId" TEXT NOT NULL,
    "requesterAddress" TEXT NOT NULL,
    "solverAddress" TEXT NOT NULL,
    "baseAsset" VARCHAR(10) NOT NULL,
    "quoteAsset" VARCHAR(10) NOT NULL,
    "baseChain" VARCHAR(20) NOT NULL,
    "quoteChain" VARCHAR(20) NOT NULL,
    "baseAmount" DECIMAL(36,18) NOT NULL,
    "quoteAmount" DECIMAL(36,18) NOT NULL,
    "premium" DECIMAL(36,18) NOT NULL,
    "timelock" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "baseTxHash" TEXT,
    "quoteTxHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFQOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Solver_address_idx" ON "Solver"("address");

-- CreateIndex
CREATE INDEX "RFQRequest_baseAsset_quoteAsset_idx" ON "RFQRequest"("baseAsset", "quoteAsset");

-- CreateIndex
CREATE INDEX "RFQRequest_status_idx" ON "RFQRequest"("status");

-- CreateIndex
CREATE INDEX "RFQRequest_requesterAddress_idx" ON "RFQRequest"("requesterAddress");

-- CreateIndex
CREATE INDEX "RFQQuote_requestId_idx" ON "RFQQuote"("requestId");

-- CreateIndex
CREATE INDEX "RFQQuote_solverId_idx" ON "RFQQuote"("solverId");

-- CreateIndex
CREATE INDEX "RFQQuote_status_idx" ON "RFQQuote"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RFQOrder_requestId_key" ON "RFQOrder"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "RFQOrder_quoteId_key" ON "RFQOrder"("quoteId");

-- CreateIndex
CREATE INDEX "RFQOrder_status_idx" ON "RFQOrder"("status");

-- CreateIndex
CREATE INDEX "RFQOrder_requesterAddress_idx" ON "RFQOrder"("requesterAddress");

-- CreateIndex
CREATE INDEX "RFQOrder_solverAddress_idx" ON "RFQOrder"("solverAddress");

-- AddForeignKey
ALTER TABLE "RFQQuote" ADD CONSTRAINT "RFQQuote_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RFQRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQQuote" ADD CONSTRAINT "RFQQuote_solverId_fkey" FOREIGN KEY ("solverId") REFERENCES "Solver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQOrder" ADD CONSTRAINT "RFQOrder_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RFQRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQOrder" ADD CONSTRAINT "RFQOrder_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "RFQQuote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQOrder" ADD CONSTRAINT "RFQOrder_solverId_fkey" FOREIGN KEY ("solverId") REFERENCES "Solver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
