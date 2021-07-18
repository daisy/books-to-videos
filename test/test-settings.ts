import { expect } from 'chai';
import 'mocha';
import { setupSettings } from '../src/cli/settings.js';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Settings', function () {

    it('uses the default settings', async function () {
        let settings = setupSettings();
        
        expect(settings.autosizeFont).to.be.true;
        expect(settings.chapters).to.be.empty;
        expect(settings.debug).to.be.false;
        expect(settings.includePageNumbers).to.be.false;
        expect(settings.maxHeight).to.equal(4000);
        expect(settings.maxWidth).to.equal(4000);
        expect(settings.numPreviewSlides).to.equal(-1);
        expect(settings.previewMode).to.be.false;
        expect(settings.quiet).to.be.false;
        expect(settings.stylesheets.length).to.equal(1);
        expect(settings.verbose).to.be.false;
        expect(settings.vttSettings).to.be.empty;
        
    });
    it("uses the settings from the preset", async function () {
        let settings = setupSettings("japanese-vertical");
        
        expect(settings.autosizeFont).to.be.true;
        expect(settings.chapters).to.be.empty;
        expect(settings.debug).to.be.false;
        expect(settings.includePageNumbers).to.be.false;
        expect(settings.maxHeight).to.equal(4000);
        expect(settings.maxWidth).to.equal(4000);
        expect(settings.numPreviewSlides).to.equal(-1);
        expect(settings.previewMode).to.be.false;
        expect(settings.quiet).to.be.false;
        expect(settings.stylesheets.length).to.equal(2);
        expect(settings.verbose).to.be.false;
        expect(settings.vttSettings).to.not.be.empty;
    });
    it("uses the custom settings", async function () {
        let settings = setupSettings('', path.resolve(__dirname, 'resources/customSettings.json'));

        expect(settings.autosizeFont).to.be.true;
        expect(settings.chapters).to.be.empty;
        expect(settings.debug).to.be.true;
        expect(settings.includePageNumbers).to.be.false;
        expect(settings.maxHeight).to.equal(4000);
        expect(settings.maxWidth).to.equal(4000);
        expect(settings.numPreviewSlides).to.equal(-1);
        expect(settings.previewMode).to.be.true;
        expect(settings.quiet).to.be.false;
        expect(settings.stylesheets.length).to.equal(2);
        expect(settings.verbose).to.be.true;
        expect(settings.vttSettings).to.be.empty;

    });
    it("uses the preset and the custom settings", async function () {
        let settings = setupSettings('japanese-vertical', path.resolve(__dirname, 'resources/customSettings.json'));

        expect(settings.autosizeFont).to.be.true;
        expect(settings.chapters).to.be.empty;
        expect(settings.debug).to.be.true;
        expect(settings.includePageNumbers).to.be.false;
        expect(settings.maxHeight).to.equal(4000);
        expect(settings.maxWidth).to.equal(4000);
        expect(settings.numPreviewSlides).to.equal(-1);
        expect(settings.previewMode).to.be.true;
        expect(settings.quiet).to.be.false;
        expect(settings.stylesheets.length).to.equal(3);
        expect(settings.verbose).to.be.true;
        expect(settings.vttSettings).to.not.be.empty;
    });

});