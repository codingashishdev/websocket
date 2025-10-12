import winston, { createLogger, loggers } from "winston"


// determining the log level based on the environment
// debug is verbose for development and "info" is for production 
const level = process.env.NODE_ENV === "production" ? "info" : "debug" 

// determine different formats for development and production
const format = process.env.NODE_ENV === "production"
    // for production, we can juse log in the json format
    ? winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    )

    //for development, use a human readable format(colorized format) 
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "hh-mm-ss" }),
        winston.format.printf(info => `${info.timestamp} ${info.level} ${info.message}`)
    )


// creating a logger instance
const logger = createLogger({
    level,
    format,
    // transport is where the logs will be sent
    transports: [
        new winston.transports.Console()
    ],
    // Do not exit on handled exceptions
    exitOnError: false
})

export default logger