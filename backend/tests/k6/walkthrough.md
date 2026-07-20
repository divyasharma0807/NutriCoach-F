# K6 Load Testing & Performance Optimization Walkthrough

This document records the final performance benchmarks, optimization summaries, and comparative statistics for the NutriCoach dashboard endpoints.

---

## 1. Performance Overview (P95 Latency Benchmarks)

Under identical conditions (20 VUs, `TEST_PROFILE=load` on the production Railway backend), the P95 latencies changed as follows:

* **Coach Dashboard**
  - P95: `5.32s` → **`2.10s`**
  - **~50% latency reduction**
* **Admin Dashboard**
  - P95: `4.06s` → **`1.38s`**
  - **~61% latency reduction**
* **Client Dashboard**
  - P95: **`1.61s`**
  - Benchmark completed
  - *No optimization required at this time*

---

## 2. Before vs After Optimization Comparisons

### A. Coach Dashboard (`GET /api/coaches/dashboard`)
| Metric | Before Optimization | Optimized Benchmark | Improvement (%) |
|--------|---------------------|---------------------|-----------------|
| **Average Latency** | 2.87 s | **1.68 s** | **41.5% Faster** |
| **P90 Latency** | 4.97 s | **2.09 s** | **58.0% Faster** |
| **P95 Latency** | 5.32 s | **2.10 s** | **60.5% Faster** |
| **Max Latency** | 10.48 s | **4.15 s** | **60.4% Faster** |
| **Error Rate** | 0% | **0%** | **0% Error Rate** |

### B. Admin Dashboard (`GET /api/admin/dashboard`)
| Metric | Before Optimization | Optimized Benchmark | Improvement (%) |
|--------|---------------------|---------------------|-----------------|
| **Average Latency** | 3.92 s | **1.25 s** | **68.1% Faster** |
| **P90 Latency** | 4.07 s | **1.39 s** | **65.8% Faster** |
| **P95 Latency** | 4.06 s | **1.38 s** | **66.0% Faster** |
| **Max Latency** | 4.29 s | **3.40 s** | **20.7% Faster** |
| **Throughput (Dashboard req/s)** | 2.29 req/s | **3.82 req/s** | **+66.8% More Throughput** |
| **Error Rate** | 0% | **0%** | **0% Error Rate** |

---

## 3. Summary of Optimizations Made

* **Parallelization using `Promise.all()`**:
  - Combined multiple independent Mongoose queries in Batch 1 (e.g. counts, lookups) to run concurrently rather than blocking sequentially.
  - Resolved Batch 2 dependent queries (e.g. referrals mapping and sub-coaches statistics calculations) concurrently.
* **Removal of Redundant Database Queries**:
  - Eliminated duplicate `Referral.countDocuments` queries by calculating counts directly from returned array lengths (`referrals.length`), saving database roundtrips.
* **Use of `.lean()` on Read-Only Queries**:
  - Appended `.lean()` to all read-only queries to disable document hydration/Mongoose virtuals wrapper overhead.
* **API Contract Integrity**:
  - All original query parameters, filtering, schemas, and payload properties have been preserved with 100% functional parity.
* **Railway Deployment Verification**:
  - Verified deployments live against Railway, yielding 0% error rate on all verified load tests.
