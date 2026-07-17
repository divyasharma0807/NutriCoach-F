/**
 * DietPlan Seeding Module - Phase 3B
 * Responsibility: Generates and bulk inserts versioned diet plan revisions matching client journeys.
 */

import mongoose from 'mongoose';
import logger from './helpers/logger.js';
import DietPlan from '../../models/DietPlan.js';
import { ensureClientProfiles } from './helpers/progression.js';

/**
 * Seeds DietPlan records based on the configuration preset.
 * Generates versioned diet revisions corresponding to client engagement tiers.
 * @param {object} config - Seeding configuration preset.
 * @param {object} context - Shared ID tracking context.
 * @param {object} options - Execution options (e.g. dryRun).
 * @returns {Promise<object>} Updated context.
 */
export async function seedDietPlans(config, context, options = {}) {
  const clientIds = context.clientIds || [];

  logger.info(`Starting DietPlan seeding: totalClients=${clientIds.length}`);

  if (clientIds.length === 0) {
    logger.warn('No Client IDs found in context. Skipping DietPlan seeding.');
    context.dietPlanIds = [];
    return context;
  }

  // Ensure client profiles are initialized
  const clientProfiles = ensureClientProfiles(context, config);

  const dietPlansToInsert = [];
  const dietPlanIds = [];

  for (const clientId of clientIds) {
    const clientRecord = (context.clientsToInsert || []).find((c) => c._id.equals(clientId));
    if (!clientRecord) continue;

    const data = clientProfiles[clientId.toString()];
    if (!data) continue;

    const { profile, timeline } = data;
    const coachId = clientRecord.coach;
    const engagement = profile.engagementTier || 'Moderate';

    // Determine how many revisions based on activity tier
    let revisionWeeks = [0]; // High tier gets initial + 2 revisions, Moderate gets initial + 1 revision
    if (engagement === 'High' && timeline.length >= 6) {
      revisionWeeks = [0, Math.floor(timeline.length / 3), Math.floor(timeline.length * 2 / 3)];
    } else if (engagement === 'Moderate' && timeline.length >= 4) {
      revisionWeeks = [0, Math.floor(timeline.length / 2)];
    }

    revisionWeeks.forEach((weekIndex, revisionIndex) => {
      const entry = timeline[weekIndex] || timeline[0];
      const dietPlanId = new mongoose.Types.ObjectId();
      dietPlanIds.push(dietPlanId);

      let beginner = '';
      let intermediate = '';
      let advanced = '';
      let weightLoss = '';

      const baseWeight = entry.bodyWeight;

      if (profile.journey === 'Weight Loss') {
        if (revisionIndex === 0) {
          beginner = `Initial weight loss target set for ${clientRecord.name}. Focus on calorie deficit.`;
          intermediate = 'Breakfast: Oats (50g) + 4 egg whites. Lunch: Grilled chicken breast (150g) + broccoli (100g) + brown rice (80g).';
          advanced = 'Dinner: Steamed fish (150g) + green salad. Snacks: Whey protein (1 scoop) + almonds (15g).';
          weightLoss = 'Deficit targets - Calories: 1800 kcal, Protein: 130g, Carbs: 150g, Fats: 50g.';
        } else if (revisionIndex === 1) {
          beginner = `Plateau adjustment. Reducing calories slightly to support ongoing weight reduction. Current weight: ${baseWeight} kg.`;
          intermediate = 'Breakfast: Oats (40g) + 5 egg whites. Lunch: Grilled chicken breast (150g) + mixed greens + sweet potato (80g).';
          advanced = 'Dinner: Baked salmon (150g) + asparagus. Snacks: Cucumber slices + hummus + whey protein.';
          weightLoss = 'Deficit targets - Calories: 1600 kcal, Protein: 135g, Carbs: 120g, Fats: 45g.';
        } else {
          beginner = `Advanced lean deficit plan. Increasing protein ratio to protect muscle mass. Current weight: ${baseWeight} kg.`;
          intermediate = 'Breakfast: Chia seed pudding + 4 egg whites. Lunch: Grilled turkey breast (180g) + spinach (150g) + quinoa (50g).';
          advanced = 'Dinner: Tofu stir fry + broccoli. Snacks: Mixed seeds (10g) + casein protein.';
          weightLoss = 'Deficit targets - Calories: 1450 kcal, Protein: 140g, Carbs: 85g, Fats: 40g.';
        }
      } else if (profile.journey === 'Muscle Gain') {
        if (revisionIndex === 0) {
          beginner = `Initial muscle building plan. Surplus calories target to drive muscle hypertrophy.`;
          intermediate = 'Breakfast: 3 whole eggs + 2 slices whole wheat toast + banana. Lunch: Lean beef steak (180g) + white rice (150g) + asparagus.';
          advanced = 'Dinner: Grilled salmon (200g) + sweet potato (150g) + olive oil. Snacks: Peanut butter (2 tbsp) + banana shake.';
          weightLoss = 'Surplus targets - Calories: 2600 kcal, Protein: 140g, Carbs: 320g, Fats: 80g.';
        } else if (revisionIndex === 1) {
          beginner = `Increasing calorie surplus for lean mass gains. Current weight: ${baseWeight} kg.`;
          intermediate = 'Breakfast: Oats (80g) + 4 egg whites + 1 scoop protein. Lunch: Grilled chicken breast (200g) + brown rice (200g) + green peas.';
          advanced = 'Dinner: Tuna steak (200g) + quinoa (150g) + mixed veggies. Snacks: Greek yogurt + walnuts + honey.';
          weightLoss = 'Surplus targets - Calories: 2800 kcal, Protein: 150g, Carbs: 350g, Fats: 90g.';
        } else {
          beginner = `Optimized hypertrophy calories. Fine-tuning post-workout nutrient timing. Current weight: ${baseWeight} kg.`;
          intermediate = 'Breakfast: Oats (100g) + 5 egg whites + banana. Lunch: Chicken breast (220g) + white rice (250g) + broccoli.';
          advanced = 'Dinner: Lean beef (200g) + baked potato (200g) + olive oil. Snacks: Casein protein (1 scoop) + almonds (25g).';
          weightLoss = 'Surplus targets - Calories: 3000 kcal, Protein: 160g, Carbs: 390g, Fats: 100g.';
        }
      } else if (profile.journey === 'Body Recomposition') {
        if (revisionIndex === 0) {
          beginner = `Calorie maintenance with high protein to fuel recomposition.`;
          intermediate = 'Breakfast: Scrambled eggs (3) + spinach + 1 slice sourdough toast. Lunch: Grilled salmon (150g) + quinoa (100g) + zucchini.';
          advanced = 'Dinner: Lean turkey burger (180g) + salad with olive oil. Snacks: Whey protein + mixed berries.';
          weightLoss = 'Recomp targets - Calories: 2000 kcal, Protein: 140g, Carbs: 200g, Fats: 60g.';
        } else if (revisionIndex === 1) {
          beginner = `Slight deficit adjustment to lower body fat while building muscle. Current weight: ${baseWeight} kg.`;
          intermediate = 'Breakfast: 4 egg whites + 1 whole egg + oatmeal (50g). Lunch: Grilled chicken (180g) + sweet potato (100g) + green beans.';
          advanced = 'Dinner: Steamed cod (200g) + broccoli + olive oil (1 tsp). Snacks: Cottage cheese (100g) + almonds (15g).';
          weightLoss = 'Recomp targets - Calories: 1850 kcal, Protein: 150g, Carbs: 160g, Fats: 55g.';
        } else {
          beginner = `Advanced carb cycling targets for optimal recomp. Current weight: ${baseWeight} kg.`;
          intermediate = 'Breakfast: Protein smoothie bowl with spinach and oats. Lunch: Salmon salad with quinoa and avocado.';
          advanced = 'Dinner: Sirloin steak (150g) + brussels sprouts. Snacks: Casein protein + walnuts (10g).';
          weightLoss = 'Recomp targets - Calories: 1750 kcal, Protein: 160g, Carbs: 130g, Fats: 50g.';
        }
      } else { // Maintenance
        if (revisionIndex === 0) {
          beginner = 'Balanced nutrition plan to maintain current body weight and metabolic parameters.';
          intermediate = 'Breakfast: Oatmeal + skimmed milk + raw honey. Lunch: Grilled fish (150g) + brown rice (100g) + mixed greens.';
          advanced = 'Dinner: Chicken stir-fry with peppers and carrots. Snacks: Apple + peanut butter (1 tbsp).';
          weightLoss = 'Maintenance targets - Calories: 2200 kcal, Protein: 120g, Carbs: 250g, Fats: 65g.';
        } else if (revisionIndex === 1) {
          beginner = `Nutrition targets adjustment to fine-tune daily energy levels. Current weight: ${baseWeight} kg.`;
          intermediate = 'Breakfast: Greek yogurt + granola + berries. Lunch: Turkey breast wrap with whole wheat tortilla.';
          advanced = 'Dinner: Baked sea bass + sweet potato mash. Snacks: Handful of almonds + whey protein.';
          weightLoss = 'Maintenance targets - Calories: 2250 kcal, Protein: 125g, Carbs: 260g, Fats: 68g.';
        } else {
          beginner = `Sustainability target plan. Focus on micro-nutrients and gut health. Current weight: ${baseWeight} kg.`;
          intermediate = 'Breakfast: Eggs on toast + avocado. Lunch: Chicken breast + quinoa salad + olive oil dressing.';
          advanced = 'Dinner: Tofu stir-fry + brown rice. Snacks: Protein bar + green tea.';
          weightLoss = 'Maintenance targets - Calories: 2200 kcal, Protein: 130g, Carbs: 240g, Fats: 70g.';
        }
      }

      dietPlansToInsert.push({
        _id: dietPlanId,
        client: clientId,
        coach: coachId,
        beginner,
        intermediate,
        advanced,
        weightLoss,
        approved: true,
        fileUrl: {
          secure_url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/diet_plan_pdf.pdf',
          public_id: 'cloudinary_diet_plan_placeholder'
        },
        createdAt: new Date(entry.date),
        updatedAt: new Date(entry.date)
      });
    });
  }

  if (options.dryRun) {
    logger.success(`[DRY RUN] Would seed ${dietPlansToInsert.length} DietPlan(s) with bulk insert.`);
  } else {
    try {
      const result = await DietPlan.insertMany(dietPlansToInsert);
      logger.success(`Created ${result.length} DietPlan(s)`);
    } catch (err) {
      logger.error('Failed to bulk insert DietPlans', err);
      throw err;
    }
  }

  context.dietPlanIds = dietPlanIds;
  context.dietPlansToInsert = dietPlansToInsert;

  return context;
}

export default seedDietPlans;
