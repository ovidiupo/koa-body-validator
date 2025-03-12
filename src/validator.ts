import {Context} from 'koa';
import "koa-body/lib/index";
import {Something, StringValidatorOptions, ValidatorFnc, ValidatorOptions, ValidatorType} from "./validator.type";

export function validateRequestBody(validations: Something) {
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
    return new Validator().isDefined();
}

export function isOptional() {
    return new Validator().isOptional();
}

function validate(body: any, validations: Something) {
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

class Validator implements ValidatorType {
    hasToBeDefined: boolean = false;
    validators: Array<(value: any, key: string, errors: string[]) => void> = [];

    isDefined(): ValidatorType {
        this.hasToBeDefined = true;
        this.validators.push((value: any, key: string, errors: string[]) => {
            if (value === undefined) {
                errors.push(`"${key}" should not be null or undefined!`);
            }
        });
        return this;
    }

    isOptional(): ValidatorType {
        this.hasToBeDefined = false;
        return this;
    }

    isString(options?: StringValidatorOptions): ValidatorType {
        this.validators.push(this.isStringValidator(options));
        return this;
    }

    isEmail(options?: ValidatorOptions): ValidatorType {
        this.validators.push(this.isEmailValidator(options));
        return this;
    }

    // TODO add interface for options type
    isComplexPassword(options?: ValidatorOptions & { regExp?: RegExp }): ValidatorType {
        this.validators.push(this.isComplexPasswordValidator(options));
        return this;
    }

    isObject(validators: Something, options?: ValidatorOptions): ValidatorType {
        this.validators.push(this.isObjectValidator(validators, options));
        return this;
    }

    // TODO: implement it + add interface for options type
    isNumber(options?: ValidatorOptions & { min?: number; max?: number }): ValidatorType {
        return this;
    }

    // TODO: implement it + add interface for options type
    isDate(options?: ValidatorOptions): ValidatorType {
        return this;
    }

    validate(value: any, key: string, errors: string[]): { errors: string[] } {
        if (!this.hasToBeDefined && value === undefined) {
            return {errors};
        }

        const size = this.validators.length;

        for (let i = 0; i < size; i++) {
            this.validators[i](value, key, errors);
        }

        return {errors};
    }

    private isStringValidator = (options?: StringValidatorOptions): ValidatorFnc => {
        const {each = false} = options || {};

        return (value: any, key: string, errors: string[]) => {
            const isStringValidatorChecks = (value: any) => {
                if (typeof value !== 'string') {
                    errors.push(`"${key}" must be a string`);
                    return;
                }

                if (options?.notEmpty && value.length === 0) {
                    errors.push(`"${key}" must not be empty`);
                }

                if (options?.min && value.length < options.min) {
                    errors.push(`"${key}" must have at least ${options.min} characters`);
                }

                if (options?.max && value.length > options.max) {
                    errors.push(`"${key}" must have at most ${options.max} characters`);
                }
            }

            if (!each) {
                isStringValidatorChecks(value);
                return;
            }

            if (!Array.isArray(value)) {
                errors.push(`"${key}" must be an array!`);
            }

            const length = value.length;
            for (let i = 0; i < length; i++) {
                isStringValidatorChecks(value[i]);
            }
        }
    }

    private isEmailValidator = (options?: ValidatorOptions): ValidatorFnc => {
        const {each = false} = options || {};

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return (value: any, key: string, errors: string[]) => {
            const isEmailValidatorCheck = (value: any) => {
                if (!emailRegex.test(value)) {
                    errors.push(`"${key}" must be a valid email format`);
                }
            }
            if (!each) {
                isEmailValidatorCheck(value);
                return;
            }

            if (!Array.isArray(value)) {
                errors.push(`"${key}" must be an array!`);
                return;
            }

            const length = value.length;
            for (let i = 0; i < length; i++) {
                isEmailValidatorCheck(value[i]);
            }

        }
    }

    private isComplexPasswordValidator = (options?: ValidatorOptions & { regExp?: RegExp }): ValidatorFnc => {
        const {
            each = false,
            regExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        } = options || {};

        return (value: any, key: string, errors: string[]) => {
            const isComplexPasswordValidatorChecks = (value: any) => {
                if (!regExp!.test(value)) {
                    errors.push(`"${key}" must be a strong password`);
                }
            }

            if (!each) {
                isComplexPasswordValidatorChecks(value);
                return;
            }

            if (!Array.isArray(value)) {
                errors.push(`"${key}" must be an array!`);
                return;
            }

            const length = value.length;
            for (let i = 0; i < length; i++) {
                isComplexPasswordValidatorChecks(value[i]);
            }

        }
    }

    private isObjectValidator = (validators: Something, options?: ValidatorOptions): ValidatorFnc => {
        const {each = false} = options || {};

        return (value: any, key: string, errors: string[]) => {
            const isObjectValidatorChecks = (value: any) => {
                if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                    errors.push(`"${key}" must be an object`);
                    value = {};
                }

                if (validators && typeof validators === 'object') {
                    for (const [nestedKey, nestedValidator] of Object.entries(validators)) {
                        const nestedValue = value[nestedKey];

                        const {errors: nestedErrors} = nestedValidator.validate(nestedValue, `${key}.${nestedKey}`, []);

                        if (nestedErrors.length) {
                            errors.push(...nestedErrors);
                        }
                    }
                }
            }

            if (!each) {
                isObjectValidatorChecks(value);
                return;
            }

            if (!Array.isArray(value)) {
                errors.push(`"${key}" must be an array!`);
            }

            const length = value.length;

            for (let i = 0; i < length; i++) {
                isObjectValidatorChecks(value[i]);
            }

        }
    }
}
