const {
    createAttachment,
    findAttachmentsByTaskId,
    findAttachmentById,
    deleteAttachment,
} = require('./attachments.repository.js');
const { findTaskById } = require('../tasks/tasks.repository.js');
const { findProjectMember } = require('../members/members.repository.js');
const { uploadOnCloudinary, deleteFromCloudinary } = require('../../config/cloudinary.js');
const NotFoundError = require('../../errors/NotFoundError.js');
const AuthorizationError = require('../../errors/AuthorizationError.js');
const ValidationError = require('../../errors/ValidationError.js');

const extractCloudinaryDetails = (fileUrl, mimeType) => {
    if (!fileUrl) return { publicId: null, resourceType: 'image' };

    const parts = fileUrl.split('/upload/');
    if (parts.length < 2) return { publicId: null, resourceType: 'image' };

    const withoutVersion = parts[1].replace(/^v\d+\//, '');

    const isImage = mimeType && mimeType.startsWith('image/');
    const resourceType = isImage ? 'image' : 'raw';
    const publicId = isImage
        ? withoutVersion.replace(/\.[^/.]+$/, '')
        : withoutVersion;

    return { publicId, resourceType };
};

const addAttachment = async ({ projectId, taskId, userId, file }) => {
    if (!file) {
        throw new ValidationError('Please provide a file to upload');
    }
    const task = await findTaskById(taskId);
    if (!task || task.projectId !== projectId) {
        throw new NotFoundError('Task not found in this project');
    }
    let uploadResult;
    try {
        uploadResult = await uploadOnCloudinary(file.path, 'taskflow_attachments');
    } catch (uploadError) {
        throw new ValidationError('Failed to upload file to cloud storage. Please try again.');
    }

    try {
        const attachment = await createAttachment({
            taskId,
            uploaderId: userId,
            fileName: file.originalname,
            fileUrl: uploadResult.secure_url,
            fileSize: file.size,
            mimeType: file.mimetype,
        });

        return attachment;
    } catch (dbError) {
        const { publicId, resourceType } = extractCloudinaryDetails(
            uploadResult.secure_url,
            file.mimetype
        );
        if (publicId) {
            await deleteFromCloudinary(publicId, resourceType);
        }
        throw dbError;
    }
};
const getTaskAttachments = async (projectId, taskId) => {
    const task = await findTaskById(taskId);
    if (!task || task.projectId !== projectId) {
        throw new NotFoundError('Task not found in this project');
    }

    const attachments = await findAttachmentsByTaskId(taskId);
    return attachments;
};
const deleteAttachmentById = async ({ projectId, taskId, attachmentId, userId }) => {
    const task = await findTaskById(taskId);
    if (!task || task.projectId !== projectId) {
        throw new NotFoundError('Task not found in this project');
    }
    const attachment = await findAttachmentById(attachmentId);
    if (!attachment || attachment.taskId !== taskId) {
        throw new NotFoundError('Attachment not found on this task');
    }
    const member = await findProjectMember(projectId, userId);
    if (!member) {
        throw new AuthorizationError('You are not a member of this project');
    }

    const isOwnerOrAdmin = member.role === 'owner' || member.role === 'admin';
    const isUploader = attachment.uploaderId === userId;

    if (!isOwnerOrAdmin && !isUploader) {
        throw new AuthorizationError('You do not have permission to delete this attachment');
    }
    const deleted = await deleteAttachment(attachmentId);
    if (deleted && deleted.fileUrl) {
        const { publicId, resourceType } = extractCloudinaryDetails(
            deleted.fileUrl,
            attachment.mimeType
        );
        if (publicId) {
            await deleteFromCloudinary(publicId, resourceType);
        }
    }

    return { id: attachmentId };
};

module.exports = {
    addAttachment,
    getTaskAttachments,
    deleteAttachmentById,
    extractCloudinaryDetails,
};