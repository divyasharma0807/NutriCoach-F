# NutriCoach Backend - K6 Testing Infrastructure

This directory contains the reusable K6 load testing framework and utilities for validating the performance, throughput, and stability of the NutriCoach backend services.

---

## Folder Structure

```
backend/tests/k6/
├── config/
│   ├── config.js          # Environment variables mapping & stage profiles
│   ├── constants.js       # User roles, HTTP methods, status codes, and headers
│   └── thresholds.js      # SLA threshold metric definitions (profile-specific & env-customizable)
├── data/                  # Storage folder for seed output files (CSV credentials)
├── scenarios/             # K6 test execution scripts
│   ├── login.js           # Authentication load testing scenario
│   ├── getMe.js           # Authenticated user identity load testing scenario
│   ├── clientDashboard.js # Client progress dashboard load testing scenario
│   ├── notifications.js   # User notifications list load testing scenario
│   ├── sessions.js        # User sessions list load testing scenario
│   ├── coachDashboard.js  # Coach dashboard stats list load testing scenario
│   └── dietPlan.js        # Client active diet plan load testing scenario
├── utils/
│   ├── auth.js            # Reusable login and header helpers (e.g. loginAndGetToken)
│   ├── responseValidators.js # Pure contract checkers (returns { valid, errors })
│   ├── csv.js             # Quote-aware CSV parsing and row lookups
│   ├── checks.js          # Standard status code & response assertions
│   ├── helpers.js         # Sleep-pacing think times & array randomizers
│   └── reporter.js        # Export HTML and JSON summaries
├── reports/               # Outputs directory for summary.html & summary.json
├── fixtures/              # Reusable mock requests payloads (empty for now)
└── customMetrics/
    └── metrics.js         # Shared custom Trends, Counters, Rates, and Gauges
```

---

## Installation

K6 runs as a standalone binary on your OS. Install it using the appropriate package manager:

* **macOS (Homebrew)**:
  ```bash
  brew install k6
  ```
* **Windows (Chocolatey)**:
  ```powershell
  choco install k6
  ```
* **Linux (APT/Debian)**:
  ```bash
  sudo apt-get install k6
  ```

---

## Environment Variables Configuration

The testing framework can be configured dynamically at runtime using `__ENV` variable arguments with the `-e` flag.

### Core Mappings
| Environment Variable | Description | Default Value |
|----------------------|-------------|---------------|
| `TEST_ENV` | Target environment (`development`, `staging`, `production`) | `development` |
| `BASE_URL` | Target server host URL (Overrides `TEST_ENV` settings) | `http://localhost:5001` (Development base) |
| `REQUEST_TIMEOUT` | Max timeout for HTTP request in ms | `60000` |
| `TEST_PROFILE` | Stage profile (`smoke`, `load`, `stress`, `spike`, `soak`, `ramp`) | `smoke` |
| `ENABLE_HTML_REPORT` | Toggle graphical HTML report generation (`true`/`false`) | `true` |
| `ENABLE_JSON_REPORT` | Toggle raw JSON metrics data log (`true`/`false`) | `true` |
| `CSV_FILE_PATH` | Path of credential seed CSV relative to execution context | `data/credentials.csv` |

### Dynamic Scenario Overrides
| Environment Variable | Description | Target Behavior |
|----------------------|-------------|-----------------|
| `TEST_VUS` / `K6_VUS` | Override number of concurrent VUs | Sets concurrent VU counts directly on simple profiles, or scales stage target VUs proportionally on multi-stage profiles |
| `TEST_DURATION` / `K6_DURATION` | Override stage execution times | Overwrites duration directly on simple profiles, or overwrites duration of every stage in multi-stage profiles |
| `TEST_STAGES` | Custom stage JSON config string | Overrides the entire stages array with custom durations and target VUs |

---

## Reusable Performance Profiles

Drive different performance checks using the `TEST_PROFILE` environment variable. Scenario code is 100% decoupled from execution profiles:

