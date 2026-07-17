/**
 * Seeding Helper Utilities
 * Uses @faker-js/faker to generate realistic data structures.
 * None of these functions interface with MongoDB; they only return mock values.
 */

import { faker } from '@faker-js/faker';

// Common Indian first names and last names to guarantee authentic Indian names
const INDIAN_FIRST_NAMES_MALE = [
  'Aarav', 'Vihaan', 'Vivaan', 'Ananya', 'Aditya', 'Arjun', 'Sai', 'Ishaan', 'Kabir',
  'Aaryan', 'Rahul', 'Rohan', 'Amit', 'Sanjay', 'Vikram', 'Pankaj', 'Vijay', 'Rajesh', 'Anil',
  'Deepak', 'Sandeep', 'Abhishek', 'Raj', 'Alok', 'Manoj', 'Sunil', 'Karan', 'Dev', 'Arvind'
];

const INDIAN_FIRST_NAMES_FEMALE = [
  'Aanya', 'Saanvi', 'Prisha', 'Riya', 'Ananya', 'Kavya', 'Aditi', 'Meera', 'Pooja', 'Neha',
  'Shruti', 'Divya', 'Sneha', 'Deepika', 'Priyanka', 'Anjali', 'Kiran', 'Shweta', 'Jyoti', 'Sunita',
  'Anita', 'Preeti', 'Swati', 'Ritu', 'Simran', 'Ishita', 'Neha', 'Tanvi', 'Payal', 'Richa'
];

const INDIAN_LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Patel', 'Kumar', 'Singh', 'Joshi', 'Mehta', 'Nayak', 'Rao',
  'Reddy', 'Choudhury', 'Das', 'Sen', 'Chatterjee', 'Banerjee', 'Mukherjee', 'Mishra', 'Trivedi', 'Pandey',
  'Deshmukh', 'Kulkarni', 'Shah', 'Nair', 'Pillai', 'Iyer', 'Iyengar', 'Yadav', 'Maurya'
];

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat',
  'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam',
  'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Ranchi'
];

const DIET_TITLES = [
  'Keto Weight Loss Plan', 'Low Carb Diet', 'High Protein Muscle Plan', 'Mediterranean balanced Diet', 'Intermittent Fasting Program',
  'Balanced Daily Nutrition', 'Vegetarian High Protein Diet', 'Vegan Cleanse Plan', 'Diabetic Friendly Meal Plan', 'Extreme Fat Loss Program'
];

const NOTIFICATION_MESSAGES = [
  'Your diet plan has been updated by your coach.',
  'Reminder: Log your daily water intake.',
  'Your weekly progress report is ready for review.',
  'New personal session scheduled with your coach.',
  'Please fill out your weekly body measurements.',
  'Kudos! You have met your calorie target yesterday.'
];

// Tracking caches to ensure global uniqueness during a seed execution
const usedEmails = new Set();
const usedPhones = new Set();

/**
 * Resets unique tracking caches for testing or successive runs.
 */
export const resetUniqueCaches = () => {
  usedEmails.clear();
  usedPhones.clear();
};

/**
 * Generates a realistic Indian Name.
 * @param {'male'|'female'} gender
 * @returns {string} Full Name
 */
export const generateIndianName = (gender) => {
  const isMale = gender === 'male' || (gender !== 'female' && Math.random() > 0.5);
  const firstNames = isMale ? INDIAN_FIRST_NAMES_MALE : INDIAN_FIRST_NAMES_FEMALE;
  const firstName = faker.helpers.arrayElement(firstNames);
  const lastName = faker.helpers.arrayElement(INDIAN_LAST_NAMES);
  return `${firstName} ${lastName}`;
};

/**
 * Generates a unique email address.
 * @param {string} name
 * @returns {string} Email
 */
