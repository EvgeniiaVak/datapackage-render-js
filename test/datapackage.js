var assert = require('assert')
  , spec = require('../datapackage.js')
  , stream = require('stream')
  , fs = require('fs')
  ;

var dp1 = {
  "name": "abc",
  "resources": [
    {
      "name": "random",
      "format": "csv",
      "path": "test/data/dp1/data.csv",
      "schema": {
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "size",
            "type": "integer"
          }
        ]
      }
    }
  ],
  "views": [
    {
      "type": "vegalite",
      "spec": {
        "data": {
          "resource": "random"
        },
        "mark": "bar",
        "encoding": {
          "x": {"field": "name", "type": "ordinal"},
          "y": {"field": "size", "type": "quantitative"}
        }
      }
    }
  ]
};

describe('DataPackage', function() {
  it('instantiates', function() {
    var dp = new spec.DataPackage();
  });

  it('instantiates with string', function() {
    var dp = new spec.DataPackage('abc');
    assert.equal(dp.path, 'abc');
  });
  
  it('instantiates with object', function() {
    var dp = new spec.DataPackage(dp1);
    assert.deepEqual(dp.data, dp1);
  });

  it('loads', function(done) {
    var dp = new spec.DataPackage('test/data/dp1');
    dp.load()
      .then(function() {
        assert.equal(dp.data.name, 'abc');
        assert.equal(dp.resources.length, 1);
        assert.equal(dp.resources[0].fullPath(), 'test/data/dp1/data.csv');
        done();
      });
  });

});

describe('Resource', function() {
  var resource = {
    "path": "test/data/dp1/data.csv"
  }
  it('instantiates', function() {
    var res = new spec.Resource(resource);
    assert.equal(res.data, resource);
    assert.equal(res.base, '');
  });
  it('fullPath works', function() {
    var res = new spec.Resource(resource, 'abc');
    assert.equal(res.base, 'abc');
    assert.equal(res.fullPath(), 'abc/test/data/dp1/data.csv');
  });
  it('objects works', function(done) {
    var res = new spec.Resource(resource);
    res.objects()
      .then(function(output) {
        assert.equal(output.length, 3);
        assert.equal(output[0].size, "100");
        done();
      });
  });
  it('stream works', function(done) {
    var res = new spec.Resource(resource);
    spec.objectStreamToArray(res.stream()).
      then(function(output) { 
        assert.equal(output.length, 3);
        assert.strictEqual(output[0].size, "100");
        done();
      });
  });
  it('stream works with jts', function(done) {
    var res = new spec.Resource(dp1.resources[0]);
    spec.objectStreamToArray(res.stream()).
      then(function(output) { 
        assert.equal(output.length, 3);
        assert.strictEqual(output[0].size, 100);
        done();
      });
  });
});

function makeStream(text) {
  var s = new stream.Readable();
  s.push(text);
  s.push(null);
  return s;
}

