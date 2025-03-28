// Sample food database with common foods and their nutritional information

const foodDatabase = [
  {
    id: 'apple',
    name: 'Apple',
    calories: 95,
    protein: 0.5,
    carbs: 25,
    fat: 0.3,
    servingSize: '1 medium (182g)',
    category: 'fruits'
  },
  {
    id: 'banana',
    name: 'Banana',
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fat: 0.4,
    servingSize: '1 medium (118g)',
    category: 'fruits'
  },
  {
    id: 'chicken-breast',
    name: 'Chicken Breast',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    servingSize: '100g (cooked)',
    category: 'protein'
  },
  {
    id: 'salmon',
    name: 'Salmon',
    calories: 206,
    protein: 22,
    carbs: 0,
    fat: 13,
    servingSize: '100g (cooked)',
    category: 'protein'
  },
  {
    id: 'brown-rice',
    name: 'Brown Rice',
    calories: 215,
    protein: 5,
    carbs: 45,
    fat: 1.8,
    servingSize: '1 cup cooked (195g)',
    category: 'grains'
  },
  {
    id: 'white-rice',
    name: 'White Rice',
    calories: 205,
    protein: 4.3,
    carbs: 45,
    fat: 0.4,
    servingSize: '1 cup cooked (195g)',
    category: 'grains'
  },
  {
    id: 'bread-whole-wheat',
    name: 'Whole Wheat Bread',
    calories: 81,
    protein: 4,
    carbs: 15,
    fat: 1.1,
    servingSize: '1 slice (38g)',
    category: 'grains'
  },
  {
    id: 'egg',
    name: 'Egg',
    calories: 78,
    protein: 6.3,
    carbs: 0.6,
    fat: 5.3,
    servingSize: '1 large (50g)',
    category: 'protein'
  },
  {
    id: 'broccoli',
    name: 'Broccoli',
    calories: 31,
    protein: 2.6,
    carbs: 6,
    fat: 0.3,
    servingSize: '1 cup chopped (91g)',
    category: 'vegetables'
  },
  {
    id: 'spinach',
    name: 'Spinach',
    calories: 7,
    protein: 0.9,
    carbs: 1.1,
    fat: 0.1,
    servingSize: '1 cup raw (30g)',
    category: 'vegetables'
  },
  {
    id: 'almonds',
    name: 'Almonds',
    calories: 164,
    protein: 6,
    carbs: 6,
    fat: 14,
    servingSize: '1 oz (28g)',
    category: 'nuts'
  },
  {
    id: 'avocado',
    name: 'Avocado',
    calories: 160,
    protein: 2,
    carbs: 8.5,
    fat: 14.7,
    servingSize: '1/2 medium (68g)',
    category: 'fruits'
  },
  {
    id: 'milk',
    name: 'Milk (2%)',
    calories: 122,
    protein: 8.1,
    carbs: 11.7,
    fat: 4.8,
    servingSize: '1 cup (245g)',
    category: 'dairy'
  },
  {
    id: 'greek-yogurt',
    name: 'Greek Yogurt (plain)',
    calories: 100,
    protein: 17,
    carbs: 6,
    fat: 0.7,
    servingSize: '170g container',
    category: 'dairy'
  },
  {
    id: 'sweet-potato',
    name: 'Sweet Potato',
    calories: 112,
    protein: 2,
    carbs: 26,
    fat: 0.1,
    servingSize: '1 medium (130g)',
    category: 'vegetables'
  }
];

// Function to search foods by name
export const searchFoods = (query) => {
  if (!query || typeof query !== 'string') {
    return [];
  }
  
  const lowercaseQuery = query.toLowerCase();
  return foodDatabase.filter(food => 
    food.name.toLowerCase().includes(lowercaseQuery)
  );
};

// Function to search foods by category
export const getFoodsByCategory = (category) => {
  if (!category || typeof category !== 'string') {
    return [];
  }
  
  return foodDatabase.filter(food => 
    food.category === category
  );
};

// Function to get a food by ID
export const getFoodById = (id) => {
  if (!id || typeof id !== 'string') {
    return null;
  }
  
  return foodDatabase.find(food => food.id === id) || null;
};

// Get all categories
export const getCategories = () => {
  const categories = [...new Set(foodDatabase.map(food => food.category))];
  return categories;
};

// Get all foods
export const getAllFoods = () => {
  return foodDatabase;
};

export default foodDatabase; 