module.exports = { 
    verifyBody, 
    isString, 
    isNumber, 
    isEmail, 
    isComplexPassword, 
    isBoolean, 
    isDate, 
    isArray, 
    isObject 
};

function verifyBody(...validation) {
    return async (ctx, next) => {
        const body = ctx.request.body;

        for (const object of validation) {
            ctx.assert(body[object.key] !== undefined, 400, `"${object.key}" should not be null or undefined!`);
            object.cb(ctx, object);
        }

        await next();
    };
}

function isString({ key, minLength, maxLength }) {
    return {
        key,
        minLength,
        maxLength,
        cb: (ctx, object) => {
            const value = ctx.request.body[object.key];
            ctx.assert(typeof value === 'string', 400, `"${object.key}" must be a string!`);
            ctx.assert(!object.minLength || value.length >= object.minLength, 400, `"${object.key}" must be at least ${object.minLength} characters!`);
            ctx.assert(!object.maxLength || value.length <= object.maxLength, 400, `"${object.key}" must be at most ${object.maxLength} characters!`);
        }
    };
}

function isNumber({ key, minValue, maxValue }) {
    return {
        key,
        minValue,
        maxValue,
        cb: (ctx, object) => {
            const value = ctx.request.body[object.key];
            ctx.assert(typeof value === 'number' && !isNaN(value), 400, `"${object.key}" must be a number!`);
            ctx.assert(!object.minValue || value >= object.minValue, 400, `"${object.key}" must be at least ${object.minValue}!`);
            ctx.assert(!object.maxValue || value <= object.maxValue, 400, `"${object.key}" must be at most ${object.maxValue}!`);
        }
    };
}

function isBoolean({ key }) {
    return {
        key,
        cb: (ctx, object) => {
            const value = ctx.request.body[object.key];
            ctx.assert(typeof value === 'boolean', 400, `"${object.key}" must be true or false!`);
        }
    };
}

function isEmail({ key }) {
    return {
        key,
        cb: (ctx, object) => {
            isString({ key }).cb(ctx, object);
            ctx.assert(ctx.request.body[key].match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/), 400, `Invalid email format!`);
        }
    };
}

function isComplexPassword({ key }) {
    return {
        key,
        cb: (ctx, object) => {
            isString({ key }).cb(ctx, object);
            ctx.assert(ctx.request.body[key].match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/), 400, `Weak password! Must have at least 8 characters, uppercase, lowercase, number, and special character.`);
        }
    };
}

function isDate({ key }) {
    return {
        key,
        cb: (ctx, object) => {
            const value = ctx.request.body[object.key];
            ctx.assert(typeof value === 'string' && !isNaN(Date.parse(value)), 400, `"${object.key}" must be a valid ISO date string!`);
        }
    };
}

function isArray({ key, minLength, maxLength }) {
    return {
        key,
        minLength,
        maxLength,
        cb: (ctx, object) => {
            const value = ctx.request.body[object.key];
            ctx.assert(Array.isArray(value), 400, `Body key "${object.key}" must be an array!`);
            ctx.assert(!object.minLength || value.length >= object.minLength, 400, `"${object.key}" must have at least ${object.minLength} items!`);
            ctx.assert(!object.maxLength || value.length <= object.maxLength, 400, `"${object.key}" must have at most ${object.maxLength} items!`);
        }
    };
}

function isStructuredObject({ key, schema }) {
    return {
        key,
        schema,
        cb: (ctx, object) => {
            const value = ctx.request.body[object.key];

            ctx.assert(
                typeof value === 'object' && value !== null && !Array.isArray(value),
                400,
                `"${object.key}" must be an object!`
            );

            for (const fieldValidation of object.schema) {
                fieldValidation.cb({ request: { body: value } }, fieldValidation);
            }
        }
    };
}

function isArrayOfObjects({ key, schema, minItems = 1, maxItems = null }) {
    return {
        key,
        schema,
        minItems,
        maxItems,
        cb: (ctx, object) => {
            const value = ctx.request.body[object.key];

            ctx.assert(Array.isArray(value), 400, `"${object.key}" must be an array!`);
            
            ctx.assert(value.length >= object.minItems, 400, `"${object.key}" must have at least ${object.minItems} items!`);
            if (object.maxItems !== null) {
                ctx.assert(value.length <= object.maxItems, 400, `"${object.key}" cannot exceed ${object.maxItems} items!`);
            }

            value.forEach((item, index) => {
                ctx.assert(
                    typeof item === 'object' && item !== null && !Array.isArray(item),
                    400,
                    `Item at index ${index} in "${object.key}" must be an object!`
                );

                for (const fieldValidation of object.schema) {
                    fieldValidation.cb({ request: { body: item } }, fieldValidation);
                }
            });
        }
    };
}
