#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs-extra';
import * as nanoid from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';
import { convertBookToVideo, verifyInput } from '../core/index.js';
import { initLogger } from '../logger/index.js';
import { parseDaisy202 } from '../parser/index.js';
import * as utils from '../utils/index.js';
import { setupSettings } from './settings.js';

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
        .option('-c, --chapters <numbers...>', "Only include these chapters, e.g. 1 2 3")
        .option('-d, --debug', "Debug mode")
        .option('-e, --encoding <encoding>', "Set the character encoding")
        .option('-f, --fontsizePx <number>', "Value in pixels of the desired font size. Fontsize is otherwise determined automatically.")
        .option('-p, --previewMode', "Only generate still images as a preview of the final output")
        .option('-r, --preset <preset>', "Name of a preset", "")
        .option('-s, --settings <file>', "Settings file")
        .option('-t, --stylesheet <file>', "Stylesheet")
        .option('-v, --verbose', "Verbose output")
        .option('-z, --vttSettings <settings>', "Settings to add after every caption, e.g. vertical:rl")
        .option('-n, --numPreviewSlides <number>', "Number of preview slides to generate")
        .action(async (input, output, settings) => {
            await convert(input, output, settings);
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

    let settings = setupSettings(cliArgs.preset, cliArgs.settings);
    if (cliArgs.debug) {
        settings.debug = true;
    }
    if (cliArgs.chapters) {
        settings.chapters = cliArgs.chapters.map(chapterNumber => parseInt(chapterNumber));
    }
    if (cliArgs.verbose) {
        settings.verbose = true;
    }
    if (cliArgs.stylesheet) {
        settings.stylesheets.push(path.resolve(process.cwd(), cliArgs.stylesheet));
    }
    if (cliArgs.encoding) {
        settings.encoding = cliArgs.encoding;
    }
    if (cliArgs.vttSettings) {
        settings.vttSettings = cliArgs.vttSettings;
    }
    if (cliArgs.previewMode) {
        settings.previewMode = cliArgs.previewMode;
    }
    if (cliArgs.fontsizePx) {
        settings.fontsizePx = cliArgs.fontsizePx;
        settings.autosizeFont = false;
    }
    if (cliArgs.numPreviewSlides) {
        settings.numPreviewSlides = cliArgs.numPreviewSlides;
    }
    let logDirname = path.resolve(outputDirname, "logs-temp");
    utils.ensureDirectory(logDirname);
    let logFilename = path.join(logDirname, `${nanoid.nanoid()}.log`);
    initLogger(logFilename, settings);

    if (cliArgs.preset != "") {
        winston.info(`Loaded preset ${cliArgs.preset}`);
    }
    if (cliArgs.settings) {
        winston.info(`Loaded settings ${cliArgs.settings}`);
    }
    settings.stylesheets.map(stylesheet => {
        if (!fs.existsSync(stylesheet)) {
            winston.error(`Stylesheet not found ${stylesheet}`);
            process.exit(1);
        }
    });

    try {
        let result = await convertBookToVideo(inputFilename, outputDirname, settings, false, logFilename);
        winston.info(JSON.stringify(result, null, 2));
    }
    catch (err) {
        winston.error("Error; exiting");
        process.exit(1);
    }

}

// utility to show a list of all available chapters
// will help users when using the "chapters" option 
async function showChapterList(input: string) {
    let settings = setupSettings("");
    let inputFilename = path.resolve(process.cwd(), input);
    initLogger();
    try {
        verifyInput(inputFilename);
    }
    catch (err) {
        winston.error(err);
        process.exit(1);
    }
    let book = await parseDaisy202(inputFilename, settings);
    let chaptersList = book.chapters.map((chapter, idx) => {
        let dur = chapter.contents.reduce((acc, curr) => acc += curr.dur, 0);
        return `${(idx + 1).toString().padEnd(15, '.')}${chapter.title.padEnd(45, '.')}Duration: ${utils.toHHMMSS(dur)}`;
    });

    winston.info(JSON.stringify(chaptersList, null, 2));
}

(async () => await main())();
