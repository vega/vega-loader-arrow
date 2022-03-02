const tape = require('tape');
const {Table, tableFromIPC, tableFromArrays, tableToIPC, vectorFromArray, Schema, Field, Float32} = require('apache-arrow');
const arrow = require('../');

function testProxyMatch(test, table, data) {
  const datum = data[0];
  const nrows = table.numRows;
  const fields = [];

  test.equal(data.length, nrows);

  // collect fields from first data object
  for (let f in datum) fields.push(f);

  // test that fields match table schema
  test.deepEqual(
    fields,
    table.schema.fields.map(_ => _.name)
  );

  // test that object properties match table data
  for (let row=0; row<nrows; ++row) {
    const d = data[row];
    fields.forEach(f => test.deepEqual(d[f], table.getChild(f).get(row)));
  }
}

tape('Arrow reader should read Apache Arrow data', function(test) {
  const nrows = 20;
  const blob = generateArrowData(nrows);
  const table = tableFromIPC(blob); // Arrow API Table
  const data = arrow(blob); // Vega-friendly objects for each row

  // test that table and proxy objects match
  testProxyMatch(test, table, data);

  // test reads and writes
  const datum = data[0];

  const f = table.schema.fields[0].name;
  const g = `${f}_new`;

  // writes to existing columns should throw an error
  test.throws(() => { datum[f] = 0; });

  // writes to derived columns should work as usual
  test.doesNotThrow(() => { datum[g] = 'foo'; });
  test.ok(datum.hasOwnProperty(g));
  test.equal(datum[g], 'foo');

  test.end();
});

tape('Arrow reader should accept pre-parsed Table', function(test) {
  const nrows = 20;
  const blob = generateArrowData(nrows);
  const table = tableFromIPC(blob); // Arrow API Table
  const data = arrow(table); // Vega-friendly objects for each row

  // test that table and proxy objects match
  testProxyMatch(test, table, data);

  test.end();
});

tape('Arrow reader should handle non-unique column names', function(test) {
  const nrows = 10;
  const blob = generateDuplicateArrowData(nrows);
  const table = tableFromIPC(blob); // Arrow API Table

  const data = arrow(blob); // Vega-friendly objects for each row
  const datum = data[0];

  test.equal(data.length, table.numRows);

  // collect fields from first data object
  const fields = [];
  for (let f in datum) fields.push(f);

  // test that duplicated name is suppressed in row proxy
  test.equal(fields.length, 1);
  test.equal(table.schema.fields.map(_ => _.name).length, 2);

  // test that row proxy field names privilege lower index column
  test.equal(datum.precipitation, table.getChildAt(0).get(0));

  test.end();
});

function generateArrowData(nrows) {
  const precipitationData = Array.from(
    {length: nrows},
    () => Number((Math.random() * 20).toFixed(1))
  );

  const dateData = Array.from(
    {length: nrows},
    (_, i) => Date.now() - 1000 * 60 * 60 * 24 * i
  );

  return tableToIPC(tableFromArrays({
    precipitation: precipitationData,
    date: dateData
  }));
}

function generateDuplicateArrowData(nrows) {
  const fields = [
    new Field('precipitation', new Float32(), true),
    new Field('precipitation', new Float32(), true)
  ];

  const precipitationData0 = Array.from(
    {length: nrows},
    () => Number((Math.random() * 20).toFixed(1))
  );

  const precipitationData1 = Array.from(
    {length: nrows},
    () => Number((Math.random() * 20).toFixed(1))
  );

  let table = new Table(new Schema(fields));

  table = table.setChildAt(0, vectorFromArray(precipitationData0, new Float32()));
  table = table.setChildAt(1, vectorFromArray(precipitationData1, new Float32()));

  return tableToIPC(table);
}
