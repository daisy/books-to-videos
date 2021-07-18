import fs from 'fs-extra';
import { format } from 'logform';
import winston from 'winston';
import * as types from '../types/index.js';

function initLogger(logFilename?: string, settings?: types.Settings) {
    if (logFilename != "") {
        // delete the logfile every time
        if (fs.existsSync(logFilename)) {
            fs.removeSync(logFilename);
        }
    }

    const alignedWithColors = format.combine(
        format.colorize(),
        format.timestamp(),
        format.align(),
        format.printf(info => `${info.level}: ${info.message}\n`)
    );

    const alignedWithTime = format.combine(
        format.timestamp(),
        format.align(),
        format.printf(info => `${info.timestamp}\n${info.level}:\n${info.message}\n`)
    );

    let consoleTransport = new winston.transports.Console(
        {
            format: alignedWithColors
        }
    );
    let transports = [];
    if (logFilename) {
        let fileTransport = new winston.transports.File(
            {
                filename: logFilename,
                format: alignedWithTime
            }
        );
        transports = [consoleTransport, fileTransport];
    }
    else {
        transports = [consoleTransport];
    }

    let level = "info";
    if (settings) {
        level = settings.debug ? "debug" : settings.verbose ? "verbose" : "info";
    }
    winston.configure({
        transports,
        level
    });

    // if quiet just silence the console
    if (settings && settings.quiet) {
        winston.remove(consoleTransport);
    }
}

export { initLogger };
