import {Context} from 'koa';
import "koa-body/lib/index";
import {
    MinMaxValidatorOptions,
    RegExpValidatorOptions,
    ValidationSchema,
    StringValidatorOptions,
    ValidatorFnc,
    ValidatorOptions,
    ValidatorType
} from "./validator.type";

export function validateRequestBody(validations: ValidationSchema) {
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

function validate(body: any, validations: ValidationSchema) {
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

    isComplexPassword(options?: RegExpValidatorOptions): ValidatorType {
        this.validators.push(this.isComplexPasswordValidator(options));
        return this;
    }

    isObject(validators: ValidationSchema, options?: ValidatorOptions): ValidatorType {
        this.validators.push(this.isObjectValidator(validators, options));
        return this;
    }

    isNumber(options?: MinMaxValidatorOptions): ValidatorType {
        this.validators.push(this.isNumberValidator(options));
        return this;
    }

    isDate(options?: ValidatorOptions): ValidatorType {
        this.validators.push(this.isDateValidator(options));
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
            const isStringValidatorChecks = (value: any, index: number | null) => {
                const _key = index !== null ? `"${key}.${index}"` : `"${key}"`;

                if (typeof value !== 'string') {
                    errors.push(`"${_key}" must be a string`);
                    return;
                }

                if (options?.notEmpty && value.length === 0) {
                    errors.push(`"${_key}" must not be empty`);
                }

                if (options?.min && value.length < options.min) {
                    errors.push(`"${_key}" must have at least ${options.min} characters`);
                }

                if (options?.max && value.length > options.max) {
                    errors.push(`"${_key}" must have at most ${options.max} characters`);
                }
            }

            if (!each) {
                isStringValidatorChecks(value, null);
                return;
            }

            if (!Array.isArray(value)) {
                errors.push(`"${key}" must be an array!`);
                return;
            }

            const length = value.length;
            for (let i = 0; i < length; i++) {
                isStringValidatorChecks(value[i], i);
            }
        }
    }

    private isEmailValidator = (options?: ValidatorOptions): ValidatorFnc => {
        const {each = false} = options || {};

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return (value: any, key: string, errors: string[]) => {
            const isEmailValidatorCheck = (value: any, index: number | null) => {
                const _key = index !== null ? `"${key}.${index}"` : `"${key}"`;

                if (!emailRegex.test(value)) {
                    errors.push(`"${_key}" must be a valid email format`);
                }
            }
            if (!each) {
                isEmailValidatorCheck(value, null);
                return;
            }

            if (!Array.isArray(value)) {
                errors.push(`"${key}" must be an array!`);
                return;
            }

            const length = value.length;
            for (let i = 0; i < length; i++) {
                isEmailValidatorCheck(value[i], i);
            }

        }
    }

    private isComplexPasswordValidator = (options?: RegExpValidatorOptions): ValidatorFnc => {
        const {
            each = false,
            regExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        } = options || {};

        return (value: any, key: string, errors: string[]) => {
            const isComplexPasswordValidatorChecks = (value: any, index: number | null) => {
                const _key = index !== null ? `"${key}.${index}"` : `"${key}"`;

                if (!regExp!.test(value)) {
                    errors.push(`"${_key}" must be a strong password`);
                }
            }

            if (!each) {
                isComplexPasswordValidatorChecks(value, null);
                return;
            }

            if (!Array.isArray(value)) {
                errors.push(`"${key}" must be an array!`);
                return;
            }

            const length = value.length;
            for (let i = 0; i < length; i++) {
                isComplexPasswordValidatorChecks(value[i], i);
            }

        }
    }

    private isObjectValidator = (validators: ValidationSchema, options?: ValidatorOptions): ValidatorFnc => {
        const {each = false} = options || {};

        return (value: any, key: string, errors: string[]) => {
            const isObjectValidatorChecks = (value: any, index: number | null) => {
                const _key = index !== null ? `"${key}.${index}"` : `"${key}"`;

                if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                    errors.push(`"${_key}" must be an object`);
                    value = {};
                }

                if (validators && typeof validators === 'object') {
                    for (const [nestedKey, nestedValidator] of Object.entries(validators)) {
                        const nestedValue = value[nestedKey];

                        const {errors: nestedErrors} = nestedValidator.validate(nestedValue, `${_key}.${nestedKey}`, []);

                        if (nestedErrors.length) {
                            errors.push(...nestedErrors);
                        }
                    }
                }
            }

            if (!each) {
                isObjectValidatorChecks(value, null);
                return;
            }

            if (!Array.isArray(value)) {
                errors.push(`"${key}" must be an array!`);
                return;
            }

            const length = value.length;

            for (let i = 0; i < length; i++) {
                isObjectValidatorChecks(value[i], i);
            }

        }
    }

    private isNumberValidator = (options?: MinMaxValidatorOptions): ValidatorFnc => {
        const {each = false} = options || {};

        return (value: any, key: string, errors: string[]) => {
            const isNumberValidatorChecks = (value: any, index: number | null) => {
                const _key = index !== null ? `"${key}.${index}"` : `"${key}"`;

                if (typeof value === 'number' && !isNaN(value)) {
                    errors.push(`"${_key}" must be a number`);
                    return;
                }

                if (options?.min && value.length < options.min) {
                    errors.push(`"${_key}" must have at least ${options.min}`);
                }

                if (options?.max && value.length > options.max) {
                    errors.push(`"${_key}" must have at most ${options.max}`);
                }
            }

            if (!each) {
                isNumberValidatorChecks(value, null);
                return;
            }

            if (!Array.isArray(value)) {
                errors.push(`"${key}" must be an array!`);
                return;
            }

            const length = value.length;
            for (let i = 0; i < length; i++) {
                isNumberValidatorChecks(value[i], i);
            }
        }
    }

    private isDateValidator = (options?: ValidatorOptions) => {
        const {each = false} = options || {};

        return (value: any, key: string, errors: string[]) => {
            const isDateValidatorChecks = (value: any, index: number | null) => {
                const _key = index !== null ? `"${key}.${index}"` : `"${key}"`;
                if (typeof value === 'string' && !isNaN(Date.parse(value))) {
                    errors.push(`${_key} must be a valid ISO date string`);
                    return;
                }

                // TODO: add min/max validators
            }

            if (!each) {
                isDateValidatorChecks(value, null);
                return;
            }

            if (!Array.isArray(value)) {
                errors.push(`"${key}" must be an array!`);
                return;
            }

            const length = value.length;
            for (let i = 0; i < length; i++) {
                isDateValidatorChecks(value[i], i);
            }
        }
    }
}
