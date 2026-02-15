import { AppError } from './errorHandler.js';

export const validateRequest =
  (schema, source = 'body') =>
  (req, res, next) => {
    const data = req[source] || {};
    const result = schema.safeParse(data);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const errors = Object.fromEntries(
        Object.entries(fieldErrors).map(([key, value]) => [key, value.join(', ')])
      );
      return next(new AppError(400, 'Validation error', errors));
    }

    // Attach parsed data for downstream handlers (optional convenience)
    if (!req.validated) req.validated = {};
    req.validated[source] = result.data;

    return next();
  };

