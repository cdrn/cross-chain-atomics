-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Raw price data from exchanges
CREATE TABLE exchange_prices (
    timestamp TIMESTAMPTZ NOT NULL,
    exchange VARCHAR(50) NOT NULL,
    base_asset VARCHAR(10) NOT NULL,
    quote_asset VARCHAR(10) NOT NULL,
    price DECIMAL(24,8) NOT NULL,
    volume_base DECIMAL(24,8) NOT NULL,
    volume_quote DECIMAL(24,8) NOT NULL
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('exchange_prices', 'timestamp');

-- Create index for faster querying
CREATE INDEX idx_exchange_prices_assets 
ON exchange_prices(base_asset, quote_asset, exchange);

-- Consolidated prices (volume-weighted average)
CREATE TABLE consolidated_prices (
    timestamp TIMESTAMPTZ NOT NULL,
    base_asset VARCHAR(10) NOT NULL,
    quote_asset VARCHAR(10) NOT NULL,
    vwap DECIMAL(24,8) NOT NULL,
    total_volume_base DECIMAL(24,8) NOT NULL,
    total_volume_quote DECIMAL(24,8) NOT NULL,
    num_exchanges INTEGER NOT NULL
);

SELECT create_hypertable('consolidated_prices', 'timestamp');

-- Volatility metrics
CREATE TABLE volatility_metrics (
    timestamp TIMESTAMPTZ NOT NULL,
    base_asset VARCHAR(10) NOT NULL,
    quote_asset VARCHAR(10) NOT NULL,
    volatility_1h DECIMAL(10,4),
    volatility_24h DECIMAL(10,4),
    volatility_7d DECIMAL(10,4),
    sample_count_1h INTEGER,
    sample_count_24h INTEGER,
    sample_count_7d INTEGER,
    last_updated TIMESTAMPTZ NOT NULL
);

SELECT create_hypertable('volatility_metrics', 'timestamp');

-- Create materialized view for hourly VWAP
CREATE MATERIALIZED VIEW hourly_vwap
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', timestamp) AS bucket,
    base_asset,
    quote_asset,
    SUM(price * volume_base) / SUM(volume_base) as vwap,
    SUM(volume_base) as total_volume_base,
    SUM(volume_quote) as total_volume_quote,
    COUNT(DISTINCT exchange) as num_exchanges
FROM exchange_prices
GROUP BY bucket, base_asset, quote_asset
WITH NO DATA;

-- Refresh policy for the materialized view
SELECT add_continuous_aggregate_policy('hourly_vwap',
    start_offset => INTERVAL '2 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour'); 