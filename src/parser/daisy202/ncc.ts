import fs from 'fs-extra';
import winston from 'winston';
import { DOMParser, XMLSerializer } from 'xmldom';
import xpath from 'xpath';
import * as types from "../../types";
import * as utils from '../../utils';
import iconv from 'iconv-lite';
import { replaceEntities } from '../entities';

// parse an NCC file
async function parse(filename:string, options:types.Settings): Promise<types.Book> {
    winston.verbose(`Parsing NCC file ${filename}`);
    
    let encoding = options.encoding ?? utils.sniffEncoding(filename);
    let fileContents = await fs.readFile(filename);
    fileContents = iconv.decode(fileContents, encoding);
    fileContents = replaceEntities(fileContents);
    
    let doc = new DOMParser().parseFromString(fileContents);
    
    // extract metadata
    let metadata: types.Metadata = parseMetadata(doc);
    // list chapters and pages
    let chapters: Array<types.Chapter> = parseChapters(doc);
    let pagelist: Array<string> = parsePagelist(doc);
    return {
        chapters,
        pagelist,
        metadata
    }
}


function parseChapters(doc): Array<types.Chapter> {
    const select = xpath.useNamespaces({
        html: 'http://www.w3.org/1999/xhtml'
    });
    let bodyChildren = select("//html:body/*", doc);
    if (bodyChildren.length == 0) {
        throw new Error(`Error parsing NCC file`);
    }

    let chapters: Array<types.Chapter> = [];
    let xmlserializer = new XMLSerializer();
    Array.from(bodyChildren).map(childElm => {
        // @ts-ignore
        if (childElm.tagName[0].toLowerCase() == "h") {
            // @ts-ignore
            let url = select("html:a/@href", childElm); 
            if (url.length == 0) {
                //@ts-ignore
                winston.warn(`Skipping ${xmlserializer.serializeToString(childElm)}, @href not found`);
            }
            else {
                // @ts-ignore
                url = url[0];
                let chapterInfo: types.Chapter = {
                    // @ts-ignore
                    title: childElm.textContent.trim(),
                    // @ts-ignore
                    url: url.value,
                    // @ts-ignore
                    level: parseInt(childElm.tagName[1])
                };
                chapters.push(chapterInfo);
            }
            
        }
    });
    return chapters;
}

// return a list of page URLs
function parsePagelist(doc): Array<string> {
    const select = xpath.useNamespaces({
        html: 'http://www.w3.org/1999/xhtml'
    });
    // @ts-ignore
    let pagelist = select("//html:body/html:span[@class='page-normal']/html:a/@href", doc);
    // @ts-ignore
    return pagelist.map(item => item.value);
}

function parseMetadata(doc): types.Metadata {
    const select = xpath.useNamespaces({
        html: 'http://www.w3.org/1999/xhtml'
    });
    let title = select('//html:meta[@name="dc:title"]/@content', doc);
    if (title.length > 0) {
        //@ts-ignore
        title = title[0].value.trim();
    }
    let lang = select('//html:meta[@name="dc:language"]/@content', doc);
    if (lang.length > 0) {
        // @ts-ignore
        lang = lang[0].value;
    }
    let authors = select('//html:meta[@name="dc:creator"]/@content', doc);
    let date = select('//html:meta[@name="dc:date"]', doc);
    if (date.length > 0) {
        // @ts-ignore
        date = date[0];
    }
    let dateContent = '';
    let dateScheme = '';
    if (date) {
        // @ts-ignore
        dateContent = date.getAttribute("content").trim();
        // @ts-ignore
        dateScheme = date.getAttribute("scheme").trim();
    }
    return {
        title: title.toString(),
        // @ts-ignore
        authors: authors.map(aut => aut.value.trim()),
        date: new Date(dateContent),
        dateScheme,
        lang: lang.toString().trim()
    };
}
export { parse };