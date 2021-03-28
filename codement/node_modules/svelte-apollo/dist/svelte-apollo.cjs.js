'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var svelte = require('svelte');
var core = require('@apollo/client/core');
var store = require('svelte/store');

var CLIENT = typeof Symbol !== "undefined" ? Symbol("client") : "@@client";
function getClient() {
    var client = svelte.getContext(CLIENT);
    if (!client) {
        throw new Error("ApolloClient has not been set yet, use setClient(new ApolloClient({ ... })) to define it");
    }
    return client;
}
function setClient(client) {
    svelte.setContext(CLIENT, client);
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function mutation(mutation) {
    var client = getClient();
    return function (options) {
        return client.mutate(__assign({ mutation: mutation }, options));
    };
}

function observableToReadable(observable, initialValue) {
    if (initialValue === void 0) { initialValue = {
        loading: true,
        data: undefined,
        error: undefined,
    }; }
    var store$1 = store.readable(initialValue, function (set) {
        var skipDuplicate = (initialValue === null || initialValue === void 0 ? void 0 : initialValue.data) !== undefined;
        var skipped = false;
        var subscription = observable.subscribe(function (result) {
            if (skipDuplicate && !skipped) {
                skipped = true;
                return;
            }
            if (result.errors) {
                var error = new core.ApolloError({ graphQLErrors: result.errors });
                set({ loading: false, data: undefined, error: error });
            }
            else {
                set({ loading: false, data: result.data, error: undefined });
            }
        }, function (error) { return set({ loading: false, data: undefined, error: error }); });
        return function () { return subscription.unsubscribe(); };
    });
    return store$1;
}
var extensions = [
    "fetchMore",
    "getCurrentResult",
    "getLastError",
    "getLastResult",
    "isDifferentFromLastResult",
    "refetch",
    "resetLastResults",
    "resetQueryStoreErrors",
    "result",
    "setOptions",
    "setVariables",
    "startPolling",
    "stopPolling",
    "subscribeToMore",
    "updateQuery",
];
function observableQueryToReadable(query, initialValue) {
    var store = observableToReadable(query, initialValue);
    for (var _i = 0, extensions_1 = extensions; _i < extensions_1.length; _i++) {
        var extension = extensions_1[_i];
        store[extension] = query[extension].bind(query);
    }
    return store;
}

var restoring = typeof WeakSet !== "undefined" ? new WeakSet() : new Set();
function restore(query, options) {
    var client = getClient();
    restoring.add(client);
    afterHydrate(function () { return restoring.delete(client); });
    client.writeQuery(__assign({ query: query }, options));
}
function afterHydrate(callback) {
    // Attempt to wait for onMount (hydration of current component is complete),
    // but if that fails (e.g. outside of component initialization)
    // wait for next event loop for hydrate to complete
    try {
        svelte.onMount(callback);
    }
    catch (_error) {
        setTimeout(callback, 1);
    }
}

function query(query, options) {
    if (options === void 0) { options = {}; }
    var client = getClient();
    var queryOptions = __assign(__assign({}, options), { query: query });
    // If client is restoring (e.g. from SSR), attempt synchronous readQuery first
    var initialValue;
    if (restoring.has(client)) {
        try {
            // undefined = skip initial value (not in cache)
            initialValue = client.readQuery(queryOptions) || undefined;
        }
        catch (err) {
            // Ignore preload errors
        }
    }
    var observable = client.watchQuery(queryOptions);
    var store = observableQueryToReadable(observable, initialValue !== undefined
        ? {
            data: initialValue,
        }
        : undefined);
    return store;
}

function subscribe(query, options) {
    if (options === void 0) { options = {}; }
    var client = getClient();
    var observable = client.subscribe(__assign({ query: query }, options));
    return observableToReadable(observable);
}

exports.getClient = getClient;
exports.mutation = mutation;
exports.query = query;
exports.restore = restore;
exports.setClient = setClient;
exports.subscribe = subscribe;
//# sourceMappingURL=svelte-apollo.cjs.js.map
