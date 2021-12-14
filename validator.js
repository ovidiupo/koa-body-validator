module.exports = { verifyBody, isString, isNumber, isEmail, isComplexPassword };

function verifyBody(...validation) {
    return async (ctx, next) => {
        const body = ctx.request.body;

        for (const object of validation) {
            ctx.assert(body[object.key], 400, `Missing body key "${object.key}"!`);

            object.cb(ctx, object);
        }

        await next();
    }
}

function isString({ key, minLength, maxLength }) {
    return {
        key,
        ...(minLength && { minLength }),
        ...(maxLength && { maxLength }),
        cb: (ctx, object) => {
            ctx.assert(typeof (ctx.request.body[object.key]) == 'string', 400, `Body key "${object.key}" has to be string!`);
            ctx.assert(!(object.minLength && object.minLength > ctx.request.body[object.key].length), 400, `Wrong min length key "${object.key}"!`);
            ctx.assert(!(object.maxLength && object.maxLength < ctx.request.body[object.key].length), 400, `Wrong max length key "${object.key}"!`);
        }
    }
}

function isNumber({ key, minValue, maxValue }) {
    return {
        key,
        ...(minValue && { minValue }),
        ...(maxValue && { maxValue }),
        cb: (ctx, object) => {
            ctx.assert(typeof (ctx.request.body[object.key]) == 'number', 400, `Body key "${object.key}" has to be number!`);
            ctx.assert(!(object.minValue && object.minValue > body[object.key]), 400, `Wrong min value key "${object.key}"!`);
            ctx.assert(!(object.maxValue && object.maxValue < body[object.key]), 400, `Wrong max value key "${object.key}"!`);
        }
    }
}

function isEmail({ key }) {
    return {
        key,
        cb: (ctx, object) => {
            isString({ key }).cb(ctx, object);

            ctx.assert(ctx.request.body[key].match(/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i), 400, `Invalid email!`);
        }
    }
}

function isComplexPassword({ key }) {
    return {
        key,
        cb: (ctx, object) => {
            isString({ key }).cb(ctx, object);

            ctx.assert(ctx.request.body[key].match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/), 400, `Week password!`);
        }
    }
}