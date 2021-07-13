import puppeteer from 'puppeteer';
import winston from 'winston';
import fs from 'fs-extra';
import * as types from '../types';
import * as utils from '../utils';
import { createHtmlPage } from './htmlPage';

// stage the HTML element in a browser by itself and optimize the fontsize
async function findOptimalFontsize(book: types.Book, settings: types.Settings): Promise<number> {
    winston.info("Finding optimal fontsize");
    let browser = await puppeteer.launch({ defaultViewport: {width: settings.maxWidth, height: settings.maxHeight} , devtools: settings.debug});
    const browserPage = await browser.newPage();
    let stylesheets = settings.stylesheets.map(stylesheet => fs.readFileSync(stylesheet, 'utf-8'));
    let allMediaSegments = utils.getMediaSegmentsSubset(book, settings);
    for (let mediaSegment of allMediaSegments) {
        let html = createHtmlPage(mediaSegment.html, stylesheets);
        let fontsize = await resizeFont(html, browserPage);
        winston.verbose(`Max possible fontsize for ${mediaSegment.internalId}: ${fontsize}`);
        mediaSegment.html.maximumFontsize = fontsize;
    }
    
    await browserPage.close();
    await browser.close();
    let allFontsizes = allMediaSegments.map(mediaSegment => mediaSegment.html.maximumFontsize);
    let optimalFontsize = Math.min(...allFontsizes);
    return optimalFontsize;
}

async function resizeFont(html: string, browserPage: puppeteer.Page) {
    await browserPage.setContent(html);
    let fontsize = await browserPage.evaluate((html) => {

        //debugger; //chromium debugger breakpoint
        
        // does the text fit in its container?
        let fits = () => {
            let textContentsElm = document.querySelector(".booksToVideos-text");
            let containerElm = document.querySelector(".booksToVideos-container");
            let outlineWidth = parseInt(getComputedStyle(containerElm).getPropertyValue('outline-width').replace("px", ''));
            
            if (textContentsElm.textContent.trim() == "") {
                return 0;
            }

            let tooBigX = textContentsElm.clientWidth > containerElm.clientWidth;
            let tooBigY = textContentsElm.clientHeight > containerElm.clientHeight;
    
            let tooSmallX = textContentsElm.clientWidth < containerElm.clientWidth;
            let tooSmallY = textContentsElm.clientHeight < containerElm.clientHeight;
    
            if (tooBigX || tooBigY) {
                return 1;
            }
            else if (tooSmallX || tooSmallY) {
                return -1;
            }
            else {
                return 0;
            }
        }

        function autosizeFont() {
            let didResize = false;
            let lastTwoRuns = []; // track the outcome of the last 2 runs. 1 = was too big, -1 = was too small
            let firstAttempt = true;
            let textFits = fits();
            while (textFits != 0) { // 0 means it fits; 1 = too big; -1 = too small
                // track the results of the last 2 runs
                if (!firstAttempt) {
                    let idx = lastTwoRuns.length % 2;
                    if (lastTwoRuns.length < idx) {
                        lastTwoRuns.push(textFits);
                    }
                    else {
                        lastTwoRuns[idx] = textFits;
                    }
                }
                // // if the last two runs were opposite, we'll just get stuck in a loop flip flopping
                // // go with the smaller of the two and call it quits
                let force = lastTwoRuns.length > 1 && lastTwoRuns[0] != lastTwoRuns[1];
                
                let adjustment = textFits * -1; // adjust in the opposite direction
                if (force) {
                    adjustment = lastTwoRuns.indexOf(-1) == 0 ? -1 : 0;
                }
                let newFontsize = parseInt(
                    getComputedStyle(document.querySelector(".booksToVideos-text"))
                    .getPropertyValue('font-size').replace("px", '')) + adjustment;
                
                document.styleSheets.item(0).addRule(
                    ".booksToVideos-text", 
                    `font-size: ${newFontsize}px !important;`);
        
                textFits = fits(); // reevaluate
                didResize = true;
                firstAttempt = false;
                if (force) {
                    break;
                }
            }
            return didResize;
        }

        autosizeFont();
        let fontsize = parseInt(
            getComputedStyle(document.querySelector(".booksToVideos-text"))
            .getPropertyValue('font-size').replace("px", ''));
        return fontsize;

    }, html);

    return fontsize;
}

export { findOptimalFontsize };