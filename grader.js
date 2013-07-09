#!/usr/bin/env node
/*
Autoutomatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var rest = require('restler');
var program = require('commander');
var cheerio = require('cheerio');
var URLFILE_DEFAULT = "http://powerful-headland-7442.herokuapp.com";
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var util = require('util');

function assertFileExists(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

function loadChecks(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

function cheerioFile(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};


function checkFiles(datafile, checksfile){
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = datafile(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;	
};

function checkHtmlFile(htmlfile, checksfile) {
    $ = cheerioFile(htmlfile);
	var out = checkFiles($, checksfile);
	writeJSON(out);
	
};

function cheerioURL(result) {
    return cheerio.load(result);
};

function buildfn(checksfile) {
    var response2console = function(result, response) {
        if (result instanceof Error) {
            console.error('Error: ' + util.format(response.message));
        } else {
          
			$ = cheerioURL(result);
			var out = checkFiles($, checksfile);
			writeJSON(out);
        }
    };
    return response2console;
};


function checkURLFile(urlfile, checksfile) {
    
    var htmlfile = buildfn(checksfile);
    rest.get(urlfile).on('complete', htmlfile);
};

function writeJSON(out){
	
	var outJson = JSON.stringify(out, null, 4);
	console.log(outJson);
	
}

function clone(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};


if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
		.option('-u, --url <url_file>', 'URL to index.html')
        .parse(process.argv);

		if (program.url)
			checkURLFile(program.url, program.checks); 
		else
			checkHtmlFile(program.file, program.checks);
		
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
