var Controller;

Controller = (function() {
  var controller, current, data, plugin, view;

  controller = null;

  data = null;

  view = null;

  current = null;

  plugin = null;

  Controller.days = ["日", "月", "火", "水", "木", "金", "土"];

  function Controller() {
    var mouse;
    current = this.getYearMonth(0);
    view = new View();
    data = new Model(view, this);
    mouse = new MouseEvent(data, this);
    controller = this;
  }

  Controller.prototype.init = function() {
    plugin = new Plugins(data);
    return this.setCurrent(0);
  };

  Controller.prototype.setProperties = function() {
    data.loadSchedules();
    return plugin.setProperties();
  };

  Controller.prototype.setConfigs = function() {
    return plugin.setConfigs();
  };

  Controller.prototype.setSchedules = function() {
    view.setSchedules(data.getSchedules(), data.getProperties());
    return plugin.setSchedules();
  };

  Controller.prototype.getCurrent = function() {
    return current;
  };

  Controller.prototype.setDate = function(offset) {
    this.setCurrent(offset);
    return data.loadSchedules();
  };

  Controller.prototype.setCurrent = function(offset) {
    var day1st;
    current = this.getYearMonth(offset);
    current.monthDays = 31 - (new Date(current.year, current.month, 32).getDate());
    day1st = new Date(current.year, current.month, 1);
    current.startDay = day1st.getDay();
    current.unixTime1stDay = Math.floor(day1st / 1000 / 60 / 60 / 24);
    View.setCalendar(current);
    return plugin.setDate(current);
  };

  Controller.prototype.getYearMonth = function(monthOffset) {
    var res, tmp;
    if (current) {
      tmp = new Date(current.year, current.month + monthOffset, 1);
    } else {
      tmp = new Date();
    }
    res = [];
    res.month = tmp.getMonth();
    res.year = tmp.getFullYear();
    res.date = res.year + "/" + (res.month + 1);
    return res;
  };

  Controller.setEvent = function() {
    var elem, _i, _len, _ref, _results;
    _ref = Dom.gets("select");
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      elem = _ref[_i];
      _results.push(elem.addEventListener("change", function() {
        return data.setScheduleStatus(this);
      }));
    }
    return _results;
  };

  Controller.click = {
    PrevMonth: function() {
      return controller.setDate(-1);
    },
    NextMonth: function() {
      return controller.setDate(1);
    },
    Nav: function(target) {
      target.parentNode.classList.toggle("keep");
      return View.calendarHeightChange();
    },
    Day: function(target) {
      var calendar, day, _i, _len, _ref;
      if (view.form.check(data)) {
        view.form.close();
        calendar = Dom.get("body > ul");
        _ref = calendar.childNodes;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          day = _ref[_i];
          if (day.classList.contains("keep")) {
            day.classList.remove("keep");
            if (day === target) {
              return;
            }
          }
        }
        return target.classList.add("keep");
      }
    },
    Tasks: function(target) {
      var child, date, title, _i, _len, _ref;
      target.parentNode.classList.toggle("keep");
      _ref = target.parentNode.childNodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        child.style.display = null;
      }
      if (target.parentNode.classList.contains("keep")) {
        date = controller.getCurrent();
        if (target.previousSibling.classList.contains("monthTask")) {
          title = date.year + "/" + parseInt(date.month + 1);
        } else if (target.previousSibling.classList.contains("yearTask")) {
          title = date.year;
        } else if (target.previousSibling.classList.contains("somedayTask")) {
          title = "";
        }
        target.parentNode.firstChild.innerHTML = title;
        target.previousSibling.style.display = "block";
      }
      return View.calendarHeightChange();
    },
    ScheduleAdd: function(target) {
      return view.form.scheduleAdd(Dom.get("h1", target.parentNode).innerHTML);
    },
    ScheduleTitle: function(target) {
      return data.getSchedules(View.getId(target), view.form.scheduleUpdate);
    },
    ScheduleContent: function(target) {
      return this.ScheduleTitle(target);
    },
    ScheduleDelete: function(target) {
      if (confirm("削除を行います。よろしいですか？")) {
        return data.deleteSchedule(parseInt(target.parentNode.classList[0].match(/\d.*/g)));
      }
    },
    ScheduleClose: function(target) {
      return target.parentNode.parentNode.classList.remove("keep");
    },
    ScheduleSubmit: function(target) {
      if (view.getForm("id").value) {
        return data.getSchedules(view.getForm("id").value, this.ScheduleSubmitCallback);
      } else {
        return this.ScheduleSubmitCallback();
      }
    },
    ScheduleSubmitCallback: function(old) {
      var query;
      query = [];
      if (old) {
        query[0] = old;
      } else {
        query[0] = [];
        query[0].post_date = new Date();
      }
      query[0].title = view.getForm("title").value;
      query[0].date = view.getForm("date").value;
      query[0].content = view.getForm("content").value;
      query[0].last_update = new Date();
      data.setSchedules(query);
      return view.form.close();
    },
    ScheduleCancel: function(target) {
      if (view.form.check(data)) {
        return view.form.close();
      }
    }
  };

  Controller.dblclick = {
    Day: function(target) {
      var date;
      date = current;
      return view.form.scheduleAdd(Dom.get("section > h1", target).innerHTML);
    }
  };

  return Controller;

})();

var Holiday;

Holiday = (function() {
  var data, holiday;

  Holiday.prototype.key = "AIzaSyAnRrOhpwkGMgjo4y7BPwzGyQ8sblFtDak";

  data = [];

  holiday = null;

  function Holiday() {
    holiday = this;
  }

  Holiday.prototype.init = function() {};

  Holiday.prototype.setDate = function(date) {
    var xhr;
    this.url = "https://www.googleapis.com/calendar/v3/calendars/ja.japanese%23holiday@group.v.calendar.google.com/events?key=";
    this.url += this.key;
    this.url += "&maxResults=100&orderBy=startTime&singleEvents=true&timeMin=";
    this.url += date.year + "-" + this.convertMonth(date.month) + "-" + "01T00:00:00Z";
    this.url += "&timeMax=";
    this.url += date.year + "-" + this.convertMonth(date.month) + "-" + (date.monthDays + 1) + "T00:00:00Z";
    xhr = new XMLHttpRequest();
    xhr.open("GET", this.url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        data = JSON.parse(xhr.responseText);
        return holiday.setHoliday();
      }
    };
    return xhr.send(null);
  };

  Holiday.prototype.setSchedules = function() {};

  Holiday.prototype.setHoliday = function() {
    var calendar, day, span, target, _i, _len, _ref, _results;
    calendar = Dom.get("body > ul");
    if (data.items) {
      _ref = data.items;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        day = _ref[_i];
        target = calendar.childNodes[parseInt(day.start.date.split("-")[2]) - 1].querySelector("span");
        span = Dom.create(target, "span", day.summary);
        span.classList.add("holidayName");
        span.style.marginLeft = ".25em";
        _results.push(target.parentNode.classList.add("holiday"));
      }
      return _results;
    }
  };

  Holiday.prototype.convertMonth = function(num) {
    return (num < 9 ? 0 : "") + (num + 1);
  };

  return Holiday;

})();

