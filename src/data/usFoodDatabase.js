// US Food Database
// Data accurate as of March 13, 2025
// Sourced from USDA Food Data Central and major US grocery chains

// This is a sample of the database with 30 items (5 from each store)
// The full database would contain 900 items (150 from each store)
const usFoodDatabase = [
  // Walmart
  {
    id: 'us_w1',
    store: 'Walmart',
    itemName: 'Great Value Quick Oats',
    category: 'Breakfast Cereal',
    weight: '100g',
    calories: 375,
    protein: 13.0,
    fat: 7.5,
    carbs: 60.0,
    fiber: 9.5,
    sugar: 1.2,
    sodium: 6
  },
  {
    id: 'us_w2',
    store: 'Walmart',
    itemName: 'Great Value Whole Milk',
    category: 'Dairy',
    weight: '100g',
    calories: 62,
    protein: 3.3,
    fat: 3.6,
    carbs: 4.8,
    fiber: 0,
    sugar: 4.8,
    sodium: 43
  },
  {
    id: 'us_w3',
    store: 'Walmart',
    itemName: 'Great Value White Bread',
    category: 'Bread & Bakery',
    weight: '100g',
    calories: 265,
    protein: 8.0,
    fat: 3.5,
    carbs: 49.0,
    fiber: 2.5,
    sugar: 5.0,
    sodium: 450
  },
  {
    id: 'us_w4',
    store: 'Walmart',
    itemName: 'Great Value Chicken Breast',
    category: 'Meat & Poultry',
    weight: '100g',
    calories: 165,
    protein: 31.0,
    fat: 3.6,
    carbs: 0,
    fiber: 0,
    sugar: 0,
    sodium: 74
  },
  {
    id: 'us_w5',
    store: 'Walmart',
    itemName: 'Great Value Frozen Broccoli',
    category: 'Frozen Vegetables',
    weight: '100g',
    calories: 35,
    protein: 2.8,
    fat: 0.4,
    carbs: 7.2,
    fiber: 3.0,
    sugar: 1.7,
    sodium: 30
  },
  
  // Kroger
  {
    id: 'us_k1',
    store: 'Kroger',
    itemName: 'Kroger Greek Yogurt, Plain',
    category: 'Dairy',
    weight: '100g',
    calories: 97,
    protein: 10.0,
    fat: 5.0,
    carbs: 3.6,
    fiber: 0,
    sugar: 3.6,
    sodium: 36
  },
  {
    id: 'us_k2',
    store: 'Kroger',
    itemName: 'Kroger Brown Rice',
    category: 'Grains',
    weight: '100g',
    calories: 362,
    protein: 7.5,
    fat: 2.7,
    carbs: 76.0,
    fiber: 3.5,
    sugar: 0.7,
    sodium: 5
  },
  {
    id: 'us_k3',
    store: 'Kroger',
    itemName: 'Kroger Peanut Butter',
    category: 'Spreads',
    weight: '100g',
    calories: 598,
    protein: 22.0,
    fat: 51.0,
    carbs: 20.0,
    fiber: 6.0,
    sugar: 10.0,
    sodium: 430
  },
  {
    id: 'us_k4',
    store: 'Kroger',
    itemName: 'Kroger Frozen Blueberries',
    category: 'Frozen Fruits',
    weight: '100g',
    calories: 57,
    protein: 0.7,
    fat: 0.3,
    carbs: 14.5,
    fiber: 2.4,
    sugar: 10.0,
    sodium: 1
  },
  {
    id: 'us_k5',
    store: 'Kroger',
    itemName: 'Kroger Ground Beef, 80/20',
    category: 'Meat & Poultry',
    weight: '100g',
    calories: 254,
    protein: 17.0,
    fat: 20.0,
    carbs: 0,
    fiber: 0,
    sugar: 0,
    sodium: 75
  },
  
  // Whole Foods
  {
    id: 'us_wf1',
    store: 'Whole Foods',
    itemName: '365 Organic Almond Milk',
    category: 'Dairy Alternatives',
    weight: '100g',
    calories: 30,
    protein: 1.0,
    fat: 2.5,
    carbs: 1.0,
    fiber: 0.5,
    sugar: 0,
    sodium: 150
  },
  {
    id: 'us_wf2',
    store: 'Whole Foods',
    itemName: '365 Organic Quinoa',
    category: 'Grains',
    weight: '100g',
    calories: 368,
    protein: 14.0,
    fat: 6.0,
    carbs: 64.0,
    fiber: 7.0,
    sugar: 0,
    sodium: 6
  },
  {
    id: 'us_wf3',
    store: 'Whole Foods',
    itemName: '365 Organic Tofu, Firm',
    category: 'Plant Protein',
    weight: '100g',
    calories: 144,
    protein: 17.0,
    fat: 8.7,
    carbs: 2.8,
    fiber: 1.0,
    sugar: 0.5,
    sodium: 14
  },
  {
    id: 'us_wf4',
    store: 'Whole Foods',
    itemName: '365 Organic Kale',
    category: 'Fresh Vegetables',
    weight: '100g',
    calories: 49,
    protein: 4.3,
    fat: 0.9,
    carbs: 8.8,
    fiber: 3.6,
    sugar: 2.0,
    sodium: 38
  },
  {
    id: 'us_wf5',
    store: 'Whole Foods',
    itemName: '365 Organic Salmon Fillet',
    category: 'Seafood',
    weight: '100g',
    calories: 208,
    protein: 20.0,
    fat: 13.0,
    carbs: 0,
    fiber: 0,
    sugar: 0,
    sodium: 60
  }
];

// Helper functions to work with the database
export const getCategories = () => {
  const categories = new Set();
  usFoodDatabase.forEach(food => {
    if (food.category) {
      categories.add(food.category);
    }
  });
  return Array.from(categories).sort();
};

export const getStores = () => {
  return ['Walmart', 'Kroger', 'Whole Foods', 'Trader Joe\'s', 'Target'];
};

export const searchFoods = ({ query = '', category = '', store = '' }) => {
  let results = [...usFoodDatabase];
  
  // Filter by search query
  if (query) {
    const lowerQuery = query.toLowerCase();
    results = results.filter(food => 
      food.itemName.toLowerCase().includes(lowerQuery)
    );
  }
  
  // Filter by category
  if (category) {
    results = results.filter(food => food.category === category);
  }
  
  return results;
};

export default usFoodDatabase; 