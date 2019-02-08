import {Table} from 'apache-arrow';

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
        ctr = function(index) { this.__rowIndex__ = index; },
        proto = ctr.prototype;

  Object.defineProperty(proto, '__rowIndex__', {
    value: -1,
    writable: true
  });

  fields.forEach(function(name) {
    const column = table.getColumn(name);

    Object.defineProperty(proto, name, {
      get: function() {
        return column.get(this.__rowIndex__);
      },
      set: function() {
        throw Error('Can not overwrite Arrow data field values.');
      },
      enumerable: true
    });
  });

  return i => new ctr(i);
}