var Model;

Model = (function() {
  var configs, controller, db, initialData, model, plugin, properties, schedules, view;

  model = Model;

  view = null;

  controller = null;

  plugin = null;

  db = null;

  schedules = [];

  properties = [];

  configs = [];

  Model.prototype.dbName = "piaccoCalendar";

  Model.prototype.iDB = window.indexedDB || window.mozIndexedDB || window.msIndexedDB || window.webkitIndexDB;

  Model.prototype.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

  initialData = [
    {
      name: "status",
      array: ["未着手", "進行中", "完了", "棄却"]
    }, {
      name: "level",
      array: ["軽", "中", "重要", "特別"]
    }, {
      name: "project",
      array: ["未設定"]
    }, {
      name: "category",
      array: ["未設定"]
    }, {
      name: "tag",
      array: []
    }
  ];

  function Model(v, c) {
    var request;
    model = this;
    view = v;
    controller = c;
    request = this.iDB.open(this.dbName, 9);
    request.onupgradeneeded = function(evt) {
      var config, d, database, i, name, property, schedule, transaction, _i, _j, _len, _len1, _ref;
      database = evt.target.result;
      if (evt.oldVersion <= 1) {
        schedule = database.createObjectStore("store", {
          keyPath: 'id',
          autoIncrement: true
        });
        schedule.createIndex("date", "date", {
          unique: false
        });
      }
      if (evt.oldVersion <= 6) {
        try {
          database.deleteObjectStore("config");
        } catch (_error) {}
        config = database.createObjectStore("config", {
          keyPath: "name",
          autoIncrement: false
        });
        config.createIndex("name", "name", {
          unique: true
        });
        for (_i = 0, _len = initialData.length; _i < _len; _i++) {
          d = initialData[_i];
          try {
            database.deleteObjectStore(d.name);
          } catch (_error) {}
          property = database.createObjectStore(d.name, {
            keyPath: "id",
            autoIncrement: true
          });
          property.createIndex("name", "name", {
            unique: true
          });
          property.createIndex("order", "order", {
            unique: false
          });
          _ref = d.array;
          for (i = _j = 0, _len1 = _ref.length; _j < _len1; i = ++_j) {
            name = _ref[i];
            property.add({
              name: name,
              order: parseInt(i + 1),
              parent: null,
              "delete": false,
              finish: false,
              hidden: false,
              color: "inherit"
            });
          }
        }
      }
      if (evt.oldVersion <= 7) {
        transaction = evt.target.transaction;
        schedule = transaction.objectStore("store");
        schedule.createIndex("order", "order", {
          unique: false
        });
        schedule.createIndex("parent", "parent", {
          unique: false
        });
        request = schedule.index("date").openCursor();
        request.onsuccess = function() {
          var cursor, req;
          cursor = this.result;
          if (cursor) {
            cursor.value.order = cursor.value.id;
            cursor.value.parent = null;
            cursor.value.status++;
            req = schedule.put(cursor.value);
            req.onerror = function(evt) {
              return alert("error");
            };
            return cursor["continue"]();
          }
        };
      }
      if (evt.oldVersion <= 8) {
        transaction = evt.target.transaction;
        schedule = transaction.objectStore("store");
        request = schedule.openCursor();
        return request.onsuccess = function() {
          var cursor, req, splitDate;
          cursor = this.result;
          if (cursor) {
            if (typeof cursor.value.date === "string") {
              splitDate = cursor.value.date.split("/");
              if (splitDate.length === 3) {
                cursor.value.date = new Date(splitDate[0], eval(splitDate[1] - 1), splitDate[2]);
              }
            } else {
              cursor.value.date = "";
            }
            req = schedule.put(cursor.value);
            req.onerror = function(evt) {
              return alert("error");
            };
            return cursor["continue"]();
          }
        };
      }
    };
    request.onsuccess = function(evt) {
      db = evt.target.result;
      controller.init();
      model.loadProperties();
      return model.loadConfigs();
    };
    request.onerror = function(evt) {
      return console.log("error");
    };
  }

  Model.prototype.loadSchedules = function() {
    var key, lower, month, r, range, request, schedule, transaction, upper, year;
    year = controller.getCurrent().year;
    month = controller.getCurrent().month;
    schedules = [];
    transaction = db.transaction(["store"], "readonly");
    schedule = transaction.objectStore("store");
    range = [];
    lower = new Date(year, month, 1);
    upper = new Date(year, month + 1, 0);
    range.someday = IDBKeyRange.only("");
    range.year = IDBKeyRange.only(year.toString());
    range.month = IDBKeyRange.only(year + "/" + parseInt(month + 1));
    range.date = IDBKeyRange.bound(lower, upper);
    for (key in range) {
      r = range[key];
      schedules[key] = [];
      request = schedule.index("date").openCursor(r);
      request.onsuccess = (function(key) {
        return function() {
          var cursor;
          cursor = this.result;
          if (cursor) {
            schedules[key].push(cursor.value);
            return cursor["continue"]();
          }
        };
      })(key);
    }
    transaction.oncomplete = function() {
      var tasks;
      for (key in schedules) {
        tasks = schedules[key];
        tasks.sort(function(a, b) {
          if (a.order > b.order) {
            return 1;
          } else {
            return -1;
          }
        });
      }
      return controller.setSchedules();
    };
    return request.onerror = function(evt) {
      return alert("error");
    };
  };

  Model.prototype.getSchedules = function(id, callback, arg) {
    var request, schedule, transaction;
    if (id) {
      transaction = db.transaction(["store"], "readonly");
      schedule = transaction.objectStore("store");
      request = schedule.get(parseInt(id));
      return request.onsuccess = function() {
        return callback(this.result, arg);
      };
    } else {
      return schedules;
    }
  };

  Model.prototype.setSchedules = function(query) {
    var request, schedule, transaction;
    transaction = db.transaction(["store"], "readwrite");
    schedule = transaction.objectStore("store");
    request = schedule.index("order").openCursor(IDBKeyRange.lowerBound(0), "prev");
    return request.onsuccess = (function(query) {
      return function() {
        var d, last, q, _i, _len;
        if (this.result) {
          last = this.result.value.order + 1;
        } else {
          last = 0;
        }
        for (_i = 0, _len = query.length; _i < _len; _i++) {
          q = query[_i];
          if ((typeof q.date === "string") && (d = q.date.split("/")) && (d.length === 3)) {
            q.date = new Date(d[0], d[1] - 1, d[2]);
          }
          if (!q.parent) {
            q.parent = null;
          }
          if (!q.order) {
            q.order = last++;
          }
          request = schedule.put(q);
          request.onerror = function(evt) {
            return alert("error");
          };
        }
        return transaction.oncomplete = function() {
          return model.loadSchedules();
        };
      };
    })(query);
  };

  Model.prototype.deleteSchedule = function(id) {
    var request, schedule, transaction;
    transaction = db.transaction(["store"], "readwrite");
    schedule = transaction.objectStore("store");
    request = schedule["delete"](parseInt(id));
    return transaction.oncomplete = function() {
      return model.loadSchedules();
    };
  };

  Model.prototype.setScheduleStatus = function(elem) {
    return this.getSchedules(View.getId(elem), this.setScheduleStatusCallback, elem);
  };

  Model.prototype.setScheduleStatusCallback = function(q, elem) {
    var cls, query, str, _i, _len, _ref, _results;
    query = [];
    query[0] = q;
    _ref = elem.classList;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      cls = _ref[_i];
      if (cls && cls !== "select" && cls.indexOf("select") === 0) {
        str = cls.replace("selectSchedule", "").toLowerCase().replace(/\d+/, "");
        query[0][str] = parseInt(elem.selectedIndex + 1);
        _results.push(model.setSchedules(query));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Model.prototype.loadProperties = function() {
    var request, store, t, target, transaction, _i, _j, _len, _len1;
    target = [];
    properties = [];
    for (_i = 0, _len = initialData.length; _i < _len; _i++) {
      t = initialData[_i];
      target.push(t.name);
      properties[t.name] = [];
    }
    transaction = db.transaction(target, "readonly");
    for (_j = 0, _len1 = target.length; _j < _len1; _j++) {
      t = target[_j];
      store = transaction.objectStore(t);
      request = store.index("order").openCursor();
      request.onsuccess = function() {
        var cursor;
        cursor = this.result;
        if (cursor) {
          properties[cursor.source.objectStore.name][cursor.value.order] = cursor.value;
          return cursor["continue"]();
        }
      };
    }
    transaction.oncomplete = function() {
      return controller.setProperties();
    };
    return request.onerror = function(evt) {
      return alert("error");
    };
  };

  Model.prototype.getProperties = function() {
    return properties;
  };

  Model.prototype.setProperties = function(target, query, callback) {
    var q, request, store, transaction, _i, _len;
    transaction = db.transaction([target], "readwrite");
    store = transaction.objectStore(target);
    for (_i = 0, _len = query.length; _i < _len; _i++) {
      q = query[_i];
      request = store.put(q);
      request.onerror = function(evt) {
        return alert("error");
      };
    }
    return transaction.oncomplete = function() {
      return model.loadProperties(null, null, callback);
    };
  };

  Model.prototype.deleteProperty = function(target, id) {
    var request, store, transaction;
    transaction = db.transaction([target], "readwrite");
    store = transaction.objectStore(target);
    request = store["delete"](parseInt(id));
    return transaction.oncomplete = function() {
      return model.loadProperties();
    };
  };

  Model.prototype.loadConfigs = function() {
    var request, store, transaction;
    configs = [];
    transaction = db.transaction(["config"], "readonly");
    store = transaction.objectStore("config");
    request = store.openCursor();
    request.onsuccess = function() {
      var cursor;
      cursor = this.result;
      if (cursor) {
        configs[cursor.value.name] = cursor.value;
        return cursor["continue"]();
      }
    };
    transaction.oncomplete = function() {
      return controller.setConfigs();
    };
    return request.onerror = function(evt) {
      return alert("error");
    };
  };

  Model.prototype.getConfigs = function() {
    return configs;
  };

  Model.prototype.setConfigs = function(query) {
    var request, store, transaction;
    transaction = db.transaction(["config"], "readwrite");
    store = transaction.objectStore("config");
    request = store.put(query);
    transaction.oncomplete = function() {
      return model.loadConfigs();
    };
    return request.onerror = function(evt) {
      return alert("error");
    };
  };

  Model.prototype.deleteConfig = function(name) {
    var request, store, transaction;
    transaction = db.transaction(["config"], "readwrite");
    store = transaction.objectStore("config");
    request = store["delete"](name);
    return transaction.oncomplete = function() {
      return model.loadConfigs();
    };
  };

  return Model;

})();

var MouseEvent;

MouseEvent = (function() {
  var controller, data, dragging, query, timer;

  controller = null;

  data = null;

  dragging = [];

  query = null;

  timer = null;

  function MouseEvent(d, c) {
    data = d;
    controller = c;
    window.onmousedown = function(evt) {
      return MouseEvent.mouse.setEvent(evt);
    };
  }

  MouseEvent.getPointer = function(evt, name) {
    var pointer;
    pointer = null;
    if (evt.srcElement) {
      pointer = evt.srcElement;
    } else if (evt.target) {
      pointer = evt.target;
    }
    if (name) {
      if (name.charAt(0) === ".") {
        name = name.substr(1);
        while (!pointer.classList.contains(name)) {
          if (pointer.tagName === "BODY") {
            return false;
          }
          pointer = pointer.parentNode;
        }
      } else {
        while (pointer.tagName !== name) {
          if (pointer.tagName === "BODY") {
            return false;
          }
          pointer = pointer.parentNode;
        }
      }
    }
    return pointer;
  };

  MouseEvent.mouse = {
    setEvent: function(evt) {
      var point;
      dragging = [];
      dragging.startX = evt.pageX;
      dragging.startY = evt.pageY;
      dragging.moveX = 0;
      dragging.moveY = 0;
      point = MouseEvent.getPointer(evt);
      if (point.classList.contains("draggable")) {
        dragging.elem = point.cloneNode(true);
        dragging.id = View.getId(point);
        dragging.elem.classList.add("dragging");
        window.addEventListener("mousemove", MouseEvent.mouse.dragMove);
        window.addEventListener("mouseup", function() {
          return window.removeEventListener("mousemove", MouseEvent.mouse.dragMove);
        });
      } else {
        window.addEventListener("mouseup", MouseEvent.mouse.swipeEnd);
        setTimeout(function() {
          return window.removeEventListener("mouseup", MouseEvent.mouse.swipeEnd);
        }, 400);
      }
      window.addEventListener("click", MouseEvent.mouse.clickEvent);
      window.addEventListener("dblclick", MouseEvent.mouse.doubleclickEvent);
      window.addEventListener("mousemove", MouseEvent.mouse.move);
      return window.addEventListener("mouseleave", MouseEvent.mouse.leave);
    },
    move: function(evt) {
      dragging.moveX = dragging.startX - evt.pageX;
      dragging.moveY = dragging.startY - evt.pageY;
      if (window.navigator.userAgent.toLowerCase().indexOf("firefox")) {
        window.getSelection().removeAllRanges();
      }
      return evt.returnValue = false;
    },
    leave: function() {
      dragging.elem.parentNode.removeChild(dragging.elem);
      dragging = null;
      return MouseEvent.mouse.dragTo(false);
    },
    dragMove: function(evt) {
      var mouseOver, point;
      window.removeEventListener("click", MouseEvent.mouse.clickEvent);
      if (Math.abs(dragging.moveX) + Math.abs(dragging.moveY) > 20) {
        window.addEventListener("mouseup", MouseEvent.mouse.dragUp);
        if (document.body.contains(dragging.elem)) {
          dragging.elem.style.left = evt.pageX - dragging.x + "px";
          dragging.elem.style.top = evt.pageY - dragging.y + "px";
          mouseOver = document.elementFromPoint(evt.pageX, evt.pageY);
          if (mouseOver.classList.contains("dragTo")) {
            dragging.hover = mouseOver;
            mouseOver.style.opacity = "1";
            if (timer === null) {
              return timer = window.setInterval(function() {
                if (mouseOver.classList.contains("dragToPrevMonth")) {
                  return controller.setDate(-1);
                } else if (mouseOver.classList.contains("dragToNextMonth")) {
                  return controller.setDate(1);
                }
              }, 800);
            }
          } else if (dragging.hover) {
            dragging.hover.style.opacity = null;
            dragging.hover = null;
            if (timer) {
              clearInterval(timer);
              return timer = null;
            }
          }
        } else {
          point = MouseEvent.getPointer(evt);
          document.body.appendChild(dragging.elem);
          dragging.elem.style.left = evt.pageX + "px";
          dragging.elem.style.top = evt.pageY + "px";
          dragging.x = evt.pageX - dragging.elem.offsetLeft;
          dragging.y = evt.pageY - dragging.elem.offsetTop;
          query = [];
          query[1] = [];
          data.getSchedules(dragging.id, MouseEvent.mouse.setquery);
          return MouseEvent.mouse.dragTo(true);
        }
      }
    },
    dragUp: function(evt) {
      var day, i, to, _i, _len, _ref;
      window.removeEventListener("mouseup", MouseEvent.mouse.dragUp);
      if (timer) {
        clearInterval(timer);
      }
      if (dragging.elem) {
        document.body.removeChild(dragging.elem);
        if (dragging.elem.classList.contains("scheduleTitle")) {
          to = document.elementFromPoint(evt.pageX, evt.pageY);
          if (to.classList.contains("dragTo")) {
            if (to.classList.contains("dragToMonth")) {
              query[0].date = controller.getCurrent().date;
            } else if (to.classList.contains("dragToYear")) {
              query[0].date = controller.getCurrent().year.toString();
            } else if (to.classList.contains("dragToSomeday")) {
              query[0].date = "";
            } else if (to.classList.contains("dragToPrevMonth")) {
              query[0].date = controller.getYearMonth(-1).date;
            } else if (to.classList.contains("dragToNextMonth")) {
              query[0].date = controller.getYearMonth(1).date;
            }
          } else {
            while (!((to.tagName === "BODY") || (to.classList.contains("clickDay")) || (to.classList.contains("dragTo")) || (to.tagName === "DL"))) {
              to = to.parentNode;
            }
            if (to.classList.contains("clickDay")) {
              i = 1;
              while (to.previousSibling) {
                ++i;
                to = to.previousSibling;
              }
              query[0].date = controller.getCurrent().date + "/" + i;
            } else if (to.tagName === "DL") {
              query[1] = [];
              data.getSchedules(View.getId(to), MouseEvent.mouse.replace);
              return;
            }
          }
        }
        data.setSchedules(query);
        _ref = Dom.get("body > ul").childNodes;
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          day = _ref[i];
          if (day.classList.contains("keep")) {
            day.classList.remove("keep");
          }
          if ((query[0].date instanceof Date) && (i === (query[0].date.getDate() - 1))) {
            day.classList.add("keep");
          }
        }
      }
      dragging = null;
      return MouseEvent.mouse.dragTo(false);
    },
    setquery: function(q) {
      return query[0] = q;
    },
    replace: function(q) {
      var tmp;
      query[1] = q;
      tmp = query[1].order;
      query[1].order = query[0].order;
      query[0].order = tmp;
      return data.setSchedules(query);
    },
    dragTo: function(bool) {
      var dragTo, _i, _len, _ref, _results;
      _ref = Dom.gets(".dragTo");
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        dragTo = _ref[_i];
        if (bool) {
          _results.push(dragTo.style.display = "block");
        } else {
          dragTo.style.opacity = null;
          _results.push(dragTo.style.display = null);
        }
      }
      return _results;
    },
    swipeEnd: function() {
      if ((Math.abs(dragging.moveX) + Math.abs(dragging.moveY)) > 40) {
        if (Math.abs(dragging.moveX) > Math.abs(dragging.moveY)) {
          if (dragging.moveX > 0) {
            return controller.setDate(1);
          } else {
            return controller.setDate(-1);
          }
        } else {
          if (dragging.moveY > 0) {

          } else {

          }
        }
      }
    },
    clickEvent: function(evt) {
      var cls, point, _i, _len, _ref;
      window.removeEventListener("click", MouseEvent.mouse.clickEvent);
      MouseEvent.mouse.dragTo(false);
      try {
        point = MouseEvent.getPointer(evt);
        while (!(point.nodeName === "BODY")) {
          _ref = point.classList;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            cls = _ref[_i];
            if (cls.indexOf("click") === 0) {
              Controller.click[cls.replace("click", "")](point);
              return;
            }
          }
          if (point.nodeName === "SECTION") {
            return;
          }
          point = point.parentNode;
        }
      } catch (_error) {}
    },
    doubleclickEvent: function(evt) {
      var cls, point, _i, _len, _ref;
      window.removeEventListener("dblclick", MouseEvent.mouse.doubleclickEvent);
      MouseEvent.mouse.dragTo(false);
      try {
        point = MouseEvent.getPointer(evt);
        while (!(point.nodeName === "BODY")) {
          _ref = point.classList;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            cls = _ref[_i];
            if (cls.indexOf("click") === 0) {
              Controller.dblclick[cls.replace("click", "")](point);
              return;
            }
          }
          if (point.nodeName === "SECTION") {
            return;
          }
          point = point.parentNode;
        }
      } catch (_error) {}
    }
  };

  return MouseEvent;

})();

