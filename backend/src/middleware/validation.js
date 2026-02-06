import Joi from 'joi';

/**
 * Validation schemas
 */
export const schemas = {
    register: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required()
    }),

    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    payin: Joi.object({
        amount: Joi.number().positive().max(100000).required(),
        fromAccount: Joi.string().optional(),
        metadata: Joi.object().optional()
    }),

    payout: Joi.object({
        amount: Joi.number().positive().max(100000).required(),
        toAccount: Joi.string().optional(),
        metadata: Joi.object().optional()
    }),

    payTax: Joi.object({
        amount: Joi.number().positive().max(100000).required(),
        taxType: Joi.string().optional(),
        metadata: Joi.object().optional()
    })
};

/**
 * Validation middleware factory
 * @param {string} schemaName - Name of the schema to validate against
 * @returns {function} - Express middleware
 */
export const validate = (schemaName) => {
    return (req, res, next) => {
        const schema = schemas[schemaName];

        if (!schema) {
            return res.status(500).json({
                success: false,
                message: 'Validation schema not found'
            });
        }

        const { error } = schema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(detail => detail.message)
            });
        }

        next();
    };
};
