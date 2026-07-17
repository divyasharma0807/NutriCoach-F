/**
 * Progression Helpers
 * Responsibility: Handles baseline health profile generation, staggered timeline calculations,
 * and journey-specific progression math (Weight Loss, Muscle Gain, Maintenance, Body Recomposition).
 */

import { faker } from '@faker-js/faker';

// List of supported journeys
const JOURNEYS = ['Weight Loss', 'Muscle Gain', 'Maintenance', 'Body Recomposition'];

/**
 * Generates a realistic baseline health profile for a client.
 * @param {object} client - Client record from context.
 * @returns {object} Baseline health profile.
 */
export const generateBaselineProfile = (client) => {
  const gender = client.gender || 'male';
  const age = client.age || 30;
  const height = client.height || 170; // cm
  const journey = faker.helpers.arrayElement(JOURNEYS);

  let initialWeight = 70;
  let initialBodyFat = 20;
  let initialMuscleMass = 45;
  let initialWaist = 80;
  let initialChest = 95;
  let initialThigh = 55;
  let initialArm = 30;

  const heightM = height / 100;
  let targetBmi = 22; // Default baseline target

  if (gender === 'male') {
    if (journey === 'Weight Loss') {
      targetBmi = faker.number.float({ min: 28, max: 34, multipleOf: 0.1 });
      initialBodyFat = faker.number.float({ min: 25, max: 35, multipleOf: 0.1 });
      initialWaist = faker.number.float({ min: 95, max: 112, multipleOf: 0.1 });
    } else if (journey === 'Muscle Gain') {
      targetBmi = faker.number.float({ min: 20.5, max: 23, multipleOf: 0.1 });
      initialBodyFat = faker.number.float({ min: 11, max: 16, multipleOf: 0.1 });
      initialWaist = faker.number.float({ min: 72, max: 80, multipleOf: 0.1 });
    } else { // Recomp / Maintenance
      targetBmi = faker.number.float({ min: 23.5, max: 26.5, multipleOf: 0.1 });
      initialBodyFat = faker.number.float({ min: 18, max: 24, multipleOf: 0.1 });
      initialWaist = faker.number.float({ min: 82, max: 92, multipleOf: 0.1 });
    }
    initialWeight = parseFloat((targetBmi * heightM * heightM).toFixed(1));
    initialMuscleMass = initialWeight * faker.number.float({ min: 0.58, max: 0.65, multipleOf: 0.01 });
    initialChest = initialWeight * 1.1 + faker.number.float({ min: -5, max: 5, multipleOf: 0.1 });
    initialThigh = faker.number.float({ min: 50, max: 63, multipleOf: 0.1 });
    initialArm = faker.number.float({ min: 30, max: 40, multipleOf: 0.1 });
  } else { // female
    if (journey === 'Weight Loss') {
      targetBmi = faker.number.float({ min: 28, max: 34, multipleOf: 0.1 });
      initialBodyFat = faker.number.float({ min: 32, max: 42, multipleOf: 0.1 });
      initialWaist = faker.number.float({ min: 85, max: 102, multipleOf: 0.1 });
    } else if (journey === 'Muscle Gain') {
      targetBmi = faker.number.float({ min: 19, max: 21.5, multipleOf: 0.1 });
      initialBodyFat = faker.number.float({ min: 18, max: 23, multipleOf: 0.1 });
      initialWaist = faker.number.float({ min: 62, max: 70, multipleOf: 0.1 });
    } else { // Recomp / Maintenance
      targetBmi = faker.number.float({ min: 21, max: 24.5, multipleOf: 0.1 });
      initialBodyFat = faker.number.float({ min: 24, max: 30, multipleOf: 0.1 });
      initialWaist = faker.number.float({ min: 70, max: 80, multipleOf: 0.1 });
    }
    initialWeight = parseFloat((targetBmi * heightM * heightM).toFixed(1));
    initialMuscleMass = initialWeight * faker.number.float({ min: 0.45, max: 0.52, multipleOf: 0.01 });
    initialChest = initialWeight * 1.2 + faker.number.float({ min: -5, max: 5, multipleOf: 0.1 });
    initialThigh = faker.number.float({ min: 48, max: 60, multipleOf: 0.1 });
    initialArm = faker.number.float({ min: 24, max: 32, multipleOf: 0.1 });
  }

  return {
    clientId: client._id,
    gender,
    age,
    height,
    journey,
    initialWeight,
    initialBodyFat,
    initialMuscleMass,
    initialWaist,
    initialChest,
    initialThigh,
    initialArm
  };
};

