var fnjs = (function() {
  'use strict';

  // 构造函数
  function fnjs() {
    this.init();
  }

  // 静态私有方法
  ;(function(f) {
    'use strict';
    // 获取函数参数的个数
    f.getParaNum = function (f) {
      return f.toString().match(/\((.*)\)/)[1].split(',').length;
    }
  })(fnjs);

  // 实例方法
  ;(function(p) {
    'use strict';
    // 初始化命名空间
    p.init = function () {
      this.name = 'fnjs';
      this.version = '1.0.0';
    }
    // 判断输入的类型
    p.type = function(entry) {
      return Object.prototype.toString.call(entry).replace(/^\[\w+ (\w+)\]$/, function(_, r) {
        return r.toLowerCase();
      });
    }

    /**
     * 将一个有多个参数的函数柯理化
     * @param {Function} f 被柯理化的函数
     * @param {Number} n 函数需要的参数
     * @param {Boolean} i 当前递归的层级是否是子层级
     * @returns Function
     */
    p.curry = function (f, n, i) {
      var type = p.type;
      if(type(f) !== 'function') return function(f) { return f; };
      var pn = n && type(n) === 'number' ? n : fnjs.getParaNum(f);
      var argList = [];

      return function (a) {
        if(!i) {
          pn = fnjs.getParaNum(f);
          argList = [];
        }
        if (arguments.length < pn) {
          pn -= arguments.length;
          argList = argList.concat(Array.from(arguments).slice(1));
        } else {
          return f.apply(null, arguments);
        }
        return p.curry(function () {
          argList = argList.concat(Array.from(arguments));
          argList.unshift(a);
          var res = f.apply(null, argList);
          if(!i) {
            pn = fnjs.getParaNum(f);
            argList = [];
          }
          return res;
        }, pn, true);
      }
    }
    /**
     * 将多个函数组合起来
     * @param {Function} arguments
     * @returns Function
     */
    p.compose = function() {
      var args = Array.from(arguments);
      return function (arg) {
        var fns = args.reverse();
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
      }
    }

    // String -> Object -> any
    p.prop = p.curry(function (property, obj) {
      return obj[property];
    });

    // Function -> Array | Functor -> Array | Functor
    p.map = p.curry(function (fn, datas) {
      if (datas.map) {
        return datas.map(fn);
      } else {
        return [fn(datas)];
      }
    });

    // Function -> string -> undefined
    p.getJSON = p.curry(function (cb, url) {
      var xhr = new XMLHttpRequest();
      xhr.open('get', url);
      xhr.setRequestHeader('Content-Type', 'json');
      xhr.onload = function (res) {
        cb.call(res.target, res.target.responseText);
      }
      xhr.send();
    });

    // HTMLElement -> string -> HTMLElement
    p.setHtml = p.curry(function (ele, html) {
      ele.innerHTML = html;
      return ele;
    });

    // HTMLElement -> string -> HTMLElement
    p.appendHtml = p.curry(function (ele, html) {
      ele.insertAdjacentHTML('beforeend', html);
      return ele;
    });

    // string -> any -> any
    p.trace = p.curry(function (tag, pipeData) {
      console.log(tag, pipeData);
      return pipeData;
    });

    // any -> any
    p.toJson = function (data) {
      return JSON.parse(data);
    }

    // Function -> Object -> String -> undefined
    p.postForm = p.curry(function (cb, data, url) {
      var xhr = new XMLHttpRequest();
      xhr.open('post', url);
      xhr.onload = function(res) {
        cb.call(res.target, res.target.responseText);
      }
      var formData = new FormData();
      for(var key in data) {
        formData.append(key, data[key]);
      }
      xhr.send(formData);
    });

    // Function -> Object -> String -> undefined
    p.postRaw = p.curry(function (cb, data, url) {
      var xhr = new XMLHttpRequest();
      xhr.open('post', url);
      xhr.onload = function (res) {
        cb.call(res.target, res.target.responseText);
      }
      xhr.setRequestHeader('Content-Type', 'json');
      xhr.send(JSON.stringify(data));
    });

    // Function -> Array -> Array
    p.filter = p.curry(function(fn, datas) {
      if(p.type(datas) === 'array') {
        return datas.filter(fn);
      } else {
        return [fn(datas)];
      }
    });

    // (String | Date, String) -> Object
    p.time = function(date, format) {
      this.date = date ? new Date(date) : new Date();
      this.value = '';
      if(!format) return this;
      var formats = format.split('-');
      formats = formats[0].length > 4 ? format.split('/') : formats;
      for(var i = 0; i < formats.length; i++) {
        var item = formats[i];
        switch (item) {
          case 'YYYY':
            this.value += this.date.getFullYear();
            break;
          case 'MM':
            this.value += this.date.getMonth();
          case 'DD':
            this.value += this.date.getDate();
        }
      }
      return this;
    }

    // (String | Date, String) -> Object
    p.moment = function(date, format) {
      return new p.time(date, format);
    }

    // time 实例
    ;(function(p) {
      'use strict';
      // undefined -> Boolean
      p.isValid = function() {
        return Number.isFinite(this.date.getTime());
      }
      // (a, b) -> c
      p.diff = function (an, format) {
        if(!an.date) return false;
        switch (format) {
          case 'years':
            return this.date.getFullYear() - an.date.getFullYear()
          default:
            return this.date.getFullYear() - an.date.getFullYear();
        }
      }
    })( p.time.prototype = p.time.prototype || {});

    // a -> b
    p.Container = function(d) {
      this.__value = d ? d : null;
    }

    // a -> b
    p.Container.of = function(d) {
      return new p.Container(d);
    }

    // Container 实例方法
    ;(function(p) {
      'use strict';
      // undefined -> a
      p.isNothing = function() {
        return this.__value === null || this.__value === undefined;
      }
      // (a -> b) -> c
      p.map = function (f) {
        return this.isNothing() ? this.constructor.of(null) : this.constructor.of(f(this.__value));
      }
    })(p.Container.prototype = p.Container.prototype || {});

    // a -> b
    p.Message = function (d) {
      this.__value = d ? d : null
    }

    // a -> b
    p.Message.of = function (d) {
      return new p.Message(d);
    }

    // Message 实例方法
    ;(function(p) {
      'use strict';
      // (a -> b) -> c
      p.map = function (f) {
        return this;
      }
    })(p.Message.prototype = p.Message.prototype || {});

  })(fnjs.prototype = fnjs.prototype || {});

  return new fnjs();
}());


// pure function
var { moment, Container, Message, curry, prop } = fnjs;

console.log(
  fnjs.Container.of({
    host: "locahost",
    port: 80
  }).map(prop("host"))
);

console.log(Container.of('haha').map(item => item + 1).map(item => item + 1));


var getAge = curry(function (now, user) {
  var birthdate = moment(user.birthdate, 'YYYY-MM-DD');
  if (!birthdate.isValid()) {
    return Message.of('birthdate could not be parse');
  } else
    return Container.of(now.diff(birthdate, 'years'));
});

console.log(getAge(moment(), {birthdate: '2010-10-21'}));