var Plugins;

Plugins = (function() {
  var aryPlugins;

  aryPlugins = [];

  function Plugins(data) {
    var plugin, _i, _j, _len, _len1;
    for (_i = 0, _len = plugins.length; _i < _len; _i++) {
      plugin = plugins[_i];
      aryPlugins.push(eval("new " + plugin + "( )"));
    }
    for (_j = 0, _len1 = aryPlugins.length; _j < _len1; _j++) {
      plugin = aryPlugins[_j];
      plugin.init(data);
    }
  }

  Plugins.prototype.setDate = function(date) {
    var plugin, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = aryPlugins.length; _i < _len; _i++) {
      plugin = aryPlugins[_i];
      try {
        _results.push(plugin.setDate(date));
      } catch (_error) {}
    }
    return _results;
  };

  Plugins.prototype.setProperties = function() {
    var plugin, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = aryPlugins.length; _i < _len; _i++) {
      plugin = aryPlugins[_i];
      try {
        _results.push(plugin.setProperties());
      } catch (_error) {}
    }
    return _results;
  };

  Plugins.prototype.setConfigs = function() {
    var plugin, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = aryPlugins.length; _i < _len; _i++) {
      plugin = aryPlugins[_i];
      try {
        _results.push(plugin.setConfigs());
      } catch (_error) {}
    }
    return _results;
  };

  Plugins.prototype.setSchedules = function() {
    var plugin, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = aryPlugins.length; _i < _len; _i++) {
      plugin = aryPlugins[_i];
      try {
        _results.push(plugin.setSchedules());
      } catch (_error) {}
    }
    return _results;
  };

  Plugins.prototype.mouse = {
    clickEvent: function(evt) {
      var plugin, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = aryPlugins.length; _i < _len; _i++) {
        plugin = aryPlugins[_i];
        try {
          _results.push(plugin.mouse.clickEvent(evt));
        } catch (_error) {}
      }
      return _results;
    },
    swipeEvent: function(evt) {
      var plugin, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = aryPlugins.length; _i < _len; _i++) {
        plugin = aryPlugins[_i];
        try {
          _results.push(plugin.mouse.swipeEvent(evt));
        } catch (_error) {}
      }
      return _results;
    },
    dragUp: function(evt) {
      var plugin, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = aryPlugins.length; _i < _len; _i++) {
        plugin = aryPlugins[_i];
        try {
          _results.push(plugin.mouse.dragUp(evt));
        } catch (_error) {}
      }
      return _results;
    },
    dragMove: function(evt) {
      var plugin, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = aryPlugins.length; _i < _len; _i++) {
        plugin = aryPlugins[_i];
        try {
          _results.push(plugin.mouse.dragMove(evt));
        } catch (_error) {}
      }
      return _results;
    },
    dragDown: function(evt) {
      var plugin, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = aryPlugins.length; _i < _len; _i++) {
        plugin = aryPlugins[_i];
        try {
          _results.push(plugin.mouse.dragDown(evt));
        } catch (_error) {}
      }
      return _results;
    },
    dragTo: function(evt) {
      var plugin, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = aryPlugins.length; _i < _len; _i++) {
        plugin = aryPlugins[_i];
        try {
          _results.push(plugin.mouse.dragTo(evt));
        } catch (_error) {}
      }
      return _results;
    }
  };

  return Plugins;

})();