### 1. Smoke Profile (`smoke`)
* **Objective**: Verifies the endpoint functions correctly under minimal load (single user).
* **Load Pattern**: 1 VU for 10s.

### 2. Load Profile (`load`)
* **Objective**: Asserts application latency and checks behavior under normal concurrent conditions.
* **Load Pattern**: Ramp up to 10 VUs in 30s, hold 10 VUs for 1m, ramp down in 30s.

### 3. Stress Profile (`stress`)
* **Objective**: Determines performance limits and evaluates stability during heavy workloads.
* **Load Pattern**: Ramp up to 25 VUs in 30s, hold 25 VUs for 1m, ramp down in 30s.

### 4. Spike Profile (`spike`)
* **Objective**: Observes server recovery rates after sudden massive influxes of traffic.
* **Load Pattern**: Spike to 50 VUs in 10s, hold 50 VUs for 30s, ramp down in 10s.

### 5. Soak Profile (`soak`)
* **Objective**: Detects slow memory leaks, resource exhaustion, and database connection degradation.
* **Load Pattern**: Ramp to 5 VUs in 1m, hold 5 VUs for 10m, ramp down in 1m.

### 6. Ramp Profile (`ramp`)
* **Objective**: Simulates a gradual step-by-step traffic progression to evaluate scaling curves.
* **Load Pattern**:
  * 1 VU for 30s
  * 5 VUs for 1m
  * 10 VUs for 2m
  * 20 VUs for 2m
  * 50 VUs for 2m
  * 20 VUs for 1m
  * 5 VUs for 30s
  * Ramp down to 0 in 10s

---

## Running the Scenarios with Advanced Profiles

To run load tests, execute from the `backend/` directory:

### Examples for Every Profile

```bash
# 1. Smoke Profile (Targeting GET /api/auth/me)
k6 run -e TEST_PROFILE=smoke -e BASE_URL=https://nutricoach-f-production.up.railway.app tests/k6/scenarios/getMe.js

# 2. Load Profile (Targeting GET /api/clients/dashboard)
k6 run -e TEST_PROFILE=load -e BASE_URL=https://nutricoach-f-production.up.railway.app tests/k6/scenarios/clientDashboard.js

# 3. Stress Profile (Targeting GET /api/notifications)
k6 run -e TEST_PROFILE=stress -e BASE_URL=https://nutricoach-f-production.up.railway.app tests/k6/scenarios/notifications.js

# 4. Spike Profile (Targeting GET /api/sessions)
k6 run -e TEST_PROFILE=spike -e BASE_URL=https://nutricoach-f-production.up.railway.app tests/k6/scenarios/sessions.js

# 5. Soak Profile (Targeting GET /api/coaches/dashboard)
k6 run -e TEST_PROFILE=soak -e BASE_URL=https://nutricoach-f-production.up.railway.app tests/k6/scenarios/coachDashboard.js

# 6. Ramp Profile (Targeting GET /api/diet-plans/my-plan)
k6 run -e TEST_PROFILE=ramp -e BASE_URL=https://nutricoach-f-production.up.railway.app tests/k6/scenarios/dietPlan.js
```

### Examples with Dynamic Overrides

```bash
# Override Smoke Profile to run with 5 VUs for 30s
k6 run -e TEST_PROFILE=smoke -e TEST_VUS=5 -e TEST_DURATION=30s -e BASE_URL=https://nutricoach-f-production.up.railway.app tests/k6/scenarios/login.js

# Scale Load Profile stages to peak at 20 VUs instead of 10 VUs
k6 run -e TEST_PROFILE=load -e TEST_VUS=20 -e BASE_URL=https://nutricoach-f-production.up.railway.app tests/k6/scenarios/login.js

# Pass a completely custom stages configuration via JSON string
k6 run -e TEST_STAGES='[{"duration":"15s","target":3},{"duration":"30s","target":3},{"duration":"15s","target":0}]' -e BASE_URL=https://nutricoach-f-production.up.railway.app tests/k6/scenarios/login.js
```
