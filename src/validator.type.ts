export interface Something {
    [key: string]: ValidatorType;
}

export interface ValidatorOptions {
    each?: boolean;
}

export interface StringValidatorOptions extends ValidatorOptions {
    min?: number;
    max?: number;
    notEmpty?: boolean
}

export interface ValidatorFnc {
    (value: any, key: string, errors: string[]): void;
}

export interface ValidatorType {
    hasToBeDefined: boolean;
    validators: Array<(value: any, key: string, errors: string[]) => void>;

    validate(value: any, key: string, errors: string[]): { errors: string[] }

    isDefined(): ValidatorType;

    isOptional(): ValidatorType;

    isString(options?: StringValidatorOptions): ValidatorType;

    isEmail(options?: ValidatorOptions): ValidatorType;

    isComplexPassword(options?: ValidatorOptions & { regExp?: RegExp }): ValidatorType;

    isObject(validators: Something, options?: ValidatorOptions): ValidatorType;

    isNumber(options?: ValidatorOptions & { min?: number; max?: number }): ValidatorType;

    isDate(options?: ValidatorOptions & { min?: Date; max?: Date }): ValidatorType;
}