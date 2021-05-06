type Metadata = {
    title: string,
    authors?: Array<string>,
    date?: Date,
    lang?: string,
    dateScheme?: string
};

type Audio = {
    src: string,
    clipBegin: number,
    clipEnd: number
};

type CapturedImage = {
    src: string
};

type Html = {
    src: string,
    selector: string,
    rawHtml?: string,
    lang?: string,
    dir?: string,
    textContent?: string,
    tagname?: string,
    maximumFontsize?: number,
    renderedFontsize?: number,
    width?: string,
    height?: string,
    encoding?: string,
    textHasUrls?: boolean
};

type MediaSegment = {
    ids?: Array<string>,
    internalId?: string,
    audios?: Array<Audio>,
    capturedImage?: CapturedImage,
    html?: Html,
    dur?: number,
    durOnDisk?: number,
    isPageNumber: boolean,
    mergedAudio?: Audio
};

type Chapter = {
    title?: string,
    contents?: Array<MediaSegment>,
    url: string,
    level: number
};

type Book = {
    lang?: string,
    dir?: string,
    safeFilename?: string,
    chapters: Array<Chapter>,
    metadata: Metadata,
    pagelist?: Array<string>
};

export { Book, Chapter, Metadata, MediaSegment, Audio, CapturedImage, Html };