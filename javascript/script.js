var Dom;

Dom = (function() {
  function Dom() {}

  Dom.button = function(parent, label, before) {
    var child;
    child = Dom.create(parent, "button", label, before);
    child.setAttribute("type", "button");
    return child;
  };

  Dom.label = function(parent, tag, text) {
    var dd, dl, dt, label;
    label = Dom.create(parent, "label");
    dl = Dom.create(label, "dl");
    dt = Dom.create(dl, "dt", text);
    dd = Dom.create(dl, "dd");
    return Dom.create(dd, tag);
  };

  Dom.create = function(parent, tag, html, before) {
    var child;
    child = document.createElement(tag);
    if (before === void 0) {
      parent.appendChild(child);
    } else {
      parent.insertBefore(child, before);
    }
    if (html) {
      child.innerHTML = html;
    }
    return child;
  };

  Dom.get = function(name, parent) {
    return this.gets(name, parent).item(0);
  };

  Dom.gets = function(name, parent) {
    if (!parent) {
      parent = document;
    }
    return parent.querySelectorAll(name);
  };

  return Dom;

})();

var Rokusei;

Rokusei = (function() {
  Rokusei.prototype.yearOffset = 2;

  Rokusei.prototype.monthOffset = 7;

  Rokusei.prototype.dayOffset = 0;

  Rokusei.prototype.status = [
    {
      name: "安定",
      color: "#da6"
    }, {
      name: "陰影",
      color: "#444"
    }, {
      name: "停止",
      color: "#222"
    }, {
      name: "減退",
      color: "#555"
    }, {
      name: "種子",
      color: "#2a8"
    }, {
      name: "緑生",
      color: "#292"
    }, {
      name: "立花",
      color: "#f77"
    }, {
      name: "健弱",
      color: "#33c"
    }, {
      name: "達成",
      color: "#f00"
    }, {
      name: "乱気",
      color: "#666"
    }, {
      name: "再会",
      color: "#e60"
    }, {
      name: "財成",
      color: "#d5c642"
    }
  ];

  function Rokusei() {}

  Rokusei.prototype.init = function() {};

  Rokusei.prototype.setDate = function(date) {
    var calendar, child, cursor, i, target, _i, _ref;
    calendar = Dom.get("body > ul");
    for (i = _i = 0, _ref = calendar.childNodes.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
      target = calendar.childNodes[i].childNodes[0];
      cursor = (date.unixTime1stDay + i + this.dayOffset) % 12;
      target.style.borderLeft = "solid " + this.status[cursor].color + " .25em";
      target.style.paddingLeft = ".25em";
      if (child = Dom.get("span", target)) {
        child.innerHTML = this.status[cursor].name;
      } else {
        child = Dom.create(target, "span", this.status[cursor].name);
      }
      child.style.marginLeft = (10 / 7 * 1 / 4) + "em";
      child.style.fontSize = "70%";
      child.style.fontWeight = "200";
      child.style.color = document.defaultView.getComputedStyle(target.parentNode, null).color;
    }
    return Dom.get("nav h1").innerHTML = date.year + "年 ( " + this.status[(date.year + this.yearOffset) % 12].name + " ) " + (date.month + 1) + "月 ( " + this.status[(date.month + this.monthOffset) % 12].name + " )";
  };

  return Rokusei;

})();

var apps, load, menu, plugins, script, style;

menu = null;

script = [];

style = [];

apps = [
  {
    name: "スケジュール",
    "class": "Controller",
    libs: ["javascript/schedule/script.js"],
    style: ["stylesheet/reset.css", "stylesheet/schedule.css"]
  }
];

window.addEventListener("load", function() {
  return load(apps[0]);
});

load = function(app) {
  var cnt, s, src, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _results;
  for (_i = 0, _len = style.length; _i < _len; _i++) {
    s = style[_i];
    s.parentNode.removeChild(s);
  }
  style = [];
  _ref = app.style;
  for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
    src = _ref[_j];
    s = Dom.create(document.head, "link");
    s.href = src;
    s.rel = "stylesheet";
    style.push(s);
  }
  for (_k = 0, _len2 = script.length; _k < _len2; _k++) {
    s = script[_k];
    s.parentNode.removeChild(s);
  }
  script = [];
  cnt = 0;
  _ref1 = app.libs;
  _results = [];
  for (_l = 0, _len3 = _ref1.length; _l < _len3; _l++) {
    src = _ref1[_l];
    s = Dom.create(document.head, "script");
    s.src = src;
    script.push(s);
    _results.push(s.onload = function() {
      cnt++;
      if (cnt === script.length) {
        return Function("new " + app["class"] + "( )")();
      }
    });
  }
  return _results;
};

plugins = ["PropertySetting", "Holiday", "Rokusei"];
