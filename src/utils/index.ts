import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import { path as ffprobePath } from '@ffprobe-installer/ffprobe';
import chardet from 'chardet';
import ffmpeg from 'fluent-ffmpeg';
import fs from "fs-extra";
import winston from 'winston';
import * as types from '../types/index.js';

async function ensureDirectory(dir: string) {
    if (!fs.existsSync(dir)) {
        await fs.mkdir(dir);
    }
}

// TODO fixme
// return {src, selector} for the src
function splitSrcSelector(src: string) {
    let idx = src.lastIndexOf("#");
    let selector = "";
    let src_ = src;
    // trim trailing hash
    if (idx == src.length - 1) {
        src_ = src.slice(0, idx);
    }
    else {
        // separate out the selector from the src
        if (idx != -1) {
            selector = src.slice(idx);
            src_ = src.slice(0, idx);
        }
    }
    return { src: src_, selector };
}

function findMostCommonValue(property, dataObjects) {
    let counts = {};
    dataObjects.map(d => {
        if (d.hasOwnProperty(property)) {
            if (counts.hasOwnProperty(d[property])) {
                counts[d[property]] += 1;
            }
            else {
                counts[d[property]] = 1;
            }
        }
    });

    let max = "";
    for (var prop in counts) {
        if (max != "" && counts[prop] > counts[max]) {
            max = prop;
        }
        else {
            max = prop;
        }
    }
    return max;
}

function getMediaSegmentsSubset(book: types.Book, options: types.Settings) {
    let allMediaSegments = [];
    if (options.chapters && options.chapters.length > 0) {
        let chapters = book.chapters.filter((chapter, idx) => options.chapters.includes(idx + 1));
        allMediaSegments = chapters.map(chapter => chapter.contents).flat();
    }
    else {
        allMediaSegments = book.chapters.map(chapter => chapter.contents).flat();
    }

    if (!options.includePageNumbers) {
        allMediaSegments = allMediaSegments.filter(mediaSegment => mediaSegment.isPageNumber == false)
    }

    if (options.previewMode) {
        let numItems = options.numPreviewSlides == -1 ? allMediaSegments.length : options.numPreviewSlides;
        allMediaSegments = allMediaSegments.slice(0, numItems);
    }
    return allMediaSegments;
}

async function getDuration(filename) {
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);

    let getDurationOperation = new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filename, function (err, metadata) {
            //console.dir(metadata); // all metadata
            resolve(metadata.format.duration);
        });
    });

    let dur = await getDurationOperation;
    return dur;
}

function toHHMMSS(secs) {
    var sec_num = parseInt(secs, 10)
    var hours = Math.floor(sec_num / 3600)
    var minutes = Math.floor(sec_num / 60) % 60
    var seconds = secs % 60

    return [hours, minutes, seconds.toFixed(3)]
        .map(v => v < 10 ? "0" + v : v)
        .filter((v, i) => v !== "00" || i > 0)
        .join(":")
}

function sniffEncoding(filepath: string) {
    let encoding = chardet.detectFileSync(filepath).toString();
    winston.verbose(`Detected ${encoding} for file ${filepath}`);
    return encoding;
}
export { ensureDirectory, splitSrcSelector, findMostCommonValue, getMediaSegmentsSubset, getDuration, toHHMMSS, sniffEncoding };
