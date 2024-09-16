import { default as tape } from 'tape';
import { tableFromIPC as arrowJSTableFromIPC } from 'apache-arrow';
import {
  columnFromArray, float32, tableFromArrays, tableFromColumns,
  tableFromIPC, tableToIPC
} from '@uwdata/flechette';
import arrow from '../src/index.js';

tape('Arrow reader should read Arrow IPC data', test => {
  const nrows = 20;
  const bytes = generateIPCData(nrows);
  const table = tableFromIPC(bytes); // Flechette Table
  const data = arrow(bytes); // Vega-friendly objects for each row

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
  test.ok(Object.hasOwn(datum, g));
  test.equal(datum[g], 'foo');

  test.end();
});

tape('Arrow reader should accept pre-parsed Flechette Table', test => {
  const nrows = 20;
  const bytes = generateIPCData(nrows);
  const table = tableFromIPC(bytes); // Flechette Table
  const data = arrow(table); // Vega-friendly objects for each row

  // test that table and proxy objects match
  testProxyMatch(test, table, data);

  test.end();
});

tape('Arrow reader should accept pre-parsed Apache Arrow Table', test => {
  const nrows = 20;
  const bytes = generateIPCData(nrows);
  const table = arrowJSTableFromIPC(bytes); // Arrow JS Table
  const data = arrow(table); // Vega-friendly objects for each row

  // test that table and proxy objects match
  testProxyMatch(test, table, data);

  test.end();
});

tape('Arrow reader should handle non-unique column names', test => {
  const nrows = 10;
  const bytes = generateDuplicateIPCData(nrows);
  const table = tableFromIPC(bytes); // Arrow API Table

  const data = arrow(bytes); // Vega-friendly objects for each row

  test.equal(data.length, table.numRows);

  // collect fields from first data object
  const fields = [];
  for (const f in data[0]) fields.push(f);

  // test that duplicated name is suppressed in row proxy
  test.equal(fields.length, 1);
  test.equal(table.schema.fields.map(_ => _.name).length, 2);

  // test that row proxy field names privilege lower index column
  test.deepEquals(
    Array.from(data, v => v[fields[0]]),
    Array.from(table.getChildAt(0))
  );

  test.end();
});

function testProxyMatch(test, table, data) {
  const nrows = table.numRows;
  const fields = [];

  test.equal(data.length, nrows);

  // collect fields from first data object
  for (const f in data[0]) fields.push(f);

  // test that fields match table schema
  test.deepEqual(
    fields,
    table.schema.fields.map(_ => _.name)
  );

  // test that object properties match table data
  for (const f of fields) {
    test.deepEqual(
      Array.from(data, v => v[f]),
      Array.from(table.getChild(f))
    );
  }
}

function generateIPCData(nrows) {
  const precipitation = Array.from(
    {length: nrows},
    () => Number((Math.random() * 20).toFixed(1))
  );

  const date = Array.from(
    {length: nrows},
    (_, i) => Date.now() - 1000 * 60 * 60 * 24 * i
  );

  return tableToIPC(
    tableFromArrays({ precipitation, date })
  );
}

function generateDuplicateIPCData(nrows) {
  const precipitation = () => Array.from(
    {length: nrows},
    () => Number((Math.random() * 20).toFixed(1))
  );

  const table = tableFromColumns([
    ['precipitation', columnFromArray(precipitation(), float32())],
    ['precipitation', columnFromArray(precipitation(), float32())]
  ]);

  return tableToIPC(table);
}
