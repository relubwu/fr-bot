const fs = require('fs');
const https = require('https');
const iconv = require('iconv-lite');
const color = require('colors');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const options = require('./options.json');

module.exports.parse = () => {
  const main = new Promise((resolve, reject) => {
    let rawDataBuffer = [];
    const { request } = options;
    // Initiate request to designated server; Pass parsed String document to Promise.resolve(args) handler.
    https.get(request, (response) => {
      console.log(`${'getHWDatabase'.black.bgWhite}::${'https.get()'.green} -> Request to ${request['hostname']}:${request['port']}@${request['path']} started.`);
      response.on('data', (d) => {
        rawDataBuffer.push(d);
      });
      response.on('end', (d) => {
        console.log(`${'getHWDatabase'.black.bgWhite}::${'https.get()'.green} -> Request ended.`);
        let decodedDataString = iconv.decode(Buffer.concat(rawDataBuffer), 'ascii');
        resolve(decodedDataString);
      })
    }).on('error', (e) => {
      console.error(e);
    })
  }).then((response) => {
    // Generate DOM using jsdom.
    const { document } = (new JSDOM(response)).window;
    console.log(`${'parseHWList'.black.bgWhite}::${'JSDOM.prototype.constructor'.green} -> DOM generation for incoming response completed.`);
    const { parse } = options;
    // Secondary parser using DOM operations.
    console.log(`${'parseHWList'.black.bgWhite}::${'document.querySelectorAll()'.green} -> Extracting table from DOM with respect to '${parse['querySelector'].yellow}.'`);
    let HWDataArray = document.querySelectorAll(parse['querySelector']);
    // Custom parser function
    console.log(`${'parseHWList'.black.bgWhite}::${'this.parse()'.green} -> Executing parsing function, to customize parsing function, please see commentaries.`);
    let HWList = [];
    HWDataArray.forEach((itemtr) => {
      if (itemtr.getAttribute('id') != 'matlabem') {
        let td = itemtr.querySelectorAll('td'),
            sectionRegex = /\d+?\.\d/g,
            problemRegex = /\s(\d+?|\d+?\(\w\))\,|\s\d+\s/g;
            let section = '',
                problemArray = [];
        td.forEach((itemtd, index) => {
          if (sectionRegex.test(itemtd.textContent)) {
            sectionRegex.lastIndex = 0;
            section = sectionRegex.exec(itemtd.textContent);
            sectionRegex.lastIndex = 0;
          }
          if (problemRegex.test(itemtd.textContent)) {
            problemRegex.lastIndex = 0;
            problemArray = itemtd.textContent.replace(/\s/g, '').replace(/(\w){3,}/g, '').split(',');
          }
        })
        if (section[0] != null) {
          let HWEntry = {
            section: section[0],
            problem: problemArray
          }
          HWList.push(HWEntry);
        }
      }
    });
    console.log(`${'parseHWList'.black.bgWhite}::${'this.parse()'.green} -> Completed successfully. ${HWList.length.toString().yellow} Entries documented.`);
    return HWList;
  }).then((HWList) => {
    let result = JSON.stringify({'title': 'MATH18', HWList}, null, 2);
    console.log(`${'saveHWList'.black.bgWhite}::${'fs.writeFileSync()'.green} -> Saving output to ${'./data.json'.yellow}`);
    fs.writeFileSync('data.json', result);
    console.log(`${'parser'.black.bgWhite}::${'parse()'.green} -> All parsing process completed, calling back.`);
  });
}
