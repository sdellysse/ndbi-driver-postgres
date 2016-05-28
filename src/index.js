"use strict";

const node_postgres = require("pg");
const uuid = require("node-uuid");

const Client = (
    node_postgres.native
    ? node_postgres.native.Client
    : node_postgres.Client
);

const PostgresDriver = function (dsn, username, password, options) {
    this.preparedStatementPrefix = options.preparedStatementPrefix || uuid.v4();

    const connectionInfo = {};
    for (const item of dsn.split(";")) {
        const key = item.split("=")[0];
        const value = item.split("=").slice(1).join("=");

        connectionInfo[key] = value;
    }

    if (username !== null) {
        connectionInfo.username = username;
    }
    if (password !== null) {
        connectionInfo.password = password;
    }

    Object.assign(connectionInfo, options);

    this.client = new Client(connectionInfo);
};

Object.assign(PostgresDriver, {
    errors: {
    },
});

Object.assign(PostgresDriver.prototype, {
    connect: function (connectionInfo) {
        return new Promise((resolve, reject) => {
            client.connect(error => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    },

    disconnect: function () {
        return new Promise((resolve, reject) => {
            client.once("end", (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
            client.end();
        });
    },

    prepare: function (sql, options) {
        return new Promise((resolve, reject) => {
            const name = options.name || `${ this.preparedStatementPrefix }.${ this.counter++ }`;

            return new Statement(name, sql, options);
        });
    },
});

module.exports = PostgresDriver;
