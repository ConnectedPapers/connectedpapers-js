"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __knownSymbol = (name, symbol) => {
  if (symbol = Symbol[name])
    return symbol;
  throw Error("Symbol." + name + " is not defined");
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var __await = function(promise, isYieldStar) {
  this[0] = promise;
  this[1] = isYieldStar;
};
var __asyncGenerator = (__this, __arguments, generator) => {
  var resume = (k, v, yes, no) => {
    try {
      var x = generator[k](v), isAwait = (v = x.value) instanceof __await, done = x.done;
      Promise.resolve(isAwait ? v[0] : v).then((y) => isAwait ? resume(k === "return" ? k : "next", v[1] ? { done: y.done, value: y.value } : y, yes, no) : yes({ value: y, done })).catch((e) => resume("throw", e, yes, no));
    } catch (e) {
      no(e);
    }
  };
  var method = (k) => it[k] = (x) => new Promise((yes, no) => resume(k, x, yes, no));
  var it = {};
  return generator = generator.apply(__this, __arguments), it[Symbol.asyncIterator] = () => it, method("next"), method("throw"), method("return"), it;
};
var __forAwait = (obj, it, method) => (it = obj[__knownSymbol("asyncIterator")]) ? it.call(obj) : (obj = obj[__knownSymbol("iterator")](), it = {}, method = (key, fn) => (fn = obj[key]) && (it[key] = (arg) => new Promise((yes, no, done) => (arg = fn.call(obj, arg), done = arg.done, Promise.resolve(arg.value).then((value) => yes({ value, done }), no)))), method("next"), method("return"), it);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  ConnectedPapersClient: () => ConnectedPapersClient
});
module.exports = __toCommonJS(src_exports);

// src/connected_papers_client.ts
var import_axios = __toESM(require("axios"));

// src/consts.ts
var testToken = "TEST_TOKEN";
var defaultServerAddress = "https://api.connectedpapers.com";
var _a;
var accessToken = (_a = process.env.CONNECTED_PAPERS_API_KEY) != null ? _a : testToken;
var _a2;
var connectedPapersRestApi = (_a2 = process.env.CONNECTED_PAPERS_REST_API) != null ? _a2 : defaultServerAddress;

// src/connected_papers_client.ts
var GraphResponseStatuses = /* @__PURE__ */ ((GraphResponseStatuses2) => {
  GraphResponseStatuses2["BAD_ID"] = "BAD_ID";
  GraphResponseStatuses2["ERROR"] = "ERROR";
  GraphResponseStatuses2["NOT_IN_DB"] = "NOT_IN_DB";
  GraphResponseStatuses2["OLD_GRAPH"] = "OLD_GRAPH";
  GraphResponseStatuses2["FRESH_GRAPH"] = "FRESH_GRAPH";
  GraphResponseStatuses2["IN_PROGRESS"] = "IN_PROGRESS";
  GraphResponseStatuses2["QUEUED"] = "QUEUED";
  GraphResponseStatuses2["BAD_TOKEN"] = "BAD_TOKEN";
  GraphResponseStatuses2["BAD_REQUEST"] = "BAD_REQUEST";
  GraphResponseStatuses2["OUT_OF_REQUESTS"] = "OUT_OF_REQUESTS";
  return GraphResponseStatuses2;
})(GraphResponseStatuses || {});
var sleepTimeBetweenChecks = 1e3;
var sleepTimeAfterError = 5e3;
var endResponseStatuses = [
  "BAD_ID" /* BAD_ID */,
  "ERROR" /* ERROR */,
  "NOT_IN_DB" /* NOT_IN_DB */,
  "FRESH_GRAPH" /* FRESH_GRAPH */,
  "BAD_TOKEN" /* BAD_TOKEN */,
  "BAD_REQUEST" /* BAD_REQUEST */,
  "OUT_OF_REQUESTS" /* OUT_OF_REQUESTS */
];
var ConnectedPapersClient = class {
  constructor(args = {}) {
    var _a3, _b;
    this.accessToken = (_a3 = args.access_token) != null ? _a3 : accessToken;
    this.serverAddr = (_b = args.server_addr) != null ? _b : connectedPapersRestApi;
  }
  getGraphAsyncIterator(args) {
    return __asyncGenerator(this, null, function* () {
      var _a3;
      let retryCounter = 3;
      while (retryCounter > 0) {
        try {
          let newestGraph;
          while (true) {
            const resp = yield new __await(import_axios.default.get(
              `${this.serverAddr}/papers-api/graph/${Number((_a3 = args.fresh_only) != null ? _a3 : false)}/${args.paper_id}`,
              { headers: { "X-Api-Key": this.accessToken } }
            ));
            if (resp.status !== 200) {
              throw new Error(`Bad response: ${resp.status}`);
            }
            const { data } = resp;
            if (!data) {
              throw new Error(`Bad response: ${resp.status}`);
            }
            if (!Object.values(GraphResponseStatuses).includes(data.status)) {
              data.status = "ERROR" /* ERROR */;
            }
            args.fresh_only = true;
            const response = data;
            if (response.graph_json) {
              newestGraph = response.graph_json;
            }
            if (endResponseStatuses.includes(response.status) || !args.loop_until_fresh) {
              yield response;
              return;
            }
            response.graph_json = newestGraph;
            yield response;
            yield new __await(new Promise((resolve) => setTimeout(resolve, sleepTimeBetweenChecks)));
          }
        } catch (e) {
          retryCounter -= 1;
          if (retryCounter === 0) {
            throw e;
          }
          yield new __await(new Promise((resolve) => setTimeout(resolve, sleepTimeAfterError)));
        }
      }
    });
  }
  getGraph(args) {
    return __async(this, null, function* () {
      const generator = this.getGraphAsyncIterator(args);
      let result = {
        status: "ERROR" /* ERROR */,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        graph_json: void 0,
        progress: void 0
      };
      try {
        for (var iter = __forAwait(generator), more, temp, error; more = !(temp = yield iter.next()).done; more = false) {
          const response = temp.value;
          result = response;
        }
      } catch (temp) {
        error = [temp];
      } finally {
        try {
          more && (temp = iter.return) && (yield temp.call(iter));
        } finally {
          if (error)
            throw error[0];
        }
      }
      return result;
    });
  }
  getRemainingUsages() {
    return __async(this, null, function* () {
      try {
        const response = yield import_axios.default.get(`${this.serverAddr}/papers-api/remaining-usages`, {
          headers: { "X-Api-Key": this.accessToken }
        });
        if (response.status !== 200) {
          throw new Error(`Bad response: ${response.status}`);
        }
        switch (typeof response.data.remaining_uses) {
          case "number":
            return response.data.remaining_uses;
          default:
            throw new Error(`Bad response: ${JSON.stringify(response)}`);
        }
      } catch (error) {
        console.error(error);
        throw error;
      }
    });
  }
  getFreeAccessPapers() {
    return __async(this, null, function* () {
      try {
        const response = yield import_axios.default.get(`${this.serverAddr}/papers-api/free-access-papers`, {
          headers: { "X-Api-Key": this.accessToken }
        });
        if (response.status !== 200) {
          throw new Error(`Bad response: ${response.status}`);
        }
        return response.data.papers;
      } catch (error) {
        console.error(error);
        throw error;
      }
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ConnectedPapersClient
});
//# sourceMappingURL=index.js.map