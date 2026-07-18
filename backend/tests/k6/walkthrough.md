# K6 Load Testing - Walkthrough (Phases 5.1 - 6.0)

This walkthrough documents the completion of the K6 load testing suite, including **Phase 6: Reusable Performance Test Profiles** for the NutriCoach backend.

---

## Files Created & Updated

### 1. Configuration Options
- **[config/config.js](file:///Users/parthnayak/Documents/Projects_code/Projects/NutriCoach-F/backend/tests/k6/config/config.js) [UPDATED]**:
  - Implemented the realistic step-by-step traffic progression for the `ramp` profile preset:
    - 1 VU (30s) -> 5 VUs (1m) -> 10 VUs (2m) -> 20 VUs (2m) -> 50 VUs (2m) -> 20 VUs (1m) -> 5 VUs (30s) -> 0 VUs (10s)
  - Refactored option resolution `getProfileOptions` to support the following environment overrides:
    - `TEST_STAGES`: Directly overrides K6 stages using a JSON string.
    - `TEST_VUS` / `K6_VUS`: Directly overrides the VU count on simple profiles, or scales stage targets proportionally on multi-stage profiles to match the peak target VUs.
    - `TEST_DURATION` / `K6_DURATION`: Directly overrides duration on simple profiles, or overrides the duration of every stage in multi-stage profiles.

### 2. Configuration Mappings
- **[README.md](file:///Users/parthnayak/Documents/Projects_code/Projects/NutriCoach-F/backend/tests/k6/README.md) [UPDATED]**:
  - Added documentation covering the definition, objective, and stages configuration of all 6 profiles (`smoke`, `load`, `stress`, `spike`, `soak`, `ramp`).
  - Added CLI execution examples illustrating profile selection and dynamic stage overrides.

---

## Verification & Execution

### 1. Custom Stages Override Verification:
* **Command**:
  ```bash
  k6 run -e TEST_PROFILE=load -e TEST_STAGES='[{"duration":"2s","target":2},{"duration":"2s","target":2},{"duration":"2s","target":0}]' -e BASE_URL=https://nutricoach-f-production.up.railway.app tests/k6/scenarios/getMe.js
  ```
* **Outcome**: **Passed (SLA threshold checked)**. K6 successfully parsed `TEST_STAGES` and executed:
  `Up to 2 looping VUs for 6s over 3 stages`

### 2. Ramp Profile Scaling Verification:
* **Command**:
  ```bash
  k6 run -e TEST_PROFILE=ramp -e TEST_VUS=5 -e TEST_DURATION=2s -e BASE_URL=https://nutricoach-f-production.up.railway.app tests/k6/scenarios/getMe.js
  ```
* **Outcome**: **Passed (SLA threshold checked)**. K6 successfully scaled the peak target of the `ramp` profile to `5` and each stage duration to `2s`, executing:
  `Up to 5 looping VUs for 16s over 8 stages`
