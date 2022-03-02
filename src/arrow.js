import {Table, tableFromIPC} from 'apache-arrow';

const RowIndex = Symbol('rowIndex');

export default function arrow(data) {
  const table = arrowTable(data);
  const proxy = rowProxy(table);
  const rows = Array(table.numRows);

  for (let i=0, n=rows.length; i<n; ++i) {
    rows[i] = proxy(i);
  }

  return rows;
}

arrow.responseType = 'arrayBuffer';

function arrowTable(data) {
  if (data instanceof Table) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    data = new Uint8Array(data);
  }
  return tableFromIPC(data);
}

function rowProxy(table) {
  const fields = table.schema.fields.map(d => d.name);
  const proto = {};

  fields.forEach((name, index) => {
    const column = table.getChildAt(index);

    // skip columns with duplicate names
    if (proto.hasOwnProperty(name)) return;

    Object.defineProperty(proto, name, {
      get: function() {
        return column.get(this[RowIndex]);
      },
      set: function() {
        throw Error('Arrow field values can not be overwritten.');
      },
      enumerable: true
    });
  });

  return i => {
    const r = Object.create(proto);
    r[RowIndex] = i;
    return r;
  };
}
