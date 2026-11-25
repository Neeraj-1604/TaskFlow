const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const env = require('./env.js');

cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
});

const uploadOnCloudinary = async (localFilePath, folder = 'taskflow_attachments') => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
            folder,
        });
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response;
    } catch (error) {
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        throw error;
    }
};

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
