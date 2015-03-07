var Dom;

Dom = (function() {
  function Dom() {}

  Dom.button = function(parent, label, before) {
    var child;
    child = Dom.create(parent, "button", label, before);
    child.setAttribute("type", "button");
    return child;
  };

  Dom.label = function(parent, tag, text, type) {
    var child, dd, dl, dt, label;
    label = Dom.create(parent, "label");
    dl = Dom.create(label, "dl");
    dt = Dom.create(dl, "dt", text);
    dd = Dom.create(dl, "dd");
    child = Dom.create(dd, tag);
    if (type) {
      child.type = type;
    }
    return child;
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

  Dom.input = function(parent, text, before) {
    var child, label;
    label = Dom.create(parent, "label", text);
    child = Dom.create(label, "input", null, before);
    child.type = "input";
    return child;
  };

  Dom.checkbox = function(parent, text, before) {
    var child, label;
    label = Dom.create(parent, "label");
    child = Dom.create(label, "input", null, before);
    child.type = "checkbox";
    label.innerHTML += text;
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
    var calendar, child, cursor, i, j, ref, target;
    calendar = Dom.get("body > ul");
    for (i = j = 0, ref = calendar.childNodes.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
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
    style: ["stylesheet/reset.css", "stylesheet/common.css", "stylesheet/schedule.css"]
  }, {
    name: "一覧",
    "class": "Controller",
    libs: ["javascript/mindmap/script.js"],
    style: ["stylesheet/reset.css", "stylesheet/common.css", "stylesheet/mindmap.css"]
  }, {
    name: "姓名判断",
    "class": "Controller",
    libs: ["http://192.168.0.16:8000/javascript/seimei/script.js"],
    style: ["stylesheet/reset.css", "stylesheet/common.css", "http://192.168.0.16:8000/stylesheet/seimei.css"]
  }
];

window.addEventListener("load", function() {
  var i, j, ref, results;
  menu = Dom.create(document.body, "header");
  Dom.button(menu, "more").addEventListener("click", function() {
    return menu.classList.toggle("keep");
  });
  load(apps[0]);
  results = [];
  for (i = j = 0, ref = apps.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
    results.push(Dom.button(menu, apps[i].name).addEventListener("click", (function(i) {
      return function() {
        return load(apps[i]);
      };
    })(i)));
  }
  return results;
});

load = function(app) {
  var child, cnt, j, k, l, len, len1, len2, len3, m, ref, ref1, results, s, src;
  if (menu.classList.contains("keep")) {
    menu.classList.toggle("keep");
  }
  while (document.body.lastChild !== menu) {
    child = document.body.lastChild;
    document.body.removeChild(child);
  }
  for (j = 0, len = style.length; j < len; j++) {
    s = style[j];
    s.parentNode.removeChild(s);
  }
  style = [];
  ref = app.style;
  for (k = 0, len1 = ref.length; k < len1; k++) {
    src = ref[k];
    s = Dom.create(document.head, "link");
    s.href = src;
    s.rel = "stylesheet";
    style.push(s);
  }
  for (l = 0, len2 = script.length; l < len2; l++) {
    s = script[l];
    s.parentNode.removeChild(s);
  }
  script = [];
  cnt = 0;
  ref1 = app.libs;
  results = [];
  for (m = 0, len3 = ref1.length; m < len3; m++) {
    src = ref1[m];
    s = Dom.create(document.head, "script");
    s.src = src;
    script.push(s);
    results.push(s.onload = function() {
      cnt++;
      if (cnt === script.length) {
        return Function("new " + app["class"] + "( )")();
      }
    });
  }
  return results;
};

plugins = ["PropertySetting", "FileInOut", "Holiday", "Rokusei"];
