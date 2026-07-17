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
 * Generates a unique-looking email address.
 * @param {string} name
 * @returns {string} Email
 */
export const generateEmail = (name) => {
  if (name) {
    const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${sanitized}${faker.number.int({ min: 10, max: 999 })}@example.com`;
  }
  return faker.internet.email();
};

/**
 * Generates an Indian mobile number.
 * @returns {string} Phone Number
 */
export const generatePhoneNumber = () => {
  const prefix = faker.helpers.arrayElement(['6', '7', '8', '9']);
  const rest = faker.string.numeric(9);
  return `${prefix}${rest}`;
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
 * @returns {{startDate: Date, endDate: Date}}
 */
export const generateSubscriptionPeriod = () => {
  const startDate = faker.date.past();
  const months = faker.helpers.arrayElement([1, 3, 6, 12]);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + months);
  return { startDate, endDate };
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
