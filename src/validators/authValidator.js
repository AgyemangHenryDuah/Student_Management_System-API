const Joi = require("joi");

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        "string.email": "Invalid email format",
        "string.empty": "Email is required",
    }),
    password: Joi.string().min(6).required().messages({
        "string.min": "Password must be at least 6 characters",
        "string.empty": "Password is required",
    }),
});

const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required().messages({
        "string.empty": "Refresh token is required",
    }),
})


const resetPasswordSchema = Joi.object({
    email: Joi.string().email().required().messages({
        "string.email": "Invalid email format",
        "string.empty": "Email is required",
    }),
    password: Joi.string().min(6).required().messages({
        "string.min": "Password must be at least 6 characters",
        "string.empty": "Password is required",
    }),
});


const validateRefreshToken = (data) => { 
    const { error } = refreshTokenSchema.validate(data, { abortEarly: false });
    if (error) {
        const messages = error.details.map((detail) => detail.message);
        return messages;
    }
    return null;
}



const validateResetPassword = (data) => {
    const { error } = resetPasswordSchema.validate(data, { abortEarly: false });
    if (error) {
        const messages = error.details.map((detail) => detail.message);
        return messages;
    }
    return null;
};

const validateLogin = (data) => {
    const { error } = loginSchema.validate(data, { abortEarly: false });
    if (error) {
        const messages = error.details.map((detail) => detail.message);
        return messages;
    }
    return null;
};



module.exports = {
    validateLogin, validateResetPassword, validateRefreshToken
};
