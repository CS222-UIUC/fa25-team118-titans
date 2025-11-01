/*
  __mocks__/pg.js
  Manual Jest mock for 'pg' (node-postgres).
  Exports: { Pool }
  - Pool: supports pool.query(text, params), pool.connect() -> client with query/release
  - Tests can call pool.setQueryResponses([{ match, result }]) to provide per-SQL results.
  - pool.queries collects executed queries for assertions.
*/

class FakeClient {
  constructor(pool) {
    this.pool = pool;
    this.released = false;
  }

  async query(text, params) {
    // record query
    if (this.pool) this.pool.queries.push({ text, params });

    const responses = Array.isArray(this.pool && this.pool.queryResponses) ? this.pool.queryResponses : [];

    for (const r of responses) {
      const matchesRegex = r.match instanceof RegExp && r.match.test(text);
      const matchesString = typeof r.match === 'string' && text.includes(r.match);
      if (matchesRegex || matchesString) {
        if (typeof r.result === 'function') return r.result(text, params);
        return r.result;
      }
    }

    // default empty result
    return { rows: [], rowCount: 0 };
  }

  release() {
    this.released = true;
  }
}

class Pool {
  constructor(options = {}) {
    this.options = options;
    this.queryResponses = options.queryResponses || [];
    this.queries = [];
    this._ended = false;
  }

  async query(text, params) {
    const client = new FakeClient(this);
    return client.query(text, params);
  }

  async connect() {
    return new FakeClient(this);
  }

  setQueryResponses(responses) {
    this.queryResponses = responses;
  }

  clearQueryResponses() {
    this.queryResponses = [];
  }

  async end() {
    this._ended = true;
    return Promise.resolve();
  }
}

module.exports = { Pool };
