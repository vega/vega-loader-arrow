import {Table} from 'apache-arrow';

export default function(arrow) {
  const table = Table.from(Array.isArray(arrow) ? arrow : [arrow]),
        nrows = table.length,
        data = Array(nrows),
        row = rowObject(table);

  table.scan(i => data[i] = row(i));

  return data;
}

function rowObject(table) {
  const fields = table.schema.fields.map(d => d.name);

  const ctr = function(index) {
    this.__rowIndex__ = index;
  };

  const proto = ctr.prototype;

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

  return function(i) {
    return new ctr(i);
  }
}
