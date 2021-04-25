import * as types from '../types';
import winston from 'winston';
import path from 'path';
import fs from 'fs-extra';
import * as utils from '../utils';

// create an HTML file containing a number of preview slides; return the filename of the HTML file
async function generatePreview(book: types.Book, options: types.Options, outDirname: string): Promise<string> {
    winston.info(`Generating preview`);
    // copy image files from temp locations to outdir
    let allMediaSegments = utils.getMediaSegmentsSubset(book, options);
    for (let segment of allMediaSegments) {
        let imageFilename = path.join(outDirname, path.basename(segment.capturedImage.src));
        await fs.copyFile(segment.capturedImage.src, imageFilename);
    }

    // fill in template (use new image paths)
    let outFilename = path.join(outDirname, "preview.html");
    let previewHtml = createPreviewHtml(book, options);
    await fs.writeFile(outFilename, previewHtml);

    winston.info(`Done generating preview`);
    return outFilename;
}

function createPreviewHtml (book: types.Book, options: types.Options) {
    let allMediaSegments = utils.getMediaSegmentsSubset(book, options);
    let lang = book.metadata.lang ?? utils.findMostCommonValue("lang", allMediaSegments.map(segment => segment.html)) ?? "en";
    let dir = utils.findMostCommonValue("dir", allMediaSegments.map(segment => segment.html)) ?? "ltr";
    
    let timestampAcc = 0;
    let calcEnd = dur => {
        timestampAcc = timestampAcc + dur;
        return timestampAcc;
    };

    let previewTemplate = 
    `<!DOCTYPE html>
    <html 
        ${lang ? `lang="${lang}"` : 'lang="en"'} 
        ${dir ? `dir="${dir}"` : ''}>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Proof sheet: ${book.metadata.title}</title>
            <style>
                body > div {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                img {
                    display: block;
                    width: 20rem;
                }  
                figcaption {
                    text-align: center;
                    font-style: italic;
                    margin: 5px;
                    width: 20rem;
                }
                figcaption > p:first-child {
                    max-height: 3rem;
                    overflow-y: scroll;
                }
                @media(max-width: 768px) {
                    img {
                        width: 100%;
                    }
                    figcaption {
                        width: 100%;
                    }
                }
            </style>
        </head>
        <body>
            <h1>Preview for ${book.metadata.title}</h1>
            <p>Contains ${allMediaSegments.length} item(s)</p>
            <p>Each full-size image is scaled down to fit this page; click to enlarge to the original dimensions
                of ${options.maxWidth} x ${options.maxHeight}.</p>
            <div>
            ${allMediaSegments.map(mediaSegment => 
                `<figure>
                    <a href="${path.basename(mediaSegment.capturedImage.src)}" title="Enlarge image">
                        <img src="${path.basename(mediaSegment.capturedImage.src)}" alt="slide containing text">
                    </a>
                    <figcaption lang="${mediaSegment.html.lang}" dir="${mediaSegment.html.dir}">
                        <p>Start: ${timestampAcc.toFixed(3)}s, End ${calcEnd(mediaSegment.durOnDisk).toFixed(3)}</p>
                        <p>Slide text: ${mediaSegment.html.textContent.trim()}</p>
                        ${options.autosizeFont ? 
                            `<p>Approximate font size at this resolution: <span class="scaledFontSize" data-fontsize="${mediaSegment.html.renderedFontsize}"></span></p>
                             <p>Font size at max resolution: ${mediaSegment.html.renderedFontsize}px</p>`
                            : 
                            `<p>User-configured font size (see user-supplied CSS)</p>`
                        }

                        <p>Word count: ${mediaSegment.html.textContent.trim().split(' ').length}</p>
                        <p>Character count: ${mediaSegment.html.textContent.trim().length}</p>
                    </figcaption>
                </figure>`
                ).join('')}
            </div>
        </body>
        <script>
                document.addEventListener("DOMContentLoaded", e => {
                    let calcRelFontSize = () => {
                        let fontsizeSpans = Array.from(document.querySelectorAll(".scaledFontSize"));
                        fontsizeSpans.map(elm => {
                            let w = elm.parentElement.parentElement.parentElement.querySelector("img").width;
                            let h = elm.parentElement.parentElement.parentElement.querySelector("img").height;
                            let fontsize = parseInt(elm.getAttribute("data-fontsize").replace('px', ''));
                            let ratio = h/${options.maxHeight};
                            elm.textContent = (parseInt(ratio * fontsize))  + "px";
                        });
                    };
                    window.addEventListener("resize", e => {
                        calcRelFontSize();
                    });

                    calcRelFontSize();
                });
                
        </script>
    </html>
    `;
    return previewTemplate;
}

export { generatePreview };