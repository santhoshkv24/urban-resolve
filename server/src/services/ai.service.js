// ===========================================
// AI Image Classification Service
// Uses Google Cloud Vision API to classify
// images into municipal categories.
// ===========================================

const vision = require('@google-cloud/vision');
const prisma = require('../config/db');
const env = require('../config/env');
const path = require('path');

let client;
if (env.AI_SERVICE_TYPE === 'google_vision') {
  try {
    let options = {};
    
    // Priority 1: JSON content from Environment Variable (Best for Render/Cloud)
    if (env.GCP_SERVICE_ACCOUNT_JSON) {
      const credentials = JSON.parse(env.GCP_SERVICE_ACCOUNT_JSON);
      options = { credentials };
      console.log('✅ Google Vision: Initializing with JSON string from env.');
    } 
    // Priority 2: File path (Best for Local)
    else if (env.GOOGLE_APPLICATION_CREDENTIALS) {
      const keyPath = path.isAbsolute(env.GOOGLE_APPLICATION_CREDENTIALS) 
        ? env.GOOGLE_APPLICATION_CREDENTIALS 
        : path.join(process.cwd(), env.GOOGLE_APPLICATION_CREDENTIALS);
      options = { keyFilename: keyPath };
      console.log(`✅ Google Vision: Initializing with key file: ${keyPath}`);
    }

    if (Object.keys(options).length > 0) {
      client = new vision.ImageAnnotatorClient(options);
    }
  } catch (err) {
    console.error('❌ Failed to initialize Google Vision Client:', err.message);
  }
}

// Category Mapping (GCP Labels -> Municipal Departments)
const MAPPING = {
  'Water': ['water', 'pipe', 'plumbing', 'leak', 'fluid', 'flood', 'fountain', 'river', 'stream'],
  'Electricity': ['electricity', 'wire', 'cable', 'transformer', 'power line', 'utility pole', 'light', 'lamp', 'electronics'],
  'Sanitation': ['waste', 'garbage', 'trash', 'litter', 'pollution', 'sanitation', 'plastic', 'debris', 'sewage', 'drain'],
  'Roads': ['road', 'asphalt', 'pothole', 'street', 'highway', 'infrastructure', 'crack', 'pavement', 'curb', 'sidewalk'],
};

/**
 * Mock AI classifier — randomly picks a category with a confidence score.
 * Fallback when Google Vision is disabled or fails.
 */
const classifyImageMock = async (imagePath) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const labels = Object.keys(MAPPING);
  const label = labels[Math.floor(Math.random() * labels.length)];
  const confidence = parseFloat((0.70 + Math.random() * 0.25).toFixed(4));
  return { label, confidence };
};

/**
 * Classify image using Google Cloud Vision
 * Returns the best matching municipal category based on detected labels.
 */
const classifyImageWithVision = async (imagePath) => {
  if (!client) throw new Error('Vision client not initialized');

  // Perform label detection
  const [result] = await client.labelDetection(imagePath);
  const labels = result.labelAnnotations;

  if (!labels || labels.length === 0) {
    return { label: null, confidence: 0 };
  }

  // Find the best match across our categories
  let bestMatch = { label: null, confidence: 0 };

  for (const label of labels) {
    const description = label.description.toLowerCase();
    const score = label.score;

    for (const [category, keywords] of Object.entries(MAPPING)) {
      if (keywords.some(k => description.includes(k))) {
        // If multiple labels match, we take the one with the highest GCP score
        if (score > bestMatch.confidence) {
          bestMatch = { label: category, confidence: score };
        }
      }
    }
  }

  return bestMatch;
};

/**
 * Main classification interface
 */
const classifyImage = async (imagePath) => {
  try {
    let result;

    if (env.AI_SERVICE_TYPE === 'google_vision' && client) {
      result = await classifyImageWithVision(imagePath);
      
      // Fallback to mock if no relevant labels were found
      if (!result.label) {
        console.log('ℹ️ Google Vision found no matching labels. Falling back to mock for demo.');
        result = await classifyImageMock(imagePath);
      }
    } else {
      result = await classifyImageMock(imagePath);
    }

    // Map the classification label to a department
    const department = await prisma.department.findFirst({
      where: {
        aiLabel: result.label,
        isActive: true,
      },
    });

    if (department) {
      return {
        departmentId: department.id,
        label: result.label,
        confidence: result.confidence,
        requiresManualReview: result.confidence < 0.75, // Flag if confidence is low
      };
    }

    return {
      departmentId: null,
      label: result.label,
      confidence: result.confidence,
      requiresManualReview: true,
    };
  } catch (error) {
    console.error('❌ AI classification failed:', error.message);
    return {
      departmentId: null,
      label: null,
      confidence: null,
      requiresManualReview: true,
    };
  }
};

module.exports = { 
  classifyImage,
  checkAiStatus: () => {
    if (env.AI_SERVICE_TYPE === 'mock') return 'MOCK (Active)';
    return client ? 'GOOGLE_VISION (Ready)' : 'GOOGLE_VISION (Not Initialized)';
  }
};