var PropertySetting;

PropertySetting = (function() {
  var align, data, dragging, heading, propertySetting;

  propertySetting = null;

  dragging = [];

  data = null;

  heading = {
    status: "進捗度",
    level: "重要度",
    project: "プロジェクト",
    category: "カテゴリー",
    tag: "タグ"
  };

  align = [
    {
      name: "両端",
      value: "justify"
    }, {
      name: "左",
      value: "left"
    }, {
      name: "中",
      value: "center"
    }, {
      name: "右",
      value: "right"
    }
  ];

  function PropertySetting() {
    var button, header, list, parent, startDayChange, textAlignChange, windowConfig, wrap;
    propertySetting = this;
    parent = Dom.get("nav");
    windowConfig = Dom.create(parent, "ul");
    windowConfig.classList.add("windowConfig");
    wrap = Dom.create(windowConfig, "li");
    header = Dom.create(wrap, "h4", "表示設定");
    list = Dom.create(wrap, "ul");
    startDayChange = Dom.create(list, "li", "週初の曜日");
    button = Dom.button(startDayChange);
    button.classList.add("click", "clickPropertySettingStartDayChange");
    textAlignChange = Dom.create(list, "li", "行揃え変更");
    button = Dom.button(textAlignChange);
    button.classList.add("click", "clickPropertySettingTextAlignChange");
  }

  PropertySetting.prototype.init = function(d) {
    data = d;
    return window.addEventListener("click", function(evt) {
      return PropertySetting.clickEvent(evt);
    });
  };

  PropertySetting.prototype.setProperties = function() {
    return this.statusSelector();
  };

  PropertySetting.prototype.setConfigs = function() {
    PropertySetting.view.startDayChange();
    return PropertySetting.view.textAlignChange();
  };

  PropertySetting.prototype.setDate = function() {};

  PropertySetting.prototype.setSchedules = function() {
    var cnt, i, item, k, s, schedule, schedules, stat, str, _i, _j, _len, _len1, _ref, _ref1, _results;
    _ref = Dom.gets(".propertySettingStatus");
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      item = _ref[_i];
      item.parentNode.removeChild(item);
    }
    _ref1 = data.getSchedules();
    _results = [];
    for (k in _ref1) {
      s = _ref1[k];
      if (k === "date") {
        _results.push((function() {
          var _j, _k, _len1, _len2, _ref2, _results1;
          _ref2 = data.getProperties().status;
          _results1 = [];
          for (i = _j = 0, _len1 = _ref2.length; _j < _len1; i = ++_j) {
            stat = _ref2[i];
            if (stat) {
              cnt = 0;
              for (_k = 0, _len2 = s.length; _k < _len2; _k++) {
                schedule = s[_k];
                if (stat && schedule && i === schedule.status) {
                  cnt++;
                }
              }
              _results1.push(Dom.create(Dom.get("body > nav"), "span", " " + stat.name + ":" + cnt + " ", Dom.get("body > nav > .windowConfig")).classList.add("propertySettingStatus"));
            } else {
              _results1.push(void 0);
            }
          }
          return _results1;
        })());
      } else {
        i = 0;
        for (_j = 0, _len1 = s.length; _j < _len1; _j++) {
          schedules = s[_j];
          if (schedules.status < 3) {
            i++;
          }
        }
        str = Dom.get("." + k + "Task").nextSibling.innerHTML.replace(/\(.+\)/, "");
        _results.push(Dom.get("." + k + "Task").nextSibling.innerHTML = str + " (未完了:" + i + ")");
      }
    }
    return _results;
  };

  PropertySetting.prototype.statusSelector = function() {
    var buttonWrapper, buttonWrapperParent, checkbox, i, item, key, label, name, parent, properties, stat, status, ul, wrap, _i, _j, _len, _len1, _ref, _results;
    parent = Dom.get("body>nav>ul");
    properties = data.getProperties();
    _ref = Dom.gets(".statusSelector", parent);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      item = _ref[_i];
      parent.removeChild(item);
    }
    _results = [];
    for (key in properties) {
      status = properties[key];
      if (key === "project" || key === "category" || key === "tag") {
        break;
      }
      wrap = Dom.create(parent, "li");
      wrap.classList.add("statusSelector");
      Dom.create(wrap, "h4", heading[key]);
      ul = Dom.create(wrap, "ul");
      for (i = _j = 0, _len1 = status.length; _j < _len1; i = ++_j) {
        stat = status[i];
        if (stat && !stat.finish && !stat["delete"]) {
          item = Dom.create(ul, "li");
          label = Dom.create(item, "label");
          checkbox = Dom.create(label, "input");
          checkbox.setAttribute("type", "checkbox");
          checkbox.setAttribute("checked", "checked");
          checkbox.classList.add("check", "checkSchedule" + key.charAt(0).toUpperCase() + key.substr(1) + i);
          label.innerHTML += stat.name;
          buttonWrapperParent = Dom.create(item, "div");
          buttonWrapper = Dom.create(buttonWrapperParent, "div");
          if (item.previousSibling) {
            Dom.create(buttonWrapper, "button", "△").classList.add("click", "clickPropertySettingStatusUp");
          }
          if ((status.length - 1) > i) {
            Dom.create(buttonWrapper, "button", "▽").classList.add("click", "clickPropertySettingStatusDown");
          }
          if (stat.name !== "未設定") {
            if (key === "project") {
              Dom.create(buttonWrapper, "button", "完了").classList.add("click", "clickPropertySettingStatusFinish");
            }
            if (key === "project" || key === "category" || key === "tag") {
              Dom.create(buttonWrapper, "button", "削除").classList.add("click", "clickPropertySettingStatusDelete");
            }
          }
        }
      }
      Dom.create(wrap, "input", status.name + "追加");
      name = key.charAt(0).toUpperCase() + key.substr(1);
      _results.push((function() {
        var _k, _len2, _ref1, _results1;
        _ref1 = [["追加", "Open"], ["取消", "Cancel"], ["追加", name]];
        _results1 = [];
        for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
          item = _ref1[_k];
          _results1.push(Dom.button(wrap, item[0]).classList.add("click", "clickPropertySetting" + "Status" + "Add", "statusAdd" + item[1]));
        }
        return _results1;
      })());
    }
    return _results;
  };

  PropertySetting.clickEvent = function(evt) {
    var cls, elements, i, num, point, schedule, status, str, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _results, _results1;
    if (point = MouseEvent.getPointer(evt, ".check")) {
      _ref = point.classList;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cls = _ref[_i];
        if (cls && cls.indexOf("check") === 0 && cls !== "check") {
          str = cls.replace("check", "");
          str = str.charAt(0).toLowerCase() + str.substr(1);
          elements = Dom.gets("." + str);
          status = str.replace("schedule", "").replace(/[0-9]/, "").toLowerCase();
        }
      }
      num = str.replace(/[A-Za-z]+/, "");
      _results = [];
      for (i = _j = 0, _len1 = elements.length; _j < _len1; i = ++_j) {
        schedule = elements[i];
        if (schedule.value === null) {
          schedule.value = 0;
        }
        if (point.checked) {
          schedule.value--;
        } else {
          schedule.value++;
        }
        if (schedule.value <= 0 && schedule.classList.contains("scheduleHidden")) {
          schedule.classList.remove("scheduleHidden");
        }
        if (schedule.value > 0 && !(schedule.classList.contains("scheduleHidden"))) {
          _results.push(schedule.classList.add("scheduleHidden"));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    } else if (point = MouseEvent.getPointer(evt, ".click")) {
      _ref1 = point.classList;
      _results1 = [];
      for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
        cls = _ref1[_k];
        if (cls.indexOf("click") === 0 && cls !== "click") {
          PropertySetting.click[cls.replace("clickPropertySetting", "")](evt);
          break;
        } else {
          _results1.push(void 0);
        }
      }
      return _results1;
    } else {

    }
  };

  PropertySetting.click = {
    StatusAdd: function(evt) {
      var cls, length, point, property, str, _i, _len, _ref, _results;
      point = Controller.getPointer(evt);
      _ref = point.classList;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cls = _ref[_i];
        if (cls && cls.indexOf("statusAdd") === 0) {
          str = cls.replace("statusAdd", "");
          switch (str) {
            case "Open":
              point.style.display = "none";
              point.previousSibling.style.display = "block";
              point.nextSibling.style.display = "block";
              _results.push(point.nextSibling.nextSibling.style.display = "block");
              break;
            case "Cancel":
              point.style.display = null;
              point.nextSibling.style.display = null;
              point.previousSibling.style.display = null;
              point.previousSibling.previousSibling.style.display = null;
              _results.push(point.previousSibling.previousSibling.value = null);
              break;
            default:
              str = str.charAt(0).toLowerCase() + str.substr(1);
              length = data.getProperties()[str].length;
              property = [];
              property[0] = {
                name: point.previousSibling.previousSibling.previousSibling.value,
                order: length,
                "delete": false,
                finish: false,
                parent: null,
                color: "inherit"
              };
              data.setProperties(str, property, PropertySetting.statusSelector);
              point.style.display = "none";
              point.previousSibling.style.display = "none";
              point.previousSibling.previousSibling.style.display = "block";
              point.previousSibling.previousSibling.previousSibling.style.display = "none";
              _results.push(point.previousSibling.previousSibling.previousSibling.value = "");
          }
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    },
    StatusUp: function(evt) {
      var f, from, p, property, query, t, tmp, to;
      p = Controller.getPointer(evt, "LI");
      property = Controller.get(p, "input", "checkSchedule");
      from = property.match(/\d/g);
      property = property.replace(/\d/, "").toLowerCase();
      to = Controller.get(p.previousSibling, "input", "checkSchedule").match(/\d/g);
      f = data.getProperties()[property][from];
      t = data.getProperties()[property][to];
      tmp = f.order;
      f.order = t.order;
      t.order = tmp;
      query = [t, f];
      return data.setProperties(property, query);
    },
    StatusDown: function(evt) {
      var f, from, p, property, query, t, tmp, to;
      p = Controller.getPointer(evt, "LI");
      property = Controller.get(p, "input", "checkSchedule");
      from = property.match(/\d/g);
      property = property.replace(/\d/, "").toLowerCase();
      to = Controller.get(p.nextSibling, "input", "checkSchedule").match(/\d/g);
      f = data.getProperties()[property][from];
      t = data.getProperties()[property][to];
      tmp = f.order;
      f.order = t.order;
      t.order = tmp;
      query = [t, f];
      return data.setProperties(property, query);
    },
    StatusColor: function(evt) {},
    StatusFinish: function(evt) {
      var id, p, property, query;
      p = Controller.getPointer(evt, "LI");
      property = Controller.get(p, "input", "checkSchedule");
      id = property.match(/\d/g);
      property = property.replace(/\d/, "").toLowerCase();
      query = [];
      query[0] = data.getProperties()[property][id];
      query[0].finish = true;
      return data.setProperties(property, query);
    },
    StatusDelete: function(evt) {
      var id, p, property, query;
      p = Controller.getPointer(evt, "LI");
      property = Controller.get(p, "input", "checkSchedule");
      id = property.match(/\d/g);
      property = property.replace(/\d/, "").toLowerCase();
      query = [];
      query[0] = data.getProperties()[property][id];
      query[0]["delete"] = true;
      return data.setProperties(property, query);
    },
    StartDayChange: function(evt) {
      var offsetDay;
      offsetDay = 0;
      if ((data.getConfigs().offsetDay) && (!isNaN(data.getConfigs().offsetDay.value))) {
        offsetDay = data.getConfigs().offsetDay.value;
      }
      offsetDay = parseInt((++offsetDay) % 7);
      return data.setConfigs({
        name: "offsetDay",
        value: offsetDay
      });
    },
    TextAlignChange: function(evt) {
      var textAlign;
      textAlign = 0;
      if ((data.getConfigs().textAlign) && (!isNaN(data.getConfigs().textAlign.value))) {
        textAlign = data.getConfigs().textAlign.value;
      }
      textAlign = parseInt((++textAlign) % align.length);
      return data.setConfigs({
        name: "textAlign",
        value: textAlign
      });
    }
  };

  PropertySetting.view = {
    startDayChange: function() {
      var calendar, cls, cols, i, monthDays, offsetDay, startDay, _i, _j, _k, _len, _ref, _ref1;
      offsetDay = 0;
      if ((data.getConfigs().offsetDay) && (!isNaN(data.getConfigs().offsetDay.value))) {
        offsetDay = data.getConfigs().offsetDay.value;
      }
      calendar = Dom.get("body > ul");
      monthDays = calendar.childNodes.length;
      _ref = calendar.firstChild.classList;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cls = _ref[_i];
        if (cls.indexOf("day") === 0 && cls !== "day") {
          startDay = parseInt(cls.replace("day", ""));
        }
      }
      Dom.get(".clickPropertySettingStartDayChange").innerHTML = Controller.days[offsetDay % 7];
      for (i = _j = 0, _ref1 = Controller.days.length; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
        if (calendar.classList.contains("startDay" + i)) {
          calendar.classList.remove("startDay" + i);
        }
      }
      calendar.classList.add("startDay" + ((7 + startDay - offsetDay) % 7));
      for (i = _k = 4; _k <= 6; i = ++_k) {
        if (calendar.classList.contains("cols" + i)) {
          calendar.classList.remove("cols" + i);
        }
      }
      cols = Math.ceil((monthDays + (7 + startDay - offsetDay) % 7) / 7);
      calendar.classList.add("cols" + cols);
      return offsetDay;
    },
    textAlignChange: function() {
      var textAlign;
      textAlign = 0;
      if ((data.getConfigs().textAlign) && (!isNaN(data.getConfigs().textAlign.value))) {
        textAlign = data.getConfigs().textAlign.value;
      }
      Dom.get(".clickPropertySettingTextAlignChange").innerHTML = align[textAlign].name;
      return document.body.style.textAlign = align[textAlign].value;
    }
  };

  return PropertySetting;

})();

