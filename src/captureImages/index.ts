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

        // take screenshots for all segments
        await takeScreenshots(book, options, tmpDirname, optimalFontsize);
    }
    else {
        await takeScreenshots(book, options, tmpDirname);
    }
    winston.info("Done capturing images");
    return book;
}

export { captureImages };