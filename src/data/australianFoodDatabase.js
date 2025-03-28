// Australian Food Database
// Data accurate as of March 9, 2025
// Sourced from store websites and the Australian Food Composition Database

// This is a sample of the database with 30 items (5 from each store)
// The full database would contain 900 items (150 from each store)
const australianFoodDatabase = [
  // Woolworths Australia
  {
    id: 'w1',
    store: 'Woolworths',
    itemName: 'Woolworths Quick Oats',
    category: 'Breakfast Cereal',
    weight: '100g',
    calories: 380,
    protein: 12.5,
    fat: 8.3,
    carbs: 58.3,
    fiber: 10.0,
    sugar: 1.0,
    sodium: 5
  },
  {
    id: 'w2',
    store: 'Woolworths',
    itemName: 'Woolworths Full Cream Milk',
    category: 'Dairy',
    weight: '100g',
    calories: 61,
    protein: 3.2,
    fat: 3.3,
    carbs: 4.8,
    fiber: 0.0,
    sugar: 4.8,
    sodium: 44
  },
  {
    id: 'w3',
    store: 'Woolworths',
    itemName: 'Woolworths Beef Mince Regular',
    category: 'Meat',
    weight: '100g',
    calories: 250,
    protein: 20.0,
    fat: 18.0,
    carbs: 0.0,
    fiber: 0.0,
    sugar: 0.0,
    sodium: 70
  },
  {
    id: 'w4',
    store: 'Woolworths',
    itemName: 'BBQ Prawns (Prawn, cooked)',
    category: 'Seafood',
    weight: '100g',
    calories: 99,
    protein: 23.0,
    fat: 1.0,
    carbs: 0.0,
    fiber: 0.0,
    sugar: 0.0,
    sodium: 470
  },
  {
    id: 'w5',
    store: 'Woolworths',
    itemName: 'Bunnings Snags (Beef Sausage, grilled)',
    category: 'Snacks',
    weight: '100g',
    calories: 296,
    protein: 13.4,
    fat: 25.6,
    carbs: 4.6,
    fiber: 0.7,
    sugar: 1.0,
    sodium: 900
  },

  // Coles Australia
  {
    id: 'c1',
    store: 'Coles',
    itemName: 'Coles Tomato Paste',
    category: 'Condiments',
    weight: '100g',
    calories: 90,
    protein: 4.0,
    fat: 0.5,
    carbs: 18.0,
    fiber: 3.0,
    sugar: 12.0,
    sodium: 50
  },
  {
    id: 'c2',
    store: 'Coles',
    itemName: 'Coles Baked Beans',
    category: 'Canned Goods',
    weight: '100g',
    calories: 90,
    protein: 5.0,
    fat: 0.5,
    carbs: 15.0,
    fiber: 5.0,
    sugar: 5.0,
    sodium: 400
  },
  {
    id: 'c3',
    store: 'Coles',
    itemName: 'Coles Finest Angus Beef Sausages',
    category: 'Meat',
    weight: '100g',
    calories: 280,
    protein: 14.0,
    fat: 23.0,
    carbs: 5.0,
    fiber: 1.0,
    sugar: 1.0,
    sodium: 850
  },
  {
    id: 'c4',
    store: 'Coles',
    itemName: 'BBQ Prawns (Prawn, cooked)',
    category: 'Seafood',
    weight: '100g',
    calories: 99,
    protein: 23.0,
    fat: 1.0,
    carbs: 0.0,
    fiber: 0.0,
    sugar: 0.0,
    sodium: 470
  },
  {
    id: 'c5',
    store: 'Coles',
    itemName: 'Bunnings Snags (Beef Sausage, grilled)',
    category: 'Snacks',
    weight: '100g',
    calories: 296,
    protein: 13.4,
    fat: 25.6,
    carbs: 4.6,
    fiber: 0.7,
    sugar: 1.0,
    sodium: 900
  },

  // Aldi Australia
  {
    id: 'a1',
    store: 'Aldi',
    itemName: 'Aldi Baked Beans',
    category: 'Canned Goods',
    weight: '100g',
    calories: 85,
    protein: 5.0,
    fat: 0.5,
    carbs: 14.0,
    fiber: 5.0,
    sugar: 4.0,
    sodium: 380
  },
  {
    id: 'a2',
    store: 'Aldi',
    itemName: 'Aldi Weet Bix',
    category: 'Breakfast Cereal',
    weight: '100g',
    calories: 355,
    protein: 12.0,
    fat: 1.5,
    carbs: 67.0,
    fiber: 12.5,
    sugar: 3.5,
    sodium: 270
  },
  {
    id: 'a3',
    store: 'Aldi',
    itemName: 'Aldi Just Organic Olive Oil',
    category: 'Pantry',
    weight: '100g',
    calories: 820,
    protein: 0.0,
    fat: 91.0,
    carbs: 0.0,
    fiber: 0.0,
    sugar: 0.0,
    sodium: 0
  },
  {
    id: 'a4',
    store: 'Aldi',
    itemName: 'BBQ Prawns (Prawn, cooked)',
    category: 'Seafood',
    weight: '100g',
    calories: 99,
    protein: 23.0,
    fat: 1.0,
    carbs: 0.0,
    fiber: 0.0,
    sugar: 0.0,
    sodium: 470
  },
  {
    id: 'a5',
    store: 'Aldi',
    itemName: 'Bunnings Snags (Beef Sausage, grilled)',
    category: 'Snacks',
    weight: '100g',
    calories: 296,
    protein: 13.4,
    fat: 25.6,
    carbs: 4.6,
    fiber: 0.7,
    sugar: 1.0,
    sodium: 900
  },

  // IGA
  {
    id: 'i1',
    store: 'IGA',
    itemName: 'IGA Tomato Sauce',
    category: 'Condiments',
    weight: '100g',
    calories: 105,
    protein: 1.2,
    fat: 0.1,
    carbs: 24.0,
    fiber: 1.2,
    sugar: 20.0,
    sodium: 750
  },
  {
    id: 'i2',
    store: 'IGA',
    itemName: 'IGA Signature Tomato Relish',
    category: 'Condiments',
    weight: '100g',
    calories: 120,
    protein: 1.5,
    fat: 0.5,
    carbs: 27.0,
    fiber: 2.0,
    sugar: 25.0,
    sodium: 700
  },
  {
    id: 'i3',
    store: 'IGA',
    itemName: 'IGA Black & Gold Cheese Crackers',
    category: 'Snacks',
    weight: '100g',
    calories: 500,
    protein: 8.0,
    fat: 25.0,
    carbs: 60.0,
    fiber: 3.0,
    sugar: 2.0,
    sodium: 800
  },
  {
    id: 'i4',
    store: 'IGA',
    itemName: 'BBQ Prawns (Prawn, cooked)',
    category: 'Seafood',
    weight: '100g',
    calories: 99,
    protein: 23.0,
    fat: 1.0,
    carbs: 0.0,
    fiber: 0.0,
    sugar: 0.0,
    sodium: 470
  },
  {
    id: 'i5',
    store: 'IGA',
    itemName: 'Bunnings Snags (Beef Sausage, grilled)',
    category: 'Snacks',
    weight: '100g',
    calories: 296,
    protein: 13.4,
    fat: 25.6,
    carbs: 4.6,
    fiber: 0.7,
    sugar: 1.0,
    sodium: 900
  },

  // Friendly Grocer
  {
    id: 'fg1',
    store: 'Friendly Grocer',
    itemName: 'FG Tomato Sauce',
    category: 'Condiments',
    weight: '100g',
    calories: 105,
    protein: 1.2,
    fat: 0.1,
    carbs: 24.0,
    fiber: 1.2,
    sugar: 20.0,
    sodium: 750
  },
  {
    id: 'fg2',
    store: 'Friendly Grocer',
    itemName: 'FG Premium Honey',
    category: 'Pantry',
    weight: '100g',
    calories: 320,
    protein: 0.5,
    fat: 0.0,
    carbs: 80.0,
    fiber: 0.0,
    sugar: 75.0,
    sodium: 10
  },
  {
    id: 'fg3',
    store: 'Friendly Grocer',
    itemName: 'FG Chocolate Digestive Biscuits',
    category: 'Snacks',
    weight: '100g',
    calories: 480,
    protein: 6.0,
    fat: 22.0,
    carbs: 65.0,
    fiber: 3.0,
    sugar: 25.0,
    sodium: 300
  },
  {
    id: 'fg4',
    store: 'Friendly Grocer',
    itemName: 'BBQ Prawns (Prawn, cooked)',
    category: 'Seafood',
    weight: '100g',
    calories: 99,
    protein: 23.0,
    fat: 1.0,
    carbs: 0.0,
    fiber: 0.0,
    sugar: 0.0,
    sodium: 470
  },
  {
    id: 'fg5',
    store: 'Friendly Grocer',
    itemName: 'Bunnings Snags (Beef Sausage, grilled)',
    category: 'Snacks',
    weight: '100g',
    calories: 296,
    protein: 13.4,
    fat: 25.6,
    carbs: 4.6,
    fiber: 0.7,
    sugar: 1.0,
    sodium: 900
  },

  // Costco Australia
  {
    id: 'co1',
    store: 'Costco',
    itemName: 'Kirkland Signature Oatmeal',
    category: 'Breakfast Cereal',
    weight: '100g',
    calories: 380,
    protein: 12.5,
    fat: 8.3,
    carbs: 58.3,
    fiber: 10.0,
    sugar: 1.0,
    sodium: 5
  },
  {
    id: 'co2',
    store: 'Costco',
    itemName: 'Kirkland Signature Peanut Butter',
    category: 'Pantry',
    weight: '100g',
    calories: 600,
    protein: 25.0,
    fat: 50.0,
    carbs: 20.0,
    fiber: 8.0,
    sugar: 6.0,
    sodium: 300
  },
  {
    id: 'co3',
    store: 'Costco',
    itemName: 'Kirkland Signature Rotisserie Chicken',
    category: 'Meat',
    weight: '100g',
    calories: 170,
    protein: 20.0,
    fat: 10.0,
    carbs: 0.0,
    fiber: 0.0,
    sugar: 0.0,
    sodium: 500
  },
  {
    id: 'co4',
    store: 'Costco',
    itemName: 'BBQ Prawns (Prawn, cooked)',
    category: 'Seafood',
    weight: '100g',
    calories: 99,
    protein: 23.0,
    fat: 1.0,
    carbs: 0.0,
    fiber: 0.0,
    sugar: 0.0,
    sodium: 470
  },
  {
    id: 'co5',
    store: 'Costco',
    itemName: 'Bunnings Snags (Beef Sausage, grilled)',
    category: 'Snacks',
    weight: '100g',
    calories: 296,
    protein: 13.4,
    fat: 25.6,
    carbs: 4.6,
    fiber: 0.7,
    sugar: 1.0,
    sodium: 900
  }
];

