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
    var elem, i, len, ref, results;
    ref = Dom.gets("select");
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      elem = ref[i];
      results.push(elem.addEventListener("change", function() {
        return data.setScheduleStatus(this);
      }));
    }
    return results;
  };

  Controller.click = {
    PrevMonth: function() {
      return controller.setDate(-1);
    },
    NextMonth: function() {
      return controller.setDate(1);
    },
    Day: function(target) {
      var calendar, day, i, len, ref;
      if (view.form.check(data)) {
        view.form.close();
        calendar = Dom.get("body > ul");
        ref = calendar.childNodes;
        for (i = 0, len = ref.length; i < len; i++) {
          day = ref[i];
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
      var child, date, i, len, ref, title;
      target.parentNode.classList.toggle("keep");
      ref = target.parentNode.childNodes;
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
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

var FileInOut;

FileInOut = (function() {
  var click, data, fileInOut, menu, prefix;

  fileInOut = null;

  click = "click";

  prefix = "fileInOut";

  menu = null;

  data = null;

  function FileInOut() {
    var btnAllDelete, btnExport, btnImport, btnPropertyExport, parent;
    fileInOut = this;
    parent = Dom.get("nav");
    Dom.button(parent, "ファイル", Dom.get(".menu")).addEventListener("click", function() {
      if (menu.style.display === "none") {
        return menu.style.display = "";
      } else {
        return menu.style.display = "none";
      }
    });
    menu = Dom.create(Dom.get(".menu"), "div");
    menu.classList.add("fileMenu");
    menu.style.display = "none";
    btnExport = Dom.label(menu, "input", "予定のエクスポート");
    btnExport.value = "ダウンロード";
    btnExport.type = "button";
    btnExport.addEventListener("click", function() {
      var value;
      return value = data.storeExport("store", fileInOut.download);
    });
    btnImport = Dom.label(menu, "input", "予定のインポート");
    btnImport.type = "file";
    btnImport.addEventListener("change", function(evt) {
      var files, reader;
      files = evt.target.files;
      reader = new FileReader();
      reader.readAsText(files[0]);
      return reader.onload = function() {
        var res;
        res = JSON.parse(reader.result);
        return data.setSchedules(res);
      };
    });
    btnAllDelete = Dom.label(menu, "input", "予定の全消去");
    btnAllDelete.type = "button";
    btnAllDelete.value = "実行";
    btnAllDelete.addEventListener("click", function() {
      if (confirm("全予定を消去しますか？")) {
        return data.scheduleAllDelete();
      }
    });
    btnPropertyExport = Dom.label(menu, "input", "付加情報のエクスポート");
    btnPropertyExport.value = "ダウンロード";
    btnPropertyExport.type = "button";
    btnPropertyExport.addEventListener("click", function() {
      var value;
      return value = data.propertyExport(fileInOut.download);
    });
  }

  FileInOut.prototype.download = function(value, name) {
    var blob, d, date, elem, filename;
    d = new Date();
    date = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + "-" + d.getHours() + "-" + d.getMinutes();
    filename = "export-" + name + "-" + date + ".json";
    blob = new Blob([JSON.stringify(value)]);
    elem = document.createElement("a");
    elem.download = filename;
    elem.href = window.URL.createObjectURL(blob);
    return elem.click();
  };

  FileInOut.prototype.init = function(d) {
    return data = d;
  };

  return FileInOut;

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
    var calendar, day, i, len, ref, results, span, target;
    calendar = Dom.get("body > ul");
    if (data.items) {
      ref = data.items;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        day = ref[i];
        target = calendar.childNodes[parseInt(day.start.date.split("-")[2]) - 1].querySelector("span");
        span = Dom.create(target, "span", day.summary);
        span.classList.add("holidayName");
        span.style.marginLeft = ".25em";
        results.push(target.parentNode.classList.add("holiday"));
      }
      return results;
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
    request = this.iDB.open(this.dbName, 11);
    request.onupgradeneeded = function(evt) {
      var config, d, database, i, j, k, len, len1, name, property, ref, schedule, transaction;
      database = evt.target.result;
      if (evt.oldVersion <= 1) {
        transaction = evt.target.transaction;
        schedule = database.createObjectStore("store", {
          keyPath: 'id',
          autoIncrement: true
        });
        schedule.createIndex("date", "date", {
          unique: false
        });
        schedule.createIndex("order", "order", {
          unique: false
        });
        schedule.createIndex("parent", "parent", {
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
        for (j = 0, len = initialData.length; j < len; j++) {
          d = initialData[j];
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
          ref = d.array;
          for (i = k = 0, len1 = ref.length; k < len1; i = ++k) {
            name = ref[i];
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
      if (evt.oldVersion <= 10) {
        transaction = evt.target.transaction;
        schedule = transaction.objectStore("store");
        schedule.createIndex("project", "project", {
          unique: false
        });
        request = schedule.openCursor();
        return request.onsuccess = function() {
          var data, key, q, value;
          if (this.result) {
            q = this.result.value;
            if (q.title) {
              data = {
                date: "",
                content: "",
                post_date: new Date(),
                start_day: null,
                finish_day: null,
                status: 1,
                level: 1,
                project: 1,
                category: 1,
                parent: null
              };
              for (key in q) {
                value = q[key];
                data[key] = value;
              }
              request = schedule.put(data);
              return request.onerror = function(evt) {
                return alert("error");
              };
            }
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
        var d, data, j, key, last, len, q, value;
        if (this.result) {
          last = this.result.value.order + 1;
        } else {
          last = 0;
        }
        for (j = 0, len = query.length; j < len; j++) {
          q = query[j];
          if (q.title) {
            data = {
              title: "",
              date: "",
              content: "",
              post_date: new Date(),
              start_day: null,
              finish_day: null,
              status: 1,
              level: 1,
              project: 1,
              category: 1
            };
            if (typeof q.date === "string") {
              if (q.date.indexOf("/") > 0) {
                if ((d = q.date.split("/")) && (d.length === 3)) {
                  q.date = new Date(d[0], d[1] - 1, d[2]);
                }
              } else {
                q.date = new Date(q.date);
                if (q.date.toString() === "Invalid Date") {
                  q.date = "";
                }
              }
            }
            if (!q.parent) {
              q.parent = null;
            }
            if (!q.order) {
              q.order = last++;
            }
            for (key in q) {
              value = q[key];
              data[key] = value;
            }
            request = schedule.put(data);
            request.onerror = function(evt) {
              return alert("error");
            };
          }
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
    var cls, j, len, query, ref, results, str;
    query = [];
    query[0] = q;
    ref = elem.classList;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      cls = ref[j];
      if (cls && cls !== "select" && cls.indexOf("select") === 0) {
        str = cls.replace("selectSchedule", "").toLowerCase().replace(/\d+/, "");
        query[0][str] = parseInt(elem.selectedIndex + 1);
        results.push(model.setSchedules(query));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  Model.prototype.scheduleAllDelete = function() {
    var request, schedule, transaction;
    transaction = db.transaction(["store"], "readwrite");
    schedule = transaction.objectStore("store");
    request = schedule.openCursor();
    request.onsuccess = function() {
      var cursor;
      cursor = this.result;
      if (cursor) {
        schedule["delete"](cursor.value.id);
        return cursor["continue"]();
      }
    };
    return transaction.oncomplete = function() {
      return model.loadSchedules();
    };
  };

  Model.prototype.loadProperties = function() {
    var j, k, len, len1, request, store, t, target, transaction;
    target = [];
    properties = [];
    for (j = 0, len = initialData.length; j < len; j++) {
      t = initialData[j];
      target.push(t.name);
      properties[t.name] = [];
    }
    transaction = db.transaction(target, "readonly");
    for (k = 0, len1 = target.length; k < len1; k++) {
      t = target[k];
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
    var j, len, q, request, store, transaction;
    transaction = db.transaction([target], "readwrite");
    store = transaction.objectStore(target);
    for (j = 0, len = query.length; j < len; j++) {
      q = query[j];
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

  Model.prototype.storeExport = function(name, callback) {
    var array, request, store, transaction;
    transaction = db.transaction([name], "readonly");
    store = transaction.objectStore(name);
    array = [];
    request = store.openCursor();
    request.onsuccess = function() {
      var cursor;
      cursor = this.result;
      if (cursor) {
        array.push(cursor.value);
        return cursor["continue"]();
      }
    };
    return transaction.oncomplete = function() {
      return callback(array, name);
    };
  };

  Model.prototype.propertyExport = function(callback) {
    var data, j, len, results;
    results = [];
    for (j = 0, len = initialData.length; j < len; j++) {
      data = initialData[j];
      results.push(model.storeExport(data.name, callback));
    }
    return results;
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
      var day, i, j, len, ref, to;
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
        ref = Dom.get("body > ul").childNodes;
        for (i = j = 0, len = ref.length; j < len; i = ++j) {
          day = ref[i];
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
      var dragTo, j, len, ref, results;
      ref = Dom.gets(".dragTo");
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        dragTo = ref[j];
        if (bool) {
          results.push(dragTo.style.display = "block");
        } else {
          dragTo.style.opacity = null;
          results.push(dragTo.style.display = null);
        }
      }
      return results;
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
      var cls, j, len, point, ref;
      window.removeEventListener("click", MouseEvent.mouse.clickEvent);
      MouseEvent.mouse.dragTo(false);
      try {
        point = MouseEvent.getPointer(evt);
        while (!(point.nodeName === "BODY")) {
          ref = point.classList;
          for (j = 0, len = ref.length; j < len; j++) {
            cls = ref[j];
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
      var cls, j, len, point, ref;
      window.removeEventListener("dblclick", MouseEvent.mouse.doubleclickEvent);
      MouseEvent.mouse.dragTo(false);
      try {
        point = MouseEvent.getPointer(evt);
        while (!(point.nodeName === "BODY")) {
          ref = point.classList;
          for (j = 0, len = ref.length; j < len; j++) {
            cls = ref[j];
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
    var i, j, len, len1, plugin;
    for (i = 0, len = plugins.length; i < len; i++) {
      plugin = plugins[i];
      aryPlugins.push(eval("new " + plugin + "( )"));
    }
    for (j = 0, len1 = aryPlugins.length; j < len1; j++) {
      plugin = aryPlugins[j];
      plugin.init(data);
    }
  }

  Plugins.prototype.setDate = function(date) {
    var i, len, plugin, results;
    results = [];
    for (i = 0, len = aryPlugins.length; i < len; i++) {
      plugin = aryPlugins[i];
      try {
        results.push(plugin.setDate(date));
      } catch (_error) {}
    }
    return results;
  };

  Plugins.prototype.setProperties = function() {
    var i, len, plugin, results;
    results = [];
    for (i = 0, len = aryPlugins.length; i < len; i++) {
      plugin = aryPlugins[i];
      try {
        results.push(plugin.setProperties());
      } catch (_error) {}
    }
    return results;
  };

  Plugins.prototype.setConfigs = function() {
    var i, len, plugin, results;
    results = [];
    for (i = 0, len = aryPlugins.length; i < len; i++) {
      plugin = aryPlugins[i];
      try {
        results.push(plugin.setConfigs());
      } catch (_error) {}
    }
    return results;
  };

  Plugins.prototype.setSchedules = function() {
    var i, len, plugin, results;
    results = [];
    for (i = 0, len = aryPlugins.length; i < len; i++) {
      plugin = aryPlugins[i];
      try {
        results.push(plugin.setSchedules());
      } catch (_error) {}
    }
    return results;
  };

  Plugins.prototype.mouse = {
    clickEvent: function(evt) {
      var i, len, plugin, results;
      results = [];
      for (i = 0, len = aryPlugins.length; i < len; i++) {
        plugin = aryPlugins[i];
        try {
          results.push(plugin.mouse.clickEvent(evt));
        } catch (_error) {}
      }
      return results;
    },
    swipeEvent: function(evt) {
      var i, len, plugin, results;
      results = [];
      for (i = 0, len = aryPlugins.length; i < len; i++) {
        plugin = aryPlugins[i];
        try {
          results.push(plugin.mouse.swipeEvent(evt));
        } catch (_error) {}
      }
      return results;
    },
    dragUp: function(evt) {
      var i, len, plugin, results;
      results = [];
      for (i = 0, len = aryPlugins.length; i < len; i++) {
        plugin = aryPlugins[i];
        try {
          results.push(plugin.mouse.dragUp(evt));
        } catch (_error) {}
      }
      return results;
    },
    dragMove: function(evt) {
      var i, len, plugin, results;
      results = [];
      for (i = 0, len = aryPlugins.length; i < len; i++) {
        plugin = aryPlugins[i];
        try {
          results.push(plugin.mouse.dragMove(evt));
        } catch (_error) {}
      }
      return results;
    },
    dragDown: function(evt) {
      var i, len, plugin, results;
      results = [];
      for (i = 0, len = aryPlugins.length; i < len; i++) {
        plugin = aryPlugins[i];
        try {
          results.push(plugin.mouse.dragDown(evt));
        } catch (_error) {}
      }
      return results;
    },
    dragTo: function(evt) {
      var i, len, plugin, results;
      results = [];
      for (i = 0, len = aryPlugins.length; i < len; i++) {
        plugin = aryPlugins[i];
        try {
          results.push(plugin.mouse.dragTo(evt));
        } catch (_error) {}
      }
      return results;
    }
  };

  return Plugins;

})();

var PropertySetting;

PropertySetting = (function() {
  var align, click, data, dragging, heading, prefix, propertySetting, windowConfig;

  propertySetting = null;

  windowConfig = null;

  dragging = [];

  data = null;

  click = "click";

  prefix = "PropertySetting";

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
    var button, header, list, parent, startDayChange, textAlignChange, wrap;
    propertySetting = this;
    parent = Dom.get("nav");
    Dom.button(parent, "表示", Dom.get(".menu")).addEventListener("click", function() {
      if (windowConfig.style.display === "none") {
        return windowConfig.style.display = "flex";
      } else {
        return windowConfig.style.display = "none";
      }
    });
    windowConfig = Dom.create(Dom.get(".menu"), "ul");
    windowConfig.classList.add("windowConfig");
    windowConfig.style.display = "none";
    View.calendarHeightChange();
    wrap = Dom.create(windowConfig, "li");
    header = Dom.create(wrap, "h4", "表示設定");
    list = Dom.create(wrap, "ul");
    startDayChange = Dom.create(list, "li", "週初の曜日");
    button = Dom.button(startDayChange);
    button.classList.add(click, click + prefix + "StartDayChange");
    textAlignChange = Dom.create(list, "li", "行揃え変更");
    button = Dom.button(textAlignChange);
    button.classList.add(click, click + prefix + "TextAlignChange");
  }

  PropertySetting.prototype.init = function(d) {
    data = d;
    return window.addEventListener(click, function(evt) {
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
    var cnt, i, item, j, k, l, len, len1, ref, ref1, results, s, schedule, schedules, stat, str;
    ref = Dom.gets("." + prefix + "Status");
    for (j = 0, len = ref.length; j < len; j++) {
      item = ref[j];
      item.parentNode.removeChild(item);
    }
    ref1 = data.getSchedules();
    results = [];
    for (k in ref1) {
      s = ref1[k];
      if (k === "date") {
        results.push((function() {
          var l, len1, len2, m, ref2, results1;
          ref2 = data.getProperties().status;
          results1 = [];
          for (i = l = 0, len1 = ref2.length; l < len1; i = ++l) {
            stat = ref2[i];
            if (stat) {
              cnt = 0;
              for (m = 0, len2 = s.length; m < len2; m++) {
                schedule = s[m];
                if (stat && schedule && i === schedule.status) {
                  cnt++;
                }
              }
              results1.push(Dom.create(Dom.get("body > nav"), "span", " " + stat.name + ":" + cnt + " ", Dom.get(".menu")).classList.add(prefix + "Status"));
            } else {
              results1.push(void 0);
            }
          }
          return results1;
        })());
      } else {
        i = 0;
        for (l = 0, len1 = s.length; l < len1; l++) {
          schedules = s[l];
          if (schedules.status < 3) {
            i++;
          }
        }
        str = Dom.get("." + k + "Task").nextSibling.innerHTML.replace(/\(.+\)/, "");
        results.push(Dom.get("." + k + "Task").nextSibling.innerHTML = str + " (未完了:" + i + ")");
      }
    }
    return results;
  };

  PropertySetting.prototype.statusSelector = function() {
    var buttonWrapper, buttonWrapperParent, checkbox, i, item, j, key, l, label, len, len1, name, parent, properties, ref, results, stat, status, ul, wrap;
    parent = Dom.get(".windowConfig");
    properties = data.getProperties();
    ref = Dom.gets(".statusSelector", parent);
    for (j = 0, len = ref.length; j < len; j++) {
      item = ref[j];
      parent.removeChild(item);
    }
    results = [];
    for (key in properties) {
      status = properties[key];
      wrap = Dom.create(parent, "li");
      wrap.classList.add("statusSelector");
      Dom.create(wrap, "h4", heading[key]);
      ul = Dom.create(wrap, "ul");
      for (i = l = 0, len1 = status.length; l < len1; i = ++l) {
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
            Dom.create(buttonWrapper, "button", "▲").classList.add(click, click + prefix + "StatusUp");
          }
          if ((status.length - 1) > i) {
            Dom.create(buttonWrapper, "button", "▼").classList.add(click, click + prefix + "StatusDown");
          }
          if (stat.name !== "未設定") {
            if (key === "project") {
              Dom.create(buttonWrapper, "button", "完了").classList.add(click, click + prefix + "StatusFinish");
            }
            if (key === "project" || key === "category" || key === "tag") {
              Dom.create(buttonWrapper, "button", "削除").classList.add(click, click + prefix + "StatusDelete");
            }
          }
        }
      }
      Dom.create(wrap, "input", status.name + "追加");
      name = key.charAt(0).toUpperCase() + key.substr(1);
      results.push((function() {
        var len2, m, ref1, results1;
        ref1 = [["追加", "Open"], ["取消", "Cancel"], ["追加", name]];
        results1 = [];
        for (m = 0, len2 = ref1.length; m < len2; m++) {
          item = ref1[m];
          results1.push(Dom.button(wrap, item[0]).classList.add(click, click + prefix + "Status" + "Add", "statusAdd" + item[1]));
        }
        return results1;
      })());
    }
    return results;
  };

  PropertySetting.clickEvent = function(evt) {
    var cls, elements, i, j, l, len, len1, len2, m, num, point, ref, ref1, results, results1, schedule, status, str;
    if (point = MouseEvent.getPointer(evt, ".check")) {
      ref = point.classList;
      for (j = 0, len = ref.length; j < len; j++) {
        cls = ref[j];
        if (cls && cls.indexOf("check") === 0 && cls !== "check") {
          str = cls.replace("check", "");
          str = str.charAt(0).toLowerCase() + str.substr(1);
          elements = Dom.gets("." + str);
          status = str.replace("schedule", "").replace(/[0-9]/, "").toLowerCase();
        }
      }
      num = str.replace(/[A-Za-z]+/, "");
      results = [];
      for (i = l = 0, len1 = elements.length; l < len1; i = ++l) {
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
          results.push(schedule.classList.add("scheduleHidden"));
        } else {
          results.push(void 0);
        }
      }
      return results;
    } else if (point = MouseEvent.getPointer(evt, ".click")) {
      ref1 = point.classList;
      results1 = [];
      for (m = 0, len2 = ref1.length; m < len2; m++) {
        cls = ref1[m];
        if (cls.indexOf(click) === 0 && cls !== click) {
          PropertySetting.click[cls.replace(click + prefix, "")](evt);
          break;
        } else {
          results1.push(void 0);
        }
      }
      return results1;
    } else {

    }
  };

  PropertySetting.click = {
    StatusAdd: function(evt) {
      var cls, j, len, length, point, property, ref, results, str;
      point = MouseEvent.getPointer(evt, "." + click + prefix + "StatusAdd");
      ref = point.classList;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        cls = ref[j];
        if (cls && cls.indexOf("statusAdd") === 0) {
          str = cls.replace("statusAdd", "");
          switch (str) {
            case "Open":
              point.style.display = "none";
              point.previousSibling.style.display = "block";
              point.nextSibling.style.display = "block";
              results.push(point.nextSibling.nextSibling.style.display = "block");
              break;
            case "Cancel":
              point.style.display = null;
              point.nextSibling.style.display = null;
              point.previousSibling.style.display = null;
              point.previousSibling.previousSibling.style.display = null;
              results.push(point.previousSibling.previousSibling.value = null);
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
              results.push(point.previousSibling.previousSibling.previousSibling.value = "");
          }
        } else {
          results.push(void 0);
        }
      }
      return results;
    },
    StatusUp: function(evt) {
      var f, from, p, property, query, t, tmp, to;
      p = MouseEvent.getPointer(evt, "LI");
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
      p = MouseEvent.getPointer(evt, "LI");
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
      var cls, id, j, len, p, property, query, ref;
      p = MouseEvent.getPointer(evt, "LI");
      ref = Dom.get(".check", p).classList;
      for (j = 0, len = ref.length; j < len; j++) {
        cls = ref[j];
        if (cls.indexOf("checkSchedule") === 0) {
          property = cls.replace("checkSchedule", "");
        }
      }
      id = property.match(/\d/g);
      property = property.replace(/\d/, "").toLowerCase();
      query = [];
      query[0] = data.getProperties()[property][id];
      query[0].finish = true;
      return data.setProperties(property, query);
    },
    StatusDelete: function(evt) {
      var cls, id, j, len, p, property, query, ref;
      p = MouseEvent.getPointer(evt, "LI");
      ref = Dom.get(".check", p).classList;
      for (j = 0, len = ref.length; j < len; j++) {
        cls = ref[j];
        if (cls.indexOf("checkSchedule") === 0) {
          property = cls.replace("checkSchedule", "");
        }
      }
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
      var calendar, cls, cols, i, j, l, len, m, monthDays, offsetDay, ref, ref1, startDay;
      offsetDay = 0;
      if ((data.getConfigs().offsetDay) && (!isNaN(data.getConfigs().offsetDay.value))) {
        offsetDay = data.getConfigs().offsetDay.value;
      }
      calendar = Dom.get("body > ul");
      monthDays = calendar.childNodes.length;
      ref = calendar.firstChild.classList;
      for (j = 0, len = ref.length; j < len; j++) {
        cls = ref[j];
        if (cls.indexOf("day") === 0 && cls !== "day") {
          startDay = parseInt(cls.replace("day", ""));
        }
      }
      Dom.get(".clickPropertySettingStartDayChange").innerHTML = Controller.days[offsetDay % 7];
      for (i = l = 0, ref1 = Controller.days.length; 0 <= ref1 ? l <= ref1 : l >= ref1; i = 0 <= ref1 ? ++l : --l) {
        if (calendar.classList.contains("startDay" + i)) {
          calendar.classList.remove("startDay" + i);
        }
      }
      calendar.classList.add("startDay" + ((7 + startDay - offsetDay) % 7));
      for (i = m = 4; m <= 6; i = ++m) {
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
    Dom.create(nav, "div").classList.add("menu");
    Dom.create(document.body, "div", "当月予定").classList.add("dragTo", "dragToMonth");
    Dom.create(document.body, "div", "当年予定").classList.add("dragTo", "dragToYear");
    Dom.create(document.body, "div", "日時未定").classList.add("dragTo", "dragToSomeday");
    Dom.create(document.body, "div", "次月").classList.add("dragTo", "dragToNextMonth");
    Dom.create(document.body, "div", "前月").classList.add("dragTo", "dragToPrevMonth");
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
    var cls, j, len, ref;
    while (elem.nodeName !== "BODY") {
      ref = elem.classList;
      for (j = 0, len = ref.length; j < len; j++) {
        cls = ref[j];
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
    var i, j, k, l, len, oneDay, ref, ref1, today, wrapper;
    for (i = j = 0, ref = date.monthDays; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
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
    ref1 = [["someday", "未定"], ["year", date.year], ["month", date.year + "/" + (date.month + 1)]];
    for (l = 0, len = ref1.length; l < len; l++) {
      k = ref1[l];
      Dom.create(tasks, "ul").classList.add(k[0] + "Task");
      Dom.button(tasks, k[1]).classList.add("clickTasks");
    }
    Dom.button(tasks, "追加").classList.add("clickScheduleAdd");
    return Dom.button(tasks, "閉じる").classList.add("clickTasks");
  };

  View.prototype.setSchedules = function(schedules, properties) {
    var day, j, k, key, l, len, len1, len2, len3, m, n, ref, ref1, ref2, result, s, schedule, status, str;
    ref = calendar.childNodes;
    for (j = 0, len = ref.length; j < len; j++) {
      day = ref[j];
      ref1 = Dom.gets("ul > li", day);
      for (l = 0, len1 = ref1.length; l < len1; l++) {
        schedule = ref1[l];
        schedule.parentNode.removeChild(schedule);
      }
    }
    ref2 = Dom.gets("ul > li", tasks);
    for (m = 0, len2 = ref2.length; m < len2; m++) {
      schedule = ref2[m];
      schedule.parentNode.removeChild(schedule);
    }
    for (k in schedules) {
      s = schedules[k];
      for (n = 0, len3 = s.length; n < len3; n++) {
        result = s[n];
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
    var i, j, key, len, property, propertySelect, scheduleItem, scheduleProperty, scheduleSect, stat, strProperty;
    if (result && result.date === date) {
      scheduleItem = Dom.create(elem, "li");
      scheduleSect = Dom.create(scheduleItem, "dl");
      scheduleSect.classList.add("id" + result.id);
      Dom.create(scheduleSect, "dt", result.title).classList.add("scheduleTitle", "clickScheduleTitle", "draggable");
      Dom.create(scheduleSect, "dd", result.content).classList.add("clickScheduleContent");
      for (key in properties) {
        property = properties[key];
        if ((key === "status") || (key === "level")) {
          if (!result[key] || result[key] === 0) {
            result[key] = 1;
          }
          strProperty = key.charAt(0).toUpperCase() + key.substr(1);
          scheduleItem.classList.add("schedule" + strProperty + result[key]);
          scheduleProperty = Dom.create(scheduleSect, "dd");
          propertySelect = Dom.create(scheduleProperty, "select");
          propertySelect.classList.add("select", "selectSchedule" + strProperty + result[key]);
          i = 0;
          for (j = 0, len = property.length; j < len; j++) {
            stat = property[j];
            if (stat) {
              Dom.create(propertySelect, "option", stat.name).classList.add("schedule" + strProperty + stat.id);
              if (stat.id === result[key]) {
                propertySelect.selectedIndex = i;
              }
              i++;
            }
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
