var fnjs = (function() {
  "use strict";

  // 构造函数
  function fnjs() {
    this.init();
  }

  // 静态私有方法
  (function(f) {
    "use strict";
    // 获取函数参数的个数
    f.getParaNum = function(f) {
      return f
        .toString()
        .match(/\((.*)\)/)[1]
        .split(",").length;
    };
  })(fnjs);

  // 实例方法
  (function(p) {
    "use strict";
    // 初始化命名空间
    p.init = function() {
      this.name = "fnjs";
      this.version = "1.0.0";
    };
    // 判断输入的类型
    p.type = function(entry) {
      return Object.prototype.toString
        .call(entry)
        .replace(/^\[\w+ (\w+)\]$/, function(_, r) {
          return r.toLowerCase();
        });
    };

    /**
     * 将一个有多个参数的函数柯理化
     * @param {Function} f 被柯理化的函数
     * @param {Number} n 函数需要的参数
     * @param {Boolean} i 当前递归的层级是否是子层级
     * @returns Function
     */
    p.curry = function(f, n, i) {
      var type = p.type;
      if (type(f) !== "function")
        return function(f) {
          return f;
        };
      var pn = null;
      var argList = [];

      return function(a) {
        var self = this;
        if (!i) {
          pn = fnjs.getParaNum(f);
          argList = [];
        } else {
          pn = n;
        }
        if (argList.length >= pn) {
          argList = [];
        } else if (arguments.length < pn) {
          pn -= arguments.length;
          argList = argList.concat(Array.from(arguments).slice(1));
        } else {
          return f.apply(self, arguments);
        }
        return p.curry(
          function() {
            argList = argList.concat(Array.from(arguments));
            argList.unshift(a);
            var res = f.apply(self, argList);
            if (!i) {
              pn = fnjs.getParaNum(f);
              argList = [];
            }
            return res;
          },
          pn,
          true
        );
      };
    };
    /**
     * 将多个函数组合起来
     * @param {Function} arguments
     * @returns Function
     */
    p.compose = function() {
      var args = Array.from(arguments);
      var reversed = false;
      return function(arg) {
        var fns = args;
        if (!reversed) {
          fns = fns.reverse();
          reversed = true;
        }
        if (args.length > 1) {
          return fns.slice(1).reduce((cur, next) => {
            return () => {
              var res = cur(arg);
              if (!res) return false;
              else {
                return next(res);
              }
            };
          }, fns[0])();
        } else {
          return args[0](arg);
        }
      };
    };

    // a -> b -> a | b
    p.add = p.curry(function(num, a) {
      if (a.map) {
        return a.map(v => v + num);
      } else {
        return a + num;
      }
    });

    // a -> b -> a | b
    p.concat = p.curry(function(a, b) {
      if (b.map) {
        return b.map(v => a.concat(v));
      } else {
        return a.concat(b);
      }
    });

    // String -> Object -> any
    p.prop = p.curry(function(property, obj) {
      return obj[property];
    });

    // Function -> Array | Functor -> Array | Functor
    p.map = p.curry(function(fn, datas) {
      if (datas.map) {
        return datas.map(fn);
      } else {
        return [fn(datas)];
      }
    });

    // Function -> string -> undefined
    p.getJSON = p.curry(function(cb, url) {
      var xhr = new XMLHttpRequest();
      xhr.open("get", url);
      xhr.onload = function(res) {
        cb.call(res.target, JSON.parse(res.target.responseText));
      };
      xhr.send();
    });

    // HTMLElement -> string -> HTMLElement
    p.setHtml = p.curry(function(ele, html) {
      ele.innerHTML = html;
      return ele;
    });

    // a -> (b -> c) -> d
    p.pipeUrl = p.curry(function(url, fn) {
      return fn(url);
    });

    // HTMLElement -> string -> HTMLElement
    p.appendHtml = p.curry(function(ele, html) {
      ele.insertAdjacentHTML("beforeend", html);
      return ele;
    });

    // string -> any -> any
    p.trace = p.curry(function(tag, pipeData) {
      console.log(tag, pipeData);
      return pipeData;
    });

    // any -> any
    p.toJson = function(data) {
      return JSON.parse(data);
    };

    // Function -> Object -> String -> undefined
    p.postForm = p.curry(function(cb, data, url) {
      var xhr = new XMLHttpRequest();
      xhr.open("post", url);
      xhr.onload = function(res) {
        cb.call(res.target, res.target.responseText);
      };
      var formData = new FormData();
      for (var key in data) {
        formData.append(key, data[key]);
      }
      xhr.send(formData);
    });

    // Function -> Object -> String -> undefined
    p.postRaw = p.curry(function(cb, data, url) {
      var xhr = new XMLHttpRequest();
      xhr.open("post", url);
      xhr.onload = function(res) {
        cb.call(res.target, res.target.responseText);
      };
      xhr.setRequestHeader("Content-Type", "json");
      xhr.send(JSON.stringify(data));
    });

    // Function -> Array -> Array
    p.filter = p.curry(function(fn, datas) {
      if (p.type(datas) === "array") {
        return datas.filter(fn);
      } else {
        return [fn(datas)];
      }
    });

    // (String | Date, String) -> Object
    p.time = function(date, format) {
      this.date = date ? new Date(date) : new Date();
      this.value = "";
      if (!format) return this;
      var formats = format.split("-");
      formats = formats[0].length > 4 ? format.split("/") : formats;
      for (var i = 0; i < formats.length; i++) {
        var item = formats[i];
        switch (item) {
          case "YYYY":
            this.value += this.date.getFullYear();
            break;
          case "MM":
            this.value += this.date.getMonth();
          case "DD":
            this.value += this.date.getDate();
        }
      }
      return this;
    };

    p.split = p.curry(function(p, data) {
      return data.split(p);
    });

    // (String | Date, String) -> Object
    p.moment = function(date, format) {
      return new p.time(date, format);
    };

    // time 实例
    (function(p) {
      "use strict";
      // undefined -> Boolean
      p.isValid = function() {
        return Number.isFinite(this.date.getTime());
      };
      // (a, b) -> c
      p.diff = function(an, format) {
        if (!an.date) return false;
        switch (format) {
          case "years":
            return this.date.getFullYear() - an.date.getFullYear();
          default:
            return this.date.getFullYear() - an.date.getFullYear();
        }
      };
    })((p.time.prototype = p.time.prototype || {}));

    // a -> b
    p.Container = function(d) {
      this.__value = d ? d : null;
    };

    // a -> b
    p.Container.of = function(d) {
      return new p.Container(d);
    };

    // (a -> a) -> (a -> b) -> c -> a
    p.either = p.curry(function(f, g, e) {
      switch (e.constructor) {
        case p.Container:
          return g(e.__value);
        case p.Message:
          return f(e.__value);
      }
    });

    // a -> a
    p.id = function(x) {
      return x;
    };

    // [a] | a -> a
    p.head = function(a) {
      try {
        return a[0] ? a[0] : a;
      } catch (err) {
        return a;
      }
    };

    // a -> Functor: b
    p.query = function(selector) {
      return new p.IO(function() {
        return document.querySelectorAll(selector);
      });
    };

    // [a] | a -> a
    p.second = function(a) {
      try {
        return a[1] ? a[1] : a;
      } catch (e) {
        return a;
      }
    };

    // a -> b -> c -> a
    p.addEvent = p.curry(function(callback, type, el) {
      if (el.length && Array.from(el).length) {
        for (var i = 0; i < el.length; i++) {
          var item = el[i];
          item.addEventListener(type, callback);
        }
      } else {
        el.addEventListener(type, callback);
      }
      return el;
    });

    // Functor: a -> b
    p.IoValue = function(io) {
      return io.unsafePerform();
    };

    // a => b
    p.IO = function(f) {
      this.unsafePerform = f;
    };

    // a -> Functor: b
    p.IO.of = function(x) {
      return new p.IO(function() {
        return x;
      });
    };

    // Container 实例方法
    (function(p) {
      "use strict";
      // undefined -> a
      p.isNothing = function() {
        return this.__value === null || this.__value === undefined;
      };
      // (a -> b) -> c
      p.map = function(f) {
        return this.isNothing()
          ? this.constructor.of(null)
          : this.constructor.of(f(this.__value));
      };
    })((p.Container.prototype = p.Container.prototype || {}));

    // IO 实例方法
    (function(p1, p) {
      "use strict";
      p1.map = function(f) {
        return new p.IO(
          p.compose(
            f,
            this.unsafePerform
          )
        );
      };
    })((p.IO.prototype = p.IO.prototype || {}), p);

    // a -> b
    p.Message = function(d) {
      this.__value = d ? d : null;
    };

    // a -> b
    p.Message.of = function(d) {
      return new p.Message(d);
    };

    // Message 实例方法
    (function(p) {
      "use strict";
      // (a -> b) -> c
      p.map = function(f) {
        return this;
      };
    })((p.Message.prototype = p.Message.prototype || {}));

    // basic event bus: a -> undefined
    p.bus = function() {
      this.maps = {};
    };
    // basic event bus 实例方法
    (function(bus) {
      "use strict";
      bus.on = p.curry(function(type, fn) {
        this.maps[type]
          ? this.maps[type].push(fn)
          : ((this.maps[type] = []), this.maps[type].push(fn));
      });
      bus.emit = p.curry(function(type, data) {
        console.log(this, type, data);
        this.maps[type] && this.__emit(type, data);
      });
      bus.__emit = function(type, data) {
        for (var i = 0; i < this.maps[type].length; i++) {
          this.maps[type][i](data);
        }
      };
    })((p.bus.prototype = p.bus.prototype || {}));

  })((fnjs.prototype = fnjs.prototype || {}));

  return new fnjs();
})();

