const asyncHandler = require('../../utils/asyncHandler.js');
  const apiResponse = require('../../utils/apiResponse.js');
  const {
      addAttachment,
      getTaskAttachments,
      deleteAttachmentById,
  } = require('./attachments.service.js');

  const createAttachment = asyncHandler(async (req, res) => {
      const { projectId, taskId } = req.params;
      const userId = req.user.id;
      const file = req.file;

      const attachment = await addAttachment({ projectId, taskId, userId, file });

      const response = new apiResponse(201, attachment, 'Attachment uploaded successfully');
      res.status(response.statusCode).json(response);
  });

  const getAttachments = asyncHandler(async (req, res) => {
      const { projectId, taskId } = req.params;

      const attachments = await getTaskAttachments(projectId, taskId);

      const response = new apiResponse(200, attachments, 'Attachments fetched successfully');
      res.status(response.statusCode).json(response);
  });

  const deleteAttachment = asyncHandler(async (req, res) => {
      const { projectId, taskId, attachmentId } = req.params;
      const userId = req.user.id;

      const result = await deleteAttachmentById({ projectId, taskId, attachmentId, userId });

      const response = new apiResponse(200, result, 'Attachment deleted successfully');
      res.status(response.statusCode).json(response);
  });

  module.exports = { createAttachment, getAttachments, deleteAttachment };