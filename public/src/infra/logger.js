export class Logger {
    static info(context, message, data = {}) {
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            context: context,
            message: message,
            ...data
        }, null, 2));
    }

    static error(context, message, errorObject) {
        console.error(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            context: context,
            message: message,
            error: {
                message: errorObject.message,
                code: errorObject.code || 'UNKNOWN_CODE',
                stack: errorObject.stack
            }
        }, null, 2));
    }
}