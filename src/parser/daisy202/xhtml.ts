import winston from 'winston';
import mime from 'mime-types';
import path from 'path';
import fs from 'fs-extra';
import { DOMParser, XMLSerializer } from 'xmldom';
import xpath from 'xpath';
import * as utils from '../../utils';
import * as types from '../../types';
import iconv from 'iconv-lite';

// get information about the HTML elements in the book
// only targets the subset of media segments being processed (e.g. if the user has only requested to work with certain chapters)
async function parse(book: types.Book, options: types.Options) {   
    winston.info("Parsing HTML...");
    
    let allMediaSegments = utils.getMediaSegmentsSubset(book, options);
    
    // organize by HTML file to reduce the number of times we open each file
    let segmentsByFile = {};
    allMediaSegments.map(mediaSegment => {
        if (segmentsByFile.hasOwnProperty(mediaSegment.html.src)) {
            segmentsByFile[mediaSegment.html.src].push(mediaSegment);
        }
        else {
            segmentsByFile[mediaSegment.html.src] = [mediaSegment];
        }
    });

    for (let file in segmentsByFile) {
        // this will fill in data for the segments
        await analyzeHtmlElements(file, segmentsByFile[file], options);    
    }
}

// collect information about the HTML segments
async function analyzeHtmlElements(filename: string, segments: Array<types.MediaSegment>, options:types.Options) {
    // load the file
    let encoding = options.encoding ?? utils.sniffEncoding(filename);
    let fileContents = await fs.readFile(filename);
    fileContents = iconv.decode(fileContents, encoding);
    
    let doc = new DOMParser().parseFromString(fileContents);
    const select = xpath.useNamespaces({
        html: 'http://www.w3.org/1999/xhtml'
    });
    let xmlserializer = new XMLSerializer();
    for (let segment of segments) {
        let selector = segment.html.selector;
        selector = selector.replace("#", "");
        let element = select(`//*[@id='${selector}']`, doc);
        if (element.length > 0) {
            // @ts-ignore
            element = element[0];
            let lang = getAttributeSearchParents(element, "lang");
            let dir = getAttributeSearchParents(element, "dir");
            cleanUpElement(element);
            // @ts-ignore
            let tagname = element.tagName;
            // @ts-ignore
            let media = tagname == "img" ? element.getAttribute("src") : null;
            // @ts-ignore
            let textContent = tagname == "img" ? element.getAttribute("alt") : element.textContent;

            let elementInfo = {
                // @ts-ignore
                rawHtml: xmlserializer.serializeToString(element), 
                lang,
                dir,
                textContent,
                media,
                tagname,
                encoding
            };

            // encode media in data uri
            // because puppeteer won't load local resources
            if (elementInfo.media) {
                let mediaFilepath = new URL(elementInfo.media, "file://" + filename).href;
                mediaFilepath = mediaFilepath.replace("file://", "");
                let mimetype = mime.lookup(path.extname(mediaFilepath));
                let encoding = 'base64'; 
                let data = await fs.readFile(mediaFilepath).toString(encoding); 
                elementInfo.media = 'data:' + mimetype + ';' + encoding + ',' + data; 
            }
            
            segment.html = {...segment.html, ...elementInfo};
        }
        else {
            winston.warn(`Element ${segment.html.selector} not found`);
        }
    }
}

function cleanUpElement(elm) {
    elm.removeAttribute("face");
    elm.removeAttribute("size");
    elm.removeAttribute("style");
    for (let child of Array.from(elm.childNodes)) {
        // @ts-ignore
        if (child.nodeType == elm.ELEMENT_NODE) {
            cleanUpElement(child);
        }
        
    }
}

function getAttributeSearchParents (elm, attributeName) {
    if (!elm) {
        return "";
    }
    if (elm.nodeType != elm.ELEMENT_NODE) {
        return "";
    }
    if (elm.hasAttribute(attributeName)) {
        return elm.getAttribute(attributeName);
    }
    else {
        return getAttributeSearchParents(elm.parentNode, attributeName);
    }
}

export { parse };