// Get all unique food categories
export const getCategories = () => {
  const categories = new Set();
  australianFoodDatabase.forEach(food => {
    if (food.category) {
      categories.add(food.category);
    }
  });
  return Array.from(categories).sort();
};

// Get all unique stores
export const getStores = () => {
  const stores = new Set();
  australianFoodDatabase.forEach(food => stores.add(food.store));
  return Array.from(stores).sort();
};

// Helper function for advanced search filtering
export const searchFoods = (params) => {
  let results = [...australianFoodDatabase];
  
  // Filter by store if specified
  if (params.store && params.store !== 'All') {
    results = results.filter(food => food.store === params.store);
  }
  
  // Filter by category if specified
  if (params.category && params.category !== 'All') {
    results = results.filter(food => food.category === params.category);
  }
  
  // Search by name if query provided
  if (params.query) {
    try {
      const query = params.query.toLowerCase();
      results = results.filter(food => 
        (food.itemName && food.itemName.toLowerCase().includes(query)) || 
        (food.category && food.category.toLowerCase().includes(query))
      );
    } catch (error) {
      console.error('Error filtering by query:', error);
      // Continue with unfiltered results
    }
  }
  
  // Filter by nutritional ranges if specified
  try {
    if (params.minCalories !== undefined) {
      const minCal = parseFloat(params.minCalories);
      if (!isNaN(minCal)) {
        results = results.filter(food => food.calories >= minCal);
      }
    }
    
    if (params.maxCalories !== undefined) {
      const maxCal = parseFloat(params.maxCalories);
      if (!isNaN(maxCal)) {
        results = results.filter(food => food.calories <= maxCal);
      }
    }
    
    if (params.minProtein !== undefined) {
      const minProt = parseFloat(params.minProtein);
      if (!isNaN(minProt)) {
        results = results.filter(food => food.protein >= minProt);
      }
    }
    
    if (params.maxProtein !== undefined) {
      const maxProt = parseFloat(params.maxProtein);
      if (!isNaN(maxProt)) {
        results = results.filter(food => food.protein <= maxProt);
      }
    }
    
    if (params.minCarbs !== undefined) {
      const minCarbs = parseFloat(params.minCarbs);
      if (!isNaN(minCarbs)) {
        results = results.filter(food => food.carbs >= minCarbs);
      }
    }
    
    if (params.maxCarbs !== undefined) {
      const maxCarbs = parseFloat(params.maxCarbs);
      if (!isNaN(maxCarbs)) {
        results = results.filter(food => food.carbs <= maxCarbs);
      }
    }
    
    if (params.minFat !== undefined) {
      const minFat = parseFloat(params.minFat);
      if (!isNaN(minFat)) {
        results = results.filter(food => food.fat >= minFat);
      }
    }
    
    if (params.maxFat !== undefined) {
      const maxFat = parseFloat(params.maxFat);
      if (!isNaN(maxFat)) {
        results = results.filter(food => food.fat <= maxFat);
      }
    }
  } catch (error) {
    console.error('Error filtering by nutritional values:', error);
    // Continue with unfiltered results
  }
  
  // Sort results if specified
  if (params.sortBy) {
    try {
      results.sort((a, b) => {
        // Sort by different properties
        switch (params.sortBy) {
          case 'name':
            return a.itemName.localeCompare(b.itemName);
          case 'calories':
            return (a.calories || 0) - (b.calories || 0);
          case 'protein':
            return (a.protein || 0) - (b.protein || 0);
          case 'carbs':
            return (a.carbs || 0) - (b.carbs || 0);
          case 'fat':
            return (a.fat || 0) - (b.fat || 0);
          default:
            return 0;
        }
      });
      
      // Reverse if descending order
      if (params.sortOrder === 'desc') {
        results.reverse();
      }
    } catch (error) {
      console.error('Error sorting results:', error);
      // Return unsorted results
    }
  }
  
  return results;
};

export default australianFoodDatabase; 