// ===========================================
// AI Image Classification Service
// Mock implementation for prototype — classifies
// images into municipal categories (Water, Electricity,
// Sanitation, Roads) with a confidence score.
// Abstracted interface for easy Google Cloud Vision swap.
// ===========================================

const prisma = require('../config/db');
const env = require('../config/env');

// Available category labels (must match Department.aiLabel values)
const CATEGORIES = ['Water', 'Electricity', 'Sanitation', 'Roads'];

/**
 * Mock AI classifier — randomly picks a category with a confidence score.
 * In production, swap this with Google Cloud Vision API call.
 * @param {string} imagePath - Path to the uploaded image
 * @returns {Promise<{label: string, confidence: number}>}
 */
const classifyImageMock = async (imagePath) => {
  // Simulate processing delay (300-800ms)
  await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500));

  const label = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const confidence = parseFloat((0.70 + Math.random() * 0.25).toFixed(4)); // 0.70 - 0.95

  return { label, confidence };
};

/**
 * Classify an uploaded image and return the recommended department.
 * If classification fails, returns null recommendation with manual review flag.
 * @param {string} imagePath - Path to the uploaded image
 * @returns {Promise<{departmentId: number|null, label: string|null, confidence: number|null, requiresManualReview: boolean}>}
 */
const classifyImage = async (imagePath) => {
  try {
    let result;

    if (env.AI_SERVICE_TYPE === 'google_vision') {
      // TODO: Implement Google Cloud Vision API integration
      // For now, fall back to mock
      result = await classifyImageMock(imagePath);
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
        requiresManualReview: false,
      };
    }

    // Label doesn't match any department — needs manual review
    console.warn(`⚠️ AI label "${result.label}" does not match any active department.`);
    return {
      departmentId: null,
      label: result.label,
      confidence: result.confidence,
      requiresManualReview: true,
    };
  } catch (error) {
    console.error('❌ AI classification failed:', error.message);
    // On failure, ticket proceeds to PENDING_ADMIN with manual review flag
    return {
      departmentId: null,
      label: null,
      confidence: null,
      requiresManualReview: true,
    };
  }
};

module.exports = { classifyImage };
