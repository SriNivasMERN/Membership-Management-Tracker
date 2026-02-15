export function createSuccessResponse(data) {
  return {
    success: true,
    data,
  };
}

export function createErrorResponse(message, errors = undefined) {
  const response = {
    success: false,
    message,
  };
  if (errors) {
    response.errors = errors;
  }
  return response;
}

