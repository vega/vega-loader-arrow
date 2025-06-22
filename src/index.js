import { tableFromIPC } from '@uwdata/flechette';

/**
 * Load a data set in Apache Arrow format for use in Vega.
 * @param {*} data Either an already parsed table (created by the
 *  `@uwdata/flechette` or `apache-arrow` libraries) or Arrow IPC
 *  binary data as an `ArrayBuffer`, `Uint8Array`, or `Uint8Array[]`.
 * @returns {Record<string,any>[]} An array of data objects representing
 *  rows of a data table.
 */
export default function arrow(data) {
  return (isArrowTable(data) ? data : decodeIPC(data)).toArray();
}

function isArrowTable(data) {
  return data?.schema && Array.isArray(data.schema.fields)
    && typeof data.toArray === 'function';
}

function decodeIPC(data, options = { useProxy: true }) {
  return tableFromIPC(data, options);
}

arrow.responseType = 'arrayBuffer';
