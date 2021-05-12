import winston from 'winston';
import * as types from '../types';
import { findOptimalFontsize } from './resizeFont';
import { takeScreenshots } from './screenshot';

// take a screenshot of each HTML reference in a media segment,
// and fill in the media segment's image field with the location of the new screenshot
async function captureImages(book: types.Book, options: types.Options, tmpDirname: string): Promise<types.Book> {
    winston.info("Capturing images...");
    
    if (options.autosizeFont) {
        let optimalFontsize = await findOptimalFontsize(book, options);
        winston.info(`Using autosized font: ${optimalFontsize}`);
        // take screenshots for all segments
        await takeScreenshots(book, options, tmpDirname, optimalFontsize);
    }
    else {
        // the fontsize may have been set manually
        if (options.fontsizePx) {
            winston.info(`Using fontsizePx option: ${options.fontsizePx}`);
            await takeScreenshots(book, options, tmpDirname, options.fontsizePx);
        }
        // else use whatever is in the supplied CSS file
        else {
            winston.info(`Using CSS for fontsize`);
            await takeScreenshots(book, options, tmpDirname);
        }
    }
    winston.info("Done capturing images");
    return book;
}

export { captureImages };