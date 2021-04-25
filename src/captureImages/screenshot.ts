import puppeteer from 'puppeteer';
import path from 'path';
import winston from 'winston';
import fs from 'fs-extra';
import * as types from '../types';
import * as utils from '../utils';
import iconv from 'iconv-lite';

// stage the HTML element in a browser by itself and optimize the fontsize
async function findOptimalFontsize(book: types.Book, options: types.Options): Promise<number> {
    winston.info("Finding optimal fontsize...");
    let browser = await puppeteer.launch({ defaultViewport: {width: options.maxWidth, height: options.maxHeight} , devtools: options.debug});
    const browserPage = await browser.newPage();
    let stylesheet = fs.readFileSync(options.stylesheet, 'utf-8');
    let allMediaSegments = utils.getMediaSegmentsSubset(book, options);
    for (let mediaSegment of allMediaSegments) {
        let html = createHtmlPage(mediaSegment.html, stylesheet);
        let fontsize = await resizeFont(html, browserPage);
        mediaSegment.html.maximumFontsize = fontsize;
    }
    
    await browserPage.close();
    await browser.close();
    let allFontsizes = allMediaSegments.map(mediaSegment => mediaSegment.html.maximumFontsize);
    let optimalFontsize = Math.min(...allFontsizes);
    winston.verbose(`Optimal fontsize: ${optimalFontsize}`);
    return optimalFontsize;
}

async function takeScreenshots(book: types.Book, options: types.Options, tmpDirname: string, fontsizeOverride?: number) {
    winston.info("Capturing HTML screenshots...");
    let outDirname = path.join(tmpDirname, "images");
    utils.ensureDirectory(outDirname);

    let htmlOutDirname = path.join(tmpDirname, "html");
    if (options.debug) {
        utils.ensureDirectory(htmlOutDirname);
    }

    let stylesheet = fs.readFileSync(options.stylesheet, 'utf-8');
    let encoding = utils.sniffEncoding(options.stylesheet);
    let stylesheetContents = await fs.readFile(options.stylesheet);
    stylesheetContents = iconv.decode(stylesheetContents, encoding);

    let browser = await puppeteer.launch({ defaultViewport: {width: options.maxWidth, height: options.maxHeight} , devtools: options.debug});
    const browserPage = await browser.newPage();

    let allMediaSegments = utils.getMediaSegmentsSubset(book, options);
    for (let mediaSegment of allMediaSegments) {
        winston.verbose(`Processing segment ${mediaSegment.internalId}`);
        let html = "";
        if (fontsizeOverride) {
            mediaSegment.html.renderedFontsize = fontsizeOverride;
            html = createHtmlPage(mediaSegment.html, stylesheet, fontsizeOverride);
        }
        else {
            html = createHtmlPage(mediaSegment.html, stylesheet);
        }

        if (options.debug) {
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
        await browserPage.screenshot({path: outFilename, clip});
        mediaSegment.capturedImage = {src: outFilename};
    }
    
    await browserPage.close();
    await browser.close();
    winston.info("Done capturing HTML screenshots.");
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

function createHtmlPage(segmentHtml: types.Html, stylesheet: string, fontsizeOverride?: number): string {
    let document = `
    <html>
        <head>
            <meta charset="utf-8">
            <style>
                ${stylesheet}
                ${fontsizeOverride ? 
                    `.booksToVideos-text {
                        font-size: ${fontsizeOverride}px !important;
                    }` 
                    : 
                    ''
                }
            </style>
        </head>
        <body>
            <div class="booksToVideos-container" lang="${segmentHtml.lang}" dir="${segmentHtml.dir}">
                <div class="booksToVideos-text">
                ${segmentHtml.tagname === "img" ? 
                `<p>${segmentHtml.textContent}</p>`
                :
                segmentHtml.rawHtml
                }
                </div>
            </div>
        </body>
    </html>
    `;

    document = document.replace("<font", "<span");
    document = document.replace("</font>", "</span>");
    return document;
}

export { findOptimalFontsize, takeScreenshots };