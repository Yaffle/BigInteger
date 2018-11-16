"use strict";

var global = this;

// for crypto.js
function BenchmarkSuite() {
}
global.BenchmarkSuite = BenchmarkSuite

var I = undefined;
global.url = undefined;
global.benchmarkSuite = undefined;
global.testSuite = undefined;
var base = this.parent !== undefined ? this.parent : {
  postMessage: function (message) {
    global.postMessage(message);
  }
};

var loadScripts = function (src, callback) {
  if (src === "") {
    setTimeout(callback, 0);
  } else {
    if (global.importScripts !== undefined) {
      global.importScripts(src);
      setTimeout(callback, 0);
    } else {
      var script = document.createElement("script");
      script.src = src;
      script.onload = callback;
      script.onreadystatechange = function() { // IE
        if (script.readyState === "complete" || script.readyState === "loaded") {
          script.onload = undefined;
          callback();
        }
      };
      document.documentElement.appendChild(script);
    }
  }
};

var transform = function (f) {
  return eval("(" + f.toString().replace(/I\.([a-zA-Z]+)\(([^,\)]+)(?:,([^,\)]+))?(?:,([^,\)]+))?\)/g, function (p, o, a, b, c) {
    if (I[o] == undefined || I[o] === "") {
      return p;
    }
    return I[o].replace(/([a-zA-Z]+)/g, function (t) {
      return t === "a" ? a.trim() : (t === "b" ? b.trim() : (t === "c" ? c.trim() : t));
    });
  }) + ")");
};

var invervalId = setInterval(function () {
  console.log("!");
}, 10000);

self.onmessage = function (event) {
  if (event.data === "start:benchmarks" || event.data === "start:tests") {
    var type = event.data;
    var src = decodeURIComponent(/src\=([^&]*)/.exec(location.search)[1]);
    loadScripts("benchmark.js", function () {
      Benchmark.options.minTime = 1 / 128;
      Benchmark.options.maxTime = 1 / 4;
      Benchmark.options.minSamples = 7;

      benchmarkSuite = new Benchmark.Suite();
      benchmarkSuite.on("cycle", function (event) {
        base.postMessage(JSON.stringify({
          message: event.target.toString(),
          url: url,
          name: event.target.name,
          result: (1 / event.target.times.period)
        }), "*");
      });
      var complete = false;
      var finish = function () {
        if (!complete) {
          complete = true;
          base.postMessage(JSON.stringify({
            message: "",
            url: url,
            name: "complete",
            result: 0
          }), "*");
          clearInterval(invervalId);
        }
      };
      benchmarkSuite.on("error", function (event) {
        finish();
      });
      benchmarkSuite.on("complete", function (event) {
        finish();
      });
      testSuite = {
        callbacks: [],
        add: function (title, callback) {
          this.callbacks.push({
            title: title,
            callback: callback
          });
        },
        run: function (options) {
          for (var i = 0; i < this.callbacks.length; i += 1) {
            var test = this.callbacks[i];
            var data = "";
            try {
              test.callback(I);
            } catch (e) {
              data = e.toString();
              if (e.message === "-") {
                data = "N/A";
              }
            }
            base.postMessage(JSON.stringify({
              message: test.title,
              url: url,
              name: "test",
              result: data
            }), "*");
          }
        }
      };
      loadScripts("libs.js", function () {
        var special = {
          "data:text/plain,number": "",
          "data:text/plain,bigint": ""
        };
        var notTestable = {
          "data:text/plain,number": true
        };
        loadScripts(src in special ? special[src] : src, function () {
          var lib = undefined;
          for (var i = 0; i < libs.length; i += 1) {
            if (libs[i].src === src) {
              lib = libs[i];
            }
          }
          I = lib;
          url = lib.url;//!
          loadScripts("generated-tests.js", function () {
          loadScripts("tests.js", function () {
            if (I.setup != undefined) {
              I.setup();
            }
            var f = transform(wrapper.toString());
            f();
            setTimeout(function () {
              if (type === "start:tests") {
                if (!(src in notTestable)) {
                  testSuite.run();
                }
                finish();
              }
              if (type === "start:benchmarks") {
                benchmarkSuite.run({
                  async: true
                });
              }
            }, 64);
          });
          });
        });
      });
    });
  }
};
