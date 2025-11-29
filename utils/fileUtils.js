/**
 * File Utilities
 */

const fs = require('fs/promises');
const path = require('path');

const imagesDir = path.join(__dirname, '..', 'public', 'uploads', 'images');
const filesDir = path.join(__dirname, '..', 'public', 'uploads', 'files');

/**
 * Physically deletes a file from the filesystem.
 */
const deletePhysicalFile = async (subDir, relativePath) => {
  if (!relativePath) return;

  const filename = path.basename(relativePath);
  const fullPath = path.join(subDir, filename);

  try {
    await fs.unlink(fullPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
        console.error(`Failed to delete file ${fullPath}:`, error);
    }
  }
};

/**
 * Deletes a specific image file from the /uploads/images directory.
 */
const deleteImage = (path) => deletePhysicalFile(imagesDir, path);

/**
 * Deletes a specific product file (zip/pdf) from the /uploads/files directory.
 */
const deleteProductFile = (path) => deletePhysicalFile(filesDir, path);

/**
 * Rollback Utility: Cleans up files processed by Multer if the subsequent
 * database operation fails.
 */
const cleanupUploadedFiles = async (files) => {
  if (!files) return;
  
  const fileArrays = [files.newImages, files.productFile];
  
  for (const fileArray of fileArrays) {
    if (fileArray) {
      await Promise.all(fileArray.map(async (file) => {
        try { 
            await fs.unlink(file.path); 
        } catch (e) { 
        }
      }));
    }
  }
};

module.exports = { 
    deleteImage, 
    deleteProductFile, 
    cleanupUploadedFiles 
};