// pure function
var {
  add,
  compose,
  moment,
  Container,
  Message,
  curry,
  prop,
  map,
  concat,
  trace,
  IO,
  split
} = fnjs;

console.log(
  fnjs.Container.of({
    host: "locahost",
    port: 80
  }).map(prop("host"))
);

console.log(
  Container.of("haha")
    .map(item => item + 1)
    .map(item => item + 1)
);

var getAge = curry(function(now, user) {
  var birthdate = moment(user.birthdate, "YYYY-MM-DD");
  if (!birthdate.isValid()) {
    return Message.of("birthdate could not be parse");
  } else return Container.of(now.diff(birthdate, "years"));
});

var exec = compose(
  concat("if you are right, you will be "),
  trace("加1后的结果"),
  add(1)
);

var ap = compose(
  map(console.log),
  map(exec),
  getAge(moment())
);

console.log("======\n", ap({ birthdate: "2009-01-23" }));

var ap1 = compose(getAge(moment()));

console.log(ap1({ birthdate: "error" }).map(console.log)); // should not work

ap1({ birthdate: "2000-01-01" })
  .map(trace("获取年龄的结果"))
  .map(exec)
  .map(console.log);

var ioObj = IO.of({ name: { name: { name: "n,a,m,e" } } });

var ress = ioObj
  .map(function(o) {
    return o.name;
  })
  .map(prop("name"))
  .map(prop("name"))
  .map(split(","));

console.log(ress.unsafePerform());
