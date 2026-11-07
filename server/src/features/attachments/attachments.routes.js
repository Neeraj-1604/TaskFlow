  const express = require('express');
  const { uploadSingle } = require('../../middleware/upload.js');
  const validate = require('../../middleware/validate.js');
  const { attachmentParamsSchema } = require('./attachments.validator.js');
  const {
      createAttachment,
      getAttachments,
      deleteAttachment,
  } = require('./attachments.controller.js');

  const router = express.Router({ mergeParams: true });

  router.post('/', uploadSingle('file'), validate(attachmentParamsSchema, 'params'), createAttachment);
  router.get('/', validate(attachmentParamsSchema, 'params'), getAttachments);
  router.delete('/:attachmentId', validate(attachmentParamsSchema, 'params'), deleteAttachment);

  module.exports = router;