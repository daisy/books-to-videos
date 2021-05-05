import winston from 'winston';
import fs from 'fs-extra';
import path from 'path';
import Vtt from 'vtt-creator';
import * as types from '../types';
import * as utils from '../utils';

async function generateCaptions(book:types.Book, options:types.Options, outDirname: string) {
    winston.info(`Generating captions`);
    var v = new Vtt();
    let startTime = 0;
    
    let allMediaSegments = utils.getMediaSegmentsSubset(book, options);

    allMediaSegments.map(mediaSegment => {
        let text = mediaSegment.html.textContent;
        text = text.replace(/\n/g, "").replace(/\t/g, "").replace(/\s\s\s\s/g, "").trim();
        v.add(startTime, startTime + mediaSegment.durOnDisk, text, options.vttSettings ?? "");
        startTime += mediaSegment.durOnDisk;
    });

    let outFilename = path.resolve(outDirname, book.metadata.title + ".vtt");
    await fs.writeFile(outFilename, v.toString());   
    winston.info(`Done generating captions`);
    return outFilename;
}

export { generateCaptions };