describe('csvToStream', function() {
  it('casting works', function(done) {
    var dp = new spec.DataPackage(dp1);
    var stream = spec.csvToStream(dp.resources[0].rawStream(), dp.resources[0].data.schema);
    spec.objectStreamToArray(stream).
      then(function(output) { 
        assert.equal(output.length, 3);
        assert.strictEqual(output[0].size, 100);
        done();
      });
  });
  it('parse works for strings', function(done) {
    var schema = fs.readFileSync("test/data/types-test/schema.json", "utf8")
    var jsonContent = JSON.parse(schema)
    var dp = new spec.DataPackage(jsonContent);
    var stream = spec.csvToStream(dp.resources[0].rawStream(), dp.resources[0].data.schema);
    spec.objectStreamToArray(stream).
      then(function(output) {
        assert.strictEqual(typeof output[0].string, 'string');
        assert.strictEqual(output[0].string, 'Word');
        assert.strictEqual(output[1].string, '');
        assert.strictEqual(output[2].string, 'test@mail.com');
        assert.strictEqual(output[3].string, 'http://www.testwebsite.com');
        done();
      });
  });
  it('parse works for numbers', function(done) {
    var schema = fs.readFileSync("test/data/types-test/schema.json", "utf8")
    var jsonContent = JSON.parse(schema)
    var dp = new spec.DataPackage(jsonContent);
    var stream = spec.csvToStream(dp.resources[0].rawStream(), dp.resources[0].data.schema);
    spec.objectStreamToArray(stream).
      then(function(output) {
        assert.strictEqual(typeof output[0].number, 'number');
        assert.strictEqual(output[0].number, 0);
        assert.strictEqual(output[1].number, -100.58);
        assert.strictEqual(output[2].number, -1);
        assert.strictEqual(output[3].number, 3.14);
        done();
      });
  });
  it('parse works for integers', function(done) {
    var schema = fs.readFileSync("test/data/types-test/schema.json", "utf8")
    var jsonContent = JSON.parse(schema)
    var dp = new spec.DataPackage(jsonContent);
    var stream = spec.csvToStream(dp.resources[0].rawStream(), dp.resources[0].data.schema);
    spec.objectStreamToArray(stream).
      then(function(output) {
        assert.strictEqual(typeof output[0].integer, 'number');
        assert.strictEqual(output[0].integer, 0);
        assert.strictEqual(output[1].integer, 5);
        assert.strictEqual(output[2].integer, 1000000);
        assert.strictEqual(output[3].integer, -1000);
        done();
      });
  });
  it('parse works for booleans', function(done) {
    var schema = fs.readFileSync("test/data/types-test/schema.json", "utf8")
    var jsonContent = JSON.parse(schema)
    var dp = new spec.DataPackage(jsonContent);
    var stream = spec.csvToStream(dp.resources[0].rawStream(), dp.resources[0].data.schema);
    spec.objectStreamToArray(stream).
      then(function(output) {
        assert.strictEqual(typeof output[0].boolean, 'boolean');
        assert.strictEqual(output[0].boolean, true);
        assert.strictEqual(output[1].boolean, false);
        assert.strictEqual(output[2].boolean, false);
        assert.strictEqual(output[3].boolean, false);
        done();
      });
  });
  it('parse works for dates', function(done) {
    var schema = fs.readFileSync("test/data/types-test/schema.json", "utf8")
    var jsonContent = JSON.parse(schema)
    var dp = new spec.DataPackage(jsonContent);
    var stream = spec.csvToStream(dp.resources[0].rawStream(), dp.resources[0].data.schema);
    spec.objectStreamToArray(stream).
      then(function(output) {
        assert.strictEqual(typeof output[0].date, 'number');
        assert.strictEqual(output[0].date, 1463788800000);
        assert.strictEqual(output[1].date, 1462060800000);
        assert.strictEqual(output[2].date, 1463827423000);
        assert.strictEqual(output[3].date, 1463947200000);
        done();
      });
  });
  it('works with delimiter', function(done) {
    var content = fs.createReadStream('test/data/csv-dialects/data-del.csv')
    var dp = new spec.DataPackage(dp1);
    var stream = spec.csvToStream(content, dp.resources[0].data.schema, {delimiter: '\t'});
    spec.objectStreamToArray(stream).
      then(function(output) {
        assert.equal(output.length, 3);
        assert.strictEqual(output[2].info, "test,for,delimiter");
        done();
      });
  });
  it('works with quoteChar', function(done) {
    var content = fs.createReadStream('test/data/csv-dialects/data-qc.csv')
    var dp = new spec.DataPackage(dp1);
    var stream = spec.csvToStream(content, dp.resources[0].data.schema, {quoteChar: "'"});
    spec.objectStreamToArray(stream).
      then(function(output) {
        assert.equal(output.length, 3);
        assert.strictEqual(output[1].info,'U,S,A');
        done();
      });
  });
  it('works with doubleQuote', function(done) {
    var content = fs.createReadStream('test/data/csv-dialects/data-dq.csv')
    var dp = new spec.DataPackage(dp1);
    var stream = spec.csvToStream(content, dp.resources[0].data.schema, {doubleQuote: '"'});
    spec.objectStreamToArray(stream).
      then(function(output) {
        assert.equal(output.length, 3);
        assert.strictEqual(output[2].info, 'no "info for this"');
        done();
      });
  });
  it('works with all csv dialects', function(done) {
    var content = fs.createReadStream('test/data/csv-dialects/data-all.csv')
    var dp = new spec.DataPackage(dp1);
    var stream = spec.csvToStream(content, dp.resources[0].data.schema, {delimiter: '\t', quoteChar: "'", doubleQuote: '"'});
    spec.objectStreamToArray(stream).
      then(function(output) {
        assert.equal(output.length, 3);
        assert.strictEqual(output[0].size, 100);
        assert.strictEqual(output[1].info, 'U	S	A');
        assert.strictEqual(output[2].info, '"no info"');
        done();
      });
  });
});

