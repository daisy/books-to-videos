import path from 'path';
import winston from 'winston';
import * as types from "../../types/index.js";
import * as utils from '../../utils/index.js';
import { parse as parseNcc } from './ncc.js';
import { parse as parseSmil } from './smil.js';
import { parse as parseXHTML } from './xhtml.js';

async function parse(nccFilename: string, settings: types.Settings): Promise<types.Book> {
    winston.info(`Parsing DAISY 2.02 book`);
    let book: types.Book = await parseNcc(nccFilename, settings);

    // resolve all the content URLs
    book.chapters.map(chapter => chapter.url = path.resolve(path.dirname(nccFilename), chapter.url));
    book.pagelist = book.pagelist.map(page => path.resolve(path.dirname(nccFilename), page));

    let uniqueSmilUrls = new Set(book.chapters.map(chapter => utils.splitSrcSelector(chapter.url).src));

    // process all the SMIL files
    let accSmilData = [];
    for (let smilUrl of uniqueSmilUrls) {
        let smilData = await parseSmil(smilUrl, settings);
        accSmilData.push(smilData);
    }
    let allSmilData: Array<types.MediaSegment> = accSmilData.flat(); // in-order flat list of all media segments

    let startIdx = -1;
    // assign media segment ranges to each chapter
    let startIdxs = book.chapters.map(chapter => {
        if (chapter.url.indexOf("#") == -1) {
            // if the chapter URL does not have a selector (e.g. file.smil#id), take the ID of the first occurence of that smil file
            for (let mediaSegment of allSmilData) {
                let found = false;
                for (let id of mediaSegment.ids) {
                    if (id.indexOf(chapter.url) != -1) {
                        chapter.url = id;
                        found = true;
                        break;
                    }
                }
                if (found) {
                    break;
                }
            }
        }
        if (allSmilData.length > startIdx + 1) {
            startIdx = allSmilData.slice(startIdx + 1).findIndex
                (mediaSegment => mediaSegment.ids.includes(chapter.url)) + startIdx + 1;
            return startIdx;
        }
        winston.error(`Parsing error for chapter ${chapter.url}`);
        return -1;
    });

    for (let i = 0; i < startIdxs.length; i++) {
        let firstIdx = startIdxs[i];
        let lastIdx = startIdxs.length > i + 1 ? startIdxs[i + 1] - 1 : allSmilData.length - 1;
        book.chapters[i].contents = allSmilData.slice(firstIdx, lastIdx + 1);
    }

    // assign unique IDs to each phrase
    book.chapters.map((chapter, cidx) => chapter.contents.map((mediaSegment, pidx) => mediaSegment.internalId = `${cidx}-${pidx}`));

    // mark the page numbers accordingly
    book.pagelist.map(page => {
        let pageMediaSegment = allSmilData.find(data => data.ids.includes(page));
        if (pageMediaSegment) {
            pageMediaSegment.isPageNumber = true;
        }
    });

    // fill in information about the XHTML elements
    await parseXHTML(book, settings);

    winston.info("Done parsing DAISY 2.02 book");
    return book;
}

export { parse };
