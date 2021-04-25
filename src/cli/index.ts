import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import winston from 'winston';
import * as nanoid from 'nanoid';
import * as types from '../types';
import * as utils from '../utils';
import { convertBookToVideo, verifyInput } from '../core';
import { initLogger } from '../logger';
import { setupOptions } from './options';
import { parseDaisy202 } from '../parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    let program = new Command();
    program.name("books-to-videos");
    program.version('0.1');
    program
        .command('convert <input> <output>')
        .description("Convert a DAISY 2.02 book to a video.", {
            input: "NCC file",
            output: "Output directory"
        })
        .option('-o, --options <file>', "Options file")
        .option('-d, --debug', "Debug mode")
        .option('-v, --verbose', "Verbose output")
        .option('-c, --chapters <numbers...>', "Only include these chapters, e.g. 1 2 3")
        .option('-s, --stylesheet <file>', "Stylesheet")
        .option('-e, --encoding <encoding>', "Set the character encoding")
        .option('-v, --vttSettings <settings>', "Settings to add after every caption, e.g. vertical:rl")
        // "options" below are CLI "options" not types.Options
        .action(async (input, output, options) => {
            await convert(input, output, options);
        });

    program
        .command('list-chapters <input>')
        .description("Show a list of all available chapters", {
            input: "NCC file"
        })
        .action(async (input) => {
            await showChapterList(input);
        });
    program.parse(process.argv);
};

async function convert(input: string, output: string, cliArgs) {
    let outputDirname = path.resolve(process.cwd(), output);
    utils.ensureDirectory(outputDirname);
    let inputFilename = path.resolve(process.cwd(), input);
    
    let options = setupOptions(cliArgs.options);
    if (cliArgs.debug) {
        options.debug = true;
    }
    if (cliArgs.chapters) {
        options.chapters = cliArgs.chapters.map(chapterNumber => parseInt(chapterNumber));
    }
    if (cliArgs.verbose) {
        options.verbose = true;
    }
    if (cliArgs.stylesheet) {
        options.stylesheet = path.resolve(process.cwd(), cliArgs.stylesheet);
    }
    if (cliArgs.encoding) {
        options.encoding = cliArgs.encoding;
    }
    if (cliArgs.vttSettings) {
        options.vttSettings = cliArgs.vttSettings;
    }
    let logDirname = path.resolve(outputDirname, "logs-temp");
    utils.ensureDirectory(logDirname);
    let logFilename = path.join(logDirname, `${nanoid.nanoid()}.log`);
    initLogger(logFilename, options);

    if (!fs.existsSync(options.stylesheet)) {
        winston.error(`Stylesheet not found ${options.stylesheet}`);
        process.exit(1);
    }

    let result = await convertBookToVideo(inputFilename, outputDirname, options, false, logFilename);
    winston.info(JSON.stringify(result, null, 2));
}

// utility to show a list of all available chapters
// will help users when using the "chapters" option 
async function showChapterList(input: string) {
    let options = setupOptions("");
    let inputFilename = path.resolve(process.cwd(), input);
    initLogger();
    try {
        verifyInput(inputFilename);
    }
    catch (err) {
        winston.error(err);
        process.exit(1);
    }
    let book = await parseDaisy202(inputFilename, options);
    let chaptersList = book.chapters.map((chapter, idx) => `${idx + 1}. ${chapter.title}`);
    winston.info(JSON.stringify(chaptersList, null, 2));
}

(async () => await main())();
