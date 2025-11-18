import { validationResult } from 'express-validator';

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Error de validación',
      errors: errors.array().map(error => ({
        field: error.path || error.param,
        value: error.value,
        message: error.msg
      }))
    });
  }
  
  next();
};

export default handleValidationErrors;