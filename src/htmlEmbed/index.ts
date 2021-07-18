import dayjs from 'dayjs';
import fs from 'fs-extra';
import path from 'path';
import winston from 'winston';
import * as types from '../types/index.js';
import * as utils from '../utils/index.js';

// create an HTML page with the video embedded in it
function createHtmlPage(book: types.Book, videoFilename: string, captionsFilename: string, videoDuration: any, outDirname: string): string {
    winston.info("Creating HTML page with embedded video and captions");
    let htmlPage =
        `<!DOCTYPE html>
    <html lang="${book.metadata.lang}">
        <head>
            <title>${book.metadata.title}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
            <h1>${book.metadata.title}</h1>
            <p>Author(s): ${book.metadata.authors}</p>
            <p>Date: ${dayjs(book.metadata.date).format("YYYY-MM-DD")}</p>
            <p>Duration: ${utils.toHHMMSS(videoDuration)}</p>
            <video id="video" controls preload="metadata" style="width: 30%">
                <source src="${path.basename(videoFilename)}">
                <track default kind="captions" src="${path.basename(captionsFilename)}">
            </video>
        </body>
        <script>
            // turn captions off by default, they're a bit chaotic when presented with an all-text video
            document.addEventListener("DOMContentLoaded", e=> {
                document.querySelector("track").track.mode = "hidden";
            });
        </script>
    </html>`;

    let outFilename = path.resolve(outDirname, "video.html");
    fs.writeFileSync(outFilename, htmlPage);
    winston.info("Done creating HTML page with embedded video and captions");
    return outFilename;
}

export { createHtmlPage };
