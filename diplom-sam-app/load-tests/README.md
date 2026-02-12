# Load Testing for SaaS Multi-Tenant Application

This directory contains load testing scripts for measuring SLI (Service Level Indicators), validating SLO (Service Level Objectives), and testing noisy neighbor isolation.

## Quick Start

```bash
# Run full noisy neighbor test (with setup)
./run-test.sh

# Run test and open report in browser
./run-test.sh --dashboard

# Skip setup (if tokens are fresh)
./run-test.sh --skip-setup
```

## Scripts

| Script               | Description                                        |
| -------------------- | -------------------------------------------------- |
| `run-test.sh`        | 🚀 Main script - runs complete noisy neighbor test |
| `get-tokens.sh`      | 🔐 Get JWT tokens for all tenants                  |
| `reset-quotas.sh`    | 🔄 Reset daily quotas to 10000                     |
| `set-rate-limits.sh` | ⚙️ Set rate limits for testing                     |
| `show-usage.sh`      | 📊 Show current usage statistics                   |
| `config.sh`          | ⚙️ Configuration (API keys, IDs, etc.)             |

## Prerequisites

### Install k6

```bash
# macOS
brew install k6

# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6
```

### Configure AWS CLI

Ensure AWS CLI is configured with appropriate credentials:

```bash
aws configure
```

## Noisy Neighbor Test

The main test (`all-tiers-noisy-neighbor-test.js`) validates tenant isolation across different pricing tiers:

### Test Scenarios

| Scenario          | Noisy Tenant | Victim Tenant | Expected Result               |
| ----------------- | ------------ | ------------- | ----------------------------- |
| BASIC → STANDARD  | BasicCorp    | StandardCorp  | Victim isolated (0% throttle) |
| BASIC → PLATINUM  | BasicCorp    | PlatinumCorp  | Victim isolated (0% throttle) |
| PREMIUM → PREMIUM | PremiumNoisy | PremiumCorp   | Victim isolated (0% throttle) |

### Rate Limits (Testing)

| Tier     | Rate Limit | Strategy                  |
| -------- | ---------- | ------------------------- |
| BASIC    | 10 req/s   | Per-tier shared           |
| STANDARD | 15 req/s   | Per-tier shared           |
| PREMIUM  | 20 req/s   | **Per-tenant individual** |
| PLATINUM | 50 req/s   | Dedicated                 |

## Manual Usage

### Get Tokens Only

```bash
./get-tokens.sh
```

### Reset Quotas Only

```bash
./reset-quotas.sh
```

### Check Current Usage

```bash
./show-usage.sh
```

### Set Rate Limits

```bash
./set-rate-limits.sh
```

## Configuration

Edit `config.sh` to update:

**SLI Measured:**

- `orders_latency`: GET /orders response time
- `products_latency`: GET /products response time
- `create_order_latency`: POST /order response time

**SLO Thresholds:**

- p50 < 200ms
- p95 < 500ms
- p99 < 1000ms
- Error rate < 1%

### 2. Noisy Neighbor Test (`noisy-neighbor-test.js`)

Tests rate limiting by simulating one tenant exceeding limits while another maintains normal usage.

```bash
k6 run noisy-neighbor-test.js
```

**Expected Results:**

- Noisy tenant should see 429 (Too Many Requests) responses
- Victim tenant should maintain normal latency and low error rate

### 3. Cold Start Test (`cold-start-test.js`)

Measures Lambda cold start times by invoking functions after periods of inactivity.

```bash
k6 run cold-start-test.js
```

**Note:** For accurate cold start measurement, also check CloudWatch Logs for `initDuration` metrics.

### 4. Tier Comparison Test (`tier-comparison-test.js`)

Compares performance across different tenant tiers (Platinum, Premium, Standard, Basic).

```bash
k6 run tier-comparison-test.js
```

**Rate Limits by Tier:**

- Platinum: 300 req/s
- Premium: 100 req/s
- Standard: 75 req/s
- Basic: 50 req/s

### 5. Onboarding Test (`onboarding-test.js`)

Measures time-to-onboard for new tenants (pooled vs silo).

```bash
k6 run onboarding-test.js
```

**⚠️ Warning:** This test creates actual tenants in your system. Clean up afterwards!

## Running Tests

### Run Individual Test

```bash
k6 run <test-file>.js
```

### Run All Tests

```bash
chmod +x run-all-tests.sh
./run-all-tests.sh
```

### Save Results to JSON

```bash
k6 run --out json=results.json latency-test.js
```

### With Summary Export

```bash
k6 run --summary-export=summary.json latency-test.js
```

## Analyzing Results

### Using Analysis Script

```bash
chmod +x analyze-results.sh
./analyze-results.sh ./results/20260125_120000
```

### Get CloudWatch Metrics

```bash
chmod +x get-cloudwatch-metrics.sh
./get-cloudwatch-metrics.sh 1  # Last 1 hour
```

## SLI/SLO Definitions

### Service Level Indicators (SLI)

| SLI          | Description                    | How Measured              |
| ------------ | ------------------------------ | ------------------------- |
| Latency      | Response time for API requests | p50, p95, p99 percentiles |
| Error Rate   | Percentage of failed requests  | HTTP 4xx/5xx responses    |
| Availability | System uptime                  | (1 - Error Rate) × 100    |
| Throughput   | Requests per second            | Total requests / duration |
| Cold Start   | Lambda initialization time     | CloudWatch initDuration   |

### Service Level Objectives (SLO)

| SLO          | Target  | Error Budget            |
| ------------ | ------- | ----------------------- |
| Latency p95  | < 500ms | 5% requests can exceed  |
| Error Rate   | < 1%    | 1% of requests can fail |
| Availability | 99.9%   | 0.1% downtime allowed   |

### Error Budget Calculation

```
Monthly Error Budget = Total Monthly Minutes × (1 - SLO)
Example: 43,200 min × (1 - 0.999) = 43.2 minutes of allowed downtime
```

## Output Format

k6 produces output like this:

```
     checks.........................: 98.50% ✓ 1970      ✗ 30
     data_received..................: 1.2 MB 6.0 kB/s
     data_sent......................: 234 kB 1.2 kB/s
     http_req_duration..............: avg=145.23ms p(50)=98ms p(95)=387ms p(99)=892ms
     http_reqs......................: 2000   10/s
     iterations.....................: 2000   10/s

     ✓ orders_latency p(50)<200
     ✓ orders_latency p(95)<500
     ✓ orders_latency p(99)<1000
```

## Thesis Integration

Use these metrics for your diploma thesis sections:

1. **SLI Section**: Report measured p50/p95/p99 latencies
2. **Noisy Neighbor**: Compare victim vs noisy tenant metrics
3. **Rate Limiting**: Show throttling effectiveness
4. **Cold Start**: Report init duration statistics
5. **Time-to-Onboard**: Compare pooled vs silo provisioning times
6. **SLO/SLA**: Define targets based on measured SLI
