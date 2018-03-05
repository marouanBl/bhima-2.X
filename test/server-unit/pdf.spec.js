/* eslint global-require: "off" */
const { expect } = require('chai');
const rewire = require('rewire');

// mock translation dictionaries
const dictionaries = {
  en : require('../fixtures/translations-en.json'),
  fr : require('../fixtures/translations-fr.json'),
};

const translate = rewire('../../server/lib/helpers/translate');
translate.__set__('dictionaries', dictionaries);

const pdf = require('../../server/lib/renderers/pdf');

// mock handlebars template file
const template = 'test/fixtures/file.handlebars';

// mock data
const data = {
  developer : 'developer',
  message : 'You are a tourist :-)',
  developer_message : 'You are a developer',
  lang : 'fr',
};

function PDFRenderUnitTest() {
  it('#pdf.render() renders correctly a pdf file', async () => {
    const result = await pdf.render({}, template, data);
    console.log(result);
  });
}

describe('PDF renderer', PDFRenderUnitTest);
