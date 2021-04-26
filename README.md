# Books to Videos

Convert a synchronized text/audio book to a video displaying text and audio.

Currently supports DAISY 2.02 to MP4 video with CSS customization.

Tested scripts: Latin, Japanese (Shift_JIS) with vertical writing, Arabic

See [sample output](https://d2v.netlify.app/)

## Installation

TODO: instructions for installation once package is published

## Usage

Running this command:

```
npm run start -- convert /path/to/ncc.html /path/to/outputDirectory
```

Will create this output in `outputDirectory`:

* Video file (MP4) of the DAISY 2.02 book
* Video captions (VTT)
* HTML file with the video and captions embedded in it
* Log file of the conversion process

There are many ways to customize the output. Read on to learn more.

## Video style

The text shown in the video can be customized by creating a stylesheet in CSS. In the stylesheet itself, use the classes `booksToVideos-container` for the whole video "container" and `booksToVideos-text` for the text portion. E.g.

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
* `-z, --vttSettings`: Settings to append after each caption, e.g. `--vttSettings align:middle position:60% vertical:rl` 

## Options file

These are all the options, with their default values:

```
{
    "autosizeFont": true,
    "chapters": [],
    "debug": false,
    "includePageNumbers": false,
    "maxHeight": 4000,
    "maxWidth": 4000,
    "numPreviewSlides": -1,
    "previewMode": false,
    "quiet": false,
    "stylesheet": "default.css",
    "verbose": true,
    "vttSettings": ""
}
```

Each setting is defined below:

* __autosizeFont__: Automatically determine the largest possible font size to use.
* __chapters__: Specify which chapters to include in the video. If empty (_[]_), create a video from the whole book.
* __debug__: Run in [debug mode](#debugging)
* __includePageNumbers__: Whether video output should include page numbers
* __maxHeight__: maximum Chromium viewport height. There's no need to change this option. Edit the CSS for the `booksToVideos-container` class to change the video dimensions.
* __maxWidth__: maximum Chromium viewport width. There's no need to change this option. Edit the CSS for the `booksToVideos-container` class to change the video dimensions.
* __numPreviewSlides__: How many slides to create when running in `previewMode`. `-1` means create all.
* __previewMode__: Create an HTML page with a list of slides instead of creating a video. Good for testing out styles; faster than making a video.
* __quiet__: Don't output anything on the command line
* __stylesheet__: Apply this stylesheet to the slides
* __verbose__: Include extra information in the command line output
* __vttSettings__: Specify [caption settings](#caption-settings)

### Custom options file

Customize any options by creating a custom options file, e.g. 

```
{
    "stylesheet": "vertical.css",
    "vttSettings": "align:middle position:60% vertical:rl"
}
```

It does not have to include entries for every option, just the ones you want to customize.

Note that some options can be customized on the command line, but not all.

## Tips

### Set encoding

While Books-to-Videos will attempt to detect the encoding, in some cases if it is not reliably found, you may specify it with the `--encoding` option. One encoding may be specified for an entire publication.

### Caption settings

Books-to-Videos creates a VTT captions file to accompany the video. The option `--vttSettings` contains settings to apply to every caption. This can be used to control the position of captions and to create vertical captions. Note that there is just one setting and it will apply to all captions. Finer-grained control for per-caption settings may be introduced in future versions if there is interest.

E.g. 

```
npm run start -- convert /path/to/ncc.html /path/to/outputDirectory --vttSettings "align:middle position:60% vertical:rl"
```

Results in this type of captions file:
```
WEBVTT

1
00:00:00.000 --> 00:00:02.666 align:middle position:60% vertical:rl
ごん狐

2
00:00:02.666 --> 00:00:04.713 align:middle position:60% vertical:rl
新美南吉

3
00:00:04.713 --> 00:00:06.343 align:middle position:60% vertical:rl
一

...
```

### `list-chapters` command

There is also a command included to view a list of chapters in the book. This can be helpful for referring to the chapters by number. For example:

```
npm run start -- list-chapters /path/to/ncc.html

1. First chapter
2. Second chapter
3. Third chapter

```

and then if you are just converting part of a book, you can use the numbers to say which chapters you want to convert:

```
npm run start -- convert /path/to/book/ncc.html /path/to/outputDirectory --chapters 2 3
```

### Debugging

Use the `--debug` option to collect more details about program execution. The `--debug` option will:

* Save a JSON model of the book to disk
* Copy the following temp files to the output directory, in a `debug` subdirectory:
    * Images of each slide
    * Video clips of each slide
* Include an HTML page for each slide, in a `debug/html` subdirectory. This is useful for testing different CSS approaches.

Note that the `--debug` option will show Chromium running and may ask you to allow incoming network connections. 

Also note that the `--debug` option may not provide the best images, so it's only recommended to use for troubleshooting, not for the final result.

