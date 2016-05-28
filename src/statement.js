"use strict";

const Statement = function (client, name, sql, options) {
    this.client = client;
    this.name = name;
    this.sql = sql;
    this.options = options;

    this.reset();
};

Object.assign(Statement, {
});

Object.assign(Statement.prototype, {
    reset: function () {
        if (this.emitter) {
            this.emitter.removeAllListeners();
            this.emitter = null
        }

        this.acc = [];
        this.lastResult = null;
        this.error = null;
        this.receiving = false;
    },

    execute: function (params) {
        return new Promise((resolve, reject) => {
            if (params == null) {
                params = [];
            }

            this.reset();

            this.emitter = this.client.query({
                name: this.name,
                text: this.sql,
                values: params,
            });

            this.emitter.on("row", (row, result) => {
                this.rowAcc.push(row);
                this.lastResult = result;
            });
            this.emitter.on("end", (result) => {
                this.lastResult = result;
                this.receiving = false;
            });
            this.emitter.on("error", (error) => {
                this.error = error;
                this.receiving = false;
            });

            resolve();
        });
    },

    fetchRow: function () {
        return new Promise((resolve, reject) => {
            if (this.error) {
                reject(error);
                return;
            }

            if (this.receiving) {
                if (this.rowAcc.length > 0) {
                    resolve(this.rowAcc.shift());
                } else {
                    setImmediate(() => this.fetchRow().then(resolve, reject));
                }
            } else {
                resolve();
            }
        });
    },

    fetchAll: function () {
        return new Promise((resolve, reject) => {
            if (this.error) {
                reject(error);
            }

            if (this.receiving) {
                setImmediate(() => this.fetchAll().then(resolve, reject));
            } else {
                resolve(this.rowAcc);
            }
        });
    },

    getRowCount: function () {
        return new Promise((resolve, reject) => {
            if (this.error) {
                reject(error);
            }

            if (this.lastResult) {
                resolve(this.lastResult.rowCount);
            } else {
                if (this.receiving) {
                    setImmediate(() => this.getRowCount().then(resolve, reject));
                } else {
                    resolve();
                }
            }
        });
    },
});

module.exports = Statement;
