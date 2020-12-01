const tape = require('tape'),
      {Table} = require('apache-arrow'),
      arrow = require('../');

function testProxyMatch(test, table, data) {
  const datum = data[0],
        nrows = table.length,
        fields = [];

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
    fields.forEach(f => test.deepEqual(d[f], table.getColumn(f).get(row)));
  }
}

tape('Arrow reader should read Apache Arrow data', function(test) {
  const nrows = 20,
        blob = generateArrowData(nrows),
        table = Table.from([blob]), // Arrow API Table
        data = arrow(blob); // Vega-friendly objects for each row

  // test that table and proxy objects match
  testProxyMatch(test, table, data);

  // test reads and writes
  const datum = data[0],
        f = table.schema.fields[0].name,
        g = `${f}_new`;

  // writes to existing columns should throw an error
  test.throws(() => { datum[f] = 0; });

  // writes to derived columns should work as usual
  test.doesNotThrow(() => { datum[g] = 'foo'; });
  test.ok(datum.hasOwnProperty(g));
  test.equal(datum[g], 'foo');

  test.end();
});

tape('Arrow reader should accept pre-parsed Table', function(test) {
  const nrows = 20,
        blob = generateArrowData(nrows),
        table = Table.from([blob]), // Arrow API Table
        data = arrow(table); // Vega-friendly objects for each row

  // test that table and proxy objects match
  testProxyMatch(test, table, data);

  test.end();
});

tape('Arrow reader should handle non-unique column names', function(test) {
  const nrows = 10,
        blob = generateDuplicateArrowData(nrows),
        table = Table.from([blob]), // Arrow API Table
        data = arrow(blob), // Vega-friendly objects for each row
        datum = data[0];

  test.equal(data.length, table.length);

  // collect fields from first data object
  const fields = [];
  for (let f in datum) fields.push(f);

  // test that duplicated name is suppressed in row proxy
  test.equal(fields.length, 1);
  test.equal(table.schema.fields.map(_ => _.name).length, 2);

  // test that row proxy field names privilege lower index column
  test.equal(datum.precipitation, table.getColumnAt(0).get(0));

  test.end();
});

function generateArrowData(nrows) {
  const fields = [
    {
      name: 'precipitation',
      type: { name: 'floatingpoint', precision: 'SINGLE'},
      nullable: false, children: []
    },
    {
      name: 'date',
      type: { name: 'date', unit: 'MILLISECOND' },
      nullable: false, children: []
    }
  ];

  const precipitationData = Array.from(
    {length: nrows},
    () => Number((Math.random() * 20).toFixed(1))
  );

  const dateData = Array.from(
    {length: nrows},
    (_, i) => Date.now() - 1000 * 60 * 60 * 24 * i
  );

  return Table.from({
    schema: { fields: fields },
    batches: [{
      count: nrows,
      columns: [
        {name: "precipitation", count: nrows, VALIDITY: [], DATA: precipitationData },
        {name: "date",          count: nrows, VALIDITY: [], DATA: dateData }
      ]
    }]
  }).serialize();
}

function generateDuplicateArrowData(nrows) {
  const fields = [
    {
      name: 'precipitation',
      type: { name: 'floatingpoint', precision: 'SINGLE'},
      nullable: false, children: []
    },
    {
      name: 'precipitation',
      type: { name: 'floatingpoint', precision: 'SINGLE'},
      nullable: false, children: []
    }
  ];

  const precipitationData0 = Array.from(
    {length: nrows},
    () => Number((Math.random() * 20).toFixed(1))
  );

  const precipitationData1 = Array.from(
    {length: nrows},
    () => Number((Math.random() * 20).toFixed(1))
  );

  return Table.from({
    schema: { fields: fields },
    batches: [{
      count: nrows,
      columns: [
        {name: "precipitation", count: nrows, VALIDITY: [], DATA: precipitationData0 },
        {name: "precipitation", count: nrows, VALIDITY: [], DATA: precipitationData1 }
      ]
    }]
  }).serialize();
}
