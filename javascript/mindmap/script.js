var Controller;

Controller = (function() {
  var data, mouse, view;

  data = null;

  view = null;

  mouse = null;

  function Controller() {
    view = new View(this);
    data = new Model(view, this);
    mouse = new MouseEvent(data, this);
  }

  Controller.prototype.setProperties = function() {
    view.setSelector(data.getProperties());
    return data.loadProject(1);
  };

  Controller.prototype.setSchedules = function(projectId) {
    return view.setSchedules(data.getSchedules(), data.getProperties(), projectId);
  };

  Controller.prototype.resetParent = function(children) {
    var child, i, j, len, len1, tmp;
    tmp = [];
    for (i = 0, len = children.length; i < len; i++) {
      child = children[i];
      if (child) {
        if (confirm(child.title + "の親タスク情報のみを削除します")) {
          tmp.push(child);
        }
      }
    }
    for (j = 0, len1 = tmp.length; j < len1; j++) {
      child = tmp[j];
      if (child) {
        child.parent = null;
      }
    }
    if (tmp.length > 0) {
      return data.setSchedules(tmp);
    }
  };

  return Controller;

})();

var Model;

Model = (function() {
  var controller, db, model, properties, schedules, view;

  model = Model;

  view = null;

  controller = null;

  db = null;

  schedules = [];

  properties = [];

  Model.prototype.dbName = "piaccoCalendar";

  Model.prototype.iDB = window.indexedDB || window.mozIndexedDB || window.msIndexedDB || window.webkitIndexDB;

  Model.prototype.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

  function Model(v, c) {
    var request;
    model = this;
    view = v;
    controller = c;
    request = this.iDB.open(this.dbName, 11);
    request.onupgradeneeded = function(evt) {};
    request.onsuccess = function(evt) {
      db = evt.target.result;
      return model.loadProperties();
    };
    request.onerror = function(evt) {
      return console.log("error");
    };
  }

  Model.prototype.loadProject = function(projectId) {
    var range, request, schedule, transaction;
    schedules = [];
    transaction = db.transaction(["store"], "readonly");
    schedule = transaction.objectStore("store");
    range = [];
    request = schedule.index("project").openCursor(IDBKeyRange.only(parseInt(projectId)));
    request.onsuccess = function() {
      var cursor;
      cursor = this.result;
      if (cursor) {
        schedules.push(cursor.value);
        return cursor["continue"]();
      }
    };
    transaction.oncomplete = function() {
      schedules.sort(function(a, b) {
        if (a.order > b.order) {
          return 1;
        } else {
          return -1;
        }
      });
      return controller.setSchedules(projectId);
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
        var d, i, last, len, q;
        if (this.result) {
          last = this.result.value.order + 1;
        } else {
          last = 0;
        }
        for (i = 0, len = query.length; i < len; i++) {
          q = query[i];
          if (!q) {
            continue;
          }
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
          return model.loadProject(query[0].project);
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

  Model.prototype.statusInclement = function(q) {
    var query;
    query = [];
    query[0] = q;
    query[0].status++;
    if (query[0].status === 2) {
      query[0].start_day = new Date();
    } else if (query[0].status === 3) {
      query[0].finish_day = new Date();
    }
    return model.setSchedules(query);
  };

  Model.prototype.setScheduleStatusCallback = function(q, elem) {
    var cls, i, len, query, ref, results, str;
    query = [];
    query[0] = q;
    ref = elem.classList;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      cls = ref[i];
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

  Model.prototype.loadProperties = function() {
    var i, len, request, store, t, target, transaction;
    target = ["status", "project", "category", "level"];
    transaction = db.transaction(target, "readonly");
    for (i = 0, len = target.length; i < len; i++) {
      t = target[i];
      properties[t] = [];
      store = transaction.objectStore(t);
      request = store.index("order").openCursor();
      request.onsuccess = function() {
        var cursor;
        cursor = this.result;
        if (cursor) {
          properties[cursor.source.objectStore.name].push(cursor.value);
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
      if (point = MouseEvent.getPointer(evt, ".draggable")) {
        dragging.elem = point.cloneNode(true);
        dragging.id = View.getId(point);
        dragging.elem.classList.add("dragging");
        dragging.elem.style.position = "absolute";
        window.addEventListener("mousemove", MouseEvent.mouse.dragMove);
        window.addEventListener("mouseup", function() {
          return window.removeEventListener("mousemove", MouseEvent.mouse.dragMove);
        });
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
      return dragging = null;
    },
    dragMove: function(evt) {
      var mouseOver, point;
      window.removeEventListener("click", MouseEvent.mouse.clickEvent);
      if (Math.abs(dragging.moveX) + Math.abs(dragging.moveY) > 20) {
        window.addEventListener("mouseup", MouseEvent.mouse.dragUp);
        if (document.body.contains(dragging.elem)) {
          dragging.elem.style.left = evt.pageX - dragging.x + "px";
          dragging.elem.style.top = evt.pageY - dragging.y + "px";
          return mouseOver = document.elementFromPoint(evt.pageX, evt.pageY);
        } else {
          point = MouseEvent.getPointer(evt);
          document.body.appendChild(dragging.elem);
          dragging.elem.style.left = evt.pageX + "px";
          dragging.elem.style.top = evt.pageY + "px";
          dragging.x = evt.pageX - dragging.elem.offsetLeft;
          dragging.y = evt.pageY - dragging.elem.offsetTop;
          query = [];
          query[1] = [];
          return data.getSchedules(dragging.id, MouseEvent.mouse.setquery);
        }
      }
    },
    dragUp: function(evt) {
      var c, childId, children, i, j, len, len1, parent, projectId, ref, to, toId;
      window.removeEventListener("mouseup", MouseEvent.mouse.dragUp);
      window.removeEventListener("mousemove", MouseEvent.mouse.move);
      if (dragging.elem) {
        childId = dragging.elem.getAttribute("task-id");
        children = [childId];
        ref = Dom.gets(".children__item", dragging.elem);
        for (i = 0, len = ref.length; i < len; i++) {
          c = ref[i];
          children.push(parseInt(c.getAttribute("task-id")));
        }
        document.body.removeChild(dragging.elem);
        to = document.elementFromPoint(evt.pageX, evt.pageY);
        if (to.classList.contains("node__text")) {
          parent = to.parentNode.parentNode;
          if (parent.classList.contains("mindmap")) {
            toId = null;
          } else if (parent.classList.contains("children__item")) {
            toId = parent.getAttribute("task-id");
          }
          data.getSchedules(childId, MouseEvent.mouse.setParent, parseInt(toId));
        } else if (to.classList.contains("clickProjectSelector")) {
          if (projectId = to.getAttribute("project-selector")) {
            console.log(projectId);
            for (j = 0, len1 = children.length; j < len1; j++) {
              c = children[j];
              console.log("lsdkjhskdfhsdkf");
              query = [];
              data.getSchedules(c, MouseEvent.mouse.setProject, [children, projectId]);
            }
          }
        }
      }
      return dragging = null;
    },
    setParent: function(q, id) {
      query = [[]];
      query[0] = q;
      query[0].parent = id;
      return data.setSchedules(query);
    },
    setProject: function(q, arr) {
      q.project = parseInt(arr[1]);
      query.push(q);
      if (q.id === parseInt(arr[0])) {
        q.parent = null;
      }
      if (query.length === arr[0].length) {
        return data.setSchedules(query);
      }
    },
    clickEvent: function(evt) {
      var cls, i, len, point, ref, results;
      point = MouseEvent.getPointer(evt);
      ref = point.classList;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        cls = ref[i];
        if (cls.indexOf("click") === 0) {
          results.push(MouseEvent.click[cls](point));
        } else {
          results.push(void 0);
        }
      }
      return results;
    },
    doubleclickEvent: function(evt) {
      var id, point;
      console.log("kjkshdfkjhdskjfhjkdskhkhk");
      point = MouseEvent.getPointer(evt);
      if (id = point.parentNode.getAttribute("task-id")) {
        console.log("kjkhkhk");
        return data.getSchedules(id, data.statusInclement);
      }
    }
  };

  MouseEvent.click = {
    clickProjectSelector: function(btn) {
      var projectId;
      projectId = btn.getAttribute("project-selector");
      return data.loadProject(projectId);
    }
  };

  return MouseEvent;

})();

var View;

View = (function() {
  var controller, form, item, map, nav, setChild;

  controller = null;

  form = [];

  nav = null;

  map = null;

  item = null;

  function View(c) {
    controller = c;
    map = Dom.create(document.body, "div");
    map.classList.add("mindmap");
    form.base = Dom.create(document.body, "form");
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

  View.prototype.setSelector = function(properties) {
    var btn, j, len, project, ref, results, wrap;
    wrap = Dom.create(document.body, "div");
    wrap.classList.add("btn-wrapper");
    ref = properties.project;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      project = ref[j];
      if ((!project["delete"]) && (!project.finish)) {
        btn = Dom.button(wrap, project.name);
        btn.classList.add("clickProjectSelector");
        results.push(btn.setAttribute("project-selector", project.id));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  View.prototype.setSchedules = function(schedules, properties, projectId) {
    var c, children, flg, i, j, k, l, len, len1, len2, len3, len4, list, m, n, name, p, ref, ref1, ref2, result, results, task, title, wrap;
    children = [];
    if (wrap = Dom.get("div", map)) {
      map.removeChild(wrap);
    }
    if (list = Dom.get("ol", map)) {
      map.removeChild(list);
    }
    wrap = Dom.create(map, "div");
    wrap.classList.add("node");
    ref = properties.project;
    for (j = 0, len = ref.length; j < len; j++) {
      p = ref[j];
      if (p.id === parseInt(projectId)) {
        name = p.name;
      }
    }
    title = Dom.create(wrap, "div", name);
    title.classList.add("node__text");
    p = Dom.create(map, "ol");
    p.classList.add("children", "children_rightbranch");
    for (k = 0, len1 = schedules.length; k < len1; k++) {
      result = schedules[k];
      if (result) {
        if (result.parent) {
          children.push(result);
        } else {
          setChild(Dom.get("body>div>ol"), result);
        }
      }
    }
    flg = true;
    while (flg) {
      flg = false;
      ref1 = map.getElementsByTagName("ol");
      for (l = 0, len2 = ref1.length; l < len2; l++) {
        task = ref1[l];
        for (i = m = 0, len3 = children.length; m < len3; i = ++m) {
          c = children[i];
          if (c && (task.parentNode.getAttribute("task-id")) === (c.parent.toString())) {
            setChild(task, c);
            flg = true;
            delete children[i];
          }
        }
      }
    }
    controller.resetParent(children);
    ref2 = Dom.gets("ol");
    results = [];
    for (n = 0, len4 = ref2.length; n < len4; n++) {
      list = ref2[n];
      if (list.hasChildNodes() === false) {
        results.push(list.parentNode.removeChild(list));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  setChild = function(parent, task) {
    var list, op, str, text, wrap;
    item = Dom.create(parent, "li");
    item.classList.add("children__item", "draggable");
    item.setAttribute("task-id", task.id);
    wrap = Dom.create(item, "div");
    wrap.classList.add("node");
    switch (task.status) {
      case 3:
        op = ".5";
        break;
      case 4:
        op = ".2";
        break;
      default:
        op = "1";
    }
    wrap.style.opacity = op;
    if (task.title.length > 8) {
      str = task.title.substring(0, 8) + "...";
    } else {
      str = task.title;
    }
    text = Dom.create(wrap, "div", str);
    text.classList.add("node__text");
    list = Dom.create(item, "ol");
    return list.classList.add("children");
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
        return Dom.get(" body > ul > .keep > section").style.display = null;
      } catch (_error) {}
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
      if (typeof item.date === "strng") {
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
