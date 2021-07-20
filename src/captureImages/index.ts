import winston from 'winston';
import * as types from '../types/index.js';
import { findOptimalFontsize } from './resizeFont.js';
import { takeScreenshots } from './screenshot.js';

// take a screenshot of each HTML reference in a media segment,
// and fill in the media segment's image field with the location of the new screenshot
async function captureImages(book: types.Book, settings: types.Settings, tmpDirname: string): Promise<types.Book> {
    winston.info("Preparing screenshots");

    if (settings.autosizeFont) {
        let optimalFontsize = await findOptimalFontsize(book, settings);
        let reducedFactor = (100 - settings.reduceAutosizedFontBy) / 100;
        optimalFontsize = reducedFactor * optimalFontsize;
        winston.info(`Using optimal fontsize: ${optimalFontsize}`);
        // take screenshots for all segments
        await takeScreenshots(book, settings, tmpDirname, optimalFontsize);
    }
    else {
        // the fontsize may have been set manually
        if (settings.fontsizePx) {
            winston.info(`Using fontsizePx option: ${settings.fontsizePx}`);
            await takeScreenshots(book, settings, tmpDirname, settings.fontsizePx);
        }
        // else use whatever is in the supplied CSS file
        else {
            winston.info(`Using CSS for fontsize`);
            await takeScreenshots(book, settings, tmpDirname);
        }
    }
    winston.info("Done capturing images");
    return book;
}

export { captureImages };
