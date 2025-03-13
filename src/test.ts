import {isDefined, isOptional, validateRequestBody} from "./validator";
import {Context} from "koa";

stringTest();
isObjectArray();
loginSchema();

function stringTest() {
    const definedStringTest = {
        validators: [{
            key: 'first_name',
            validators: ['isDefined', 'isString'],
        }, {
            key: 'last_name',
            validators: ['isDefined', 'isString'],
        }],
        body: {
            first_name: isDefined().isString(),
            last_name: isDefined().isString()
        }
    }
    validateRequestBody(definedStringTest.body)(...koaMiddleware(definedStringTest.validators, {}));
    validateRequestBody(definedStringTest.body)(...koaMiddleware(definedStringTest.validators, {name: 12}));
    validateRequestBody(definedStringTest.body)(...koaMiddleware(definedStringTest.validators, {first_name: ['Ovidiu']}));
    validateRequestBody(definedStringTest.body)(...koaMiddleware(definedStringTest.validators, {first_name: ['Ovidiu', '1']}));


    const notDefinedStringTest = {
        validators: [{
            key: 'name',
            validators: ['isOptional', 'isString']
        }],
        body: {
            name: isOptional().isString()
        }
    }
    validateRequestBody(notDefinedStringTest.body)(...koaMiddleware(notDefinedStringTest.validators, {}));
    validateRequestBody(notDefinedStringTest.body)(...koaMiddleware(notDefinedStringTest.validators, {name: 12}));
    validateRequestBody(notDefinedStringTest.body)(...koaMiddleware(notDefinedStringTest.validators, {name: 'Ovidiu'}));

    const definedStringTestWithMinLength = {
        validators: [{
            key: 'first_name',
            validators: ['isDefined', 'isString({min: 5})'],
        }, {
            key: 'last_name',
            validators: ['isDefined', 'isString({min: 5})'],
        }],
        body: {
            first_name: isDefined().isString({min: 5}),
            last_name: isDefined().isString({min: 5})
        }
    }
    validateRequestBody(definedStringTestWithMinLength.body)(...koaMiddleware(definedStringTestWithMinLength.validators, {}));
    validateRequestBody(definedStringTestWithMinLength.body)(...koaMiddleware(definedStringTestWithMinLength.validators, {name: 12}));
    validateRequestBody(definedStringTestWithMinLength.body)(...koaMiddleware(definedStringTestWithMinLength.validators, {first_name: 'Ovidiu'}));
}

function isObjectArray() {
    const tests = {
        validators: [{
            key: 'users',
            validators: ['isDefined', 'isObject({firstName: isDefined().isString(), lastName: isDefined().isString()}, {each: true})'],
        }],
        body: {
            users: isDefined().isObject({
                firstName: isDefined().isString({min: 5, max: 20}),
                lastName: isDefined().isString({min: 5, max: 20}),
            }, {each: true})
        }
    }
    validateRequestBody(tests.body)(...koaMiddleware(tests.validators, {}));
    validateRequestBody(tests.body)(...koaMiddleware(tests.validators, {users: {}}));
    validateRequestBody(tests.body)(...koaMiddleware(tests.validators, {users: []}));
    validateRequestBody(tests.body)(...koaMiddleware(tests.validators, {users: [{firstName: 'Ovidiu'}, {firstName: 12}]}));
}

function loginSchema() {
    const schema = {
        email: isDefined().isEmail(),
        password: isDefined().isComplexPassword()
    };

    const validators = [{
        key: 'email',
        validators: ['isDefined', 'isEmail'],
    }, {
        key: 'password',
        validators: ['isDefined', 'isComplexPassword'],
    }];

    const tests = [
        {},
        {
            email: 'ovidiu'
        },
        {
            email: 'ovidiu.podina@example.com'
        },
        {
            email: 'ovidiu.podina@example.com',
            password: '123456',
        },
        {
            email: 'ovidiu.podina@example.com',
            password: 'Test123!',
        }
    ];

    validateRequestBody(schema)(...koaMiddleware(validators, tests[0]));
    validateRequestBody(schema)(...koaMiddleware(validators, tests[1]));
    validateRequestBody(schema)(...koaMiddleware(validators, tests[2]));
    validateRequestBody(schema)(...koaMiddleware(validators, tests[3]));
    validateRequestBody(schema)(...koaMiddleware(validators, tests[4]));
}

function koaMiddleware(validators: Array<{
    key: string,
    validators: string[]
}>, body: any): [Context, () => Promise<void>] {
    body ||= {}

    return [
        context(validators, body),
        async () => {
            console.log('Done: ', body);
        }
    ]
}

function context(validators: Array<{ key: string, validators: string[] }>, body: any) {
    console.log('\nTesting:', body, `for:`, validators.reduce((result, validator) => {
        result += '\n\x1b[31m' + validator.key + '\x1b[0m: \x1b[33m' + validator.validators.join(', ') + '\x1b[0m';
        return result;
    }, ''));

    return {
        request: {body},
        throw: (err: number, message: string) => {
            console.log('Error: ', err, message);
        }
    } as unknown as Context
}