/**
 * Generates a progressive timeline of body measurements and body parameters.
 * @param {object} profile - Baseline health profile.
 * @param {number} totalWeeks - Number of entries.
 * @param {Date} startDate - Start date of the timeline.
 * @returns {Array<object>} Chronological entries containing progressive values.
 */
export const generateProgressionTimeline = (profile, totalWeeks, startDate) => {
  const timeline = [];
  const start = new Date(startDate || '2026-01-01');

  let currentWeight = profile.initialWeight;
  let currentBodyFat = profile.initialBodyFat;
  let currentMuscleMass = profile.initialMuscleMass;
  let currentWaist = profile.initialWaist;
  let currentChest = profile.initialChest;
  let currentThigh = profile.initialThigh;
  let currentArm = profile.initialArm;

  for (let w = 0; w < totalWeeks; w++) {
    // Generate dates with random stagger offset: e.g. 6 to 8 days apart
    const entryDate = new Date(start);
    entryDate.setDate(start.getDate() + w * 7 + faker.number.int({ min: -1, max: 1 }));

    // Apply progression calculations based on journey
    if (w > 0) {
      const noise = () => faker.number.float({ min: -0.05, max: 0.05 });
      
      if (profile.journey === 'Weight Loss') {
        currentWeight -= faker.number.float({ min: 0.3, max: 0.7, multipleOf: 0.05 });
        currentBodyFat -= faker.number.float({ min: 0.1, max: 0.3, multipleOf: 0.05 });
        currentMuscleMass += faker.number.float({ min: -0.05, max: 0.05, multipleOf: 0.01 }); // Keep muscle stable
        currentWaist -= faker.number.float({ min: 0.15, max: 0.3, multipleOf: 0.05 });
        currentChest -= faker.number.float({ min: 0.1, max: 0.2, multipleOf: 0.05 });
        currentThigh -= faker.number.float({ min: 0.05, max: 0.15, multipleOf: 0.05 });
        currentArm -= faker.number.float({ min: 0.02, max: 0.08, multipleOf: 0.01 });
      } else if (profile.journey === 'Muscle Gain') {
        currentWeight += faker.number.float({ min: 0.15, max: 0.3, multipleOf: 0.05 });
        currentBodyFat += faker.number.float({ min: 0.02, max: 0.08, multipleOf: 0.01 }); // Minimal fat gain
        currentMuscleMass += faker.number.float({ min: 0.1, max: 0.25, multipleOf: 0.05 });
        currentChest += faker.number.float({ min: 0.05, max: 0.15, multipleOf: 0.05 });
        currentWaist += faker.number.float({ min: 0.02, max: 0.06, multipleOf: 0.01 });
        currentThigh += faker.number.float({ min: 0.05, max: 0.12, multipleOf: 0.05 });
        currentArm += faker.number.float({ min: 0.04, max: 0.1, multipleOf: 0.01 });
      } else if (profile.journey === 'Body Recomposition') {
        currentWeight += faker.number.float({ min: -0.1, max: 0.1, multipleOf: 0.02 }); // Weight stable
        currentBodyFat -= faker.number.float({ min: 0.08, max: 0.18, multipleOf: 0.02 });
        currentMuscleMass += faker.number.float({ min: 0.08, max: 0.18, multipleOf: 0.02 });
        currentWaist -= faker.number.float({ min: 0.08, max: 0.18, multipleOf: 0.02 });
        currentChest += faker.number.float({ min: 0.02, max: 0.08, multipleOf: 0.02 });
        currentArm += faker.number.float({ min: 0.01, max: 0.04, multipleOf: 0.01 });
        currentThigh += faker.number.float({ min: -0.05, max: 0.05, multipleOf: 0.01 });
      } else { // Maintenance
        currentWeight += noise() * 2;
        currentBodyFat += noise();
        currentMuscleMass += noise() * 0.5;
        currentWaist += noise();
        currentChest += noise();
        currentThigh += noise();
        currentArm += noise() * 0.2;
      }
    }

    // Hard bounds safety checks to guarantee realistic physiological ranges
    currentWeight = Math.max(35, Math.min(180, currentWeight));
    currentBodyFat = Math.max(3, Math.min(55, currentBodyFat));
    currentMuscleMass = Math.max(20, Math.min(100, currentMuscleMass));
    currentWaist = Math.max(50, Math.min(150, currentWaist));
    currentChest = Math.max(60, Math.min(160, currentChest));
    currentThigh = Math.max(35, Math.min(90, currentThigh));
    currentArm = Math.max(15, Math.min(60, currentArm));

    // Calculate secondary parameters based on formulas
    const heightM = profile.height / 100;
    const bmi = currentWeight / (heightM * heightM);
    const weightWithoutFat = currentWeight * (1 - currentBodyFat / 100);
    const muscleRate = (currentMuscleMass / currentWeight) * 100;
    const bodyWater = (100 - currentBodyFat) * 0.7; // Standard physiological water weight proxy

    // Harris-Benedict BMR equation
    let bmr = 0;
    if (profile.gender === 'male') {
      bmr = 10 * currentWeight + 6.25 * profile.height - 5 * profile.age + 5;
    } else {
      bmr = 10 * currentWeight + 6.25 * profile.height - 5 * profile.age - 161;
    }

    // Visceral fat scale 1 to 20
    let visceralFat = Math.round(bmi * 0.4);
    if (profile.journey === 'Weight Loss' && w > 0) {
      visceralFat = Math.max(4, visceralFat - Math.floor(w / 3));
    }

    // Metabolic age proxy
    const ageOffset = profile.journey === 'Weight Loss' ? Math.max(-2, 4 - Math.floor(w / 2)) : 2;
    const metabolicAge = Math.round(profile.age + ageOffset);

    // Protein Mass proxy
    const proteinMass = currentMuscleMass * 0.21;
    
    // Subcutaneous Fat proxy
    const subcutaneousFat = currentWeight * (currentBodyFat / 100) * 0.78;

    timeline.push({
      date: entryDate.toISOString().split('T')[0],
      isProfileBaseline: w === 0,
      
      // Measurements
      belly: parseFloat((currentWaist * 1.05).toFixed(1)),
      waist: parseFloat(currentWaist.toFixed(1)),
      thigh: parseFloat(currentThigh.toFixed(1)),
      chest: parseFloat(currentChest.toFixed(1)),
      arm: parseFloat(currentArm.toFixed(1)),

      // Body Parameters
      bodyWeight: parseFloat(currentWeight.toFixed(1)),
      bmi: parseFloat(bmi.toFixed(1)),
      bodyFatRatio: parseFloat(currentBodyFat.toFixed(1)),
      muscleRate: parseFloat(muscleRate.toFixed(1)),
      bodyWater: parseFloat(bodyWater.toFixed(1)),
      boneMass: parseFloat((currentWeight * 0.045).toFixed(1)), // bone weight averages 4.5% of body weight
      bmr: Math.round(bmr),
      metabolicAge: Math.max(12, metabolicAge),
      visceralFat: Math.max(1, Math.min(20, visceralFat)),
      subcutaneousFat: parseFloat(subcutaneousFat.toFixed(1)),
      proteinMass: parseFloat(proteinMass.toFixed(1)),
      muscleMass: parseFloat(currentMuscleMass.toFixed(1)),
      weightWithoutFat: parseFloat(weightWithoutFat.toFixed(1))
    });
  }

  return timeline;
};

/**
 * Ensures that all clients have a shared baseline profile and timeline stored in the context.
 * @param {object} context - Shared ID tracking context.
 * @param {object} config - Seeding configuration preset.
 * @returns {object} Client profiles map.
 */
export const ensureClientProfiles = (context, config) => {
  if (context.clientProfiles) return context.clientProfiles;

  const clients = context.clients || [];
  const clientProfiles = {};

  for (const client of clients) {
    const clientRecord = (context.clientsToInsert || []).find((c) => c._id.equals(client._id));
    if (!clientRecord) continue;

    // Generate baseline profile
    const profile = generateBaselineProfile(clientRecord);

    // Assign engagement tier
    profile.engagementTier = faker.helpers.arrayElement(['High', 'Moderate', 'Low']);

    // Choose start date based on subscription or default
    const startDate = clientRecord.subscriptionStartDate || new Date('2026-01-01');

    // Generate timeline (weeks count based on config measurementsPerClient)
    const measurementsCount = config.measurementsPerClient || 5;
    const timeline = generateProgressionTimeline(profile, measurementsCount, startDate);

    clientProfiles[client._id.toString()] = {
      profile,
      timeline
    };
  }

  context.clientProfiles = clientProfiles;
  return clientProfiles;
};
