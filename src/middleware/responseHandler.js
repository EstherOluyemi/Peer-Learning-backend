export const sendSuccess = (res, data, status = 200, metadata = null) => {
  const response = {
    status: 'success',
    data,
  };
  if (metadata) {
    response.metadata = metadata;
  }
  return res.status(status).json(response);
};

export const sendError = (res, message, code, status = 400) => {
  return res.status(status).json({
    status: 'error',
    code,
    message,
    timestamp: new Date().toISOString()
  });
};
