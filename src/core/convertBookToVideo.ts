import tmp from 'tmp';
import winston from "winston";
import path from 'path';
import filenamify from 'filenamify';
import fs from 'fs-extra';
import * as nanoid from 'nanoid';
import * as types from '../types';
import * as logger from '../logger';
import * as utils from '../utils';
import { parseDaisy202 } from '../parser';
import { generateCaptions } from '../captions';
import { generatePreview } from '../preview';
import { captureImages } from '../captureImages';
import { generateVideo } from '../video';
import { verifyInput } from './verifyInput';
import { createHtmlPage } from '../htmlEmbed';

// returns an output object
async function convertBookToVideo(
    inputFilename: string, 
    outputDirname: string, 
    settings: types.Settings,
    initLogger: boolean = false,
    logFilename?: string,)
    : Promise<types.ConversionResult> {
    
    let logFilename_ = logFilename ?? path.join(outputDirname, `${nanoid.nanoid()}.log`);
    if (initLogger) {
        logger.initLogger(logFilename_, settings);
    }
    
    try {
        verifyInput(inputFilename);
    }
    catch(err) {
        winston.error(err);
        process.exit(1);
    }
    
    winston.info(`Input: ${inputFilename}`);
    if (settings.chapters.length > 0) {
        winston.info(`Including only chapters: ${settings.chapters}`);
    }
    winston.debug(`settings: \n${JSON.stringify(settings, null, 2)}`);
    
    // setup the temp directory
    tmp.setGracefulCleanup();
    let tmpDirname:string = await new Promise((resolve, reject) => {
        tmp.dir(function _tempDirCreated(err, path) {
            if (err) reject(err);
            else resolve(path);
          });
    });
    winston.verbose(`Temp files in ${tmpDirname}`);

    if (settings.autosizeFont && settings.fontsizePx) {
        settings.autosizeFont = false;
        winston.info("Ignoring autosizeFont option because fontsizePx option is set");
    }
    
    // parse the book
    let book = await parseDaisy202(inputFilename, settings);
    book.safeFilename = filenamify(book.metadata.title);

    let outDirname = path.resolve(outputDirname, book.safeFilename);
    utils.ensureDirectory(outDirname);

    // make sure there's something to work with
    if (utils.getMediaSegmentsSubset(book, settings).length == 0) {
        winston.error("No content found. Check your 'chapters' and 'includePageNumbers' preferences.");
        process.exit(1);
    }
    
    // gather images of the rendered text phrases
    book = await captureImages(book, settings, tmpDirname);

    //console.log(JSON.stringify(book, null, 2));
    
    let previewFilename = null;
    let captionsFilename = null;
    let videoFilename = null;
    let htmlEmbedFilename = null;
    let videoDuration = null;

    if (settings.previewMode) {
        // output option: preview of slides, no video
        previewFilename = await generatePreview(book, settings, outDirname);
    }
    else {
        // output option: video
        videoFilename = await generateVideo(book, settings, outDirname, tmpDirname);
        videoDuration = await utils.getDuration(videoFilename);
        
        // add captions
        captionsFilename = await generateCaptions(book, settings, outDirname);

        // embed the video and captions in an HTML file
        htmlEmbedFilename = createHtmlPage(book, videoFilename, captionsFilename, videoDuration, outDirname);
    }

    // when we start logging, we don't know the book's name and therefore we don't know the final output directory
    // so we can move the logfile there at the end
    let finalLogFilename = path.resolve(outDirname, `${book.safeFilename}.log`);
    await fs.move(logFilename_, finalLogFilename, {overwrite: true});

    let retval:types.ConversionResult = {
        outputDirectory: outDirname,
        logFile: path.basename(finalLogFilename)
    };
    if (captionsFilename) {
        retval.captionsFilename = path.basename(captionsFilename);
    }
    if (previewFilename) {
        retval.previewFilename = path.basename(previewFilename);
    }
    if (videoFilename) {
        retval.videoFilename = path.basename(videoFilename);
    }
    if (videoDuration) {
        retval.videoDuration = videoDuration;
    }
    if (htmlEmbedFilename) {
        retval.htmlEmbedFilename = htmlEmbedFilename;
    }

    // if debug mode, write the parsed book model to disk
    // and also copy the tmpdir to a /debug subfolder in the output dir
    if (settings.debug) {
        let bookDebugFile = path.resolve(tmpDirname, `${book.safeFilename}.json`);
        await fs.writeFile(bookDebugFile, JSON.stringify(book, null, 2));

        let debugDirname = path.resolve(outDirname, "debug");
        if (fs.existsSync(debugDirname)) {
            await fs.remove(debugDirname);
        }
        utils.ensureDirectory(debugDirname);
        await fs.copy(tmpDirname, debugDirname);
    }

    return retval;
    
}

export { convertBookToVideo };