/**
 * Detail Service
 */

const { v4: uuidv4 } = require('uuid');
const { readDb, writeDb } = require('../utils/db');
const { deleteImage, deleteProductFile } = require('../utils/fileUtils');
const itemService = require('./itemService');

/**
 * Retrieves the detail record associated with a specific parent Item ID.
 */
const getDetailByItemId = async (itemId) => {
  const db = await readDb();
  return db.details.find((d) => d.itemId === itemId);
};

/**
 * Main "Save" for the Item Editor.
 * Handles:
 * 1. Renaming the parent Item (if name changed).
 * 2. Merging existing images with newly uploaded images.
 * 3. Cleaning up images explicitly removed by the user.
 * 4. Handling file replacement for downloadable products.
 */
const upsertDetail = async (itemId, formData, files) => {
    const { detailId, title, content, existingImages, existingFilePath, externalLink, name, categoryId, tags } = formData;

    if (name) {
        await itemService.updateItem(itemId, name, categoryId, tags);
    }

    const db = await readDb();

    const newImagePaths = files?.newImages ? files.newImages.map(f => `/uploads/images/${f.filename}`) : [];
    
    const imagesToKeep = existingImages ? (Array.isArray(existingImages) ? existingImages : [existingImages]) : [];
    
    const finalImages = [...new Set([...imagesToKeep, ...newImagePaths])];

    let finalFilePath = existingFilePath || null;
    if (files?.productFile && files.productFile[0]) {
        finalFilePath = `/uploads/files/${files.productFile[0].filename}`;
    }

    const detailData = {
        itemId,
        title,
        content,
        images: finalImages,
        filePath: finalFilePath,
        externalLink: externalLink ? externalLink.trim() : null
    };

    let redirectId = itemId;

    if (detailId) {
        const index = db.details.findIndex(d => d.id === detailId);
        if (index > -1) {
            const oldDetail = db.details[index];
            
            const keptSet = new Set(imagesToKeep);
            await Promise.all(oldDetail.images.map(async img => {
                if (!keptSet.has(img)) await deleteImage(img);
            }));

            if (files?.productFile && oldDetail.filePath) {
                await deleteProductFile(oldDetail.filePath);
            }

            db.details[index] = { ...oldDetail, ...detailData };
            redirectId = db.details[index].itemId;
        }
    } else {
        const newDetail = { id: uuidv4(), ...detailData };
        db.details.push(newDetail);
    }

    await writeDb(db);
    return `/admin/item/${redirectId}/manage`;
};

/**
 * Deletes a detail record and cleans up all associated physical files (images/zips).
 */
const deleteDetail = async (id) => {
    const db = await readDb();
    const detail = db.details.find(d => d.id === id);
    const itemId = detail ? detail.itemId : null;

    if (detail) {
        if (detail.images) await Promise.all(detail.images.map(deleteImage));
        if (detail.filePath) await deleteProductFile(detail.filePath);
        
        db.details = db.details.filter(d => d.id !== id);
        await writeDb(db);
    }
    return itemId ? `/admin/item/${itemId}/manage` : '/admin/dashboard';
};

/**
 * Cascading delete helper. Called when an Item is deleted to ensure
 * its Detail record (and files) don't become orphans.
 */
const deleteDetailsByItemId = async (itemId) => {
    const db = await readDb();
    const toDelete = db.details.filter(d => d.itemId === itemId);
    
    await Promise.all(toDelete.map(async d => {
        if (d.images) await Promise.all(d.images.map(deleteImage));
        if (d.filePath) await deleteProductFile(d.filePath);
    }));

    db.details = db.details.filter(d => d.itemId !== itemId);
    await writeDb(db);
};

module.exports = {
  getDetailByItemId,
  upsertDetail,
  deleteDetail,
  deleteDetailsByItemId
};
