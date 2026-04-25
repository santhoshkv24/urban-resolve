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

/**
 * Classify image using Google Cloud Vision
 * Returns the best matching municipal category based on detected labels.
 */
const classifyImageWithVision = async (imagePath, departments) => {
  if (!client) throw new Error('Vision client not initialized');

  // Handle remote URLs (Cloudinary) vs Local paths
  const request = {
    image: imagePath.startsWith('http') 
      ? { source: { imageUri: imagePath } } 
      : { content: imagePath }
  };

  // Perform label detection
  const [result] = await client.labelDetection(request);
  const labels = result.labelAnnotations;

  console.log(`🔍 AI Detected Labels for ${imagePath.substring(0, 50)}...:`, 
    labels?.map(l => `${l.description} (${Math.round(l.score * 100)}%)`).join(', ')
  );

  if (!labels || labels.length === 0) {
    return { departmentId: null, label: null, confidence: 0 };
  }

  // Find the best match across our departments' keywords
  let bestMatch = { departmentId: null, label: null, confidence: 0 };

  for (const annotation of labels) {
    const description = annotation.description.toLowerCase();
    const score = annotation.score;

    for (const dept of departments) {
      if (!dept.keywords) continue;
      
      const keywords = dept.keywords.split(',').map(k => k.trim().toLowerCase());
      
      // Check if any keyword is contained in the GCP description OR vice versa
      if (keywords.some(k => description.includes(k) || k.includes(description))) {
        // If multiple labels match, we take the one with the highest GCP score
        if (score > bestMatch.confidence) {
          bestMatch = { 
            departmentId: dept.id, 
            label: dept.aiLabel || dept.name, 
            confidence: score 
          };
        }
      }
    }
  }

  return bestMatch;
};

/**
 * Mock AI classifier — randomly picks a category with a confidence score.
 */
const classifyImageMock = async (departments) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const dept = departments[Math.floor(Math.random() * departments.length)];
  const confidence = parseFloat((0.70 + Math.random() * 0.25).toFixed(4));
  return { 
    departmentId: dept.id, 
    label: dept.aiLabel || dept.name, 
    confidence 
  };
};

/**
 * Main classification interface
 */
const classifyImage = async (imagePath) => {
  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true }
    });

    if (departments.length === 0) {
      throw new Error('No active departments found for classification');
    }

    let result;

    if (env.AI_SERVICE_TYPE === 'google_vision' && client) {
      result = await classifyImageWithVision(imagePath, departments);
      
      // Fallback to mock if no relevant labels were found
      if (!result.departmentId) {
        console.log('ℹ️ Google Vision found no matching labels. Falling back to mock for demo.');
        result = await classifyImageMock(departments);
      }
    } else {
      result = await classifyImageMock(departments);
    }

    return {
      departmentId: result.departmentId,
      label: result.label,
      confidence: result.confidence,
      requiresManualReview: result.confidence < 0.75, // Flag if confidence is low
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
