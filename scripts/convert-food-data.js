/**
 * Food Data Conversion Script
 * 
 * This script helps convert food data from various formats to the format
 * required by the Calorie Tracker application.
 * 
 * Usage:
 * 1. Install Node.js if you haven't already
 * 2. Run: npm install csv-parser fs-extra
 * 3. Place your input file in the same directory as this script
 * 4. Run: node convert-food-data.js <input-file> <output-file> <format>
 *    - input-file: Path to your input file
 *    - output-file: Path for the converted output file
 *    - format: Output format (json or csv)
 * 
 * Example:
 *    node convert-food-data.js my-foods.csv converted-foods.json json
 */

const fs = require('fs-extra');
const csv = require('csv-parser');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Usage: node convert-food-data.js <input-file> <output-file> <format>');
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];
const outputFormat = args[2].toLowerCase();

if (!['json', 'csv'].includes(outputFormat)) {
  console.error('Error: Format must be either "json" or "csv"');
  process.exit(1);
}

// Check if input file exists
if (!fs.existsSync(inputFile)) {
  console.error(`Error: Input file "${inputFile}" not found`);
  process.exit(1);
}

// Determine input format based on file extension
const inputFormat = path.extname(inputFile).toLowerCase();

// Function to convert data to the required format
function convertData(inputData) {
  return inputData.map(item => {
    // Create a standardized food object
    const food = {
      itemName: item.name || item.itemName || item.food_name || item.foodName || '',
      category: item.category || item.food_group || item.foodGroup || 'Uncategorized',
      weight: item.weight || item.serving_size || item.servingSize || '100g',
      calories: parseFloat(item.calories || item.energy || item.kcal || 0),
      protein: parseFloat(item.protein || item.proteins || 0),
      fat: parseFloat(item.fat || item.fats || item.total_fat || 0),
      carbs: parseFloat(item.carbs || item.carbohydrates || item.total_carbohydrate || 0),
      fiber: parseFloat(item.fiber || item.dietary_fiber || 0),
      sugar: parseFloat(item.sugar || item.sugars || item.total_sugar || 0),
      sodium: parseFloat(item.sodium || 0),
      description: item.description || item.notes || ''
    };

    // Validate required fields
    if (!food.itemName) {
      console.warn('Warning: Food item missing name, skipping');
      return null;
    }

    if (isNaN(food.calories)) {
      console.warn(`Warning: "${food.itemName}" has invalid calories value, setting to 0`);
      food.calories = 0;
    }

    return food;
  }).filter(Boolean); // Remove null items
}

// Process CSV input
if (inputFormat === '.csv') {
  const results = [];
  
  fs.createReadStream(inputFile)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      const convertedData = convertData(results);
      outputConvertedData(convertedData);
    });
}
// Process JSON input
else if (inputFormat === '.json') {
  try {
    const data = fs.readJsonSync(inputFile);
    const inputData = Array.isArray(data) ? data : [data];
    const convertedData = convertData(inputData);
    outputConvertedData(convertedData);
  } catch (error) {
    console.error('Error reading JSON file:', error.message);
    process.exit(1);
  }
}
// Process Excel (XLSX) input - requires additional library
else if (inputFormat === '.xlsx' || inputFormat === '.xls') {
  console.error('Excel format not supported directly. Please export to CSV first.');
  process.exit(1);
}
// Unsupported format
else {
  console.error(`Unsupported input format: ${inputFormat}`);
  process.exit(1);
}

// Output the converted data in the specified format
function outputConvertedData(data) {
  if (outputFormat === 'json') {
    fs.writeJsonSync(outputFile, data, { spaces: 2 });
  } else if (outputFormat === 'csv') {
    // Create CSV header
    const header = 'itemName,category,weight,calories,protein,fat,carbs,fiber,sugar,sodium,description\n';
    
    // Create CSV rows
    const rows = data.map(food => {
      return [
        `"${food.itemName.replace(/"/g, '""')}"`,
        `"${food.category.replace(/"/g, '""')}"`,
        `"${food.weight.replace(/"/g, '""')}"`,
        food.calories,
        food.protein,
        food.fat,
        food.carbs,
        food.fiber,
        food.sugar,
        food.sodium,
        `"${food.description.replace(/"/g, '""')}"`
      ].join(',');
    }).join('\n');
    
    // Write CSV file
    fs.writeFileSync(outputFile, header + rows);
  }
  
  console.log(`Conversion complete! ${data.length} food items converted to ${outputFormat.toUpperCase()}.`);
  console.log(`Output saved to: ${outputFile}`);
} 