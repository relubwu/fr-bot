const parser = require('./parser.js');
const data = require('./data.json');

parser.parse();

const { HWList } = data;
HWList.forEach((item) => {
  //console.log(item.section);
  item.problem
});
