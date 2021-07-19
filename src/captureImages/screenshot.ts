import fs from 'fs-extra';
import path from 'path';
import puppeteer from 'puppeteer';
import winston from 'winston';
import * as types from '../types/index.js';
import * as utils from '../utils/index.js';
import { createHtmlPage } from './htmlPage.js';

async function takeScreenshots(book: types.Book, settings: types.Settings, tmpDirname: string, fontsizeOverride?: number) {
    winston.info("Capturing screenshots");
    let outDirname = path.join(tmpDirname, "images");
    utils.ensureDirectory(outDirname);

    let htmlOutDirname = path.join(tmpDirname, "html");
    if (settings.debug) {
        utils.ensureDirectory(htmlOutDirname);
    }

    let stylesheets = settings.stylesheets.map(stylesheet => fs.readFileSync(stylesheet, 'utf-8'));

    let browser = await puppeteer.launch({
        defaultViewport: {
            width: settings.maxWidth,
            height: settings.maxHeight
        },
        devtools: settings.debug
    });
    const browserPage = await browser.newPage();

    let allMediaSegments = utils.getMediaSegmentsSubset(book, settings);
    for (let mediaSegment of allMediaSegments) {
        winston.verbose(`Processing segment ${mediaSegment.internalId}`);
        let html = "";
        if (fontsizeOverride) {
            mediaSegment.html.renderedFontsize = fontsizeOverride;
            html = createHtmlPage(mediaSegment.html, stylesheets, mediaSegment.html.renderedFontsize);
        }
        else {
            html = createHtmlPage(mediaSegment.html, stylesheets);
        }

        if (settings.debug) {
            // useful for testing 
            await fs.writeFile(path.join(htmlOutDirname, `${mediaSegment.internalId}.html`), html);
        }

        await browserPage.setContent(html);
        // load the HTML and apply settings
        let dimensions = await browserPage.evaluate((html) => {
            //document.documentElement.innerHTML = html;
            return {
                height: document.querySelector(".booksToVideos-container").clientHeight,
                width: document.querySelector(".booksToVideos-container").clientWidth
            };
        }, html);

        let clip = {
            x: 0,
            y: 0,
            width: dimensions.width,
            height: dimensions.height
        };
        let outFilename = path.join(outDirname, `${mediaSegment.internalId}.png`);
        await browserPage.screenshot({ path: outFilename, clip });
        mediaSegment.capturedImage = { src: outFilename };
    }

    await browserPage.close();
    await browser.close();
    winston.info("Done capturing HTML screenshots.");
}



export { takeScreenshots };
