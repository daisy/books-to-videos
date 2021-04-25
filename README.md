# Books to Videos

Convert a synchronized text/audio book to a video displaying text and audio.

Currently supports DAISY 2.02 to MP4 video with CSS customization.

Tested scripts: Latin, Japanese (Shift_JIS) with vertical writing, Arabic

## Installation

* Install [NPM](https://www.npmjs.com/get-npm)
* Clone this repository
* `npm i`

## Usage

Running this command:

```
npm run start -- convert /path/to/book/ncc.html ../outputDirectory
```

Will create this output in `../outputDirectory`:

* Video file (MP4) of the DAISY 2.02 book
* Video captions (VTT)
* HTML file with the video and captions embedded in it
* Log file of the conversion process

There are many ways to customize the output. Read on to learn more.

## Video style

The text shown in the video can be customized by creating a stylesheet in CSS. In the stylesheet itself, use the class `booksToVideos-container` for the whole video "container" and `booksToVideos-text` for the text portion. E.g.

```
.booksToVideos-container {    
    outline-offset: -15px;
    outline: lightblue 15px solid;
    background-color: black;

    width: 2000px;
    height: 2000px;
    
}
.booksToVideos-text {
    font-family: Optima;
    font-weight: bold;
    color: lightblue;
    text-align: center;
    line-height: 1.6;
}

```

You can pass the stylesheet to use in on the command line or specify it in the options file.

The [default](https://github.com/daisy/books-to-videos/blob/main/src/cli/defaults/default.css) stylesheet is a good place to start when creating your own. It contains some best practice rules for resetting browser styles that would look out of place in a video.


## Command line options

Some options can be configured via the command line. They are:

* `-c, --chapters`: If you don't want to convert the entire book, you may specify which chapters to convert. E.g. `--chapters 1 2 3`
* `-d, --debug`: Turn debug mode on
* `-e, --encoding`: Force a character encoding. E.g. `--encoding Shift_JIS`
* `-h, --help`: Show help
* `-o, --options`: Custom options file. E.g. `--options my-settings.json`
* `-s, --stylesheet`: Custom CSS file. E.g. `--stylesheet my-style.css`
* `-v, --verbose`: Turn verbose output on.

## Options file

These are the default options:

```
{
    "autosizeFont": true,
    "previewMode": false,
    "numPreviewSlides": -1,
    "quiet": false,
    "debug": false,
    "verbose": true,
    "maxWidth": 4000,
    "maxHeight": 4000,
    "includePageNumbers": false,
    "chapters": [],
    "stylesheet": "default.css",
    "vttSettings": ""
}
```

### Advanced: Custom options file

Customize any options by creating a custom options file, e.g. 

```
{
    "stylesheet": "vertical.css",
    "vttSettings": "vertical:rl"
}
```

It does not have to include entries for every option, just the ones you want to customize.

Note that some options can be customized on the command line, but not all.

## Tips

### Set encoding

While Books-to-Videos will attempt to detect the encoding, in some cases if it is not reliably found, you may specify it with the `--encoding` option. One encoding may be specified for an entire publication.

### VTT settings

There is an option called `vttSettings` which contains settings to use with every caption. This option can be used to control the position of captions and to create vertical captions. Note that there is just one setting and it will apply to all captions. Finer-grained control may be introduced in future versions if there is interest. 

### `list-chapters` command

There is also a command included to view a list of chapters in the book. This can be helpful for referring to the chapters by number. For example:

```
npm run start -- list-chapters /path/to/book/ncc.html

1. First chapter
2. Second chapter
3. Third chapter

```

and then if you are just converting part of a book, you can use the numbers to say which chapters you want to convert:

```
npm run start -- convert /path/to/book/ncc.html ../outputDirectory --chapters 2 3
```

## TODOs

* write tests
    * parser
    * intermediate steps
    * final video duration
    * test smil parser with missing clip-begin, clip-end
* feat: add metadata to video clip