var View;

View = (function() {
  var calendar, form, item, nav, tasks;

  form = [];

  nav = null;

  calendar = null;

  tasks = null;

  item = null;

  function View() {
    nav = Dom.create(document.body, "nav");
    calendar = Dom.create(document.body, "ul");
    tasks = Dom.create(document.body, "section");
    form.base = Dom.create(document.body, "form");
    Dom.button(nav, "◁").classList.add("clickPrevMonth");
    Dom.create(nav, "h1");
    Dom.button(nav, "▷").classList.add("clickNextMonth");
    Dom.create(document.body, "div", "当月予定").classList.add("dragTo", "dragToMonth");
    Dom.create(document.body, "div", "当年予定").classList.add("dragTo", "dragToYear");
    Dom.create(document.body, "div", "日時未定").classList.add("dragTo", "dragToSomeday");
    Dom.create(document.body, "div", "次月").classList.add("dragTo", "dragToNextMonth");
    Dom.create(document.body, "div", "前月").classList.add("dragTo", "dragToPrevMonth");
    Dom.button(nav, "設定").classList.add("clickNav");
    View.calendarHeightChange();
    form.date = Dom.label(form.base, "input", "日付");
    form.date.setAttribute("disabled", "disabled");
    form.title = Dom.label(form.base, "input", "タイトル");
    form.content = Dom.label(form.base, "textarea", "内容");
    form.id = Dom.create(form.base, "input");
    form.id.setAttribute("type", "hidden");
    Dom.button(form.base, "保存").classList.add("clickScheduleSubmit");
    Dom.button(form.base, "戻る").classList.add("clickScheduleCancel");
  }

  View.prototype.getForm = function(args) {
    return form[args];
  };

  View.getId = function(elem) {
    var cls, _i, _len, _ref;
    while (elem.nodeName !== "BODY") {
      _ref = elem.classList;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cls = _ref[_i];
        if (cls.indexOf("id") === 0) {
          return cls.match(/\d.*/g);
        }
      }
      elem = elem.parentNode;
    }
    return false;
  };

  View.calendarHeightChange = function() {
    var bottom;
    if (tasks.offsetHeight > form.base.offsetHeight) {
      bottom = tasks.offsetHeight;
    } else {
      bottom = form.base.offsetHeight;
    }
    return calendar.style.height = (window.innerHeight - nav.offsetHeight - bottom - 1) + "px";
  };

  View.setCalendar = function(date) {
    while (calendar.hasChildNodes()) {
      calendar.removeChild(calendar.firstChild);
    }
    while (tasks.hasChildNodes()) {
      tasks.removeChild(tasks.firstChild);
    }
    while (calendar.classList.length > 0) {
      calendar.classList.remove(calendar.classList[0]);
    }
    calendar.classList.add("startDay" + (date.startDay % 7), "cols" + Math.ceil((date.monthDays + (date.startDay % 7) + 1) / 7));
    Dom.get("nav h1").innerHTML = date.year + "年 " + (date.month + 1) + "月";
    return View.setDays(date);
  };

  View.setDays = function(date) {
    var i, k, oneDay, today, wrapper, _i, _j, _len, _ref, _ref1;
    for (i = _i = 0, _ref = date.monthDays; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
      oneDay = Dom.create(calendar, "li");
      Dom.create(oneDay, "span", i + 1);
      Dom.create(oneDay, "ul");
      oneDay.classList.add("clickDay", "day", "day" + (date.startDay + i) % 7);
      wrapper = Dom.create(oneDay, "section");
      Dom.create(wrapper, "h1", date.date + "/" + (i + 1));
      Dom.create(wrapper, "ul");
      Dom.button(wrapper, "追加").classList.add("clickScheduleAdd");
      Dom.button(wrapper, "閉じる").classList.add("clickScheduleClose");
    }
    today = new Date();
    if (date.year === today.getFullYear() && date.month === today.getMonth()) {
      Dom.gets("li", calendar).item(today.getDate() - 1).classList.add("today");
    }
    tasks.innerHTML = "";
    Dom.create(tasks, "h1");
    _ref1 = [["someday", "未定"], ["year", date.year], ["month", date.year + "/" + (date.month + 1)]];
    for (_j = 0, _len = _ref1.length; _j < _len; _j++) {
      k = _ref1[_j];
      Dom.create(tasks, "ul").classList.add(k[0] + "Task");
      Dom.button(tasks, k[1]).classList.add("clickTasks");
    }
    Dom.button(tasks, "追加").classList.add("clickScheduleAdd");
    return Dom.button(tasks, "閉じる").classList.add("clickTasks");
  };

  View.prototype.setSchedules = function(schedules, properties) {
    var day, k, key, result, s, schedule, status, str, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2;
    _ref = calendar.childNodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      day = _ref[_i];
      _ref1 = Dom.gets("ul > li", day);
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        schedule = _ref1[_j];
        schedule.parentNode.removeChild(schedule);
      }
    }
    _ref2 = Dom.gets("ul > li", tasks);
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      schedule = _ref2[_k];
      schedule.parentNode.removeChild(schedule);
    }
    for (k in schedules) {
      s = schedules[k];
      for (_l = 0, _len3 = s.length; _l < _len3; _l++) {
        result = s[_l];
        if (k === "date") {
          day = calendar.childNodes[parseInt(result.date.getDate() - 1)];
          View.drawSchedule(properties, result.date, result, Dom.get("section > ul", day));
          schedule = Dom.create(Dom.get("ul", day), "li", result.title);
          schedule.classList.add("id" + result.id, "scheduleTitle", "draggable");
          for (key in properties) {
            status = properties[key];
            if (!result[key] || result[key] === 0) {
              result[key] = 1;
            }
            str = key.charAt(0).toUpperCase() + key.substr(1);
            schedule.classList.add("schedule" + str + result[key]);
          }
        } else {
          View.drawSchedule(properties, result.date, result, Dom.get("." + k + "Task", tasks));
        }
      }
    }
    return Controller.setEvent();
  };

  View.drawSchedule = function(properties, date, result, elem) {
    var i, key, property, propertySelect, scheduleItem, scheduleProperty, scheduleSect, stat, strProperty, _i, _len;
    if (result && result.date === date) {
      scheduleItem = Dom.create(elem, "li");
      scheduleSect = Dom.create(scheduleItem, "dl");
      scheduleSect.classList.add("id" + result.id);
      Dom.create(scheduleSect, "dt", result.title).classList.add("scheduleTitle", "clickScheduleTitle", "draggable");
      Dom.create(scheduleSect, "dd", result.content).classList.add("clickScheduleContent");
      for (key in properties) {
        property = properties[key];
        if (!result[key] || result[key] === 0) {
          result[key] = 1;
        }
        strProperty = key.charAt(0).toUpperCase() + key.substr(1);
        scheduleItem.classList.add("schedule" + strProperty + result[key]);
        scheduleProperty = Dom.create(scheduleSect, "dd");
        propertySelect = Dom.create(scheduleProperty, "select");
        propertySelect.classList.add("select", "selectSchedule" + strProperty + result[key]);
        i = 0;
        for (_i = 0, _len = property.length; _i < _len; _i++) {
          stat = property[_i];
          if (stat) {
            Dom.create(propertySelect, "option", stat.name).classList.add("schedule" + strProperty + stat.id);
            if (stat.id === result[key]) {
              propertySelect.selectedIndex = i;
            }
            i++;
          }
        }
      }
      return Dom.create(scheduleSect, "dd", "削除").classList.add("clickScheduleDelete");
    }
  };

  View.prototype.form = {
    check: function(data) {
      var flg, id;
      flg = true;
      if (id = form.id.value) {
        if ((form.title.value !== item.title) || (form.content.value !== item.content)) {
          flg = confirm("内容が変更中です。本当に閉じますか？");
        }
      } else if (form.title.value || form.content.value) {
        flg = confirm("入力中の内容があります。本当に閉じますか？");
      }
      return flg;
    },
    close: function() {
      form.date.value = null;
      form.title.value = null;
      form.content.value = null;
      form.id.value = null;
      form.base.style.display = null;
      item = null;
      try {
        Dom.get(" body > ul > .keep > section").style.display = null;
      } catch (_error) {}
      return View.calendarHeightChange();
    },
    scheduleAdd: function(date) {
      form.base.style.display = "block";
      form.date.value = date;
      Dom.get(document, " body > ul > .keep > section").item(0).style.display = "none";
      return View.caluendarHeightChange();
    },
    scheduleUpdate: function(i) {
      item = i;
      form.base.style.display = "block";
      if (typeof item.date === "string") {
        form.date.value = item.date;
      } else {
        form.date.value = item.date.getFullYear() + "/" + (item.date.getMonth() + 1) + "/" + item.date.getDate();
      }
      form.title.value = item.title;
      form.content.value = item.content;
      form.id.value = item.id;
      Dom.get(" body > ul > .keep > section").style.display = "none";
      return View.caluendarHeightChange();
    }
  };

  return View;

})();
