# Books to Videos

Convert a synchronized text/audio book to a video displaying text and audio.

Currently supports DAISY 2.02 to MP4 video with CSS customization.

Tested scripts: Latin, Japanese (Shift_JIS) with vertical writing, Japanese with ruby markup, Arabic

See [sample output](https://d2v.netlify.app/)

## Installation

TODO: instructions for installation once package is published

## Usage

This command:

```
npm run start -- convert /path/to/ncc.html /path/to/outputDirectory
```

Will create these files in `outputDirectory`:

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

You can pass the stylesheet to use in on the command line or specify it in the settings file.

The [default](https://github.com/daisy/books-to-videos/blob/main/src/cli/defaults/default.css) stylesheet is a good place to start when creating your own. It contains some best practice rules for resetting browser styles that would look out of place in a video.


## Command line options

Some settings can be configured via the command line. They are:

* `-c, --chapters`: List of numbers, e.g. `--chapters 1 2 3`. Use this option to [convert part of a book](#convert-part-of-a-book) 
* `-d, --debug`: Run in [debug mode](#debugging)
* `-e, --encoding`: Force a character [encoding](#set-encoding)
* `-f, --fontsizePx <number>`: Value in pixels of the desired font size
* `-p, --previewMode`: Only generate still images as a preview of the final output
* `-s, --settings`: Custom settings file. E.g. `--settings my-settings.json` 
* `-t, --stylesheet`: CSS file used for the [video style](#video-style). E.g. `--stylesheet my-style.css`
* `-v, --verbose`: Turn verbose output on.
* `-z, --vttSettings`: Specify [caption settings](#caption-settings)
* `-h, --help`: Show help

Settings on the command line override settings in a file.

## Settings file

All the settings can be set via a file (JSON format). They are:

| Option | Allowed values | Description |
|--------|----------------|-------------|
| __autosizeFont__ | `true`/`false` | Automatically determine the largest possible font size to use |
| __chapters__ | An array e.g. `[1, 2, 3]` | If you don't want to convert the entire book, you may [convert part of a book](#convert-part-of-a-book) by specifying which chapters to include. If this value is empty (_`[]`_), the video will be created from the whole book.
| __debug__ | |Run in [debug mode](#debugging)|
| __encoding__| String | Specify an encoding for the DAISY book. Useful for solving encoding issues. | 
| __includePageNumbers__ | `true`/`false` | Whether video output should include page numbers. 
| __fontsizePx__ | Number of pixels | Force the fontsize to this value. If present, automatically overrides `autosizeFont`; therefore, this value is not present by default |
| __maxHeight__ | Number of pixels | Maximum Chromium viewport height. There's no need to change this option. Edit the CSS for the `booksToVideos-container` class to change the video dimensions.
| __maxWidth__ | Number of pixels | Maximum Chromium viewport width. There's no need to change this option. Edit the CSS for the `booksToVideos-container` class to change the video dimensions.
| __numPreviewSlides__ | Number of slides, or `-1` | How many slides to create when running in `previewMode`. To create all possible slides, set this option to `-1`.
| __previewMode__ | `true`/`false` | Create an HTML page with a list of slides instead of creating a video. Good for testing out styles; faster than making a video.
| __quiet__ | `true`/`false` | Don't output anything on the command line
| __stylesheet__ | Filename | CSS file used for the [video style](#video-style)
| __verbose__ | `true`/`false` | Include extra information in the command line output
| __vttSettings__ | String | Specify [caption settings](#caption-settings)

### Default settings 

```
{
    "autosizeFont": true,
    "chapters": [],
    "debug": false,
    "includePageNumbers": false,
    "maxWidth": 4000,
    "maxHeight": 4000,
    "numPreviewSlides": -1,
    "previewMode": false,
    "quiet": false,
    "stylesheet": "default.css",
    "verbose": true,
    "vttSettings": ""
}
```


### Custom settings file

Customize any settings by creating a custom file, e.g. 
`my-settings.json`:
```
{
    "stylesheet": "vertical.css",
    "vttSettings": "align:middle position:60% vertical:rl"
}
```

It does not have to include entries for every setting, just the ones you want to customize.

Then pass the custom file on the command line:
```
npm run start -- convert /path/to/ncc.html /path/to/outputDirectory --settings /path/to/my-settings.json
```

## Tips

### Convert part of a book

If you are just converting part of a book, you can use the numbers to say which chapters you want to convert:

```
npm run start -- convert /path/to/book/ncc.html /path/to/outputDirectory --chapters 2 3
```

To get the chapter numbers, use the `list-chapters` command:

```
npm run start -- list-chapters /path/to/ncc.html

1. First chapter
2. Second chapter
3. Third chapter

```

Note that when processing selected chapters intead of the whole book, the fontsize will be optimized for those chapters. It may be different when the whole book is processed.

### Encoding

While Books-to-Videos will attempt to detect the encoding, in some cases if it is not reliably found, you may specify it with the `--encoding` option. One encoding may be specified for an entire publication.

### Font size 

The video will use just one font size for all its contents. The font size is determined based on your settings.

By default, `autosizeFont` is enabled in the settings JSON file. To override this, set the font size you would like instead on the command line with the `fontsizePx` option. E.g. 

```
npm run start -- convert /path/to/ncc.html outDirectory --fontsizePx 25
```

Would apply a fontsize of `25px` to the video output.

Two other ways to accomplish the same result are:

### Use CSS
1. Create a custom configuration file with `autosizeFont` set to `false`
2. Create a custom CSS file and include your desired fontsize there, under the class selector `.booksToVideos-text`

### `fontsizePx` in settings file

1. Create a custom settings JSON file with `fontsizePx` set to the value you want.
2. Specify this custom file on the command line with the `--settings` parameter

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

### URLs

Sometimes a phrase contains a very long URL and we may wish to apply custom word wrapping rules to that type of text. Books-to-videos inserts a class "url" into the text containing URLs so that it may be styled differently. E.g. 

```
<span id="xmri_0034">https://extranet.who.int/kobe<span class="tex">_</span>centre/ja/news/COVID19<span class="tex">_</span>specialpage<span class="tex">_</span>public</span>
```

becomes

```
<span id="xmri_0034" class="url">https://extranet.who.int/kobe<span class="tex">_</span>centre/ja/news/COVID19<span class="tex">_</span>specialpage<span class="tex">_</span>public</span>
```

and then in the stylesheet, we have this default:

```
.url {
    word-break: break-all;
}
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

### Development

See the [development notes](https://github.com/daisy/books-to-videos/wiki/Development-notes).