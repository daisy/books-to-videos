import * as types from '../types';
import winston from 'winston';
import {path as ffmpegPath} from '@ffmpeg-installer/ffmpeg';
import {path as ffprobePath} from '@ffprobe-installer/ffprobe';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs-extra';
import path from 'path';
import * as utils from '../utils';


async function generateVideo(book: types.Book, options: types.Options, outDirname: string, tmpDirname: string): Promise<string> {
    winston.info("Generating video");
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);

    let outFilename = path.join(outDirname, `${book.safeFilename}.mp4`);
    await mergeAudioClips(book, options, tmpDirname);
    
    let videoClips = await createShortVideos(book, options, tmpDirname);

    // correct the durations
    let allMediaSegments = utils.getMediaSegmentsSubset(book, options);
    let segIdx = 0;
    for (let seg of allMediaSegments) {
        let vid = videoClips[segIdx];
        let dur = await utils.getDuration(vid);
        seg.durOnDisk = dur;
        segIdx++;
    };
    
    await mergeShortVideos(videoClips, outFilename, tmpDirname);

    winston.info("Done generating video");
    return outFilename;
}

async function mergeAudioClips(book: types.Book, options: types.Options, tmpDirname: string) {
    winston.verbose("Merging audio clips...");
    let allMediaSegments = utils.getMediaSegmentsSubset(book, options);
    for (let mediaSegment of allMediaSegments) {
        if (mediaSegment.audios && mediaSegment.audios.length == 1) {
            mediaSegment.mergedAudio = {...mediaSegment.audios[0]};
        }
        else if (mediaSegment.audios && mediaSegment.audios.length > 1) {
            winston.verbose(`Detected multiple audio clips for phrase ${mediaSegment.internalId}`);
            let audioTmpDirname = path.join(tmpDirname, "audio");
            utils.ensureDirectory(audioTmpDirname);
            let audioTmpFilenames = [];
            // first, create clips for each audio segment
            let splitOperations = mediaSegment.audios.map((audio, idx) => {
                return new Promise((resolve, reject) => {
                    let audioTmpFilename = path.join(audioTmpDirname, `${mediaSegment.internalId}-${idx}${path.extname(audio.src)}`);
                    audioTmpFilenames.push(audioTmpFilename);
                    ffmpeg()
                        .input(audio.src)
                        .audioFilters(`atrim=${audio.clipBegin}:${audio.clipEnd}`)
                        .output(audioTmpFilename)
                        .on('progress', (progress) => {
                            winston.verbose(`[ffmpeg] ${JSON.stringify(progress)}`);
                        })
                        .on('error', (err) => {
                            winston.error(`[ffmpeg] error: ${err.message}`);
                            reject(err);
                        })
                        .on('end', () => {
                            winston.verbose('[ffmpeg] finished');
                            resolve(0);
                        })
                        .run();
                });
            });

            await Promise.all(splitOperations);

            let concatFiles = 'concat:' + audioTmpFilenames.join('|');
            let extension = path.extname(audioTmpFilenames[0])
            let mergedAudioFilename = `${audioTmpDirname}/${mediaSegment.internalId}${extension}`;
    
            // merge the clips into one audio file
            let mergeOperation = new Promise((resolve, reject) => {
                ffmpeg()
                    .input(concatFiles)
                    .output(mergedAudioFilename)
                    .on('progress', (progress) => {
                        winston.verbose(`[ffmpeg] ${JSON.stringify(progress)}`);
                    })
                    .on('error', (err) => {
                        winston.error(`[ffmpeg] error: ${err.message}`);
                        reject(err);
                    })
                    .on('end', () => {
                        winston.verbose('[ffmpeg] finished');
                        resolve(0);
                    })
                    .run();
            });
            
            await mergeOperation;
            mediaSegment.mergedAudio = {
                src: mergedAudioFilename,
                clipBegin: 0,
                clipEnd: mediaSegment.dur
            };
        }
    }
    winston.verbose("Done merging audio clips");
}

// create a series of short videos and return a list of filepaths
async function createShortVideos(book: types.Book, options: types.Options, tmpDirname: string): Promise<Array<string>> {
    winston.verbose("Creating short videos...");
    let allMediaSegments = utils.getMediaSegmentsSubset(book, options);
    let outDirname = path.join(tmpDirname, "videos");
    utils.ensureDirectory(outDirname);

    //let idx = 0;
    let videoClips = [];
    for (let mediaSegment of allMediaSegments) {
        winston.verbose(`Processing phrase ${mediaSegment.internalId}`);
        let shortVideosOperation = new Promise((resolve, reject) => {
            ffmpeg()
                .addInput(mediaSegment.capturedImage.src)
                .addInput(mediaSegment.mergedAudio.src) 
                .audioFilters(`atrim=${mediaSegment.mergedAudio.clipBegin}:${mediaSegment.mergedAudio.clipEnd},asetpts=PTS-STARTPTS`)
                .outputOptions([
                    '-pix_fmt yuv420p', 
                    '-tune stillimage',
                    '-b:a 192k'])
                .saveToFile(`${outDirname}/video-${mediaSegment.internalId}.mp4`, outDirname)
                .on('progress', (progress) => {
                    winston.verbose(`[ffmpeg] ${JSON.stringify(progress)}`);
                })
                .on('error', (err) => {
                    winston.error(`[ffmpeg] error: ${err.message}`);
                    reject(err);
                })
                .on('end', () => {
                    winston.verbose('[ffmpeg] finished');
                    resolve(0);
                })
                .run();
        });
    
        await shortVideosOperation;
        videoClips.push(`${outDirname}/video-${mediaSegment.internalId}.mp4`);
        //idx++;
    }
    winston.verbose("Done creating short videos");
    return videoClips;
}

async function mergeShortVideos(videoClips: Array<string>, outFilename: string, tmpDirname: string) {
    winston.verbose("Merging short videos...");
    let concatVideos = videoClips.map((videoClip, idx) => {
        return `file '${videoClip}'\n`;
    }).join('\n');
    let concatTxtFile = path.join(tmpDirname, "concatShortVideos.txt");
    await fs.writeFile(concatTxtFile, concatVideos);
    let mergeOperation = new Promise((resolve, reject) => {
        // ffmpeg -f concat -safe 0 -i concatVideos.txt -c copy out.mp4
        ffmpeg()
            .addInput(concatTxtFile)
            .inputOptions(['-f concat', '-safe 0'])
            .outputOptions([
                '-c copy'
            ])
            .saveToFile(outFilename, tmpDirname)
            .on('progress', (progress) => {
                winston.verbose(`[ffmpeg] ${JSON.stringify(progress.percent)}% done`);
            })
            .on('error', (err) => {
                winston.error(`[ffmpeg] error: ${err.message}`);
                reject(err);
            })
            .on('end', () => {
                winston.verbose('[ffmpeg] finished');
                resolve(0);
            })
            .run();
        });
    
    await mergeOperation;
    winston.verbose("Done merging short videos");
}

export { generateVideo };