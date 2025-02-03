-- CreateTable
CREATE TABLE "ExchangePrice" (
    "timestamp" TIMESTAMPTZ NOT NULL,
    "exchange" VARCHAR(50) NOT NULL,
    "baseAsset" VARCHAR(10) NOT NULL,
    "quoteAsset" VARCHAR(10) NOT NULL,
    "price" DECIMAL(24,8) NOT NULL,
    "volumeBase" DECIMAL(24,8) NOT NULL,
    "volumeQuote" DECIMAL(24,8) NOT NULL,

    CONSTRAINT "ExchangePrice_pkey" PRIMARY KEY ("timestamp","exchange","baseAsset","quoteAsset")
);

-- CreateTable
CREATE TABLE "ConsolidatedPrice" (
    "timestamp" TIMESTAMPTZ NOT NULL,
    "baseAsset" VARCHAR(10) NOT NULL,
    "quoteAsset" VARCHAR(10) NOT NULL,
    "vwap" DECIMAL(24,8) NOT NULL,
    "totalVolumeBase" DECIMAL(24,8) NOT NULL,
    "totalVolumeQuote" DECIMAL(24,8) NOT NULL,
    "numExchanges" INTEGER NOT NULL,

    CONSTRAINT "ConsolidatedPrice_pkey" PRIMARY KEY ("timestamp","baseAsset","quoteAsset")
);

-- CreateTable
CREATE TABLE "VolatilityMetric" (
    "timestamp" TIMESTAMPTZ NOT NULL,
    "baseAsset" VARCHAR(10) NOT NULL,
    "quoteAsset" VARCHAR(10) NOT NULL,
    "volatility1h" DECIMAL(10,4),
    "volatility24h" DECIMAL(10,4),
    "volatility7d" DECIMAL(10,4),
    "sampleCount1h" INTEGER,
    "sampleCount24h" INTEGER,
    "sampleCount7d" INTEGER,
    "lastUpdated" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "VolatilityMetric_pkey" PRIMARY KEY ("timestamp","baseAsset","quoteAsset")
);

-- CreateIndex
CREATE INDEX "ExchangePrice_baseAsset_quoteAsset_exchange_idx" ON "ExchangePrice"("baseAsset", "quoteAsset", "exchange");
