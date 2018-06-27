import * as T from '@babel/types';
import readdir from 'recursive-readdir';

import path from 'path';

export const generateSemicolon = () => T.emptyStatement();

const ignoreFunc = (file, stats) => {
  // `file` is the path to the file, and `stats` is an `fs.Stats`
  // object returned from `fs.lstat()`.

  if (stats.isDirectory() && path.basename(file) === 'node_modules') {
    return true;
  }
  if (!stats.isDirectory() && path.extname(file) !== '.js') {
    return true;
  }


  return false;
};

export const getJsFilesInFolder = path => readdir(path, [ignoreFunc]);
