"use strict";

var filter = function (description) {
  var table = document.querySelector("table");
  var rows = table.querySelectorAll("tr");
  var row = undefined;
  var i = -1;
  while (++i < rows.length) {
    var a = rows[i].querySelector("td > a[href]");
    if (a != undefined && a.href === description.url) {
      row = rows[i];
    }
  }
  if (!row.querySelector("input[type=checkbox]").checked) {
    return false;
  }

  //if (description.url.indexOf("XXX") !== -1) {
  //  return false;
  //}
  return true;
};

var hardwareConcurrency = 1;//navigator.hardwareConcurrency != undefined ? navigator.hardwareConcurrency : 1;
var lastIndex = -1;
var running = 0;
var test = undefined;
var type = undefined;

self.onmessage = function (e) {
  e = e || window.event;

  var data = JSON.parse(e.data);
  if (data.name === "test") {
    if (data.result !== "") {
      var table = document.querySelector("table.tests");
      var rows = table.rows;
      var row = undefined;
      var testRow = undefined;
      var i = -1;
      i += 1;
      while (++i < rows.length) {
        var a = rows[i].cells[0];
        if (a.getAttribute("data.message") === data.message) {
          testRow = rows[i];
        }
      }
      if (testRow == undefined) {
        testRow = table.insertRow(-1);
        var c = testRow.insertCell(-1);
        c.setAttribute("data.message", data.message);
        c.innerHTML = data.message;
        for (var i = 1; i < table.rows[0].cells.length; i += 1) {
          testRow.insertCell(-1);
        }
      }
      var row = rows[0];
      var cellIndex = 0;
      while (cellIndex < row.cells.length && row.cells[cellIndex].getAttribute("data-url") !== data.url) {
        cellIndex += 1;
      }
      if (cellIndex === row.cells.length) {
        for (var i = 0; i < rows.length; i += 1) {
          rows[i].insertCell(cellIndex);
        }
        row.cells[cellIndex].setAttribute("data-url", data.url);
        row.cells[cellIndex].innerHTML = data.url;
      }
      testRow.cells[cellIndex].innerHTML = data.result === "" ? "OK" : data.result;
      if (data.result !== "") {
        if (testRow.classList != undefined) {
          testRow.classList.add("y");
        }
      }
    }
  } else if (data.name !== "complete") {
    /*
    var tables = document.querySelectorAll("table");
    var e = undefined;
    var i = -1;
    while (++i < tables.length) {
      if (tables[i].getAttribute("data-name") === data.name) {
        e = tables[i];
      }
    }
    if (e == undefined) {
      e = document.createElement("table");
      e.setAttribute("sortable", "sortable");
      e.setAttribute("data-name", data.name);
      e.style.marginTop = "0.25em";
      e.style.marginBottom = "0.25em";
      document.body.appendChild(e);
      var caption = document.createElement("caption");
      e.appendChild(caption)
      caption.innerHTML = data.name;
      caption.style.textAlign = "left";
      caption.style.fontWeight = "bold";
      var head = document.createElement("thead");
      e.appendChild(head)
      var row = head.insertRow(-1);
      var th0 = row.insertCell(0);
      th0.tabIndex = 0;
      th0.innerHTML = "URL";
      var th1 = row.insertCell(1);
      th1.tabIndex = 0;
      th1.innerHTML = "benchmark";
      var th2 = row.insertCell(2);
      th2.tabIndex = 0;
      th2.innerHTML = "ops/sec";
      th2.setAttribute("sorted", "reversed 1");
      var body = document.createElement("tbody");
      e.appendChild(body);
    }
    var x = e.tBodies[0].insertRow(-1);
    x.className = "result";
    var c0 = x.insertCell(0);
    c0.innerHTML = data.url === "number" ? data.url : "<a href=\"" + data.url + "\">" + data.url + "</a>";
    

    var match = /([\s\S]*?)\sx\s([^\(]*)([\s\S]*)/.exec(data.message);

    var c1 = x.insertCell(1);
    c1.innerHTML = data.name;
    var c2 = x.insertCell(2);
    c2.style.textAlign = "right";
    c2.innerHTML = match == undefined ? "-" : match[2];

    sortTable(e);
    */
    var table = document.querySelector("table");
    var rows = table.querySelectorAll("tr");
    var row = undefined;
    var i = -1;
    while (++i < rows.length) {
      var a = rows[i].querySelector("td > a[href]");
      if (a != undefined && a.href === data.url) {
        row = rows[i];
      }
    }
    if (row === undefined) {
      throw new Error(data.url);
    }
    var cellIndex = -1;
    var cells = table.querySelectorAll("thead tr > td");
    var j = -1;
    while (++j < cells.length) {
      if (cells[j].getAttribute("id") === data.name) {
        cellIndex = j;
      }
    }
    if (cellIndex === -1) {
      throw new Error(data.name);
    }
    var match = /([\s\S]*?)\sx\s([^\(]*)([\s\S]*)/.exec(data.message);

    row.cells[cellIndex].appendChild(document.createTextNode(match == undefined ? "-" : match[2]));

  } else {
    running -= 1;
    window.setTimeout(function () {
      test();
    }, 0);
  }
};

test = function () {
  var i = lastIndex;
  while (++i < libs.length) {
    if (running < hardwareConcurrency && filter(libs[i])) {
      running += 1;
      lastIndex = i;
      var src = libs[i].src;
      if (self.Worker !== undefined && location.protocol !== "file:") {
        var w = new self.Worker("iframe.js?src=" + encodeURIComponent(src));
        w.onmessage = function (event) {
          self.postMessage(event.data, "*");
        };
        w.onerror = function (src, e) {
          console.log(e, src);
        }.bind(undefined, src);
        w.postMessage("start:" + type);
      } else {
        var w = document.createElement("iframe");
        w.style.visibility = "hidden";
        w.style.width = "0px";
        w.style.height = "0px";
        document.body.appendChild(w);
        w.setAttribute("src", "iframe.html?src=" + encodeURIComponent(src));
        w.onload = function () {
          w.contentWindow.postMessage("start:" + type, "*");
        };
      }
    }
  }
};

window.setTimeout(function () {
  document.getElementById("table-container").innerHTML = generateTable();
  document.getElementById("info-table-container").innerHTML = generateInfoTable();
  
  
  var c = document.querySelector("input[type=checkbox]");
  c.onchange = function () {
    var value = c.checked;
    var elements = document.querySelectorAll("input[type=checkbox]");
    for (var i = 0; i < elements.length; i += 1) {
      elements[i].checked = value;
    }
  };
  var startTests = function () {
    var state = [];
    var elements = document.querySelectorAll("input[type=checkbox]");
    for (var i = 0; i < elements.length; i += 1) {
      state[i] = elements[i].checked;
    }
    var s = JSON.stringify(state);
    try {
      window.localStorage.setItem("state", s);
    } catch (error) {
      console.log(error);
    }
    lastIndex = -1;
    test();
  };
  document.querySelector("button.tests").onclick = function () {
    type = "tests";
    startTests();
  };
  document.querySelector("button.benchmarks").onclick = function () {
    type = "benchmarks";
    startTests();
  };
  window.addEventListener("message", function (e) {
    if (running > 0) {
      document.querySelector("span.working").removeAttribute("hidden");
    } else {
      document.querySelector("span.working").setAttribute("hidden", "hidden");
    }
  }, false);
  
  var s = null;
  try {
    s = window.localStorage.getItem("state");
  } catch (error) {
    console.log(error);
  }
  var state = JSON.parse(s || "[]");
  var elements = document.querySelectorAll("input[type=checkbox]");
  for (var i = 0; i < elements.length; i += 1) {
    elements[i].checked = i < state.length ? state[i] : false;
  }
  
}, 128);

// <table sortable>

var sortTable = function (table) {
  var cellIndex = -1;
  var cells = table.tHead.rows[0].cells;
  var k = -1;
  var reversed = false;
  while (++k < cells.length) {
    var s = cells[k].getAttribute("sorted");
    if (s === "1" || s === "reversed 1") {
      cellIndex = k;
      reversed = s === "reversed 1";
    }
  }
  if (cellIndex !== -1) {
    var values = [];
    var rows = table.tBodies[0].rows;
    var i = -1;
    while (++i < rows.length) {
      var row = rows[i];
      var value = row.cells[cellIndex].textContent;
      var match = (/^[\d,]+(?:[\.][\d,]*)?|^\-$/).exec(value);
      if (match != undefined) {
        value = Number(match[0].replace(/,/g, ""));
        if (value !== value) {
          value = -1.0 / 0.0;
        }
      }
      values.push({
        value: value,
        index: i,
        row: row
      });
    }
    values = values.sort(function (a, b) {
      if (a.value < b.value) {
        return reversed ? +1 : -1;
      }
      if (b.value < a.value) {
        return reversed ? -1 : +1;
      }
      return a.index - b.index;
    });
    while (table.tBodies[0].firstChild != undefined) {
      table.tBodies[0].removeChild(table.tBodies[0].firstChild);
    }
    var j = -1;
    while (++j < values.length) {
      var value = values[j];
      table.tBodies[0].appendChild(value.row);
    }
  }
};

(function () {

  document.addEventListener("click", function (e) {
    if (!e.defaultPrevented) {
      var t = e.target;
      while (t != undefined && t.tagName !== "TD") {
        t = t.parentNode;
      }
      if (t != undefined && t.parentNode.parentNode.tagName === "THEAD" && t.parentNode.parentNode.parentNode.getAttribute("sortable") != undefined) {
        var cellIndex = t.cellIndex;
        var sorted = t.getAttribute("sorted");
        var cells = t.parentNode.cells;
        var k = -1;
        while (++k < cells.length) {
          cells[k].setAttribute("sorted", "");
        }
        var reversed = sorted !== "reversed 1";
        t.setAttribute("sorted", reversed ?  "reversed 1" : "1");
        var table = t.parentNode.parentNode.parentNode;
        sortTable(table);
      }
    }
  }, false);
}());


var escapeHTML = function (s) {
  return s.replace(/&/g, "&amp;")
          .replace(/"/g, "&quot;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
};

var generateTable = function () {
  var html = "";
  html += "\n<table class=\"results\" sortable=\"sortable\">";
  html += "\n<thead>";
  html += "\n  <tr>";
  html += "\n    <td><input type=checkbox /></td>";
  html += "\n    <td tabindex=\"0\">URL</td>";
  var benchmarks = [
    {id: "create-10", url: "https://github.com/indutny/bn.js/blob/master/benchmarks/index.js"},
    {id: "create-hex", url: "https://github.com/indutny/bn.js/blob/master/benchmarks/index.js"},
    {id: "toString-10", url: "https://github.com/indutny/bn.js/blob/master/benchmarks/index.js"},
    {id: "toString-hex", url: "https://github.com/indutny/bn.js/blob/master/benchmarks/index.js"},
    {id: "add", url: "https://github.com/indutny/bn.js/blob/master/benchmarks/index.js"},
    {id: "mul", url: "https://github.com/indutny/bn.js/blob/master/benchmarks/index.js"},
    {id: "div", url: "https://github.com/indutny/bn.js/blob/master/benchmarks/index.js"},
    {id: "mod", url: "https://github.com/indutny/bn.js/blob/master/benchmarks/index.js"},
    {id: "10*10==20", url: "#1"},
    {id: "27*27==54", url: "#2"},
    {id: "bitwise-shift-operators", url: "#3"},
    {id: "bitwise-logical-operators", url: "#4"},
    {id: "joseprio", url: "http://www.joseprio.com/blog/2013/04/27/biginteger-libraries-for-js"},
  ];
  for (var i = 0; i < benchmarks.length; i += 1) {
    var benchmark = benchmarks[i];
    html += "\n    <td tabindex=\"0\" id=\"${id}\"><a target=\"_blank\" href=\"${url}\">${id}</a></td>".replace("${id}", benchmark.id).replace("${url}", benchmark.url).replace("${id}", benchmark.id);
  }
  html += "\n  </tr>";
  html += "\n</thead>";
  html += "\n<tbody>";
  for (var i = 0; i < libs.length; i += 1) {
    var lib = libs[i];
    html += "\n  <tr class=\"result\">";
    html += "\n    <td><input type=checkbox " + (lib.checked ? "checked=\"checked\"" : "") + " /></td>";
    html += "\n    <td><a target=\"_blank\" href=\"${url}\">${url}</a></td>".replace(/\$\{url\}/g, escapeHTML(lib.url));
    for (var j = 0; j < benchmarks.length; j += 1) {
      html += "\n    <td></td>";
    }
    html += "\n  </tr>";
  }
  html += "\n</tbody>";
  html += "\n</table>";
  return html;
};

//console.log(generateTable());

var generateInfoTable = function () {
  var object = {};
  object["url"] = "";
  for (var i = 0; i < libs.length; i += 1) {
    object = Object.assign(object, libs[i]);
  }

  var html = "";
  html += "<table>";
  html += "<thead>";
  html += "<tr>";
  for (var key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      if (key !== "src" && key !== "source" && key !== "setup") {
        html += "<th>";
        html += escapeHTML(key);
        html += "</th>";
      }
    }
  }
  html += "</tr>";
  html += "</thead>";
  html += "<tbody>";
  for (var i = 0; i < libs.length; i += 1) {
    html += "<tr>";
    for (var key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        if (key !== "src" && key !== "source" && key !== "setup") {
          html += key === "url" ? "<th>" : "<td>";
          var v = libs[i][key];
          html += escapeHTML(typeof v === "function" ? "function" : (typeof v === "boolean" ? (v ? "+" : "-") : (v == undefined ? "undefined" : v || "-")));
          html += key === "url" ? "</th>" : "</td>";
        }
      }
    }
    html += "</tr>";
  }
  html += "</tbody>";
  html += "</table>";
  return html;
};
