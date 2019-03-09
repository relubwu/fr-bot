const express = require('express');
const app = express();
const port = 8204;
const path = require('path');
const list = require('./list.json');
const db = require('./db.json');
const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { $CHAPTERS, $HWLIST } = list;
const template = fs.readFileSync('./client/viewer.html').toString();

const validate = (input) => {
  if (input.length == 0) {
    return false;
  } else {
    const validation = /[A]\d{8}/g;
    if (validation.test(input)) {
      validation.lastIndex = 0;
      input = input.replace(validation.exec(input)[0], '');
    }
    validation.lastIndex = 0;
    return (input.length != 0) ? false : true;
  }
};

const getContent = (reqContent, reqDensity) => {
  let contentArray = [];
  reqContent.forEach((item, index) => {
    let content = { item: item };
    let questions = [];
    let operator = $HWLIST[item].content;
    let availQuestionNum = operator.length;
    let contentQuestioNum = Math.floor(availQuestionNum * reqDensity);
    for (let i = 0; i < contentQuestioNum; i++) {
      questions.push(operator[Math.floor(Math.random()*contentQuestioNum)]);
    }
    content.questions = questions;
    contentArray.push(content);
  })
  return contentArray;
};

const storeContent = (pid, content) => {
  db[pid] = content;
  fs.writeFileSync('./db.json', JSON.stringify(db));
};

const weaveResponseHTML = (pid, list) => {
  let block = "";
  list.forEach((i) => {
    let chapter = i.item.split('&sub');
    if (chapter[0] != "S" && chapter[0] != "Midterm") {
      block = block.concat(`<div class="py-5 content-block" id="contentBlock"><div class="container"><div class="row"><div class="col-md-12"><div class="card"><div class="card-header bg-primary"> §${chapter[0]}.${chapter[1]}</div><div class="card-body d-flex justify-content-center flex-column align-items-center"><h4>#${i.questions.toString()}.</h4><p>${i.questions.length} questions generated&nbsp;</p><a class="btn btn-outline-primary" id="download" href="/static/Chapter${chapter[0]} Solutions.pdf" download="Chapter${chapter[0]} Solutions.pdf">Download Solutions (PDF)</a></div></div></div></div></div></div>`);
    } else {
      block = block.concat(`<div class="py-5 content-block" id="contentBlock"><div class="container"><div class="row"><div class="col-md-12"><div class="card"><div class="card-header bg-primary"> §${chapter[0]}.${chapter[1]}</div><div class="card-body d-flex justify-content-center flex-column align-items-center"><h4>#${i.questions.toString()}.</h4><p>${i.questions.length} questions generated, solutions are temporarily unavailable&nbsp;</p></div></div></div></div></div></div>`);
    }
  });
  let response = new JSDOM(template);
  response.window.document.getElementById('entry').innerHTML = block;
  return response.serialize();
}

app.use('/static', express.static(path.join(__dirname + '/client/assets')));

app.listen(port, () => console.log(`Activated on ${port}.`));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/client/index.html'));
});

app.get('/creator', (req, res) => {
  res.sendFile(path.join(__dirname + '/client/creator.html'));
});

app.get('/viewer', (req, res) => {
  if (req.query.content == null) {
    console.log(`Invalid Attempt from ${req.ip} using ${req.query.pid}.`)
    res.status(400).send("Please use valid content. This malicious request is documented.");
  } else
  if (validate(req.query.pid)) {
    let $RESPONSE = { list: [] };
    $RESPONSE.list = getContent(req.query.content, req.query.density);
    res.send(weaveResponseHTML(req.query.pid, $RESPONSE.list));
    storeContent(req.query.pid, $RESPONSE.list);
  } else {
    console.log(`Invalid Attempt from ${req.ip} using ${req.query.pid}.`)
    res.status(400).send("Please use valid PID. This malicious request is documented.");
  }
});

app.get('/pullClient', (req, res) => {
  res.sendFile(path.join(__dirname + '/client/pull.html'));
});

app.get('/pull', (req, res) => {
  if (validate(req.query.pid)) {
    if (db[req.query.pid]) {
      let $RESPONSE = { list: [] };
      $RESPONSE.list = db[req.query.pid];
      res.send(weaveResponseHTML(req.query.pid, $RESPONSE.list));
    } else {
      res.redirect('/');
    }
  } else {
    console.log(`Invalid Attempt from ${req.ip} using ${req.query.pid}.`)
    res.status(400).send("Please use valid PID. This malicious request is documented.");
  }
});
