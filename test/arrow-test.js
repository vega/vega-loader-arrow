const tape = require('tape'),
      {Table} = require('apache-arrow'),
      {arrow} = require('../');

tape('Arrow reader should read Apache Arrow data', function(test) {
  const nrows = 100,
        blob = generateArrowData(nrows),
        table = Table.from([blob]), // Arrow API Table
        data = arrow(blob); // Vega-friendly objects for each row

  test.equal(data.length, table.length);

  // collect fields from first data object
  const fields = [];
  for (let f in data[0]) {
    if (f !== '__rowIndex__') fields.push(f);
  }

  // test that fields match table schema
  test.deepEqual(
    fields,
    table.schema.fields.map(_ => _.name)
  );

  // test that object properties match table data
  for (let i=0; i<nrows; ++i) {
    test.equal(data[i].__rowIndex__, i);
    fields.forEach(f => test.deepEqual(data[i][f], table.getColumn(f).get(i)));
  }

  // test reads and writes
  const d = data[0],
        f = fields[0],
        g = f + '_new';

  // writes to existing columns should throw an error
  test.throws(() => { d[f] = 0; });

  // writes to derived columns should work as usual
  test.doesNotThrow(() => { d[g] = 'foo'; });
  test.ok(d.hasOwnProperty(g));
  test.equal(d[g], 'foo');

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