export const generateEmail = (name) => {
  let email;
  let attempts = 0;
  do {
    const base = name ? name.toLowerCase().replace(/[^a-z0-9]/g, '') : faker.internet.userName();
    const suffix = attempts === 0 ? faker.number.int({ min: 10, max: 999 }) : faker.number.int({ min: 1000, max: 999999 });
    email = `${base}${suffix}@test.com`;
    attempts++;
  } while (usedEmails.has(email) && attempts < 100);
  usedEmails.add(email);
  return email;
};

/**
 * Generates a unique Indian mobile number starting with 6, 7, 8, or 9.
 * @returns {string} Phone Number
 */
export const generatePhoneNumber = () => {
  let phone;
  let attempts = 0;
  do {
    const prefix = faker.helpers.arrayElement(['6', '7', '8', '9']);
    const rest = faker.string.numeric(9);
    phone = `${prefix}${rest}`;
    attempts++;
  } while (usedPhones.has(phone) && attempts < 100);
  usedPhones.add(phone);
  return phone;
};

/**
 * Generates a random Indian city name.
 * @returns {string} City
 */
export const generateCity = () => {
  return faker.helpers.arrayElement(INDIAN_CITIES);
};

/**
 * Generates a random gender selection.
 * @returns {string} Gender
 */
export const generateGender = () => {
  return faker.helpers.arrayElement(['male', 'female']);
};

/**
 * Generates a height value in cm.
 * @returns {number} Height in cm
 */
export const generateHeight = () => {
  return faker.number.int({ min: 140, max: 200 });
};

/**
 * Generates a weight value in kg.
 * @returns {number} Weight in kg
 */
export const generateWeight = () => {
  return faker.number.int({ min: 45, max: 120 });
};

/**
 * Generates a random age between 18 and 65.
 * @returns {number} Age
 */
export const generateAge = () => {
  return faker.number.int({ min: 18, max: 65 });
};

/**
 * Generates a random date within a range.
 * @param {string|Date} start
 * @param {string|Date} end
 * @returns {Date} Random Date
 */
export const generateDate = (start = '2025-01-01', end = '2026-12-31') => {
  return faker.date.between({ from: start, to: end });
};

/**
 * Generates start and end dates representing a subscription period.
 * @returns {{subscriptionStartDate: Date, subscriptionExpiryDate: Date}}
 */
export const generateSubscriptionPeriod = () => {
  const subscriptionStartDate = faker.date.past();
  const months = faker.helpers.arrayElement([1, 3, 6, 12]);
  const subscriptionExpiryDate = new Date(subscriptionStartDate);
  subscriptionExpiryDate.setMonth(subscriptionExpiryDate.getMonth() + months);
  return { subscriptionStartDate, subscriptionExpiryDate };
};

/**
 * Generates a random notification message.
 * @returns {string} Notification Message
 */
export const generateNotificationMessage = () => {
  return faker.helpers.arrayElement(NOTIFICATION_MESSAGES);
};

/**
 * Generates a random diet plan title.
 * @returns {string} Diet Title
 */
export const generateDietTitle = () => {
  return faker.helpers.arrayElement(DIET_TITLES);
};

/**
 * Generates a structured set of body measurements.
 * @returns {object} Body Measurements
 */
export const generateBodyMeasurements = () => {
  return {
    chest: parseFloat(faker.number.float({ min: 80, max: 120, multipleOf: 0.1 }).toFixed(1)),
    waist: parseFloat(faker.number.float({ min: 60, max: 110, multipleOf: 0.1 }).toFixed(1)),
    hips: parseFloat(faker.number.float({ min: 80, max: 120, multipleOf: 0.1 }).toFixed(1)),
    thighs: parseFloat(faker.number.float({ min: 45, max: 70, multipleOf: 0.1 }).toFixed(1)),
    arms: parseFloat(faker.number.float({ min: 25, max: 45, multipleOf: 0.1 }).toFixed(1))
  };
};

/**
 * Generates a generic measurement value (e.g. weight, waist size, etc.).
 * @returns {number} Measurement Value
 */
export const generateMeasurementValue = () => {
  return parseFloat(faker.number.float({ min: 50, max: 150, multipleOf: 0.1 }).toFixed(1));
};
