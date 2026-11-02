const cloudinary = require('cloudinary').v2;
const fs = require('fs');
require('dotenv').config();

// Configure Cloudinary SDK with environment credentials
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

/**
 * Upload a local file to Cloudinary and clean up the temporary file from the disk.
 * @param {string} localFilePath - Path of the file saved locally by Multer
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<object|null>} - Cloudinary upload response object
 */
const uploadOnCloudinary = async (localFilePath, folder = 'taskflow_attachments') => {
    try {
        if (!localFilePath) return null;

        // Upload file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
            folder,
        });

        // Upload succeeded: remove the local temporary file from disk
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response;
    } catch (error) {
        // Upload failed: remove the local temporary file so it doesn't pollute the disk
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        throw error;
    }
};

/**
 * Delete a file from Cloudinary using its public ID.
 * @param {string} publicId - The Cloudinary public_id of the asset
 * @param {string} resourceType - Resource type ('image', 'raw', etc.)
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
    try {
        if (!publicId) return null;
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
        return result;
    } catch (error) {
        console.error('Failed to delete asset from Cloudinary:', error);
        return null;
    }
};

module.exports = {
    cloudinary,
    uploadOnCloudinary,
    deleteFromCloudinary,
};
