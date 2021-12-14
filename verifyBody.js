exports.verifyBody = function (...validation) {
    return async (ctx, next) => {
        const body = ctx.request.body;

        for (const object of validation) {
            ctx.assert(body[object.key], 400, `Missing body key "${object.key}"!`);

            object.cb(ctx, object);
        }

        await next();
    }
}

