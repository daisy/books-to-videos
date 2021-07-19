import * as types from '../types/index.js';

function createHtmlPage(segmentHtml: types.Html, stylesheets: Array<string>, fontsizeOverride?: number): string {
    let document = `
    <html>
        <head>
            <meta charset="utf-8">
            
                ${stylesheets.map(stylesheet => `<style>${stylesheet}</style>`).join('')}
                
                ${fontsizeOverride ?
            `<style>
                .booksToVideos-text {
                    font-size: ${fontsizeOverride}px !important;
                }
            </style>`
            :
            ''
        }
        </head>
        <body>
            <div class="booksToVideos-container" lang="${segmentHtml.lang}" dir="${segmentHtml.dir}">
                <div class="booksToVideos-text ${segmentHtml.textHasUrls ? `url` : ''}">
                ${segmentHtml.rawHtml}
                </div>
            </div>
        </body>
    </html>
    `;

    document = document.replace("<font", "<span");
    document = document.replace("</font>", "</span>");
    return document;
}

export { createHtmlPage };
