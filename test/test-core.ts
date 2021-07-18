import { expect } from 'chai';
import fs from 'fs-extra';
import 'mocha';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { setupSettings } from '../src/cli/settings.js';
import { convertBookToVideo } from '../src/core/index.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Video conversion', function () {
    this.timeout(1000000);
    let result: any = {};
    before(async function () {
        let settings = setupSettings();
        let inputFile = path.join(process.cwd(), './test/resources/book/ncc.html');
        let outputDir = path.join(process.cwd(), './out');
        result = await convertBookToVideo(inputFile, outputDir, settings, true);
    });
    it('returned a list of the created contents', async function () {
        expect(result).to.not.be.empty;
        expect(result).to.have.all.keys(
            'videoFilename',
            'captionsFilename',
            'htmlEmbedFilename',
            'videoDuration',
            'logFile',
            'outputDirectory');
    });
    it('creates an mp4 video', async function () {
        expect(fs.existsSync(path.join(result.outputDirectory, result.videoFilename))).to.be.true;
    });
    it("creates a VTT captions file", async function () {
        expect(fs.existsSync(path.join(result.outputDirectory, result.captionsFilename))).to.be.true;
    });
    it("creates a log file", async function () {
        expect(fs.existsSync(path.join(result.outputDirectory, result.logFile))).to.be.true;
    });

});

describe('Preview mode', function () {
    let result: any = {};
    this.timeout(1000000);
    before(async function () {
        let settings = setupSettings('', path.resolve(__dirname, 'resources/customSettings2.json'));
        let inputFile = path.resolve(__dirname, 'resources/book/ncc.html');
        let outputDir = path.resolve(__dirname, '../out');
        result = await convertBookToVideo(inputFile, outputDir, settings, true);
    });
    it("creates the specified number of static preview images", async function () {
        let dirContents = await fs.readdir(result.outputDirectory);
        let images = dirContents.filter(item => path.extname(item) == '.png');
        expect(images.length).to.equal(5);
    });
});

describe('Error handling', function () {
    it("reports failure when given an unsupported file type", async function () {
        let settings = setupSettings();
        let inputFile = path.resolve(__dirname, 'resources/customSettings.json');
        let outputDir = path.resolve(__dirname, '../out');
        try {
            let result = await convertBookToVideo(inputFile, outputDir, settings, true);
        }
        catch (err) {
            expect(err).to.not.be.null;
            return;
        }
        expect(1).to.equal(2); // we should never hit this point, if so, it's automatically an error

    });
});