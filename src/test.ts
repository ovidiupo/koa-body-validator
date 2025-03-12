import {Context} from 'koa';
import "koa-body/lib/index";
import {Validator} from "./validator.type";

export function validateRequestBody(validations: Validator) {
    return async (ctx: Context, next: () => Promise<void>) => {
        const body = ctx.request.body;

        const errors = validate(body, validations);

        if (errors.length) {
            ctx.throw(400, {errors});
        }

        await next();
    }
}

export function isDefined() {
    return createValidator().isDefined();
}

export function isString() {
    return createValidator().isString();
}

function validate(body: any, validations: Validator) {
    const _errors: string[] = [];

    for (const [key, validator] of Object.entries(validations)) {
        const value = body[key];

        if (value === undefined && !validator.hasToBeDefined) {
            continue;
        }

        const {errors} = validator.validate(value, key, []);

        if (errors?.length) {
            _errors.push(...errors);
        }
    }

    return _errors;
}

function createValidator(): Validator {
    return <Validator>{
        hasToBeDefined: false,
        validators: [],
        isDefined: () => {
            this.hasToBeDefined = true;
            this.validators.push((value: any, key: string, errors: string[]) => {
                if (value === undefined) {
                    errors.push(`"${key}" should not be null or undefined!`);
                }
            });
            return this;
        },
        isString: () => {
            this.validators.push((value: any, key: string, errors: string[]) => {
                if (typeof value !== 'string') {
                    errors.push(`"${key}" must be a string`);
                }
            });
            return this;
        },
        validate: (value: any, key: string, errors: string[]) => {
            if (!this.hasToBeDefined && value === undefined) {
                return {errors};
            }

            const size = this.validators.length;

            for (let i = 0; i < size; i++) {
                this.validators[i](value, key, errors);
            }

            return {errors};
        }
    };
}