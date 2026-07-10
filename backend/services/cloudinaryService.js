import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

/**
 * Uploads a local file to Cloudinary and deletes the local temporary file.
 * @param {string} filePath - Path to the local file.
 * @param {string} folderName - Subfolder inside Cloudinary (e.g. profiles, medicals, transformations, diets).
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export const uploadToCloudinary = async (filePath, folderName) => {
  try {
    const options = {
      folder: `nutricoach/${folderName}`
    };

    // For PDFs/docs, upload as image so Cloudinary allows public delivery without 401
    options.resource_type = 'image';

    const result = await cloudinary.uploader.upload(filePath, options);
    
    // Delete local temporary file
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn(`Failed to delete temp file ${filePath}:`, err.message);
      }
    }
    
    return {
      secure_url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    // Make sure to clean up temp file even on failure
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn(`Failed to delete temp file ${filePath} after failure:`, err.message);
      }
    }
    throw error;
  }
};

/**
 * Deletes a file from Cloudinary by public_id.
 * @param {string} publicId - Cloudinary public_id.
 * @param {string} resourceType - 'image' or 'raw' (for PDF).
 * @returns {Promise<any>}
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId) return;
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error(`Failed to delete asset ${publicId} from Cloudinary:`, error);
    throw error;
  }
};
