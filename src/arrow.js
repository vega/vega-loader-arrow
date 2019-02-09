import {Table} from 'apache-arrow';

const RowIndex = Symbol('rowIndex');

export default function arrow(data) {
  const table = Table.from(Array.isArray(data) ? data : [data]),
        proxy = rowProxy(table),
        rows = Array(table.length);

  table.scan(i => rows[i] = proxy(i));

  return rows;
}

arrow.responseType = 'arrayBuffer';

function rowProxy(table) {
  const fields = table.schema.fields.map(d => d.name),
        Row = function(index) { this[RowIndex] = index; },
        proto = Row.prototype;

  fields.forEach(name => {
    const column = table.getColumn(name);

    // skip columns with duplicate names
    if (proto.hasOwnProperty(name)) return;

    Object.defineProperty(proto, name, {
      get: function() {
        return column.get(this[RowIndex]);
      },
      set: function() {
        throw Error('Can not overwrite Arrow data field values.');
      },
      enumerable: true
    });
  });

  return i => new Row(i);
}
