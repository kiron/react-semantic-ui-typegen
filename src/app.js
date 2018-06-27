// @flow

import { parse } from 'babylon';
import generator from '@babel/generator';
import * as T from '@babel/types';
import * as reactDocs from 'react-docgen';
import { parseJsonFile, type ReactDocGen } from './parseFile';
import * as Utils from './util';
import fs from 'fs';

const generateModuleDeclaration = (moduleName: string, statements) => {
  return T.declareModule(T.stringLiteral(moduleName), T.blockStatement(statements));
};

// let example = require('../example')
// const program = T.program([generateModuleDeclaration('semantic-ui-react', [parseJsonFile(example)])]);
// const output = generator(program, {}, '');
// console.log(output.code);

Utils.getJsFilesInFolder('./node_modules/semantic-ui-react/src')
  .then(files => {
    const statements = [];
    files.forEach(file => {
      let doc;
      try {
        const src = fs.readFileSync(file);
        doc = reactDocs.parse(src);
      } catch (err) {
        return;
        // console.error(err);
        // console.error(file);
      }
      const result = parseJsonFile(doc);
      statements.push(result);
    });
    const program = T.program([generateModuleDeclaration('semantic-ui-react', statements)]);
    const output = generator(program, {}, '');
    console.log(output.code);
  })
  .catch(err => console.error(err));
