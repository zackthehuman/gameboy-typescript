var Buffer = require('buffer').Buffer;
var path = require('path');
var existsSync = require('exists-sync');
var Rollup = require('broccoli-rollup');
var Funnel = require('broccoli-funnel');
var MergeTrees = require('broccoli-merge-trees');
var stew = require('broccoli-stew');
var typescript = require('broccoli-typescript-compiler').typescript;
var buble = require('rollup-plugin-buble');
var fs = require('fs');
var find = stew.find;

var SOURCE_MAPPING_DATA_URL = '//# sourceMap';
SOURCE_MAPPING_DATA_URL += 'pingURL=data:application/json;base64,';

module.exports = function () {
  var bower = __dirname + '/bower_components';
  var hasBower = existsSync(bower);
  var types = new Funnel(path.dirname(require.resolve('typescript/lib/lib.d.ts')), {
    include: ['lib*.d.ts']
  });
  var src = new MergeTrees([types, 'src']);
  var index = typescript(src, {
    annotation: 'compile index.ts',
    tsconfig: {
      compilerOptions: {
        module: 'es2015',
        moduleResolution: 'node',
        target: 'es2015',
        declaration: true,
        strictNullChecks: true,
        inlineSourceMap: true,
        inlineSources: true
      },
      files: [
        'lib.es2015.d.ts',
        'lib.dom.d.ts',
        'index.ts'
      ]
    }
  });
  var worker = typescript(src, {
    annotation: 'compile gameboy.ts',
    tsconfig: {
      compilerOptions: {
        module: 'es2015',
        moduleResolution: 'node',
        target: 'es2015',
        declaration: true,
        strictNullChecks: true,
        inlineSourceMap: true,
        inlineSources: true
      },
      files: [
        'lib.es2015.d.ts',
        'lib.webworker.d.ts',
        'worker/gameboy.ts'
      ]
    }
  });

  var testFiles = new Funnel('src/tests');

  var testHarness = [new Funnel(testFiles, {
    include: ['index.html']
  })];

  var qunitTypes = 'node_modules/@types/qunit';

  var tests = typescript(new MergeTrees([src, qunitTypes]), {
    annotation: 'compile all-tests.ts',
    tsconfig: {
      compilerOptions: {
        module: 'es2015',
        moduleResolution: 'node',
        target: 'es2015',
        declaration: true,
        strictNullChecks: true,
        inlineSourceMap: true,
        inlineSources: true
      },
      files: [
        'tests/all-tests.ts',
        'index.d.ts'
      ]
    }
  });

  if (hasBower) {
    testHarness.push(find(bower, {
      srcDir: '/qunit/qunit'
    }));
  }

  testHarness = new Funnel(new MergeTrees(testHarness), {
    destDir: '/tests'
  });

  return new MergeTrees([
    new Funnel('src', {
      include: ['index.html']
    }),
    new Rollup(index, {
      annotation: 'index.js',
      rollup: {
        entry: 'index.js',
        plugins: [ loadWithInlineMap(), buble() ],
        sourceMap: true,
        dest: 'index.js',
        format: 'iife'
      }
    }),
    new Rollup(worker, {
      annotation: 'worker/gameboy.js',
      rollup: {
        entry: 'worker/gameboy.js',
        plugins: [ loadWithInlineMap(), buble() ],
        sourceMap: true,
        dest: 'worker/gameboy.js',
        format: 'iife',
        moduleName: 'gameboy'
      }
    }),
    new Rollup(tests, {
      annotation: 'tests/all-tests.js',
      rollup: {
        entry: 'tests/all-tests.js',
        plugins: [ loadWithInlineMap(), buble() ],
        sourceMap: true,
        dest: 'tests/all-tests.js',
        format: 'iife',
        moduleName: 'alltests'
      }
    }),
    testHarness
  ], {
    annotation: 'dist'
  });
};

function loadWithInlineMap() {
  return {
    load: function (id) {
      var code = fs.readFileSync(id, 'utf8');
      var result = {
        code: code,
        map: null
      };
      var index = code.lastIndexOf(SOURCE_MAPPING_DATA_URL);
      if (index === -1) {
        return result;
      }
      result.code = code;
      result.map = parseSourceMap(code.slice(index + SOURCE_MAPPING_DATA_URL.length));
      return result;
    }
  };
}

function parseSourceMap(base64) {
  return JSON.parse(new Buffer(base64, 'base64').toString('utf8'));
}
