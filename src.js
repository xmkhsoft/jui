///<jscompress sourcefile="promise.js" />
; (function () {
    function ok(val) {
        return val
    }
    function ng(e) {
        throw e
    }

    function done(onSuccess) {//添加成功回调
        return this.then(onSuccess, ng)
    }
    function fail(onFail) {//添加出错回调
        return this.then(ok, onFail)
    }
    function defer() {
        var ret = {};
        ret.promise = new this(function (resolve, reject) {
            ret.resolve = resolve
            ret.reject = reject
        });
        return ret
    }
    var Promise = function (executor) {
        this._callbacks = []
        var me = this
        if (typeof this !== "object")
            throw new TypeError("Promises must be constructed via new")
        if (typeof executor !== "function")
            throw new TypeError("not a function")

        executor(function (value) {
            _resolve(me, value)
        }, function (reason) {
            _reject(me, reason)
        })
    }
    function fireCallbacks(promise, fn) {
        if (typeof promise.async === "boolean") {
            var isAsync = promise.async
        } else {
            isAsync = promise.async = true
        }
        if (isAsync) {
            window.setTimeout(fn, 0)
        } else {
            fn()
        }
    }
//返回一个已经处于`resolved`状态的Promise对象
    Promise.resolve = function (value) {
        return new Promise(function (resolve) {
            resolve(value)
        })
    }
//返回一个已经处于`rejected`状态的Promise对象
    Promise.reject = function (reason) {
        return new Promise(function (resolve, reject) {
            reject(reason)
        })
    }

    Promise.prototype = {
//一个Promise对象一共有3个状态：
//- `pending`：还处在等待状态，并没有明确最终结果
//- `resolved`：任务已经完成，处在成功状态
//- `rejected`：任务已经完成，处在失败状态
        constructor: Promise,
        _state: "pending",
        _fired: false, //判定是否已经被触发
        _fire: function (onSuccess, onFail) {
            if (this._state === "rejected") {
                if (typeof onFail === "function") {
                    onFail(this._value)
                } else {
                    throw this._value
                }
            } else {
                if (typeof onSuccess === "function") {
                    onSuccess(this._value)
                }
            }
        },
        _then: function (onSuccess, onFail) {
            if (this._fired) {//在已有Promise上添加回调
                var me = this
                fireCallbacks(me, function () {
                    me._fire(onSuccess, onFail)
                });
            } else {
                this._callbacks.push({onSuccess: onSuccess, onFail: onFail})
            }
        },
        then: function (onSuccess, onFail) {
            onSuccess = typeof onSuccess === "function" ? onSuccess : ok
            onFail = typeof onFail === "function" ? onFail : ng
            var me = this//在新的Promise上添加回调
            var nextPromise = new Promise(function (resolve, reject) {
                me._then(function (value) {
                    try {
                        value = onSuccess(value)
                    } catch (e) {
                        // https://promisesaplus.com/#point-55
                        reject(e)
                        return
                    }
                    resolve(value)
                }, function (value) {
                    try {
                        value = onFail(value)
                    } catch (e) {
                        reject(e)
                        return
                    }
                    resolve(value)
                })
            })
            for (var i in me) {
                if (!personal[i]) {
                    nextPromise[i] = me[i]
                }
            }
            return nextPromise
        },
        "done": done,
        "catch": fail,
        "fail": fail
    }
    var personal = {
        _state: 1,
        _fired: 1,
        _value: 1,
        _callbacks: 1
    }
    function _resolve(promise, value) {//触发成功回调
        if (promise._state !== "pending")
            return;
        if (value && typeof value.then === "function") {
//thenable对象使用then，Promise实例使用_then
            var method = value instanceof Promise ? "_then" : "then"
            value[method](function (val) {
                _transmit(promise, val, true)
            }, function (reason) {
                _transmit(promise, reason, false)
            });
        } else {
            _transmit(promise, value, true);
        }
    }
    function _reject(promise, value) {//触发失败回调
        if (promise._state !== "pending")
            return
        _transmit(promise, value, false)
    }
//改变Promise的_fired值，并保持用户传参，触发所有回调
    function _transmit(promise, value, isResolved) {
        promise._fired = true;
        promise._value = value;
        promise._state = isResolved ? "fulfilled" : "rejected"
        fireCallbacks(promise, function () {
            promise._callbacks.forEach(function (data) {
                promise._fire(data.onSuccess, data.onFail);
            })
        })
    }
    function _some(any, iterable) {
        iterable = Array.isArray(iterable) ? iterable : []
        var n = 0, result = [], end
        return new Promise(function (resolve, reject) {
            // 空数组直接resolve
            if (!iterable.length)
                resolve(result)
            function loop(a, index) {
                a.then(function (ret) {
                    if (!end) {
                        result[index] = ret//保证回调的顺序
                        n++
                        if (any || n >= iterable.length) {
                            resolve(any ? ret : result)
                            end = true
                        }
                    }
                }, function (e) {
                    end = true
                    reject(e)
                })
            }
            for (var i = 0, l = iterable.length; i < l; i++) {
                loop(iterable[i], i)
            }
        })
    }

    Promise.all = function (iterable) {
        return _some(false, iterable)
    }
    Promise.race = function (iterable) {
        return _some(true, iterable)
    }
    Promise.defer = defer

    var nativePromise = window.Promise
    if (/native code/.test(nativePromise)) {
        nativePromise.prototype.done = done
        nativePromise.prototype.fail = fail
        if (!nativePromise.defer) { //chrome实现的私有方法
            nativePromise.defer = defer
        }
    }
    return window.Promise = nativePromise || Promise

})() ;
//https://github.com/ecomfe/er/blob/master/src/Deferred.js
//http://jser.info/post/77696682011/es6-promises

///<jscompress sourcefile="zepto.js" />
/* Zepto v1.2.0 - zepto event ajax form ie - zeptojs.com/license */
(function(global, factory) {
  if (typeof define === 'function' && define.amd)
    define(function() { return factory(global) })
  else
    factory(global)
}(this, function(window) {
  var Zepto = (function() {
  var undefined, key, $, classList, emptyArray = [], concat = emptyArray.concat, filter = emptyArray.filter, slice = emptyArray.slice,
    document = window.document,
    elementDisplay = {}, classCache = {},
    cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    rootNodeRE = /^(?:body|html)$/i,
    capitalRE = /([A-Z])/g,

    // special attributes that should be get/set via method calls
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

    adjacencyOperators = [ 'after', 'prepend', 'before', 'append' ],
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table, 'thead': table, 'tfoot': table,
      'td': tableRow, 'th': tableRow,
      '*': document.createElement('div')
    },
    readyRE = /complete|loaded|interactive/,
    simpleSelectorRE = /^[\w-]*$/,
    class2type = {},
    toString = class2type.toString,
    zepto = {},
    camelize, uniq,
    tempParent = document.createElement('div'),
    propMap = {
      'tabindex': 'tabIndex',
      'readonly': 'readOnly',
      'for': 'htmlFor',
      'class': 'className',
      'maxlength': 'maxLength',
      'cellspacing': 'cellSpacing',
      'cellpadding': 'cellPadding',
      'rowspan': 'rowSpan',
      'colspan': 'colSpan',
      'usemap': 'useMap',
      'frameborder': 'frameBorder',
      'contenteditable': 'contentEditable'
    },
    isArray = Array.isArray ||
      function(object){ return object instanceof Array }

  zepto.matches = function(element, selector) {
    if (!selector || !element || element.nodeType !== 1) return false
    var matchesSelector = element.matches || element.webkitMatchesSelector ||
                          element.mozMatchesSelector || element.oMatchesSelector ||
                          element.matchesSelector
    if (matchesSelector) return matchesSelector.call(element, selector)
    // fall back to performing a selector:
    var match, parent = element.parentNode, temp = !parent
    if (temp) (parent = tempParent).appendChild(element)
    match = ~zepto.qsa(parent, selector).indexOf(element)
    temp && tempParent.removeChild(element)
    return match
  }

  function type(obj) {
    return obj == null ? String(obj) :
      class2type[toString.call(obj)] || "object"
  }

  function isFunction(value) { return type(value) == "function" }
  function isWindow(obj)     { return obj != null && obj == obj.window }
  function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }
  function isObject(obj)     { return type(obj) == "object" }
  function isPlainObject(obj) {
    return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
  }

  function likeArray(obj) {
    var length = !!obj && 'length' in obj && obj.length,
      type = $.type(obj)

    return 'function' != type && !isWindow(obj) && (
      'array' == type || length === 0 ||
        (typeof length == 'number' && length > 0 && (length - 1) in obj)
    )
  }

  function compact(array) { return filter.call(array, function(item){ return item != null }) }
  function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array }
  camelize = function(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) }
  function dasherize(str) {
    return str.replace(/::/g, '/')
           .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
           .replace(/([a-z\d])([A-Z])/g, '$1_$2')
           .replace(/_/g, '-')
           .toLowerCase()
  }
  uniq = function(array){ return filter.call(array, function(item, idx){ return array.indexOf(item) == idx }) }

  function classRE(name) {
    return name in classCache ?
      classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
  }

  function maybeAddPx(name, value) {
    return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
  }

  function defaultDisplay(nodeName) {
    var element, display
    if (!elementDisplay[nodeName]) {
      element = document.createElement(nodeName)
      document.body.appendChild(element)
      display = getComputedStyle(element, '').getPropertyValue("display")
      element.parentNode.removeChild(element)
      display == "none" && (display = "block")
      elementDisplay[nodeName] = display
    }
    return elementDisplay[nodeName]
  }

  function children(element) {
    return 'children' in element ?
      slice.call(element.children) :
      $.map(element.childNodes, function(node){ if (node.nodeType == 1) return node })
  }

  function Z(dom, selector) {
    var i, len = dom ? dom.length : 0
    for (i = 0; i < len; i++) this[i] = dom[i]
    this.length = len
    this.selector = selector || ''
  }

  // `$.zepto.fragment` takes a html string and an optional tag name
  // to generate DOM nodes from the given html string.
  // The generated DOM nodes are returned as an array.
  // This function can be overridden in plugins for example to make
  // it compatible with browsers that don't support the DOM fully.
  zepto.fragment = function(html, name, properties) {
    var dom, nodes, container

    // A special case optimization for a single tag
    if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))

    if (!dom) {
      if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
      if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
      if (!(name in containers)) name = '*'

      container = containers[name]
      container.innerHTML = '' + html
      dom = $.each(slice.call(container.childNodes), function(){
        container.removeChild(this)
      })
    }

    if (isPlainObject(properties)) {
      nodes = $(dom)
      $.each(properties, function(key, value) {
        if (methodAttributes.indexOf(key) > -1) nodes[key](value)
        else nodes.attr(key, value)
      })
    }

    return dom
  }

  // `$.zepto.Z` swaps out the prototype of the given `dom` array
  // of nodes with `$.fn` and thus supplying all the Zepto functions
  // to the array. This method can be overridden in plugins.
  zepto.Z = function(dom, selector) {
    return new Z(dom, selector)
  }

  // `$.zepto.isZ` should return `true` if the given object is a Zepto
  // collection. This method can be overridden in plugins.
  zepto.isZ = function(object) {
    return object instanceof zepto.Z
  }

  // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
  // takes a CSS selector and an optional context (and handles various
  // special cases).
  // This method can be overridden in plugins.
  zepto.init = function(selector, context) {
    var dom
    // If nothing given, return an empty Zepto collection
    if (!selector) return zepto.Z()
    // Optimize for string selectors
    else if (typeof selector == 'string') {
      selector = selector.trim()
      // If it's a html fragment, create nodes from it
      // Note: In both Chrome 21 and Firefox 15, DOM error 12
      // is thrown if the fragment doesn't begin with <
      if (selector[0] == '<' && fragmentRE.test(selector))
        dom = zepto.fragment(selector, RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // If it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
    }
    // If a function is given, call it when the DOM is ready
    else if (isFunction(selector)) return $(document).ready(selector)
    // If a Zepto collection is given, just return it
    else if (zepto.isZ(selector)) return selector
    else {
      // normalize array if an array of nodes is given
      if (isArray(selector)) dom = compact(selector)
      // Wrap DOM nodes.
      else if (isObject(selector))
        dom = [selector], selector = null
      // If it's a html fragment, create nodes from it
      else if (fragmentRE.test(selector))
        dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // And last but no least, if it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
    }
    // create a new Zepto collection from the nodes found
    return zepto.Z(dom, selector)
  }

  // `$` will be the base `Zepto` object. When calling this
  // function just call `$.zepto.init, which makes the implementation
  // details of selecting nodes and creating Zepto collections
  // patchable in plugins.
  $ = function(selector, context){
    return zepto.init(selector, context)
  }

  function extend(target, source, deep) {
    for (key in source)
      if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
        if (isPlainObject(source[key]) && !isPlainObject(target[key]))
          target[key] = {}
        if (isArray(source[key]) && !isArray(target[key]))
          target[key] = []
        extend(target[key], source[key], deep)
      }
      else if (source[key] !== undefined) target[key] = source[key]
  }

  // Copy all but undefined properties from one or more
  // objects to the `target` object.
  $.extend = function(target){
    var deep, args = slice.call(arguments, 1)
    if (typeof target == 'boolean') {
      deep = target
      target = args.shift()
    }
    args.forEach(function(arg){ extend(target, arg, deep) })
    return target
  }

  // `$.zepto.qsa` is Zepto's CSS selector implementation which
  // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
  // This method can be overridden in plugins.
  zepto.qsa = function(element, selector){
    var found,
        maybeID = selector[0] == '#',
        maybeClass = !maybeID && selector[0] == '.',
        nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
        isSimple = simpleSelectorRE.test(nameOnly)
    return (element.getElementById && isSimple && maybeID) ? // Safari DocumentFragment doesn't have getElementById
      ( (found = element.getElementById(nameOnly)) ? [found] : [] ) :
      (element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11) ? [] :
      slice.call(
        isSimple && !maybeID && element.getElementsByClassName ? // DocumentFragment doesn't have getElementsByClassName/TagName
          maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
          element.getElementsByTagName(selector) : // Or a tag
          element.querySelectorAll(selector) // Or it's not simple, and we need to query all
      )
  }

  function filtered(nodes, selector) {
    return selector == null ? $(nodes) : $(nodes).filter(selector)
  }

  $.contains = document.documentElement.contains ?
    function(parent, node) {
      return parent !== node && parent.contains(node)
    } :
    function(parent, node) {
      while (node && (node = node.parentNode))
        if (node === parent) return true
      return false
    }

  function funcArg(context, arg, idx, payload) {
    return isFunction(arg) ? arg.call(context, idx, payload) : arg
  }

  function setAttribute(node, name, value) {
    value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
  }

  // access className property while respecting SVGAnimatedString
  function className(node, value){
    var klass = node.className || '',
        svg   = klass && klass.baseVal !== undefined

    if (value === undefined) return svg ? klass.baseVal : klass
    svg ? (klass.baseVal = value) : (node.className = value)
  }

  // "true"  => true
  // "false" => false
  // "null"  => null
  // "42"    => 42
  // "42.5"  => 42.5
  // "08"    => "08"
  // JSON    => parse if valid
  // String  => self
  function deserializeValue(value) {
    try {
      return value ?
        value == "true" ||
        ( value == "false" ? false :
          value == "null" ? null :
          +value + "" == value ? +value :
          /^[\[\{]/.test(value) ? $.parseJSON(value) :
          value )
        : value
    } catch(e) {
      return value
    }
  }

  $.type = type
  $.isFunction = isFunction
  $.isWindow = isWindow
  $.isArray = isArray
  $.isPlainObject = isPlainObject

  $.isEmptyObject = function(obj) {
    var name
    for (name in obj) return false
    return true
  }

  $.isNumeric = function(val) {
    var num = Number(val), type = typeof val
    return val != null && type != 'boolean' &&
      (type != 'string' || val.length) &&
      !isNaN(num) && isFinite(num) || false
  }

  $.inArray = function(elem, array, i){
    return emptyArray.indexOf.call(array, elem, i)
  }

  $.camelCase = camelize
  $.trim = function(str) {
    return str == null ? "" : String.prototype.trim.call(str)
  }

  // plugin compatibility
  $.uuid = 0
  $.support = { }
  $.expr = { }
  $.noop = function() {}

  $.map = function(elements, callback){
    var value, values = [], i, key
    if (likeArray(elements))
      for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i)
        if (value != null) values.push(value)
      }
    else
      for (key in elements) {
        value = callback(elements[key], key)
        if (value != null) values.push(value)
      }
    return flatten(values)
  }

  $.each = function(elements, callback){
    var i, key
    if (likeArray(elements)) {
      for (i = 0; i < elements.length; i++)
        if (callback.call(elements[i], i, elements[i]) === false) return elements
    } else {
      for (key in elements)
        if (callback.call(elements[key], key, elements[key]) === false) return elements
    }

    return elements
  }

  $.grep = function(elements, callback){
    return filter.call(elements, callback)
  }

  if (window.JSON) $.parseJSON = JSON.parse

  // Populate the class2type map
  $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
    class2type[ "[object " + name + "]" ] = name.toLowerCase()
  })

  // Define methods that will be available on all
  // Zepto collections
  $.fn = {
    constructor: zepto.Z,
    length: 0,

    // Because a collection acts like an array
    // copy over these useful array functions.
    forEach: emptyArray.forEach,
    reduce: emptyArray.reduce,
    push: emptyArray.push,
    sort: emptyArray.sort,
    splice: emptyArray.splice,
    indexOf: emptyArray.indexOf,
    concat: function(){
      var i, value, args = []
      for (i = 0; i < arguments.length; i++) {
        value = arguments[i]
        args[i] = zepto.isZ(value) ? value.toArray() : value
      }
      return concat.apply(zepto.isZ(this) ? this.toArray() : this, args)
    },

    // `map` and `slice` in the jQuery API work differently
    // from their array counterparts
    map: function(fn){
      return $($.map(this, function(el, i){ return fn.call(el, i, el) }))
    },
    slice: function(){
      return $(slice.apply(this, arguments))
    },

    ready: function(callback){
      // need to check if document.body exists for IE as that browser reports
      // document ready when it hasn't yet created the body element
      if (readyRE.test(document.readyState) && document.body) callback($)
      else document.addEventListener('DOMContentLoaded', function(){ callback($) }, false)
      return this
    },
    get: function(idx){
      return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
    },
    toArray: function(){ return this.get() },
    size: function(){
      return this.length
    },
    remove: function(){
      return this.each(function(){
        if (this.parentNode != null)
          this.parentNode.removeChild(this)
      })
    },
    each: function(callback){
      emptyArray.every.call(this, function(el, idx){
        return callback.call(el, idx, el) !== false
      })
      return this
    },
    filter: function(selector){
      if (isFunction(selector)) return this.not(this.not(selector))
      return $(filter.call(this, function(element){
        return zepto.matches(element, selector)
      }))
    },
    add: function(selector,context){
      return $(uniq(this.concat($(selector,context))))
    },
    is: function(selector){
      return this.length > 0 && zepto.matches(this[0], selector)
    },
    not: function(selector){
      var nodes=[]
      if (isFunction(selector) && selector.call !== undefined)
        this.each(function(idx){
          if (!selector.call(this,idx)) nodes.push(this)
        })
      else {
        var excludes = typeof selector == 'string' ? this.filter(selector) :
          (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
        this.forEach(function(el){
          if (excludes.indexOf(el) < 0) nodes.push(el)
        })
      }
      return $(nodes)
    },
    has: function(selector){
      return this.filter(function(){
        return isObject(selector) ?
          $.contains(this, selector) :
          $(this).find(selector).size()
      })
    },
    eq: function(idx){
      return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
    },
    first: function(){
      var el = this[0]
      return el && !isObject(el) ? el : $(el)
    },
    last: function(){
      var el = this[this.length - 1]
      return el && !isObject(el) ? el : $(el)
    },
    find: function(selector){
      var result, $this = this
      if (!selector) result = $()
      else if (typeof selector == 'object')
        result = $(selector).filter(function(){
          var node = this
          return emptyArray.some.call($this, function(parent){
            return $.contains(parent, node)
          })
        })
      else if (this.length == 1) result = $(zepto.qsa(this[0], selector))
      else result = this.map(function(){ return zepto.qsa(this, selector) })
      return result
    },
    closest: function(selector, context){
      var nodes = [], collection = typeof selector == 'object' && $(selector)
      this.each(function(_, node){
        while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
          node = node !== context && !isDocument(node) && node.parentNode
        if (node && nodes.indexOf(node) < 0) nodes.push(node)
      })
      return $(nodes)
    },
    parents: function(selector){
      var ancestors = [], nodes = this
      while (nodes.length > 0)
        nodes = $.map(nodes, function(node){
          if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
            ancestors.push(node)
            return node
          }
        })
      return filtered(ancestors, selector)
    },
    parent: function(selector){
      return filtered(uniq(this.pluck('parentNode')), selector)
    },
    children: function(selector){
      return filtered(this.map(function(){ return children(this) }), selector)
    },
    contents: function() {
      return this.map(function() { return this.contentDocument || slice.call(this.childNodes) })
    },
    siblings: function(selector){
      return filtered(this.map(function(i, el){
        return filter.call(children(el.parentNode), function(child){ return child!==el })
      }), selector)
    },
    empty: function(){
      return this.each(function(){ this.innerHTML = '' })
    },
    // `pluck` is borrowed from Prototype.js
    pluck: function(property){
      return $.map(this, function(el){ return el[property] })
    },
    show: function(){
      return this.each(function(){
        this.style.display == "none" && (this.style.display = '')
        if (getComputedStyle(this, '').getPropertyValue("display") == "none")
          this.style.display = defaultDisplay(this.nodeName)
      })
    },
    replaceWith: function(newContent){
      return this.before(newContent).remove()
    },
    wrap: function(structure){
      var func = isFunction(structure)
      if (this[0] && !func)
        var dom   = $(structure).get(0),
            clone = dom.parentNode || this.length > 1

      return this.each(function(index){
        $(this).wrapAll(
          func ? structure.call(this, index) :
            clone ? dom.cloneNode(true) : dom
        )
      })
    },
    wrapAll: function(structure){
      if (this[0]) {
        $(this[0]).before(structure = $(structure))
        var children
        // drill down to the inmost element
        while ((children = structure.children()).length) structure = children.first()
        $(structure).append(this)
      }
      return this
    },
    wrapInner: function(structure){
      var func = isFunction(structure)
      return this.each(function(index){
        var self = $(this), contents = self.contents(),
            dom  = func ? structure.call(this, index) : structure
        contents.length ? contents.wrapAll(dom) : self.append(dom)
      })
    },
    unwrap: function(){
      this.parent().each(function(){
        $(this).replaceWith($(this).children())
      })
      return this
    },
    clone: function(){
      return this.map(function(){ return this.cloneNode(true) })
    },
    hide: function(){
      return this.css("display", "none")
    },
    toggle: function(setting){
      return this.each(function(){
        var el = $(this)
        ;(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
      })
    },
    prev: function(selector){ return $(this.pluck('previousElementSibling')).filter(selector || '*') },
    next: function(selector){ return $(this.pluck('nextElementSibling')).filter(selector || '*') },
    html: function(html){
      return 0 in arguments ?
        this.each(function(idx){
          var originHtml = this.innerHTML
          $(this).empty().append( funcArg(this, html, idx, originHtml) )
        }) :
        (0 in this ? this[0].innerHTML : null)
    },
    text: function(text){
      return 0 in arguments ?
        this.each(function(idx){
          var newText = funcArg(this, text, idx, this.textContent)
          this.textContent = newText == null ? '' : ''+newText
        }) :
        (0 in this ? this.pluck('textContent').join("") : null)
    },
    attr: function(name, value){
      var result
      return (typeof name == 'string' && !(1 in arguments)) ?
        (0 in this && this[0].nodeType == 1 && (result = this[0].getAttribute(name)) != null ? result : undefined) :
        this.each(function(idx){
          if (this.nodeType !== 1) return
          if (isObject(name)) for (key in name) setAttribute(this, key, name[key])
          else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
        })
    },
    removeAttr: function(name){
      return this.each(function(){ this.nodeType === 1 && name.split(' ').forEach(function(attribute){
        setAttribute(this, attribute)
      }, this)})
    },
    prop: function(name, value){
      name = propMap[name] || name
      return (1 in arguments) ?
        this.each(function(idx){
          this[name] = funcArg(this, value, idx, this[name])
        }) :
        (this[0] && this[0][name])
    },
    removeProp: function(name){
      name = propMap[name] || name
      return this.each(function(){ delete this[name] })
    },
    data: function(name, value){
      var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase()

      var data = (1 in arguments) ?
        this.attr(attrName, value) :
        this.attr(attrName)

      return data !== null ? deserializeValue(data) : undefined
    },
    val: function(value){
      if (0 in arguments) {
        if (value == null) value = ""
        return this.each(function(idx){
          this.value = funcArg(this, value, idx, this.value)
        })
      } else {
        return this[0] && (this[0].multiple ?
           $(this[0]).find('option').filter(function(){ return this.selected }).pluck('value') :
           this[0].value)
      }
    },
    offset: function(coordinates){
      if (coordinates) return this.each(function(index){
        var $this = $(this),
            coords = funcArg(this, coordinates, index, $this.offset()),
            parentOffset = $this.offsetParent().offset(),
            props = {
              top:  coords.top  - parentOffset.top,
              left: coords.left - parentOffset.left
            }

        if ($this.css('position') == 'static') props['position'] = 'relative'
        $this.css(props)
      })
      if (!this.length) return null
      if (document.documentElement !== this[0] && !$.contains(document.documentElement, this[0]))
        return {top: 0, left: 0}
      var obj = this[0].getBoundingClientRect()
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: Math.round(obj.width),
        height: Math.round(obj.height)
      }
    },
    css: function(property, value){
      if (arguments.length < 2) {
        var element = this[0]
        if (typeof property == 'string') {
          if (!element) return
          return element.style[camelize(property)] || getComputedStyle(element, '').getPropertyValue(property)
        } else if (isArray(property)) {
          if (!element) return
          var props = {}
          var computedStyle = getComputedStyle(element, '')
          $.each(property, function(_, prop){
            props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop))
          })
          return props
        }
      }

      var css = ''
      if (type(property) == 'string') {
        if (!value && value !== 0)
          this.each(function(){ this.style.removeProperty(dasherize(property)) })
        else
          css = dasherize(property) + ":" + maybeAddPx(property, value)
      } else {
        for (key in property)
          if (!property[key] && property[key] !== 0)
            this.each(function(){ this.style.removeProperty(dasherize(key)) })
          else
            css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
      }

      return this.each(function(){ this.style.cssText += ';' + css })
    },
    index: function(element){
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
    },
    hasClass: function(name){
      if (!name) return false
      return emptyArray.some.call(this, function(el){
        return this.test(className(el))
      }, classRE(name))
    },
    addClass: function(name){
      if (!name) return this
      return this.each(function(idx){
        if (!('className' in this)) return
        classList = []
        var cls = className(this), newName = funcArg(this, name, idx, cls)
        newName.split(/\s+/g).forEach(function(klass){
          if (!$(this).hasClass(klass)) classList.push(klass)
        }, this)
        classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
      })
    },
    removeClass: function(name){
      return this.each(function(idx){
        if (!('className' in this)) return
        if (name === undefined) return className(this, '')
        classList = className(this)
        funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass){
          classList = classList.replace(classRE(klass), " ")
        })
        className(this, classList.trim())
      })
    },
    toggleClass: function(name, when){
      if (!name) return this
      return this.each(function(idx){
        var $this = $(this), names = funcArg(this, name, idx, className(this))
        names.split(/\s+/g).forEach(function(klass){
          (when === undefined ? !$this.hasClass(klass) : when) ?
            $this.addClass(klass) : $this.removeClass(klass)
        })
      })
    },
    scrollTop: function(value){
      if (!this.length) return
      var hasScrollTop = 'scrollTop' in this[0]
      if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset
      return this.each(hasScrollTop ?
        function(){ this.scrollTop = value } :
        function(){ this.scrollTo(this.scrollX, value) })
    },
    scrollLeft: function(value){
      if (!this.length) return
      var hasScrollLeft = 'scrollLeft' in this[0]
      if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
      return this.each(hasScrollLeft ?
        function(){ this.scrollLeft = value } :
        function(){ this.scrollTo(value, this.scrollY) })
    },
    position: function() {
      if (!this.length) return

      var elem = this[0],
        // Get *real* offsetParent
        offsetParent = this.offsetParent(),
        // Get correct offsets
        offset       = this.offset(),
        parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset()

      // Subtract element margins
      // note: when an element has margin: auto the offsetLeft and marginLeft
      // are the same in Safari causing offset.left to incorrectly be 0
      offset.top  -= parseFloat( $(elem).css('margin-top') ) || 0
      offset.left -= parseFloat( $(elem).css('margin-left') ) || 0

      // Add offsetParent borders
      parentOffset.top  += parseFloat( $(offsetParent[0]).css('border-top-width') ) || 0
      parentOffset.left += parseFloat( $(offsetParent[0]).css('border-left-width') ) || 0

      // Subtract the two offsets
      return {
        top:  offset.top  - parentOffset.top,
        left: offset.left - parentOffset.left
      }
    },
    offsetParent: function() {
      return this.map(function(){
        var parent = this.offsetParent || document.body
        while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
          parent = parent.offsetParent
        return parent
      })
    }
  }

  // for now
  $.fn.detach = $.fn.remove

  // Generate the `width` and `height` functions
  ;['width', 'height'].forEach(function(dimension){
    var dimensionProperty =
      dimension.replace(/./, function(m){ return m[0].toUpperCase() })

    $.fn[dimension] = function(value){
      var offset, el = this[0]
      if (value === undefined) return isWindow(el) ? el['inner' + dimensionProperty] :
        isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
        (offset = this.offset()) && offset[dimension]
      else return this.each(function(idx){
        el = $(this)
        el.css(dimension, funcArg(this, value, idx, el[dimension]()))
      })
    }
  })

  function traverseNode(node, fun) {
    fun(node)
    for (var i = 0, len = node.childNodes.length; i < len; i++)
      traverseNode(node.childNodes[i], fun)
  }

  // Generate the `after`, `prepend`, `before`, `append`,
  // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
  adjacencyOperators.forEach(function(operator, operatorIndex) {
    var inside = operatorIndex % 2 //=> prepend, append

    $.fn[operator] = function(){
      // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
      var argType, nodes = $.map(arguments, function(arg) {
            var arr = []
            argType = type(arg)
            if (argType == "array") {
              arg.forEach(function(el) {
                if (el.nodeType !== undefined) return arr.push(el)
                else if ($.zepto.isZ(el)) return arr = arr.concat(el.get())
                arr = arr.concat(zepto.fragment(el))
              })
              return arr
            }
            return argType == "object" || arg == null ?
              arg : zepto.fragment(arg)
          }),
          parent, copyByClone = this.length > 1
      if (nodes.length < 1) return this

      return this.each(function(_, target){
        parent = inside ? target : target.parentNode

        // convert all methods to a "before" operation
        target = operatorIndex == 0 ? target.nextSibling :
                 operatorIndex == 1 ? target.firstChild :
                 operatorIndex == 2 ? target :
                 null

        var parentInDocument = $.contains(document.documentElement, parent)

        nodes.forEach(function(node){
          if (copyByClone) node = node.cloneNode(true)
          else if (!parent) return $(node).remove()

          parent.insertBefore(node, target)
          if (parentInDocument) traverseNode(node, function(el){
            if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
               (!el.type || el.type === 'text/javascript') && !el.src){
              var target = el.ownerDocument ? el.ownerDocument.defaultView : window
              target['eval'].call(target, el.innerHTML)
            }
          })
        })
      })
    }

    // after    => insertAfter
    // prepend  => prependTo
    // before   => insertBefore
    // append   => appendTo
    $.fn[inside ? operator+'To' : 'insert'+(operatorIndex ? 'Before' : 'After')] = function(html){
      $(html)[operator](this)
      return this
    }
  })

  zepto.Z.prototype = Z.prototype = $.fn

  // Export internal API functions in the `$.zepto` namespace
  zepto.uniq = uniq
  zepto.deserializeValue = deserializeValue
  $.zepto = zepto

  return $
})()

window.Zepto = Zepto
window.$ === undefined && (window.$ = Zepto)

;(function($){
  var _zid = 1, undefined,
      slice = Array.prototype.slice,
      isFunction = $.isFunction,
      isString = function(obj){ return typeof obj == 'string' },
      handlers = {},
      specialEvents={},
      focusinSupported = 'onfocusin' in window,
      focus = { focus: 'focusin', blur: 'focusout' },
      hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' }

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

  function zid(element) {
    return element._zid || (element._zid = _zid++)
  }
  function findHandlers(element, event, fn, selector) {
    event = parse(event)
    if (event.ns) var matcher = matcherFor(event.ns)
    return (handlers[zid(element)] || []).filter(function(handler) {
      return handler
        && (!event.e  || handler.e == event.e)
        && (!event.ns || matcher.test(handler.ns))
        && (!fn       || zid(handler.fn) === zid(fn))
        && (!selector || handler.sel == selector)
    })
  }
  function parse(event) {
    var parts = ('' + event).split('.')
    return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
  }
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
  }

  function eventCapture(handler, captureSetting) {
    return handler.del &&
      (!focusinSupported && (handler.e in focus)) ||
      !!captureSetting
  }

  function realEvent(type) {
    return hover[type] || (focusinSupported && focus[type]) || type
  }

  function add(element, events, fn, data, selector, delegator, capture){
    var id = zid(element), set = (handlers[id] || (handlers[id] = []))
    events.split(/\s/).forEach(function(event){
      if (event == 'ready') return $(document).ready(fn)
      var handler   = parse(event)
      handler.fn    = fn
      handler.sel   = selector
      // emulate mouseenter, mouseleave
      if (handler.e in hover) fn = function(e){
        var related = e.relatedTarget
        if (!related || (related !== this && !$.contains(this, related)))
          return handler.fn.apply(this, arguments)
      }
      handler.del   = delegator
      var callback  = delegator || fn
      handler.proxy = function(e){
        e = compatible(e)
        if (e.isImmediatePropagationStopped()) return
        e.data = data
        var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
        if (result === false) e.preventDefault(), e.stopPropagation()
        return result
      }
      handler.i = set.length
      set.push(handler)
      if ('addEventListener' in element)
        element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
    })
  }
  function remove(element, events, fn, selector, capture){
    var id = zid(element)
    ;(events || '').split(/\s/).forEach(function(event){
      findHandlers(element, event, fn, selector).forEach(function(handler){
        delete handlers[id][handler.i]
      if ('removeEventListener' in element)
        element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
      })
    })
  }

  $.event = { add: add, remove: remove }

  $.proxy = function(fn, context) {
    var args = (2 in arguments) && slice.call(arguments, 2)
    if (isFunction(fn)) {
      var proxyFn = function(){ return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments) }
      proxyFn._zid = zid(fn)
      return proxyFn
    } else if (isString(context)) {
      if (args) {
        args.unshift(fn[context], fn)
        return $.proxy.apply(null, args)
      } else {
        return $.proxy(fn[context], fn)
      }
    } else {
      throw new TypeError("expected function")
    }
  }

  $.fn.bind = function(event, data, callback){
    return this.on(event, data, callback)
  }
  $.fn.unbind = function(event, callback){
    return this.off(event, callback)
  }
  $.fn.one = function(event, selector, data, callback){
    return this.on(event, selector, data, callback, 1)
  }

  var returnTrue = function(){return true},
      returnFalse = function(){return false},
      ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$|webkitMovement[XY]$)/,
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      }

  function compatible(event, source) {
    if (source || !event.isDefaultPrevented) {
      source || (source = event)

      $.each(eventMethods, function(name, predicate) {
        var sourceMethod = source[name]
        event[name] = function(){
          this[predicate] = returnTrue
          return sourceMethod && sourceMethod.apply(source, arguments)
        }
        event[predicate] = returnFalse
      })

      event.timeStamp || (event.timeStamp = Date.now())

      if (source.defaultPrevented !== undefined ? source.defaultPrevented :
          'returnValue' in source ? source.returnValue === false :
          source.getPreventDefault && source.getPreventDefault())
        event.isDefaultPrevented = returnTrue
    }
    return event
  }

  function createProxy(event) {
    var key, proxy = { originalEvent: event }
    for (key in event)
      if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]

    return compatible(proxy, event)
  }

  $.fn.delegate = function(selector, event, callback){
    return this.on(event, selector, callback)
  }
  $.fn.undelegate = function(selector, event, callback){
    return this.off(event, selector, callback)
  }

  $.fn.live = function(event, callback){
    $(document.body).delegate(this.selector, event, callback)
    return this
  }
  $.fn.die = function(event, callback){
    $(document.body).undelegate(this.selector, event, callback)
    return this
  }

  $.fn.on = function(event, selector, data, callback, one){
    var autoRemove, delegator, $this = this
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.on(type, selector, data, fn, one)
      })
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = data, data = selector, selector = undefined
    if (callback === undefined || data === false)
      callback = data, data = undefined

    if (callback === false) callback = returnFalse

    return $this.each(function(_, element){
      if (one) autoRemove = function(e){
        remove(element, e.type, callback)
        return callback.apply(this, arguments)
      }

      if (selector) delegator = function(e){
        var evt, match = $(e.target).closest(selector, element).get(0)
        if (match && match !== element) {
          evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
          return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
        }
      }

      add(element, event, callback, data, selector, delegator || autoRemove)
    })
  }
  $.fn.off = function(event, selector, callback){
    var $this = this
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.off(type, selector, fn)
      })
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = selector, selector = undefined

    if (callback === false) callback = returnFalse

    return $this.each(function(){
      remove(this, event, callback, selector)
    })
  }

  $.fn.trigger = function(event, args){
    event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event)
    event._args = args
    return this.each(function(){
      // handle focus(), blur() by calling them directly
      if (event.type in focus && typeof this[event.type] == "function") this[event.type]()
      // items in the collection might not be DOM elements
      else if ('dispatchEvent' in this) this.dispatchEvent(event)
      else $(this).triggerHandler(event, args)
    })
  }

  // triggers event handlers on current element just as if an event occurred,
  // doesn't trigger an actual event, doesn't bubble
  $.fn.triggerHandler = function(event, args){
    var e, result
    this.each(function(i, element){
      e = createProxy(isString(event) ? $.Event(event) : event)
      e._args = args
      e.target = element
      $.each(findHandlers(element, event.type || event), function(i, handler){
        result = handler.proxy(e)
        if (e.isImmediatePropagationStopped()) return false
      })
    })
    return result
  }

  // shortcut methods for `.bind(event, fn)` for each event type
  ;('focusin focusout focus blur load resize scroll unload click dblclick '+
  'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave '+
  'change select keydown keypress keyup error').split(' ').forEach(function(event) {
    $.fn[event] = function(callback) {
      return (0 in arguments) ?
        this.bind(event, callback) :
        this.trigger(event)
    }
  })

  $.Event = function(type, props) {
    if (!isString(type)) props = type, type = props.type
    var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
    if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
    event.initEvent(type, bubbles, true)
    return compatible(event)
  }

})(Zepto)

;(function($){
  var jsonpID = +new Date(),
      document = window.document,
      key,
      name,
      rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      scriptTypeRE = /^(?:text|application)\/javascript/i,
      xmlTypeRE = /^(?:text|application)\/xml/i,
      jsonType = 'application/json',
      htmlType = 'text/html',
      blankRE = /^\s*$/,
      originAnchor = document.createElement('a')

  originAnchor.href = window.location.href

  // trigger a custom event and return false if it was cancelled
  function triggerAndReturn(context, eventName, data) {
    var event = $.Event(eventName)
    $(context).trigger(event, data)
    return !event.isDefaultPrevented()
  }

  // trigger an Ajax "global" event
  function triggerGlobal(settings, context, eventName, data) {
    if (settings.global) return triggerAndReturn(context || document, eventName, data)
  }

  // Number of active Ajax requests
  $.active = 0

  function ajaxStart(settings) {
    if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
  }
  function ajaxStop(settings) {
    if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
  }

  // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
  function ajaxBeforeSend(xhr, settings) {
    var context = settings.context
    if (settings.beforeSend.call(context, xhr, settings) === false ||
        triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
      return false

    triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
  }
  function ajaxSuccess(data, xhr, settings, deferred) {
    var context = settings.context, status = 'success'
    settings.success.call(context, data, status, xhr)
    if (deferred) deferred.resolveWith(context, [data, status, xhr])
    triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
    ajaxComplete(status, xhr, settings)
  }
  // type: "timeout", "error", "abort", "parsererror"
  function ajaxError(error, type, xhr, settings, deferred) {
    var context = settings.context
    settings.error.call(context, xhr, type, error)
    if (deferred) deferred.rejectWith(context, [xhr, type, error])
    triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type])
    ajaxComplete(type, xhr, settings)
  }
  // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
  function ajaxComplete(status, xhr, settings) {
    var context = settings.context
    settings.complete.call(context, xhr, status)
    triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
    ajaxStop(settings)
  }

  function ajaxDataFilter(data, type, settings) {
    if (settings.dataFilter == empty) return data
    var context = settings.context
    return settings.dataFilter.call(context, data, type)
  }

  // Empty function, used as default callback
  function empty() {}

  $.ajaxJSONP = function(options, deferred){
    if (!('type' in options)) return $.ajax(options)

    var _callbackName = options.jsonpCallback,
      callbackName = ($.isFunction(_callbackName) ?
        _callbackName() : _callbackName) || ('Zepto' + (jsonpID++)),
      script = document.createElement('script'),
      originalCallback = window[callbackName],
      responseData,
      abort = function(errorType) {
        $(script).triggerHandler('error', errorType || 'abort')
      },
      xhr = { abort: abort }, abortTimeout

    if (deferred) deferred.promise(xhr)

    $(script).on('load error', function(e, errorType){
      clearTimeout(abortTimeout)
      $(script).off().remove()

      if (e.type == 'error' || !responseData) {
        ajaxError(null, errorType || 'error', xhr, options, deferred)
      } else {
        ajaxSuccess(responseData[0], xhr, options, deferred)
      }

      window[callbackName] = originalCallback
      if (responseData && $.isFunction(originalCallback))
        originalCallback(responseData[0])

      originalCallback = responseData = undefined
    })

    if (ajaxBeforeSend(xhr, options) === false) {
      abort('abort')
      return xhr
    }

    window[callbackName] = function(){
      responseData = arguments
    }

    script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName)
    document.head.appendChild(script)

    if (options.timeout > 0) abortTimeout = setTimeout(function(){
      abort('timeout')
    }, options.timeout)

    return xhr
  }

  $.ajaxSettings = {
    // Default type of request
    type: 'GET',
    // Callback that is executed before request
    beforeSend: empty,
    // Callback that is executed if the request succeeds
    success: empty,
    // Callback that is executed the the server drops error
    error: empty,
    // Callback that is executed on request complete (both: error and success)
    complete: empty,
    // The context for the callbacks
    context: null,
    // Whether to trigger "global" Ajax events
    global: true,
    // Transport
    xhr: function () {
      return new window.XMLHttpRequest()
    },
    // MIME types mapping
    // IIS returns Javascript as "application/x-javascript"
    accepts: {
      script: 'text/javascript, application/javascript, application/x-javascript',
      json:   jsonType,
      xml:    'application/xml, text/xml',
      html:   htmlType,
      text:   'text/plain'
    },
    // Whether the request is to another domain
    crossDomain: false,
    // Default timeout
    timeout: 0,
    // Whether data should be serialized to string
    processData: true,
    // Whether the browser should be allowed to cache GET responses
    cache: true,
    //Used to handle the raw response data of XMLHttpRequest.
    //This is a pre-filtering function to sanitize the response.
    //The sanitized response should be returned
    dataFilter: empty
  }

  function mimeToDataType(mime) {
    if (mime) mime = mime.split(';', 2)[0]
    return mime && ( mime == htmlType ? 'html' :
      mime == jsonType ? 'json' :
      scriptTypeRE.test(mime) ? 'script' :
      xmlTypeRE.test(mime) && 'xml' ) || 'text'
  }

  function appendQuery(url, query) {
    if (query == '') return url
    return (url + '&' + query).replace(/[&?]{1,2}/, '?')
  }

  // serialize payload and append it to the URL for GET requests
  function serializeData(options) {
    if (options.processData && options.data && $.type(options.data) != "string")
      options.data = $.param(options.data, options.traditional)
    if (options.data && (!options.type || options.type.toUpperCase() == 'GET' || 'jsonp' == options.dataType))
      options.url = appendQuery(options.url, options.data), options.data = undefined
  }

  $.ajax = function(options){
    var settings = $.extend({}, options || {}),
        deferred = $.Deferred && $.Deferred(),
        urlAnchor, hashIndex
    for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

    ajaxStart(settings)

    if (!settings.crossDomain) {
      urlAnchor = document.createElement('a')
      urlAnchor.href = settings.url
      // cleans up URL for .href (IE only), see https://github.com/madrobby/zepto/pull/1049
      urlAnchor.href = urlAnchor.href
      settings.crossDomain = (originAnchor.protocol + '//' + originAnchor.host) !== (urlAnchor.protocol + '//' + urlAnchor.host)
    }

    if (!settings.url) settings.url = window.location.toString()
    if ((hashIndex = settings.url.indexOf('#')) > -1) settings.url = settings.url.slice(0, hashIndex)
    serializeData(settings)

    var dataType = settings.dataType, hasPlaceholder = /\?.+=\?/.test(settings.url)
    if (hasPlaceholder) dataType = 'jsonp'

    if (settings.cache === false || (
         (!options || options.cache !== true) &&
         ('script' == dataType || 'jsonp' == dataType)
        ))
      settings.url = appendQuery(settings.url, '_=' + Date.now())

    if ('jsonp' == dataType) {
      if (!hasPlaceholder)
        settings.url = appendQuery(settings.url,
          settings.jsonp ? (settings.jsonp + '=?') : settings.jsonp === false ? '' : 'callback=?')
      return $.ajaxJSONP(settings, deferred)
    }

    var mime = settings.accepts[dataType],
        headers = { },
        setHeader = function(name, value) { headers[name.toLowerCase()] = [name, value] },
        protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
        xhr = settings.xhr(),
        nativeSetHeader = xhr.setRequestHeader,
        abortTimeout

    if (deferred) deferred.promise(xhr)

    if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest')
    setHeader('Accept', mime || '*/*')
    if (mime = settings.mimeType || mime) {
      if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
      xhr.overrideMimeType && xhr.overrideMimeType(mime)
    }
    if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
      setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded')

    if (settings.headers) for (name in settings.headers) setHeader(name, settings.headers[name])
    xhr.setRequestHeader = setHeader

    xhr.onreadystatechange = function(){
      if (xhr.readyState == 4) {
        xhr.onreadystatechange = empty
        clearTimeout(abortTimeout)
        var result, error = false
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
          dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'))

          if (xhr.responseType == 'arraybuffer' || xhr.responseType == 'blob')
            result = xhr.response
          else {
            result = xhr.responseText

            try {
              // http://perfectionkills.com/global-eval-what-are-the-options/
              // sanitize response accordingly if data filter callback provided
              result = ajaxDataFilter(result, dataType, settings)
              if (dataType == 'script')    (1,eval)(result)
              else if (dataType == 'xml')  result = xhr.responseXML
              else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result)
            } catch (e) { error = e }

            if (error) return ajaxError(error, 'parsererror', xhr, settings, deferred)
          }

          ajaxSuccess(result, xhr, settings, deferred)
        } else {
          ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings, deferred)
        }
      }
    }

    if (ajaxBeforeSend(xhr, settings) === false) {
      xhr.abort()
      ajaxError(null, 'abort', xhr, settings, deferred)
      return xhr
    }

    var async = 'async' in settings ? settings.async : true
    xhr.open(settings.type, settings.url, async, settings.username, settings.password)

    if (settings.xhrFields) for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name]

    for (name in headers) nativeSetHeader.apply(xhr, headers[name])

    if (settings.timeout > 0) abortTimeout = setTimeout(function(){
        xhr.onreadystatechange = empty
        xhr.abort()
        ajaxError(null, 'timeout', xhr, settings, deferred)
      }, settings.timeout)

    // avoid sending empty string (#319)
    xhr.send(settings.data ? settings.data : null)
    return xhr
  }

  // handle optional data/success arguments
  function parseArguments(url, data, success, dataType) {
    if ($.isFunction(data)) dataType = success, success = data, data = undefined
    if (!$.isFunction(success)) dataType = success, success = undefined
    return {
      url: url
    , data: data
    , success: success
    , dataType: dataType
    }
  }

  $.get = function(/* url, data, success, dataType */){
    return $.ajax(parseArguments.apply(null, arguments))
  }

  $.post = function(/* url, data, success, dataType */){
    var options = parseArguments.apply(null, arguments)
    options.type = 'POST'
    return $.ajax(options)
  }

  $.getJSON = function(/* url, data, success */){
    var options = parseArguments.apply(null, arguments)
    options.dataType = 'json'
    return $.ajax(options)
  }

  $.fn.load = function(url, data, success){
    if (!this.length) return this
    var self = this, parts = url.split(/\s/), selector,
        options = parseArguments(url, data, success),
        callback = options.success
    if (parts.length > 1) options.url = parts[0], selector = parts[1]
    options.success = function(response){
      self.html(selector ?
        $('<div>').html(response.replace(rscript, "")).find(selector)
        : response)
      callback && callback.apply(self, arguments)
    }
    $.ajax(options)
    return this
  }

  var escape = encodeURIComponent

  function serialize(params, obj, traditional, scope){
    var type, array = $.isArray(obj), hash = $.isPlainObject(obj)
    $.each(obj, function(key, value) {
      type = $.type(value)
      if (scope) key = traditional ? scope :
        scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']'
      // handle data in serializeArray() format
      if (!scope && array) params.add(value.name, value.value)
      // recurse into nested objects
      else if (type == "array" || (!traditional && type == "object"))
        serialize(params, value, traditional, key)
      else params.add(key, value)
    })
  }

  $.param = function(obj, traditional){
    var params = []
    params.add = function(key, value) {
      if ($.isFunction(value)) value = value()
      if (value == null) value = ""
      this.push(escape(key) + '=' + escape(value))
    }
    serialize(params, obj, traditional)
    return params.join('&').replace(/%20/g, '+')
  }
})(Zepto)

;(function($){
  $.fn.serializeArray = function() {
    var name, type, result = [],
      add = function(value) {
        if (value.forEach) return value.forEach(add)
        result.push({ name: name, value: value })
      }
    if (this[0]) $.each(this[0].elements, function(_, field){
      type = field.type, name = field.name
      if (name && field.nodeName.toLowerCase() != 'fieldset' &&
        !field.disabled && type != 'submit' && type != 'reset' && type != 'button' && type != 'file' &&
        ((type != 'radio' && type != 'checkbox') || field.checked))
          add($(field).val())
    })
    return result
  }

  $.fn.serialize = function(){
    var result = []
    this.serializeArray().forEach(function(elm){
      result.push(encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value))
    })
    return result.join('&')
  }

  $.fn.submit = function(callback) {
    if (0 in arguments) this.bind('submit', callback)
    else if (this.length) {
      var event = $.Event('submit')
      this.eq(0).trigger(event)
      if (!event.isDefaultPrevented()) this.get(0).submit()
    }
    return this
  }

})(Zepto)

;(function(){
  // getComputedStyle shouldn't freak out when called
  // without a valid element as argument
  try {
    getComputedStyle(undefined)
  } catch(e) {
    var nativeGetComputedStyle = getComputedStyle
    window.getComputedStyle = function(element, pseudoElement){
      try {
        return nativeGetComputedStyle(element, pseudoElement)
      } catch(e) {
        return null
      }
    }
  }
})()
  return Zepto
}))
///<jscompress sourcefile="vue.js" />
/*!
 * Vue.js v1.0.26
 * (c) 2016 Evan You
 * Released under the MIT License.
 */
!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):t.Vue=e()}(this,function(){"use strict";function t(e,n,r){if(i(e,n))return void(e[n]=r);if(e._isVue)return void t(e._data,n,r);var s=e.__ob__;if(!s)return void(e[n]=r);if(s.convert(n,r),s.dep.notify(),s.vms)for(var o=s.vms.length;o--;){var a=s.vms[o];a._proxy(n),a._digest()}return r}function e(t,e){if(i(t,e)){delete t[e];var n=t.__ob__;if(!n)return void(t._isVue&&(delete t._data[e],t._digest()));if(n.dep.notify(),n.vms)for(var r=n.vms.length;r--;){var s=n.vms[r];s._unproxy(e),s._digest()}}}function i(t,e){return Oi.call(t,e)}function n(t){return Ti.test(t)}function r(t){var e=(t+"").charCodeAt(0);return 36===e||95===e}function s(t){return null==t?"":t.toString()}function o(t){if("string"!=typeof t)return t;var e=Number(t);return isNaN(e)?t:e}function a(t){return"true"===t?!0:"false"===t?!1:t}function h(t){var e=t.charCodeAt(0),i=t.charCodeAt(t.length-1);return e!==i||34!==e&&39!==e?t:t.slice(1,-1)}function l(t){return t.replace(Ni,c)}function c(t,e){return e?e.toUpperCase():""}function u(t){return t.replace(ji,"$1-$2").toLowerCase()}function f(t){return t.replace(Ei,c)}function p(t,e){return function(i){var n=arguments.length;return n?n>1?t.apply(e,arguments):t.call(e,i):t.call(e)}}function d(t,e){e=e||0;for(var i=t.length-e,n=new Array(i);i--;)n[i]=t[i+e];return n}function v(t,e){for(var i=Object.keys(e),n=i.length;n--;)t[i[n]]=e[i[n]];return t}function m(t){return null!==t&&"object"==typeof t}function g(t){return Si.call(t)===Fi}function _(t,e,i,n){Object.defineProperty(t,e,{value:i,enumerable:!!n,writable:!0,configurable:!0})}function y(t,e){var i,n,r,s,o,a=function h(){var a=Date.now()-s;e>a&&a>=0?i=setTimeout(h,e-a):(i=null,o=t.apply(r,n),i||(r=n=null))};return function(){return r=this,n=arguments,s=Date.now(),i||(i=setTimeout(a,e)),o}}function b(t,e){for(var i=t.length;i--;)if(t[i]===e)return i;return-1}function w(t){var e=function i(){return i.cancelled?void 0:t.apply(this,arguments)};return e.cancel=function(){e.cancelled=!0},e}function C(t,e){return t==e||(m(t)&&m(e)?JSON.stringify(t)===JSON.stringify(e):!1)}function $(t){this.size=0,this.limit=t,this.head=this.tail=void 0,this._keymap=Object.create(null)}function k(){var t,e=en.slice(hn,on).trim();if(e){t={};var i=e.match(vn);t.name=i[0],i.length>1&&(t.args=i.slice(1).map(x))}t&&(nn.filters=nn.filters||[]).push(t),hn=on+1}function x(t){if(mn.test(t))return{value:o(t),dynamic:!1};var e=h(t),i=e===t;return{value:i?t:e,dynamic:i}}function A(t){var e=dn.get(t);if(e)return e;for(en=t,ln=cn=!1,un=fn=pn=0,hn=0,nn={},on=0,an=en.length;an>on;on++)if(sn=rn,rn=en.charCodeAt(on),ln)39===rn&&92!==sn&&(ln=!ln);else if(cn)34===rn&&92!==sn&&(cn=!cn);else if(124===rn&&124!==en.charCodeAt(on+1)&&124!==en.charCodeAt(on-1))null==nn.expression?(hn=on+1,nn.expression=en.slice(0,on).trim()):k();else switch(rn){case 34:cn=!0;break;case 39:ln=!0;break;case 40:pn++;break;case 41:pn--;break;case 91:fn++;break;case 93:fn--;break;case 123:un++;break;case 125:un--}return null==nn.expression?nn.expression=en.slice(0,on).trim():0!==hn&&k(),dn.put(t,nn),nn}function O(t){return t.replace(_n,"\\$&")}function T(){var t=O(An.delimiters[0]),e=O(An.delimiters[1]),i=O(An.unsafeDelimiters[0]),n=O(An.unsafeDelimiters[1]);bn=new RegExp(i+"((?:.|\\n)+?)"+n+"|"+t+"((?:.|\\n)+?)"+e,"g"),wn=new RegExp("^"+i+"((?:.|\\n)+?)"+n+"$"),yn=new $(1e3)}function N(t){yn||T();var e=yn.get(t);if(e)return e;if(!bn.test(t))return null;for(var i,n,r,s,o,a,h=[],l=bn.lastIndex=0;i=bn.exec(t);)n=i.index,n>l&&h.push({value:t.slice(l,n)}),r=wn.test(i[0]),s=r?i[1]:i[2],o=s.charCodeAt(0),a=42===o,s=a?s.slice(1):s,h.push({tag:!0,value:s.trim(),html:r,oneTime:a}),l=n+i[0].length;return l<t.length&&h.push({value:t.slice(l)}),yn.put(t,h),h}function j(t,e){return t.length>1?t.map(function(t){return E(t,e)}).join("+"):E(t[0],e,!0)}function E(t,e,i){return t.tag?t.oneTime&&e?'"'+e.$eval(t.value)+'"':S(t.value,i):'"'+t.value+'"'}function S(t,e){if(Cn.test(t)){var i=A(t);return i.filters?"this._applyFilters("+i.expression+",null,"+JSON.stringify(i.filters)+",false)":"("+t+")"}return e?t:"("+t+")"}function F(t,e,i,n){R(t,1,function(){e.appendChild(t)},i,n)}function D(t,e,i,n){R(t,1,function(){B(t,e)},i,n)}function P(t,e,i){R(t,-1,function(){z(t)},e,i)}function R(t,e,i,n,r){var s=t.__v_trans;if(!s||!s.hooks&&!qi||!n._isCompiled||n.$parent&&!n.$parent._isCompiled)return i(),void(r&&r());var o=e>0?"enter":"leave";s[o](i,r)}function L(t){if("string"==typeof t){t=document.querySelector(t)}return t}function H(t){if(!t)return!1;var e=t.ownerDocument.documentElement,i=t.parentNode;return e===t||e===i||!(!i||1!==i.nodeType||!e.contains(i))}function I(t,e){var i=t.getAttribute(e);return null!==i&&t.removeAttribute(e),i}function M(t,e){var i=I(t,":"+e);return null===i&&(i=I(t,"v-bind:"+e)),i}function V(t,e){return t.hasAttribute(e)||t.hasAttribute(":"+e)||t.hasAttribute("v-bind:"+e)}function B(t,e){e.parentNode.insertBefore(t,e)}function W(t,e){e.nextSibling?B(t,e.nextSibling):e.parentNode.appendChild(t)}function z(t){t.parentNode.removeChild(t)}function U(t,e){e.firstChild?B(t,e.firstChild):e.appendChild(t)}function J(t,e){var i=t.parentNode;i&&i.replaceChild(e,t)}function q(t,e,i,n){t.addEventListener(e,i,n)}function Q(t,e,i){t.removeEventListener(e,i)}function G(t){var e=t.className;return"object"==typeof e&&(e=e.baseVal||""),e}function Z(t,e){Mi&&!/svg$/.test(t.namespaceURI)?t.className=e:t.setAttribute("class",e)}function X(t,e){if(t.classList)t.classList.add(e);else{var i=" "+G(t)+" ";i.indexOf(" "+e+" ")<0&&Z(t,(i+e).trim())}}function Y(t,e){if(t.classList)t.classList.remove(e);else{for(var i=" "+G(t)+" ",n=" "+e+" ";i.indexOf(n)>=0;)i=i.replace(n," ");Z(t,i.trim())}t.className||t.removeAttribute("class")}function K(t,e){var i,n;if(it(t)&&at(t.content)&&(t=t.content),t.hasChildNodes())for(tt(t),n=e?document.createDocumentFragment():document.createElement("div");i=t.firstChild;)n.appendChild(i);return n}function tt(t){for(var e;e=t.firstChild,et(e);)t.removeChild(e);for(;e=t.lastChild,et(e);)t.removeChild(e)}function et(t){return t&&(3===t.nodeType&&!t.data.trim()||8===t.nodeType)}function it(t){return t.tagName&&"template"===t.tagName.toLowerCase()}function nt(t,e){var i=An.debug?document.createComment(t):document.createTextNode(e?" ":"");return i.__v_anchor=!0,i}function rt(t){if(t.hasAttributes())for(var e=t.attributes,i=0,n=e.length;n>i;i++){var r=e[i].name;if(Nn.test(r))return l(r.replace(Nn,""))}}function st(t,e,i){for(var n;t!==e;)n=t.nextSibling,i(t),t=n;i(e)}function ot(t,e,i,n,r){function s(){if(a++,o&&a>=h.length){for(var t=0;t<h.length;t++)n.appendChild(h[t]);r&&r()}}var o=!1,a=0,h=[];st(t,e,function(t){t===e&&(o=!0),h.push(t),P(t,i,s)})}function at(t){return t&&11===t.nodeType}function ht(t){if(t.outerHTML)return t.outerHTML;var e=document.createElement("div");return e.appendChild(t.cloneNode(!0)),e.innerHTML}function lt(t,e){var i=t.tagName.toLowerCase(),n=t.hasAttributes();if(jn.test(i)||En.test(i)){if(n)return ct(t,e)}else{if(gt(e,"components",i))return{id:i};var r=n&&ct(t,e);if(r)return r}}function ct(t,e){var i=t.getAttribute("is");if(null!=i){if(gt(e,"components",i))return t.removeAttribute("is"),{id:i}}else if(i=M(t,"is"),null!=i)return{id:i,dynamic:!0}}function ut(e,n){var r,s,o;for(r in n)s=e[r],o=n[r],i(e,r)?m(s)&&m(o)&&ut(s,o):t(e,r,o);return e}function ft(t,e){var i=Object.create(t||null);return e?v(i,vt(e)):i}function pt(t){if(t.components)for(var e,i=t.components=vt(t.components),n=Object.keys(i),r=0,s=n.length;s>r;r++){var o=n[r];jn.test(o)||En.test(o)||(e=i[o],g(e)&&(i[o]=wi.extend(e)))}}function dt(t){var e,i,n=t.props;if(Di(n))for(t.props={},e=n.length;e--;)i=n[e],"string"==typeof i?t.props[i]=null:i.name&&(t.props[i.name]=i);else if(g(n)){var r=Object.keys(n);for(e=r.length;e--;)i=n[r[e]],"function"==typeof i&&(n[r[e]]={type:i})}}function vt(t){if(Di(t)){for(var e,i={},n=t.length;n--;){e=t[n];var r="function"==typeof e?e.options&&e.options.name||e.id:e.name||e.id;r&&(i[r]=e)}return i}return t}function mt(t,e,n){function r(i){var r=Sn[i]||Fn;o[i]=r(t[i],e[i],n,i)}pt(e),dt(e);var s,o={};if(e["extends"]&&(t="function"==typeof e["extends"]?mt(t,e["extends"].options,n):mt(t,e["extends"],n)),e.mixins)for(var a=0,h=e.mixins.length;h>a;a++){var l=e.mixins[a],c=l.prototype instanceof wi?l.options:l;t=mt(t,c,n)}for(s in t)r(s);for(s in e)i(t,s)||r(s);return o}function gt(t,e,i,n){if("string"==typeof i){var r,s=t[e],o=s[i]||s[r=l(i)]||s[r.charAt(0).toUpperCase()+r.slice(1)];return o}}function _t(){this.id=Dn++,this.subs=[]}function yt(t){Hn=!1,t(),Hn=!0}function bt(t){if(this.value=t,this.dep=new _t,_(t,"__ob__",this),Di(t)){var e=Pi?wt:Ct;e(t,Rn,Ln),this.observeArray(t)}else this.walk(t)}function wt(t,e){t.__proto__=e}function Ct(t,e,i){for(var n=0,r=i.length;r>n;n++){var s=i[n];_(t,s,e[s])}}function $t(t,e){if(t&&"object"==typeof t){var n;return i(t,"__ob__")&&t.__ob__ instanceof bt?n=t.__ob__:Hn&&(Di(t)||g(t))&&Object.isExtensible(t)&&!t._isVue&&(n=new bt(t)),n&&e&&n.addVm(e),n}}function kt(t,e,i){var n=new _t,r=Object.getOwnPropertyDescriptor(t,e);if(!r||r.configurable!==!1){var s=r&&r.get,o=r&&r.set,a=$t(i);Object.defineProperty(t,e,{enumerable:!0,configurable:!0,get:function(){var e=s?s.call(t):i;if(_t.target&&(n.depend(),a&&a.dep.depend(),Di(e)))for(var r,o=0,h=e.length;h>o;o++)r=e[o],r&&r.__ob__&&r.__ob__.dep.depend();return e},set:function(e){var r=s?s.call(t):i;e!==r&&(o?o.call(t,e):i=e,a=$t(e),n.notify())}})}}function xt(t){t.prototype._init=function(t){t=t||{},this.$el=null,this.$parent=t.parent,this.$root=this.$parent?this.$parent.$root:this,this.$children=[],this.$refs={},this.$els={},this._watchers=[],this._directives=[],this._uid=Mn++,this._isVue=!0,this._events={},this._eventsCount={},this._isFragment=!1,this._fragment=this._fragmentStart=this._fragmentEnd=null,this._isCompiled=this._isDestroyed=this._isReady=this._isAttached=this._isBeingDestroyed=this._vForRemoving=!1,this._unlinkFn=null,this._context=t._context||this.$parent,this._scope=t._scope,this._frag=t._frag,this._frag&&this._frag.children.push(this),this.$parent&&this.$parent.$children.push(this),t=this.$options=mt(this.constructor.options,t,this),this._updateRef(),this._data={},this._callHook("init"),this._initState(),this._initEvents(),this._callHook("created"),t.el&&this.$mount(t.el)}}function At(t){if(void 0===t)return"eof";var e=t.charCodeAt(0);switch(e){case 91:case 93:case 46:case 34:case 39:case 48:return t;case 95:case 36:return"ident";case 32:case 9:case 10:case 13:case 160:case 65279:case 8232:case 8233:return"ws"}return e>=97&&122>=e||e>=65&&90>=e?"ident":e>=49&&57>=e?"number":"else"}function Ot(t){var e=t.trim();return"0"===t.charAt(0)&&isNaN(t)?!1:n(e)?h(e):"*"+e}function Tt(t){function e(){var e=t[c+1];return u===Xn&&"'"===e||u===Yn&&'"'===e?(c++,n="\\"+e,p[Bn](),!0):void 0}var i,n,r,s,o,a,h,l=[],c=-1,u=Jn,f=0,p=[];for(p[Wn]=function(){void 0!==r&&(l.push(r),r=void 0)},p[Bn]=function(){void 0===r?r=n:r+=n},p[zn]=function(){p[Bn](),f++},p[Un]=function(){if(f>0)f--,u=Zn,p[Bn]();else{if(f=0,r=Ot(r),r===!1)return!1;p[Wn]()}};null!=u;)if(c++,i=t[c],"\\"!==i||!e()){if(s=At(i),h=er[u],o=h[s]||h["else"]||tr,o===tr)return;if(u=o[0],a=p[o[1]],a&&(n=o[2],n=void 0===n?i:n,a()===!1))return;if(u===Kn)return l.raw=t,l}}function Nt(t){var e=Vn.get(t);return e||(e=Tt(t),e&&Vn.put(t,e)),e}function jt(t,e){return It(e).get(t)}function Et(e,i,n){var r=e;if("string"==typeof i&&(i=Tt(i)),!i||!m(e))return!1;for(var s,o,a=0,h=i.length;h>a;a++)s=e,o=i[a],"*"===o.charAt(0)&&(o=It(o.slice(1)).get.call(r,r)),h-1>a?(e=e[o],m(e)||(e={},t(s,o,e))):Di(e)?e.$set(o,n):o in e?e[o]=n:t(e,o,n);return!0}function St(){}function Ft(t,e){var i=vr.length;return vr[i]=e?t.replace(lr,"\\n"):t,'"'+i+'"'}function Dt(t){var e=t.charAt(0),i=t.slice(1);return sr.test(i)?t:(i=i.indexOf('"')>-1?i.replace(ur,Pt):i,e+"scope."+i)}function Pt(t,e){return vr[e]}function Rt(t){ar.test(t),vr.length=0;var e=t.replace(cr,Ft).replace(hr,"");return e=(" "+e).replace(pr,Dt).replace(ur,Pt),Lt(e)}function Lt(t){try{return new Function("scope","return "+t+";")}catch(e){return St}}function Ht(t){var e=Nt(t);return e?function(t,i){Et(t,e,i)}:void 0}function It(t,e){t=t.trim();var i=nr.get(t);if(i)return e&&!i.set&&(i.set=Ht(i.exp)),i;var n={exp:t};return n.get=Mt(t)&&t.indexOf("[")<0?Lt("scope."+t):Rt(t),e&&(n.set=Ht(t)),nr.put(t,n),n}function Mt(t){return fr.test(t)&&!dr.test(t)&&"Math."!==t.slice(0,5)}function Vt(){gr.length=0,_r.length=0,yr={},br={},wr=!1}function Bt(){for(var t=!0;t;)t=!1,Wt(gr),Wt(_r),gr.length?t=!0:(Li&&An.devtools&&Li.emit("flush"),Vt())}function Wt(t){for(var e=0;e<t.length;e++){var i=t[e],n=i.id;yr[n]=null,i.run()}t.length=0}function zt(t){var e=t.id;if(null==yr[e]){var i=t.user?_r:gr;yr[e]=i.length,i.push(t),wr||(wr=!0,Yi(Bt))}}function Ut(t,e,i,n){n&&v(this,n);var r="function"==typeof e;if(this.vm=t,t._watchers.push(this),this.expression=e,this.cb=i,this.id=++Cr,this.active=!0,this.dirty=this.lazy,this.deps=[],this.newDeps=[],this.depIds=new Ki,this.newDepIds=new Ki,this.prevError=null,r)this.getter=e,this.setter=void 0;else{var s=It(e,this.twoWay);this.getter=s.get,this.setter=s.set}this.value=this.lazy?void 0:this.get(),this.queued=this.shallow=!1}function Jt(t,e){var i=void 0,n=void 0;e||(e=$r,e.clear());var r=Di(t),s=m(t);if((r||s)&&Object.isExtensible(t)){if(t.__ob__){var o=t.__ob__.dep.id;if(e.has(o))return;e.add(o)}if(r)for(i=t.length;i--;)Jt(t[i],e);else if(s)for(n=Object.keys(t),i=n.length;i--;)Jt(t[n[i]],e)}}function qt(t){return it(t)&&at(t.content)}function Qt(t,e){var i=e?t:t.trim(),n=xr.get(i);if(n)return n;var r=document.createDocumentFragment(),s=t.match(Tr),o=Nr.test(t),a=jr.test(t);if(s||o||a){var h=s&&s[1],l=Or[h]||Or.efault,c=l[0],u=l[1],f=l[2],p=document.createElement("div");for(p.innerHTML=u+t+f;c--;)p=p.lastChild;for(var d;d=p.firstChild;)r.appendChild(d)}else r.appendChild(document.createTextNode(t));return e||tt(r),xr.put(i,r),r}function Gt(t){if(qt(t))return Qt(t.innerHTML);if("SCRIPT"===t.tagName)return Qt(t.textContent);for(var e,i=Zt(t),n=document.createDocumentFragment();e=i.firstChild;)n.appendChild(e);return tt(n),n}function Zt(t){if(!t.querySelectorAll)return t.cloneNode();var e,i,n,r=t.cloneNode(!0);if(Er){var s=r;if(qt(t)&&(t=t.content,s=r.content),i=t.querySelectorAll("template"),i.length)for(n=s.querySelectorAll("template"),e=n.length;e--;)n[e].parentNode.replaceChild(Zt(i[e]),n[e])}if(Sr)if("TEXTAREA"===t.tagName)r.value=t.value;else if(i=t.querySelectorAll("textarea"),i.length)for(n=r.querySelectorAll("textarea"),e=n.length;e--;)n[e].value=i[e].value;return r}function Xt(t,e,i){var n,r;return at(t)?(tt(t),e?Zt(t):t):("string"==typeof t?i||"#"!==t.charAt(0)?r=Qt(t,i):(r=Ar.get(t),r||(n=document.getElementById(t.slice(1)),n&&(r=Gt(n),Ar.put(t,r)))):t.nodeType&&(r=Gt(t)),r&&e?Zt(r):r)}function Yt(t,e,i,n,r,s){this.children=[],this.childFrags=[],this.vm=e,this.scope=r,this.inserted=!1,this.parentFrag=s,s&&s.childFrags.push(this),this.unlink=t(e,i,n,r,this);var o=this.single=1===i.childNodes.length&&!i.childNodes[0].__v_anchor;o?(this.node=i.childNodes[0],this.before=Kt,this.remove=te):(this.node=nt("fragment-start"),this.end=nt("fragment-end"),this.frag=i,U(this.node,i),i.appendChild(this.end),this.before=ee,this.remove=ie),this.node.__v_frag=this}function Kt(t,e){this.inserted=!0;var i=e!==!1?D:B;i(this.node,t,this.vm),H(this.node)&&this.callHook(ne)}function te(){this.inserted=!1;var t=H(this.node),e=this;this.beforeRemove(),P(this.node,this.vm,function(){t&&e.callHook(re),e.destroy()})}function ee(t,e){this.inserted=!0;var i=this.vm,n=e!==!1?D:B;st(this.node,this.end,function(e){n(e,t,i)}),H(this.node)&&this.callHook(ne)}function ie(){this.inserted=!1;var t=this,e=H(this.node);this.beforeRemove(),ot(this.node,this.end,this.vm,this.frag,function(){e&&t.callHook(re),t.destroy()})}function ne(t){!t._isAttached&&H(t.$el)&&t._callHook("attached")}function re(t){t._isAttached&&!H(t.$el)&&t._callHook("detached")}function se(t,e){this.vm=t;var i,n="string"==typeof e;n||it(e)&&!e.hasAttribute("v-if")?i=Xt(e,!0):(i=document.createDocumentFragment(),i.appendChild(e)),this.template=i;var r,s=t.constructor.cid;if(s>0){var o=s+(n?e:ht(e));r=Pr.get(o),r||(r=De(i,t.$options,!0),Pr.put(o,r))}else r=De(i,t.$options,!0);this.linker=r}function oe(t,e,i){var n=t.node.previousSibling;if(n){for(t=n.__v_frag;!(t&&t.forId===i&&t.inserted||n===e);){if(n=n.previousSibling,!n)return;t=n.__v_frag}return t}}function ae(t){var e=t.node;if(t.end)for(;!e.__vue__&&e!==t.end&&e.nextSibling;)e=e.nextSibling;return e.__vue__}function he(t){for(var e=-1,i=new Array(Math.floor(t));++e<t;)i[e]=e;return i}function le(t,e,i,n){return n?"$index"===n?t:n.charAt(0).match(/\w/)?jt(i,n):i[n]:e||i}function ce(t,e,i){for(var n,r,s,o=e?[]:null,a=0,h=t.options.length;h>a;a++)if(n=t.options[a],s=i?n.hasAttribute("selected"):n.selected){if(r=n.hasOwnProperty("_value")?n._value:n.value,!e)return r;o.push(r)}return o}function ue(t,e){for(var i=t.length;i--;)if(C(t[i],e))return i;return-1}function fe(t,e){var i=e.map(function(t){var e=t.charCodeAt(0);return e>47&&58>e?parseInt(t,10):1===t.length&&(e=t.toUpperCase().charCodeAt(0),e>64&&91>e)?e:is[t]});return i=[].concat.apply([],i),function(e){return i.indexOf(e.keyCode)>-1?t.call(this,e):void 0}}function pe(t){return function(e){return e.stopPropagation(),t.call(this,e)}}function de(t){return function(e){return e.preventDefault(),t.call(this,e)}}function ve(t){return function(e){return e.target===e.currentTarget?t.call(this,e):void 0}}function me(t){if(as[t])return as[t];var e=ge(t);return as[t]=as[e]=e,e}function ge(t){t=u(t);var e=l(t),i=e.charAt(0).toUpperCase()+e.slice(1);hs||(hs=document.createElement("div"));var n,r=rs.length;if("filter"!==e&&e in hs.style)return{kebab:t,camel:e};for(;r--;)if(n=ss[r]+i,n in hs.style)return{kebab:rs[r]+t,camel:n}}function _e(t){var e=[];if(Di(t))for(var i=0,n=t.length;n>i;i++){var r=t[i];if(r)if("string"==typeof r)e.push(r);else for(var s in r)r[s]&&e.push(s)}else if(m(t))for(var o in t)t[o]&&e.push(o);return e}function ye(t,e,i){if(e=e.trim(),-1===e.indexOf(" "))return void i(t,e);for(var n=e.split(/\s+/),r=0,s=n.length;s>r;r++)i(t,n[r])}function be(t,e,i){function n(){++s>=r?i():t[s].call(e,n)}var r=t.length,s=0;t[0].call(e,n)}function we(t,e,i){for(var r,s,o,a,h,c,f,p=[],d=Object.keys(e),v=d.length;v--;)s=d[v],r=e[s]||ks,h=l(s),xs.test(h)&&(f={name:s,path:h,options:r,mode:$s.ONE_WAY,raw:null},o=u(s),null===(a=M(t,o))&&(null!==(a=M(t,o+".sync"))?f.mode=$s.TWO_WAY:null!==(a=M(t,o+".once"))&&(f.mode=$s.ONE_TIME)),null!==a?(f.raw=a,c=A(a),a=c.expression,f.filters=c.filters,n(a)&&!c.filters?f.optimizedLiteral=!0:f.dynamic=!0,f.parentPath=a):null!==(a=I(t,o))&&(f.raw=a),p.push(f));return Ce(p)}function Ce(t){return function(e,n){e._props={};for(var r,s,l,c,f,p=e.$options.propsData,d=t.length;d--;)if(r=t[d],f=r.raw,s=r.path,l=r.options,e._props[s]=r,p&&i(p,s)&&ke(e,r,p[s]),null===f)ke(e,r,void 0);else if(r.dynamic)r.mode===$s.ONE_TIME?(c=(n||e._context||e).$get(r.parentPath),ke(e,r,c)):e._context?e._bindDir({name:"prop",def:Os,prop:r},null,null,n):ke(e,r,e.$get(r.parentPath));else if(r.optimizedLiteral){var v=h(f);c=v===f?a(o(f)):v,ke(e,r,c)}else c=l.type!==Boolean||""!==f&&f!==u(r.name)?f:!0,ke(e,r,c)}}function $e(t,e,i,n){var r=e.dynamic&&Mt(e.parentPath),s=i;void 0===s&&(s=Ae(t,e)),s=Te(e,s,t);var o=s!==i;Oe(e,s,t)||(s=void 0),r&&!o?yt(function(){n(s)}):n(s)}function ke(t,e,i){$e(t,e,i,function(i){kt(t,e.path,i)})}function xe(t,e,i){$e(t,e,i,function(i){t[e.path]=i})}function Ae(t,e){var n=e.options;if(!i(n,"default"))return n.type===Boolean?!1:void 0;var r=n["default"];return m(r),"function"==typeof r&&n.type!==Function?r.call(t):r}function Oe(t,e,i){if(!t.options.required&&(null===t.raw||null==e))return!0;var n=t.options,r=n.type,s=!r,o=[];if(r){Di(r)||(r=[r]);for(var a=0;a<r.length&&!s;a++){var h=Ne(e,r[a]);o.push(h.expectedType),s=h.valid}}if(!s)return!1;var l=n.validator;return!l||l(e)}function Te(t,e,i){var n=t.options.coerce;return n&&"function"==typeof n?n(e):e}function Ne(t,e){var i,n;return e===String?(n="string",i=typeof t===n):e===Number?(n="number",i=typeof t===n):e===Boolean?(n="boolean",i=typeof t===n):e===Function?(n="function",i=typeof t===n):e===Object?(n="object",i=g(t)):e===Array?(n="array",i=Di(t)):i=t instanceof e,{valid:i,expectedType:n}}function je(t){Ts.push(t),Ns||(Ns=!0,Yi(Ee))}function Ee(){for(var t=document.documentElement.offsetHeight,e=0;e<Ts.length;e++)Ts[e]();return Ts=[],Ns=!1,t}function Se(t,e,i,n){this.id=e,this.el=t,this.enterClass=i&&i.enterClass||e+"-enter",this.leaveClass=i&&i.leaveClass||e+"-leave",this.hooks=i,this.vm=n,this.pendingCssEvent=this.pendingCssCb=this.cancel=this.pendingJsCb=this.op=this.cb=null,this.justEntered=!1,this.entered=this.left=!1,this.typeCache={},this.type=i&&i.type;var r=this;["enterNextTick","enterDone","leaveNextTick","leaveDone"].forEach(function(t){r[t]=p(r[t],r)})}function Fe(t){if(/svg$/.test(t.namespaceURI)){var e=t.getBoundingClientRect();return!(e.width||e.height)}return!(t.offsetWidth||t.offsetHeight||t.getClientRects().length)}function De(t,e,i){var n=i||!e._asComponent?Ve(t,e):null,r=n&&n.terminal||ri(t)||!t.hasChildNodes()?null:qe(t.childNodes,e);return function(t,e,i,s,o){var a=d(e.childNodes),h=Pe(function(){n&&n(t,e,i,s,o),r&&r(t,a,i,s,o)},t);return Le(t,h)}}function Pe(t,e){e._directives=[];var i=e._directives.length;t();var n=e._directives.slice(i);n.sort(Re);for(var r=0,s=n.length;s>r;r++)n[r]._bind();return n}function Re(t,e){return t=t.descriptor.def.priority||zs,e=e.descriptor.def.priority||zs,t>e?-1:t===e?0:1}function Le(t,e,i,n){function r(r){He(t,e,r),i&&n&&He(i,n)}return r.dirs=e,r}function He(t,e,i){for(var n=e.length;n--;)e[n]._teardown()}function Ie(t,e,i,n){var r=we(e,i,t),s=Pe(function(){r(t,n)},t);return Le(t,s)}function Me(t,e,i){var n,r,s=e._containerAttrs,o=e._replacerAttrs;return 11!==t.nodeType&&(e._asComponent?(s&&i&&(n=ti(s,i)),o&&(r=ti(o,e))):r=ti(t.attributes,e)),e._containerAttrs=e._replacerAttrs=null,function(t,e,i){var s,o=t._context;o&&n&&(s=Pe(function(){n(o,e,null,i)},o));var a=Pe(function(){r&&r(t,e)},t);return Le(t,a,o,s)}}function Ve(t,e){var i=t.nodeType;return 1!==i||ri(t)?3===i&&t.data.trim()?We(t,e):null:Be(t,e)}function Be(t,e){if("TEXTAREA"===t.tagName){var i=N(t.value);i&&(t.setAttribute(":value",j(i)),t.value="")}var n,r=t.hasAttributes(),s=r&&d(t.attributes);return r&&(n=Xe(t,s,e)),n||(n=Ge(t,e)),n||(n=Ze(t,e)),!n&&r&&(n=ti(s,e)),n}function We(t,e){if(t._skip)return ze;var i=N(t.wholeText);if(!i)return null;for(var n=t.nextSibling;n&&3===n.nodeType;)n._skip=!0,n=n.nextSibling;for(var r,s,o=document.createDocumentFragment(),a=0,h=i.length;h>a;a++)s=i[a],r=s.tag?Ue(s,e):document.createTextNode(s.value),o.appendChild(r);return Je(i,o,e)}function ze(t,e){z(e)}function Ue(t,e){function i(e){if(!t.descriptor){var i=A(t.value);t.descriptor={name:e,def:bs[e],expression:i.expression,filters:i.filters}}}var n;return t.oneTime?n=document.createTextNode(t.value):t.html?(n=document.createComment("v-html"),i("html")):(n=document.createTextNode(" "),i("text")),n}function Je(t,e){return function(i,n,r,o){for(var a,h,l,c=e.cloneNode(!0),u=d(c.childNodes),f=0,p=t.length;p>f;f++)a=t[f],h=a.value,a.tag&&(l=u[f],a.oneTime?(h=(o||i).$eval(h),a.html?J(l,Xt(h,!0)):l.data=s(h)):i._bindDir(a.descriptor,l,r,o));J(n,c)}}function qe(t,e){for(var i,n,r,s=[],o=0,a=t.length;a>o;o++)r=t[o],i=Ve(r,e),n=i&&i.terminal||"SCRIPT"===r.tagName||!r.hasChildNodes()?null:qe(r.childNodes,e),s.push(i,n);return s.length?Qe(s):null}function Qe(t){return function(e,i,n,r,s){for(var o,a,h,l=0,c=0,u=t.length;u>l;c++){o=i[c],a=t[l++],h=t[l++];var f=d(o.childNodes);a&&a(e,o,n,r,s),h&&h(e,f,n,r,s)}}}function Ge(t,e){var i=t.tagName.toLowerCase();if(!jn.test(i)){var n=gt(e,"elementDirectives",i);return n?Ke(t,i,"",e,n):void 0}}function Ze(t,e){var i=lt(t,e);if(i){var n=rt(t),r={name:"component",ref:n,expression:i.id,def:Hs.component,modifiers:{literal:!i.dynamic}},s=function(t,e,i,s,o){n&&kt((s||t).$refs,n,null),t._bindDir(r,e,i,s,o)};return s.terminal=!0,s}}function Xe(t,e,i){if(null!==I(t,"v-pre"))return Ye;if(t.hasAttribute("v-else")){var n=t.previousElementSibling;if(n&&n.hasAttribute("v-if"))return Ye}for(var r,s,o,a,h,l,c,u,f,p,d=0,v=e.length;v>d;d++)r=e[d],s=r.name.replace(Bs,""),(h=s.match(Vs))&&(f=gt(i,"directives",h[1]),f&&f.terminal&&(!p||(f.priority||Us)>p.priority)&&(p=f,c=r.name,a=ei(r.name),o=r.value,l=h[1],u=h[2]));return p?Ke(t,l,o,i,p,c,u,a):void 0}function Ye(){}function Ke(t,e,i,n,r,s,o,a){var h=A(i),l={name:e,arg:o,expression:h.expression,filters:h.filters,raw:i,attr:s,modifiers:a,def:r};"for"!==e&&"router-view"!==e||(l.ref=rt(t));var c=function(t,e,i,n,r){l.ref&&kt((n||t).$refs,l.ref,null),t._bindDir(l,e,i,n,r)};return c.terminal=!0,c}function ti(t,e){function i(t,e,i){var n=i&&ni(i),r=!n&&A(s);v.push({name:t,attr:o,raw:a,def:e,arg:l,modifiers:c,expression:r&&r.expression,filters:r&&r.filters,interp:i,hasOneTime:n})}for(var n,r,s,o,a,h,l,c,u,f,p,d=t.length,v=[];d--;)if(n=t[d],r=o=n.name,s=a=n.value,f=N(s),l=null,c=ei(r),r=r.replace(Bs,""),f)s=j(f),l=r,i("bind",bs.bind,f);else if(Ws.test(r))c.literal=!Is.test(r),i("transition",Hs.transition);else if(Ms.test(r))l=r.replace(Ms,""),i("on",bs.on);else if(Is.test(r))h=r.replace(Is,""),"style"===h||"class"===h?i(h,Hs[h]):(l=h,i("bind",bs.bind));else if(p=r.match(Vs)){if(h=p[1],l=p[2],"else"===h)continue;u=gt(e,"directives",h,!0),u&&i(h,u)}return v.length?ii(v):void 0}function ei(t){var e=Object.create(null),i=t.match(Bs);if(i)for(var n=i.length;n--;)e[i[n].slice(1)]=!0;return e}function ii(t){return function(e,i,n,r,s){for(var o=t.length;o--;)e._bindDir(t[o],i,n,r,s)}}function ni(t){for(var e=t.length;e--;)if(t[e].oneTime)return!0}function ri(t){return"SCRIPT"===t.tagName&&(!t.hasAttribute("type")||"text/javascript"===t.getAttribute("type"))}function si(t,e){return e&&(e._containerAttrs=ai(t)),it(t)&&(t=Xt(t)),e&&(e._asComponent&&!e.template&&(e.template="<slot></slot>"),e.template&&(e._content=K(t),t=oi(t,e))),at(t)&&(U(nt("v-start",!0),t),t.appendChild(nt("v-end",!0))),t}function oi(t,e){var i=e.template,n=Xt(i,!0);if(n){var r=n.firstChild,s=r.tagName&&r.tagName.toLowerCase();return e.replace?(t===document.body,n.childNodes.length>1||1!==r.nodeType||"component"===s||gt(e,"components",s)||V(r,"is")||gt(e,"elementDirectives",s)||r.hasAttribute("v-for")||r.hasAttribute("v-if")?n:(e._replacerAttrs=ai(r),hi(t,r),r)):(t.appendChild(n),t)}}function ai(t){return 1===t.nodeType&&t.hasAttributes()?d(t.attributes):void 0}function hi(t,e){for(var i,n,r=t.attributes,s=r.length;s--;)i=r[s].name,n=r[s].value,e.hasAttribute(i)||Js.test(i)?"class"===i&&!N(n)&&(n=n.trim())&&n.split(/\s+/).forEach(function(t){X(e,t)}):e.setAttribute(i,n)}function li(t,e){if(e){for(var i,n,r=t._slotContents=Object.create(null),s=0,o=e.children.length;o>s;s++)i=e.children[s],(n=i.getAttribute("slot"))&&(r[n]||(r[n]=[])).push(i);for(n in r)r[n]=ci(r[n],e);if(e.hasChildNodes()){var a=e.childNodes;if(1===a.length&&3===a[0].nodeType&&!a[0].data.trim())return;r["default"]=ci(e.childNodes,e)}}}function ci(t,e){var i=document.createDocumentFragment();t=d(t);for(var n=0,r=t.length;r>n;n++){var s=t[n];!it(s)||s.hasAttribute("v-if")||s.hasAttribute("v-for")||(e.removeChild(s),s=Xt(s,!0)),i.appendChild(s)}return i}function ui(t){function e(){}function n(t,e){var i=new Ut(e,t,null,{lazy:!0});return function(){return i.dirty&&i.evaluate(),_t.target&&i.depend(),i.value}}Object.defineProperty(t.prototype,"$data",{get:function(){return this._data},set:function(t){t!==this._data&&this._setData(t)}}),t.prototype._initState=function(){this._initProps(),this._initMeta(),this._initMethods(),this._initData(),this._initComputed()},t.prototype._initProps=function(){var t=this.$options,e=t.el,i=t.props;e=t.el=L(e),this._propsUnlinkFn=e&&1===e.nodeType&&i?Ie(this,e,i,this._scope):null},t.prototype._initData=function(){var t=this.$options.data,e=this._data=t?t():{};g(e)||(e={});var n,r,s=this._props,o=Object.keys(e);for(n=o.length;n--;)r=o[n],s&&i(s,r)||this._proxy(r);$t(e,this)},t.prototype._setData=function(t){t=t||{};var e=this._data;this._data=t;var n,r,s;for(n=Object.keys(e),s=n.length;s--;)r=n[s],r in t||this._unproxy(r);for(n=Object.keys(t),s=n.length;s--;)r=n[s],i(this,r)||this._proxy(r);e.__ob__.removeVm(this),$t(t,this),this._digest()},t.prototype._proxy=function(t){if(!r(t)){var e=this;Object.defineProperty(e,t,{configurable:!0,enumerable:!0,get:function(){return e._data[t]},set:function(i){e._data[t]=i}})}},t.prototype._unproxy=function(t){r(t)||delete this[t]},t.prototype._digest=function(){for(var t=0,e=this._watchers.length;e>t;t++)this._watchers[t].update(!0)},t.prototype._initComputed=function(){var t=this.$options.computed;if(t)for(var i in t){var r=t[i],s={enumerable:!0,configurable:!0};"function"==typeof r?(s.get=n(r,this),s.set=e):(s.get=r.get?r.cache!==!1?n(r.get,this):p(r.get,this):e,s.set=r.set?p(r.set,this):e),Object.defineProperty(this,i,s)}},t.prototype._initMethods=function(){var t=this.$options.methods;if(t)for(var e in t)this[e]=p(t[e],this)},t.prototype._initMeta=function(){var t=this.$options._meta;if(t)for(var e in t)kt(this,e,t[e])}}function fi(t){function e(t,e){for(var i,n,r,s=e.attributes,o=0,a=s.length;a>o;o++)i=s[o].name,Qs.test(i)&&(i=i.replace(Qs,""),n=s[o].value,Mt(n)&&(n+=".apply(this, $arguments)"),r=(t._scope||t._context).$eval(n,!0),r._fromParent=!0,t.$on(i.replace(Qs),r))}function i(t,e,i){if(i){var r,s,o,a;for(s in i)if(r=i[s],Di(r))for(o=0,a=r.length;a>o;o++)n(t,e,s,r[o]);else n(t,e,s,r)}}function n(t,e,i,r,s){var o=typeof r;if("function"===o)t[e](i,r,s);else if("string"===o){var a=t.$options.methods,h=a&&a[r];h&&t[e](i,h,s)}else r&&"object"===o&&n(t,e,i,r.handler,r)}function r(){this._isAttached||(this._isAttached=!0,this.$children.forEach(s))}function s(t){!t._isAttached&&H(t.$el)&&t._callHook("attached")}function o(){this._isAttached&&(this._isAttached=!1,this.$children.forEach(a))}function a(t){t._isAttached&&!H(t.$el)&&t._callHook("detached")}t.prototype._initEvents=function(){var t=this.$options;t._asComponent&&e(this,t.el),i(this,"$on",t.events),i(this,"$watch",t.watch)},t.prototype._initDOMHooks=function(){this.$on("hook:attached",r),this.$on("hook:detached",o)},t.prototype._callHook=function(t){this.$emit("pre-hook:"+t);var e=this.$options[t];if(e)for(var i=0,n=e.length;n>i;i++)e[i].call(this);this.$emit("hook:"+t)}}function pi(){}function di(t,e,i,n,r,s){this.vm=e,this.el=i,this.descriptor=t,this.name=t.name,this.expression=t.expression,this.arg=t.arg,this.modifiers=t.modifiers,this.filters=t.filters,this.literal=this.modifiers&&this.modifiers.literal,this._locked=!1,this._bound=!1,this._listeners=null,this._host=n,this._scope=r,this._frag=s}function vi(t){t.prototype._updateRef=function(t){var e=this.$options._ref;if(e){var i=(this._scope||this._context).$refs;t?i[e]===this&&(i[e]=null):i[e]=this}},t.prototype._compile=function(t){var e=this.$options,i=t;if(t=si(t,e),this._initElement(t),1!==t.nodeType||null===I(t,"v-pre")){var n=this._context&&this._context.$options,r=Me(t,e,n);li(this,e._content);var s,o=this.constructor;e._linkerCachable&&(s=o.linker,s||(s=o.linker=De(t,e)));var a=r(this,t,this._scope),h=s?s(this,t):De(t,e)(this,t);this._unlinkFn=function(){a(),h(!0)},e.replace&&J(i,t),this._isCompiled=!0,this._callHook("compiled")}},t.prototype._initElement=function(t){at(t)?(this._isFragment=!0,this.$el=this._fragmentStart=t.firstChild,this._fragmentEnd=t.lastChild,3===this._fragmentStart.nodeType&&(this._fragmentStart.data=this._fragmentEnd.data=""),this._fragment=t):this.$el=t,this.$el.__vue__=this,this._callHook("beforeCompile")},t.prototype._bindDir=function(t,e,i,n,r){this._directives.push(new di(t,this,e,i,n,r))},t.prototype._destroy=function(t,e){if(this._isBeingDestroyed)return void(e||this._cleanup());var i,n,r=this,s=function(){!i||n||e||r._cleanup()};t&&this.$el&&(n=!0,this.$remove(function(){
n=!1,s()})),this._callHook("beforeDestroy"),this._isBeingDestroyed=!0;var o,a=this.$parent;for(a&&!a._isBeingDestroyed&&(a.$children.$remove(this),this._updateRef(!0)),o=this.$children.length;o--;)this.$children[o].$destroy();for(this._propsUnlinkFn&&this._propsUnlinkFn(),this._unlinkFn&&this._unlinkFn(),o=this._watchers.length;o--;)this._watchers[o].teardown();this.$el&&(this.$el.__vue__=null),i=!0,s()},t.prototype._cleanup=function(){this._isDestroyed||(this._frag&&this._frag.children.$remove(this),this._data&&this._data.__ob__&&this._data.__ob__.removeVm(this),this.$el=this.$parent=this.$root=this.$children=this._watchers=this._context=this._scope=this._directives=null,this._isDestroyed=!0,this._callHook("destroyed"),this.$off())}}function mi(t){t.prototype._applyFilters=function(t,e,i,n){var r,s,o,a,h,l,c,u,f;for(l=0,c=i.length;c>l;l++)if(r=i[n?c-l-1:l],s=gt(this.$options,"filters",r.name,!0),s&&(s=n?s.write:s.read||s,"function"==typeof s)){if(o=n?[t,e]:[t],h=n?2:1,r.args)for(u=0,f=r.args.length;f>u;u++)a=r.args[u],o[u+h]=a.dynamic?this.$get(a.value):a.value;t=s.apply(this,o)}return t},t.prototype._resolveComponent=function(e,i){var n;if(n="function"==typeof e?e:gt(this.$options,"components",e,!0))if(n.options)i(n);else if(n.resolved)i(n.resolved);else if(n.requested)n.pendingCallbacks.push(i);else{n.requested=!0;var r=n.pendingCallbacks=[i];n.call(this,function(e){g(e)&&(e=t.extend(e)),n.resolved=e;for(var i=0,s=r.length;s>i;i++)r[i](e)},function(t){})}}}function gi(t){function i(t){return JSON.parse(JSON.stringify(t))}t.prototype.$get=function(t,e){var i=It(t);if(i){if(e){var n=this;return function(){n.$arguments=d(arguments);var t=i.get.call(n,n);return n.$arguments=null,t}}try{return i.get.call(this,this)}catch(r){}}},t.prototype.$set=function(t,e){var i=It(t,!0);i&&i.set&&i.set.call(this,this,e)},t.prototype.$delete=function(t){e(this._data,t)},t.prototype.$watch=function(t,e,i){var n,r=this;"string"==typeof t&&(n=A(t),t=n.expression);var s=new Ut(r,t,e,{deep:i&&i.deep,sync:i&&i.sync,filters:n&&n.filters,user:!i||i.user!==!1});return i&&i.immediate&&e.call(r,s.value),function(){s.teardown()}},t.prototype.$eval=function(t,e){if(Gs.test(t)){var i=A(t),n=this.$get(i.expression,e);return i.filters?this._applyFilters(n,null,i.filters):n}return this.$get(t,e)},t.prototype.$interpolate=function(t){var e=N(t),i=this;return e?1===e.length?i.$eval(e[0].value)+"":e.map(function(t){return t.tag?i.$eval(t.value):t.value}).join(""):t},t.prototype.$log=function(t){var e=t?jt(this._data,t):this._data;if(e&&(e=i(e)),!t){var n;for(n in this.$options.computed)e[n]=i(this[n]);if(this._props)for(n in this._props)e[n]=i(this[n])}console.log(e)}}function _i(t){function e(t,e,n,r,s,o){e=i(e);var a=!H(e),h=r===!1||a?s:o,l=!a&&!t._isAttached&&!H(t.$el);return t._isFragment?(st(t._fragmentStart,t._fragmentEnd,function(i){h(i,e,t)}),n&&n()):h(t.$el,e,t,n),l&&t._callHook("attached"),t}function i(t){return"string"==typeof t?document.querySelector(t):t}function n(t,e,i,n){e.appendChild(t),n&&n()}function r(t,e,i,n){B(t,e),n&&n()}function s(t,e,i){z(t),i&&i()}t.prototype.$nextTick=function(t){Yi(t,this)},t.prototype.$appendTo=function(t,i,r){return e(this,t,i,r,n,F)},t.prototype.$prependTo=function(t,e,n){return t=i(t),t.hasChildNodes()?this.$before(t.firstChild,e,n):this.$appendTo(t,e,n),this},t.prototype.$before=function(t,i,n){return e(this,t,i,n,r,D)},t.prototype.$after=function(t,e,n){return t=i(t),t.nextSibling?this.$before(t.nextSibling,e,n):this.$appendTo(t.parentNode,e,n),this},t.prototype.$remove=function(t,e){if(!this.$el.parentNode)return t&&t();var i=this._isAttached&&H(this.$el);i||(e=!1);var n=this,r=function(){i&&n._callHook("detached"),t&&t()};if(this._isFragment)ot(this._fragmentStart,this._fragmentEnd,this,this._fragment,r);else{var o=e===!1?s:P;o(this.$el,this,r)}return this}}function yi(t){function e(t,e,n){var r=t.$parent;if(r&&n&&!i.test(e))for(;r;)r._eventsCount[e]=(r._eventsCount[e]||0)+n,r=r.$parent}t.prototype.$on=function(t,i){return(this._events[t]||(this._events[t]=[])).push(i),e(this,t,1),this},t.prototype.$once=function(t,e){function i(){n.$off(t,i),e.apply(this,arguments)}var n=this;return i.fn=e,this.$on(t,i),this},t.prototype.$off=function(t,i){var n;if(!arguments.length){if(this.$parent)for(t in this._events)n=this._events[t],n&&e(this,t,-n.length);return this._events={},this}if(n=this._events[t],!n)return this;if(1===arguments.length)return e(this,t,-n.length),this._events[t]=null,this;for(var r,s=n.length;s--;)if(r=n[s],r===i||r.fn===i){e(this,t,-1),n.splice(s,1);break}return this},t.prototype.$emit=function(t){var e="string"==typeof t;t=e?t:t.name;var i=this._events[t],n=e||!i;if(i){i=i.length>1?d(i):i;var r=e&&i.some(function(t){return t._fromParent});r&&(n=!1);for(var s=d(arguments,1),o=0,a=i.length;a>o;o++){var h=i[o],l=h.apply(this,s);l!==!0||r&&!h._fromParent||(n=!0)}}return n},t.prototype.$broadcast=function(t){var e="string"==typeof t;if(t=e?t:t.name,this._eventsCount[t]){var i=this.$children,n=d(arguments);e&&(n[0]={name:t,source:this});for(var r=0,s=i.length;s>r;r++){var o=i[r],a=o.$emit.apply(o,n);a&&o.$broadcast.apply(o,n)}return this}},t.prototype.$dispatch=function(t){var e=this.$emit.apply(this,arguments);if(e){var i=this.$parent,n=d(arguments);for(n[0]={name:t,source:this};i;)e=i.$emit.apply(i,n),i=e?i.$parent:null;return this}};var i=/^hook:/}function bi(t){function e(){this._isAttached=!0,this._isReady=!0,this._callHook("ready")}t.prototype.$mount=function(t){return this._isCompiled?void 0:(t=L(t),t||(t=document.createElement("div")),this._compile(t),this._initDOMHooks(),H(this.$el)?(this._callHook("attached"),e.call(this)):this.$once("hook:attached",e),this)},t.prototype.$destroy=function(t,e){this._destroy(t,e)},t.prototype.$compile=function(t,e,i,n){return De(t,this.$options,!0)(this,t,e,i,n)}}function wi(t){this._init(t)}function Ci(t,e,i){return i=i?parseInt(i,10):0,e=o(e),"number"==typeof e?t.slice(i,i+e):t}function $i(t,e,i){if(t=Ks(t),null==e)return t;if("function"==typeof e)return t.filter(e);e=(""+e).toLowerCase();for(var n,r,s,o,a="in"===i?3:2,h=Array.prototype.concat.apply([],d(arguments,a)),l=[],c=0,u=t.length;u>c;c++)if(n=t[c],s=n&&n.$value||n,o=h.length){for(;o--;)if(r=h[o],"$key"===r&&xi(n.$key,e)||xi(jt(s,r),e)){l.push(n);break}}else xi(n,e)&&l.push(n);return l}function ki(t){function e(t,e,i){var r=n[i];return r&&("$key"!==r&&(m(t)&&"$value"in t&&(t=t.$value),m(e)&&"$value"in e&&(e=e.$value)),t=m(t)?jt(t,r):t,e=m(e)?jt(e,r):e),t===e?0:t>e?s:-s}var i=null,n=void 0;t=Ks(t);var r=d(arguments,1),s=r[r.length-1];"number"==typeof s?(s=0>s?-1:1,r=r.length>1?r.slice(0,-1):r):s=1;var o=r[0];return o?("function"==typeof o?i=function(t,e){return o(t,e)*s}:(n=Array.prototype.concat.apply([],r),i=function(t,r,s){return s=s||0,s>=n.length-1?e(t,r,s):e(t,r,s)||i(t,r,s+1)}),t.slice().sort(i)):t}function xi(t,e){var i;if(g(t)){var n=Object.keys(t);for(i=n.length;i--;)if(xi(t[n[i]],e))return!0}else if(Di(t)){for(i=t.length;i--;)if(xi(t[i],e))return!0}else if(null!=t)return t.toString().toLowerCase().indexOf(e)>-1}function Ai(i){function n(t){return new Function("return function "+f(t)+" (options) { this._init(options) }")()}i.options={directives:bs,elementDirectives:Ys,filters:eo,transitions:{},components:{},partials:{},replace:!0},i.util=In,i.config=An,i.set=t,i["delete"]=e,i.nextTick=Yi,i.compiler=qs,i.FragmentFactory=se,i.internalDirectives=Hs,i.parsers={path:ir,text:$n,template:Fr,directive:gn,expression:mr},i.cid=0;var r=1;i.extend=function(t){t=t||{};var e=this,i=0===e.cid;if(i&&t._Ctor)return t._Ctor;var s=t.name||e.options.name,o=n(s||"VueComponent");return o.prototype=Object.create(e.prototype),o.prototype.constructor=o,o.cid=r++,o.options=mt(e.options,t),o["super"]=e,o.extend=e.extend,An._assetTypes.forEach(function(t){o[t]=e[t]}),s&&(o.options.components[s]=o),i&&(t._Ctor=o),o},i.use=function(t){if(!t.installed){var e=d(arguments,1);return e.unshift(this),"function"==typeof t.install?t.install.apply(t,e):t.apply(null,e),t.installed=!0,this}},i.mixin=function(t){i.options=mt(i.options,t)},An._assetTypes.forEach(function(t){i[t]=function(e,n){return n?("component"===t&&g(n)&&(n.name||(n.name=e),n=i.extend(n)),this.options[t+"s"][e]=n,n):this.options[t+"s"][e]}}),v(i.transition,Tn)}var Oi=Object.prototype.hasOwnProperty,Ti=/^\s?(true|false|-?[\d\.]+|'[^']*'|"[^"]*")\s?$/,Ni=/-(\w)/g,ji=/([a-z\d])([A-Z])/g,Ei=/(?:^|[-_\/])(\w)/g,Si=Object.prototype.toString,Fi="[object Object]",Di=Array.isArray,Pi="__proto__"in{},Ri="undefined"!=typeof window&&"[object Object]"!==Object.prototype.toString.call(window),Li=Ri&&window.__VUE_DEVTOOLS_GLOBAL_HOOK__,Hi=Ri&&window.navigator.userAgent.toLowerCase(),Ii=Hi&&Hi.indexOf("trident")>0,Mi=Hi&&Hi.indexOf("msie 9.0")>0,Vi=Hi&&Hi.indexOf("android")>0,Bi=Hi&&/(iphone|ipad|ipod|ios)/i.test(Hi),Wi=Bi&&Hi.match(/os ([\d_]+)/),zi=Wi&&Wi[1].split("_"),Ui=zi&&Number(zi[0])>=9&&Number(zi[1])>=3&&!window.indexedDB,Ji=void 0,qi=void 0,Qi=void 0,Gi=void 0;if(Ri&&!Mi){var Zi=void 0===window.ontransitionend&&void 0!==window.onwebkittransitionend,Xi=void 0===window.onanimationend&&void 0!==window.onwebkitanimationend;Ji=Zi?"WebkitTransition":"transition",qi=Zi?"webkitTransitionEnd":"transitionend",Qi=Xi?"WebkitAnimation":"animation",Gi=Xi?"webkitAnimationEnd":"animationend"}var Yi=function(){function t(){n=!1;var t=i.slice(0);i=[];for(var e=0;e<t.length;e++)t[e]()}var e,i=[],n=!1;if("undefined"==typeof MutationObserver||Ui){var r=Ri?window:"undefined"!=typeof global?global:{};e=r.setImmediate||setTimeout}else{var s=1,o=new MutationObserver(t),a=document.createTextNode(s);o.observe(a,{characterData:!0}),e=function(){s=(s+1)%2,a.data=s}}return function(r,s){var o=s?function(){r.call(s)}:r;i.push(o),n||(n=!0,e(t,0))}}(),Ki=void 0;"undefined"!=typeof Set&&Set.toString().match(/native code/)?Ki=Set:(Ki=function(){this.set=Object.create(null)},Ki.prototype.has=function(t){return void 0!==this.set[t]},Ki.prototype.add=function(t){this.set[t]=1},Ki.prototype.clear=function(){this.set=Object.create(null)});var tn=$.prototype;tn.put=function(t,e){var i,n=this.get(t,!0);return n||(this.size===this.limit&&(i=this.shift()),n={key:t},this._keymap[t]=n,this.tail?(this.tail.newer=n,n.older=this.tail):this.head=n,this.tail=n,this.size++),n.value=e,i},tn.shift=function(){var t=this.head;return t&&(this.head=this.head.newer,this.head.older=void 0,t.newer=t.older=void 0,this._keymap[t.key]=void 0,this.size--),t},tn.get=function(t,e){var i=this._keymap[t];if(void 0!==i)return i===this.tail?e?i:i.value:(i.newer&&(i===this.head&&(this.head=i.newer),i.newer.older=i.older),i.older&&(i.older.newer=i.newer),i.newer=void 0,i.older=this.tail,this.tail&&(this.tail.newer=i),this.tail=i,e?i:i.value)};var en,nn,rn,sn,on,an,hn,ln,cn,un,fn,pn,dn=new $(1e3),vn=/[^\s'"]+|'[^']*'|"[^"]*"/g,mn=/^in$|^-?\d+/,gn=Object.freeze({parseDirective:A}),_n=/[-.*+?^${}()|[\]\/\\]/g,yn=void 0,bn=void 0,wn=void 0,Cn=/[^|]\|[^|]/,$n=Object.freeze({compileRegex:T,parseText:N,tokensToExp:j}),kn=["{{","}}"],xn=["{{{","}}}"],An=Object.defineProperties({debug:!1,silent:!1,async:!0,warnExpressionErrors:!0,devtools:!1,_delimitersChanged:!0,_assetTypes:["component","directive","elementDirective","filter","transition","partial"],_propBindingModes:{ONE_WAY:0,TWO_WAY:1,ONE_TIME:2},_maxUpdateCount:100},{delimiters:{get:function(){return kn},set:function(t){kn=t,T()},configurable:!0,enumerable:!0},unsafeDelimiters:{get:function(){return xn},set:function(t){xn=t,T()},configurable:!0,enumerable:!0}}),On=void 0,Tn=Object.freeze({appendWithTransition:F,beforeWithTransition:D,removeWithTransition:P,applyTransition:R}),Nn=/^v-ref:/,jn=/^(div|p|span|img|a|b|i|br|ul|ol|li|h1|h2|h3|h4|h5|h6|code|pre|table|th|td|tr|form|label|input|select|option|nav|article|section|header|footer)$/i,En=/^(slot|partial|component)$/i,Sn=An.optionMergeStrategies=Object.create(null);Sn.data=function(t,e,i){return i?t||e?function(){var n="function"==typeof e?e.call(i):e,r="function"==typeof t?t.call(i):void 0;return n?ut(n,r):r}:void 0:e?"function"!=typeof e?t:t?function(){return ut(e.call(this),t.call(this))}:e:t},Sn.el=function(t,e,i){if(i||!e||"function"==typeof e){var n=e||t;return i&&"function"==typeof n?n.call(i):n}},Sn.init=Sn.created=Sn.ready=Sn.attached=Sn.detached=Sn.beforeCompile=Sn.compiled=Sn.beforeDestroy=Sn.destroyed=Sn.activate=function(t,e){return e?t?t.concat(e):Di(e)?e:[e]:t},An._assetTypes.forEach(function(t){Sn[t+"s"]=ft}),Sn.watch=Sn.events=function(t,e){if(!e)return t;if(!t)return e;var i={};v(i,t);for(var n in e){var r=i[n],s=e[n];r&&!Di(r)&&(r=[r]),i[n]=r?r.concat(s):[s]}return i},Sn.props=Sn.methods=Sn.computed=function(t,e){if(!e)return t;if(!t)return e;var i=Object.create(null);return v(i,t),v(i,e),i};var Fn=function(t,e){return void 0===e?t:e},Dn=0;_t.target=null,_t.prototype.addSub=function(t){this.subs.push(t)},_t.prototype.removeSub=function(t){this.subs.$remove(t)},_t.prototype.depend=function(){_t.target.addDep(this)},_t.prototype.notify=function(){for(var t=d(this.subs),e=0,i=t.length;i>e;e++)t[e].update()};var Pn=Array.prototype,Rn=Object.create(Pn);["push","pop","shift","unshift","splice","sort","reverse"].forEach(function(t){var e=Pn[t];_(Rn,t,function(){for(var i=arguments.length,n=new Array(i);i--;)n[i]=arguments[i];var r,s=e.apply(this,n),o=this.__ob__;switch(t){case"push":r=n;break;case"unshift":r=n;break;case"splice":r=n.slice(2)}return r&&o.observeArray(r),o.dep.notify(),s})}),_(Pn,"$set",function(t,e){return t>=this.length&&(this.length=Number(t)+1),this.splice(t,1,e)[0]}),_(Pn,"$remove",function(t){if(this.length){var e=b(this,t);return e>-1?this.splice(e,1):void 0}});var Ln=Object.getOwnPropertyNames(Rn),Hn=!0;bt.prototype.walk=function(t){for(var e=Object.keys(t),i=0,n=e.length;n>i;i++)this.convert(e[i],t[e[i]])},bt.prototype.observeArray=function(t){for(var e=0,i=t.length;i>e;e++)$t(t[e])},bt.prototype.convert=function(t,e){kt(this.value,t,e)},bt.prototype.addVm=function(t){(this.vms||(this.vms=[])).push(t)},bt.prototype.removeVm=function(t){this.vms.$remove(t)};var In=Object.freeze({defineReactive:kt,set:t,del:e,hasOwn:i,isLiteral:n,isReserved:r,_toString:s,toNumber:o,toBoolean:a,stripQuotes:h,camelize:l,hyphenate:u,classify:f,bind:p,toArray:d,extend:v,isObject:m,isPlainObject:g,def:_,debounce:y,indexOf:b,cancellable:w,looseEqual:C,isArray:Di,hasProto:Pi,inBrowser:Ri,devtools:Li,isIE:Ii,isIE9:Mi,isAndroid:Vi,isIos:Bi,iosVersionMatch:Wi,iosVersion:zi,hasMutationObserverBug:Ui,get transitionProp(){return Ji},get transitionEndEvent(){return qi},get animationProp(){return Qi},get animationEndEvent(){return Gi},nextTick:Yi,get _Set(){return Ki},query:L,inDoc:H,getAttr:I,getBindAttr:M,hasBindAttr:V,before:B,after:W,remove:z,prepend:U,replace:J,on:q,off:Q,setClass:Z,addClass:X,removeClass:Y,extractContent:K,trimNode:tt,isTemplate:it,createAnchor:nt,findRef:rt,mapNodeRange:st,removeNodeRange:ot,isFragment:at,getOuterHTML:ht,mergeOptions:mt,resolveAsset:gt,checkComponentAttr:lt,commonTagRE:jn,reservedTagRE:En,warn:On}),Mn=0,Vn=new $(1e3),Bn=0,Wn=1,zn=2,Un=3,Jn=0,qn=1,Qn=2,Gn=3,Zn=4,Xn=5,Yn=6,Kn=7,tr=8,er=[];er[Jn]={ws:[Jn],ident:[Gn,Bn],"[":[Zn],eof:[Kn]},er[qn]={ws:[qn],".":[Qn],"[":[Zn],eof:[Kn]},er[Qn]={ws:[Qn],ident:[Gn,Bn]},er[Gn]={ident:[Gn,Bn],0:[Gn,Bn],number:[Gn,Bn],ws:[qn,Wn],".":[Qn,Wn],"[":[Zn,Wn],eof:[Kn,Wn]},er[Zn]={"'":[Xn,Bn],'"':[Yn,Bn],"[":[Zn,zn],"]":[qn,Un],eof:tr,"else":[Zn,Bn]},er[Xn]={"'":[Zn,Bn],eof:tr,"else":[Xn,Bn]},er[Yn]={'"':[Zn,Bn],eof:tr,"else":[Yn,Bn]};var ir=Object.freeze({parsePath:Nt,getPath:jt,setPath:Et}),nr=new $(1e3),rr="Math,Date,this,true,false,null,undefined,Infinity,NaN,isNaN,isFinite,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,parseInt,parseFloat",sr=new RegExp("^("+rr.replace(/,/g,"\\b|")+"\\b)"),or="break,case,class,catch,const,continue,debugger,default,delete,do,else,export,extends,finally,for,function,if,import,in,instanceof,let,return,super,switch,throw,try,var,while,with,yield,enum,await,implements,package,protected,static,interface,private,public",ar=new RegExp("^("+or.replace(/,/g,"\\b|")+"\\b)"),hr=/\s/g,lr=/\n/g,cr=/[\{,]\s*[\w\$_]+\s*:|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*\$\{|\}(?:[^`\\]|\\.)*`|`(?:[^`\\]|\\.)*`)|new |typeof |void /g,ur=/"(\d+)"/g,fr=/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['.*?'\]|\[".*?"\]|\[\d+\]|\[[A-Za-z_$][\w$]*\])*$/,pr=/[^\w$\.](?:[A-Za-z_$][\w$]*)/g,dr=/^(?:true|false|null|undefined|Infinity|NaN)$/,vr=[],mr=Object.freeze({parseExpression:It,isSimplePath:Mt}),gr=[],_r=[],yr={},br={},wr=!1,Cr=0;Ut.prototype.get=function(){this.beforeGet();var t,e=this.scope||this.vm;try{t=this.getter.call(e,e)}catch(i){}return this.deep&&Jt(t),this.preProcess&&(t=this.preProcess(t)),this.filters&&(t=e._applyFilters(t,null,this.filters,!1)),this.postProcess&&(t=this.postProcess(t)),this.afterGet(),t},Ut.prototype.set=function(t){var e=this.scope||this.vm;this.filters&&(t=e._applyFilters(t,this.value,this.filters,!0));try{this.setter.call(e,e,t)}catch(i){}var n=e.$forContext;if(n&&n.alias===this.expression){if(n.filters)return;n._withLock(function(){e.$key?n.rawValue[e.$key]=t:n.rawValue.$set(e.$index,t)})}},Ut.prototype.beforeGet=function(){_t.target=this},Ut.prototype.addDep=function(t){var e=t.id;this.newDepIds.has(e)||(this.newDepIds.add(e),this.newDeps.push(t),this.depIds.has(e)||t.addSub(this))},Ut.prototype.afterGet=function(){_t.target=null;for(var t=this.deps.length;t--;){var e=this.deps[t];this.newDepIds.has(e.id)||e.removeSub(this)}var i=this.depIds;this.depIds=this.newDepIds,this.newDepIds=i,this.newDepIds.clear(),i=this.deps,this.deps=this.newDeps,this.newDeps=i,this.newDeps.length=0},Ut.prototype.update=function(t){this.lazy?this.dirty=!0:this.sync||!An.async?this.run():(this.shallow=this.queued?t?this.shallow:!1:!!t,this.queued=!0,zt(this))},Ut.prototype.run=function(){if(this.active){var t=this.get();if(t!==this.value||(m(t)||this.deep)&&!this.shallow){var e=this.value;this.value=t;this.prevError;this.cb.call(this.vm,t,e)}this.queued=this.shallow=!1}},Ut.prototype.evaluate=function(){var t=_t.target;this.value=this.get(),this.dirty=!1,_t.target=t},Ut.prototype.depend=function(){for(var t=this.deps.length;t--;)this.deps[t].depend()},Ut.prototype.teardown=function(){if(this.active){this.vm._isBeingDestroyed||this.vm._vForRemoving||this.vm._watchers.$remove(this);for(var t=this.deps.length;t--;)this.deps[t].removeSub(this);this.active=!1,this.vm=this.cb=this.value=null}};var $r=new Ki,kr={bind:function(){this.attr=3===this.el.nodeType?"data":"textContent"},update:function(t){this.el[this.attr]=s(t)}},xr=new $(1e3),Ar=new $(1e3),Or={efault:[0,"",""],legend:[1,"<fieldset>","</fieldset>"],tr:[2,"<table><tbody>","</tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"]};Or.td=Or.th=[3,"<table><tbody><tr>","</tr></tbody></table>"],Or.option=Or.optgroup=[1,'<select multiple="multiple">',"</select>"],Or.thead=Or.tbody=Or.colgroup=Or.caption=Or.tfoot=[1,"<table>","</table>"],Or.g=Or.defs=Or.symbol=Or.use=Or.image=Or.text=Or.circle=Or.ellipse=Or.line=Or.path=Or.polygon=Or.polyline=Or.rect=[1,'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:ev="http://www.w3.org/2001/xml-events"version="1.1">',"</svg>"];var Tr=/<([\w:-]+)/,Nr=/&#?\w+?;/,jr=/<!--/,Er=function(){if(Ri){var t=document.createElement("div");return t.innerHTML="<template>1</template>",!t.cloneNode(!0).firstChild.innerHTML}return!1}(),Sr=function(){if(Ri){var t=document.createElement("textarea");return t.placeholder="t","t"===t.cloneNode(!0).value}return!1}(),Fr=Object.freeze({cloneNode:Zt,parseTemplate:Xt}),Dr={bind:function(){8===this.el.nodeType&&(this.nodes=[],this.anchor=nt("v-html"),J(this.el,this.anchor))},update:function(t){t=s(t),this.nodes?this.swap(t):this.el.innerHTML=t},swap:function(t){for(var e=this.nodes.length;e--;)z(this.nodes[e]);var i=Xt(t,!0,!0);this.nodes=d(i.childNodes),B(i,this.anchor)}};Yt.prototype.callHook=function(t){var e,i;for(e=0,i=this.childFrags.length;i>e;e++)this.childFrags[e].callHook(t);for(e=0,i=this.children.length;i>e;e++)t(this.children[e])},Yt.prototype.beforeRemove=function(){var t,e;for(t=0,e=this.childFrags.length;e>t;t++)this.childFrags[t].beforeRemove(!1);for(t=0,e=this.children.length;e>t;t++)this.children[t].$destroy(!1,!0);var i=this.unlink.dirs;for(t=0,e=i.length;e>t;t++)i[t]._watcher&&i[t]._watcher.teardown()},Yt.prototype.destroy=function(){this.parentFrag&&this.parentFrag.childFrags.$remove(this),this.node.__v_frag=null,this.unlink()};var Pr=new $(5e3);se.prototype.create=function(t,e,i){var n=Zt(this.template);return new Yt(this.linker,this.vm,n,t,e,i)};var Rr=700,Lr=800,Hr=850,Ir=1100,Mr=1500,Vr=1500,Br=1750,Wr=2100,zr=2200,Ur=2300,Jr=0,qr={priority:zr,terminal:!0,params:["track-by","stagger","enter-stagger","leave-stagger"],bind:function(){var t=this.expression.match(/(.*) (?:in|of) (.*)/);if(t){var e=t[1].match(/\((.*),(.*)\)/);e?(this.iterator=e[1].trim(),this.alias=e[2].trim()):this.alias=t[1].trim(),this.expression=t[2]}if(this.alias){this.id="__v-for__"+ ++Jr;var i=this.el.tagName;this.isOption=("OPTION"===i||"OPTGROUP"===i)&&"SELECT"===this.el.parentNode.tagName,this.start=nt("v-for-start"),this.end=nt("v-for-end"),J(this.el,this.end),B(this.start,this.end),this.cache=Object.create(null),this.factory=new se(this.vm,this.el)}},update:function(t){this.diff(t),this.updateRef(),this.updateModel()},diff:function(t){var e,n,r,s,o,a,h=t[0],l=this.fromObject=m(h)&&i(h,"$key")&&i(h,"$value"),c=this.params.trackBy,u=this.frags,f=this.frags=new Array(t.length),p=this.alias,d=this.iterator,v=this.start,g=this.end,_=H(v),y=!u;for(e=0,n=t.length;n>e;e++)h=t[e],s=l?h.$key:null,o=l?h.$value:h,a=!m(o),r=!y&&this.getCachedFrag(o,e,s),r?(r.reused=!0,r.scope.$index=e,s&&(r.scope.$key=s),d&&(r.scope[d]=null!==s?s:e),(c||l||a)&&yt(function(){r.scope[p]=o})):(r=this.create(o,p,e,s),r.fresh=!y),f[e]=r,y&&r.before(g);if(!y){var b=0,w=u.length-f.length;for(this.vm._vForRemoving=!0,e=0,n=u.length;n>e;e++)r=u[e],r.reused||(this.deleteCachedFrag(r),this.remove(r,b++,w,_));this.vm._vForRemoving=!1,b&&(this.vm._watchers=this.vm._watchers.filter(function(t){return t.active}));var C,$,k,x=0;for(e=0,n=f.length;n>e;e++)r=f[e],C=f[e-1],$=C?C.staggerCb?C.staggerAnchor:C.end||C.node:v,r.reused&&!r.staggerCb?(k=oe(r,v,this.id),k===C||k&&oe(k,v,this.id)===C||this.move(r,$)):this.insert(r,x++,$,_),r.reused=r.fresh=!1}},create:function(t,e,i,n){var r=this._host,s=this._scope||this.vm,o=Object.create(s);o.$refs=Object.create(s.$refs),o.$els=Object.create(s.$els),o.$parent=s,o.$forContext=this,yt(function(){kt(o,e,t)}),kt(o,"$index",i),n?kt(o,"$key",n):o.$key&&_(o,"$key",null),this.iterator&&kt(o,this.iterator,null!==n?n:i);var a=this.factory.create(r,o,this._frag);return a.forId=this.id,this.cacheFrag(t,a,i,n),a},updateRef:function(){var t=this.descriptor.ref;if(t){var e,i=(this._scope||this.vm).$refs;this.fromObject?(e={},this.frags.forEach(function(t){e[t.scope.$key]=ae(t)})):e=this.frags.map(ae),i[t]=e}},updateModel:function(){if(this.isOption){var t=this.start.parentNode,e=t&&t.__v_model;e&&e.forceUpdate()}},insert:function(t,e,i,n){t.staggerCb&&(t.staggerCb.cancel(),t.staggerCb=null);var r=this.getStagger(t,e,null,"enter");if(n&&r){var s=t.staggerAnchor;s||(s=t.staggerAnchor=nt("stagger-anchor"),s.__v_frag=t),W(s,i);var o=t.staggerCb=w(function(){t.staggerCb=null,t.before(s),z(s)});setTimeout(o,r)}else{var a=i.nextSibling;a||(W(this.end,i),a=this.end),t.before(a)}},remove:function(t,e,i,n){if(t.staggerCb)return t.staggerCb.cancel(),void(t.staggerCb=null);var r=this.getStagger(t,e,i,"leave");if(n&&r){var s=t.staggerCb=w(function(){t.staggerCb=null,t.remove()});setTimeout(s,r)}else t.remove()},move:function(t,e){e.nextSibling||this.end.parentNode.appendChild(this.end),t.before(e.nextSibling,!1)},cacheFrag:function(t,e,n,r){var s,o=this.params.trackBy,a=this.cache,h=!m(t);r||o||h?(s=le(n,r,t,o),a[s]||(a[s]=e)):(s=this.id,i(t,s)?null===t[s]&&(t[s]=e):Object.isExtensible(t)&&_(t,s,e)),e.raw=t},getCachedFrag:function(t,e,i){var n,r=this.params.trackBy,s=!m(t);if(i||r||s){var o=le(e,i,t,r);n=this.cache[o]}else n=t[this.id];return n&&(n.reused||n.fresh),n},deleteCachedFrag:function(t){var e=t.raw,n=this.params.trackBy,r=t.scope,s=r.$index,o=i(r,"$key")&&r.$key,a=!m(e);if(n||o||a){var h=le(s,o,e,n);this.cache[h]=null}else e[this.id]=null,t.raw=null},getStagger:function(t,e,i,n){n+="Stagger";var r=t.node.__v_trans,s=r&&r.hooks,o=s&&(s[n]||s.stagger);return o?o.call(t,e,i):e*parseInt(this.params[n]||this.params.stagger,10)},_preProcess:function(t){return this.rawValue=t,t},_postProcess:function(t){if(Di(t))return t;if(g(t)){for(var e,i=Object.keys(t),n=i.length,r=new Array(n);n--;)e=i[n],r[n]={$key:e,$value:t[e]};return r}return"number"!=typeof t||isNaN(t)||(t=he(t)),t||[]},unbind:function(){if(this.descriptor.ref&&((this._scope||this.vm).$refs[this.descriptor.ref]=null),this.frags)for(var t,e=this.frags.length;e--;)t=this.frags[e],this.deleteCachedFrag(t),t.destroy()}},Qr={priority:Wr,terminal:!0,bind:function(){var t=this.el;if(t.__vue__)this.invalid=!0;else{var e=t.nextElementSibling;e&&null!==I(e,"v-else")&&(z(e),this.elseEl=e),this.anchor=nt("v-if"),J(t,this.anchor)}},update:function(t){this.invalid||(t?this.frag||this.insert():this.remove())},insert:function(){this.elseFrag&&(this.elseFrag.remove(),this.elseFrag=null),this.factory||(this.factory=new se(this.vm,this.el)),this.frag=this.factory.create(this._host,this._scope,this._frag),this.frag.before(this.anchor)},remove:function(){this.frag&&(this.frag.remove(),this.frag=null),this.elseEl&&!this.elseFrag&&(this.elseFactory||(this.elseFactory=new se(this.elseEl._context||this.vm,this.elseEl)),this.elseFrag=this.elseFactory.create(this._host,this._scope,this._frag),this.elseFrag.before(this.anchor))},unbind:function(){this.frag&&this.frag.destroy(),this.elseFrag&&this.elseFrag.destroy()}},Gr={bind:function(){var t=this.el.nextElementSibling;t&&null!==I(t,"v-else")&&(this.elseEl=t)},update:function(t){this.apply(this.el,t),this.elseEl&&this.apply(this.elseEl,!t)},apply:function(t,e){function i(){t.style.display=e?"":"none"}H(t)?R(t,e?1:-1,i,this.vm):i()}},Zr={bind:function(){var t=this,e=this.el,i="range"===e.type,n=this.params.lazy,r=this.params.number,s=this.params.debounce,a=!1;if(Vi||i||(this.on("compositionstart",function(){a=!0}),this.on("compositionend",function(){a=!1,n||t.listener()})),this.focused=!1,i||n||(this.on("focus",function(){t.focused=!0}),this.on("blur",function(){t.focused=!1,t._frag&&!t._frag.inserted||t.rawListener()})),this.listener=this.rawListener=function(){if(!a&&t._bound){var n=r||i?o(e.value):e.value;t.set(n),Yi(function(){t._bound&&!t.focused&&t.update(t._watcher.value)})}},s&&(this.listener=y(this.listener,s)),this.hasjQuery="function"==typeof jQuery,this.hasjQuery){var h=jQuery.fn.on?"on":"bind";jQuery(e)[h]("change",this.rawListener),n||jQuery(e)[h]("input",this.listener)}else this.on("change",this.rawListener),n||this.on("input",this.listener);!n&&Mi&&(this.on("cut",function(){Yi(t.listener)}),this.on("keyup",function(e){46!==e.keyCode&&8!==e.keyCode||t.listener()})),(e.hasAttribute("value")||"TEXTAREA"===e.tagName&&e.value.trim())&&(this.afterBind=this.listener)},update:function(t){t=s(t),t!==this.el.value&&(this.el.value=t)},unbind:function(){var t=this.el;if(this.hasjQuery){var e=jQuery.fn.off?"off":"unbind";jQuery(t)[e]("change",this.listener),jQuery(t)[e]("input",this.listener)}}},Xr={bind:function(){var t=this,e=this.el;this.getValue=function(){if(e.hasOwnProperty("_value"))return e._value;var i=e.value;return t.params.number&&(i=o(i)),i},this.listener=function(){t.set(t.getValue())},this.on("change",this.listener),e.hasAttribute("checked")&&(this.afterBind=this.listener)},update:function(t){this.el.checked=C(t,this.getValue())}},Yr={bind:function(){var t=this,e=this,i=this.el;this.forceUpdate=function(){e._watcher&&e.update(e._watcher.get())};var n=this.multiple=i.hasAttribute("multiple");this.listener=function(){var t=ce(i,n);t=e.params.number?Di(t)?t.map(o):o(t):t,e.set(t)},this.on("change",this.listener);var r=ce(i,n,!0);(n&&r.length||!n&&null!==r)&&(this.afterBind=this.listener),this.vm.$on("hook:attached",function(){Yi(t.forceUpdate)}),H(i)||Yi(this.forceUpdate)},update:function(t){var e=this.el;e.selectedIndex=-1;for(var i,n,r=this.multiple&&Di(t),s=e.options,o=s.length;o--;)i=s[o],n=i.hasOwnProperty("_value")?i._value:i.value,i.selected=r?ue(t,n)>-1:C(t,n)},unbind:function(){this.vm.$off("hook:attached",this.forceUpdate)}},Kr={bind:function(){function t(){var t=i.checked;return t&&i.hasOwnProperty("_trueValue")?i._trueValue:!t&&i.hasOwnProperty("_falseValue")?i._falseValue:t}var e=this,i=this.el;this.getValue=function(){return i.hasOwnProperty("_value")?i._value:e.params.number?o(i.value):i.value},this.listener=function(){var n=e._watcher.value;if(Di(n)){var r=e.getValue();i.checked?b(n,r)<0&&n.push(r):n.$remove(r)}else e.set(t())},this.on("change",this.listener),i.hasAttribute("checked")&&(this.afterBind=this.listener)},update:function(t){var e=this.el;Di(t)?e.checked=b(t,this.getValue())>-1:e.hasOwnProperty("_trueValue")?e.checked=C(t,e._trueValue):e.checked=!!t}},ts={text:Zr,radio:Xr,select:Yr,checkbox:Kr},es={priority:Lr,twoWay:!0,handlers:ts,params:["lazy","number","debounce"],bind:function(){this.checkFilters(),this.hasRead&&!this.hasWrite;var t,e=this.el,i=e.tagName;if("INPUT"===i)t=ts[e.type]||ts.text;else if("SELECT"===i)t=ts.select;else{if("TEXTAREA"!==i)return;t=ts.text}e.__v_model=this,t.bind.call(this),this.update=t.update,this._unbind=t.unbind},checkFilters:function(){var t=this.filters;if(t)for(var e=t.length;e--;){var i=gt(this.vm.$options,"filters",t[e].name);("function"==typeof i||i.read)&&(this.hasRead=!0),i.write&&(this.hasWrite=!0)}},unbind:function(){this.el.__v_model=null,this._unbind&&this._unbind()}},is={esc:27,tab:9,enter:13,space:32,"delete":[8,46],up:38,left:37,right:39,down:40},ns={priority:Rr,acceptStatement:!0,keyCodes:is,bind:function(){if("IFRAME"===this.el.tagName&&"load"!==this.arg){var t=this;this.iframeBind=function(){q(t.el.contentWindow,t.arg,t.handler,t.modifiers.capture)},this.on("load",this.iframeBind)}},update:function(t){if(this.descriptor.raw||(t=function(){}),"function"==typeof t){this.modifiers.stop&&(t=pe(t)),this.modifiers.prevent&&(t=de(t)),this.modifiers.self&&(t=ve(t));var e=Object.keys(this.modifiers).filter(function(t){return"stop"!==t&&"prevent"!==t&&"self"!==t&&"capture"!==t});e.length&&(t=fe(t,e)),this.reset(),this.handler=t,this.iframeBind?this.iframeBind():q(this.el,this.arg,this.handler,this.modifiers.capture)}},reset:function(){var t=this.iframeBind?this.el.contentWindow:this.el;this.handler&&Q(t,this.arg,this.handler)},unbind:function(){this.reset()}},rs=["-webkit-","-moz-","-ms-"],ss=["Webkit","Moz","ms"],os=/!important;?$/,as=Object.create(null),hs=null,ls={deep:!0,update:function(t){"string"==typeof t?this.el.style.cssText=t:Di(t)?this.handleObject(t.reduce(v,{})):this.handleObject(t||{})},handleObject:function(t){var e,i,n=this.cache||(this.cache={});for(e in n)e in t||(this.handleSingle(e,null),delete n[e]);for(e in t)i=t[e],i!==n[e]&&(n[e]=i,this.handleSingle(e,i))},handleSingle:function(t,e){if(t=me(t))if(null!=e&&(e+=""),e){var i=os.test(e)?"important":"";i?(e=e.replace(os,"").trim(),this.el.style.setProperty(t.kebab,e,i)):this.el.style[t.camel]=e}else this.el.style[t.camel]=""}},cs="http://www.w3.org/1999/xlink",us=/^xlink:/,fs=/^v-|^:|^@|^(?:is|transition|transition-mode|debounce|track-by|stagger|enter-stagger|leave-stagger)$/,ps=/^(?:value|checked|selected|muted)$/,ds=/^(?:draggable|contenteditable|spellcheck)$/,vs={value:"_value","true-value":"_trueValue","false-value":"_falseValue"},ms={priority:Hr,bind:function(){var t=this.arg,e=this.el.tagName;t||(this.deep=!0);var i=this.descriptor,n=i.interp;n&&(i.hasOneTime&&(this.expression=j(n,this._scope||this.vm)),(fs.test(t)||"name"===t&&("PARTIAL"===e||"SLOT"===e))&&(this.el.removeAttribute(t),this.invalid=!0))},update:function(t){
if(!this.invalid){var e=this.arg;this.arg?this.handleSingle(e,t):this.handleObject(t||{})}},handleObject:ls.handleObject,handleSingle:function(t,e){var i=this.el,n=this.descriptor.interp;if(this.modifiers.camel&&(t=l(t)),!n&&ps.test(t)&&t in i){var r="value"===t&&null==e?"":e;i[t]!==r&&(i[t]=r)}var s=vs[t];if(!n&&s){i[s]=e;var o=i.__v_model;o&&o.listener()}return"value"===t&&"TEXTAREA"===i.tagName?void i.removeAttribute(t):void(ds.test(t)?i.setAttribute(t,e?"true":"false"):null!=e&&e!==!1?"class"===t?(i.__v_trans&&(e+=" "+i.__v_trans.id+"-transition"),Z(i,e)):us.test(t)?i.setAttributeNS(cs,t,e===!0?"":e):i.setAttribute(t,e===!0?"":e):i.removeAttribute(t))}},gs={priority:Mr,bind:function(){if(this.arg){var t=this.id=l(this.arg),e=(this._scope||this.vm).$els;i(e,t)?e[t]=this.el:kt(e,t,this.el)}},unbind:function(){var t=(this._scope||this.vm).$els;t[this.id]===this.el&&(t[this.id]=null)}},_s={bind:function(){}},ys={bind:function(){var t=this.el;this.vm.$once("pre-hook:compiled",function(){t.removeAttribute("v-cloak")})}},bs={text:kr,html:Dr,"for":qr,"if":Qr,show:Gr,model:es,on:ns,bind:ms,el:gs,ref:_s,cloak:ys},ws={deep:!0,update:function(t){t?"string"==typeof t?this.setClass(t.trim().split(/\s+/)):this.setClass(_e(t)):this.cleanup()},setClass:function(t){this.cleanup(t);for(var e=0,i=t.length;i>e;e++){var n=t[e];n&&ye(this.el,n,X)}this.prevKeys=t},cleanup:function(t){var e=this.prevKeys;if(e)for(var i=e.length;i--;){var n=e[i];(!t||t.indexOf(n)<0)&&ye(this.el,n,Y)}}},Cs={priority:Vr,params:["keep-alive","transition-mode","inline-template"],bind:function(){this.el.__vue__||(this.keepAlive=this.params.keepAlive,this.keepAlive&&(this.cache={}),this.params.inlineTemplate&&(this.inlineTemplate=K(this.el,!0)),this.pendingComponentCb=this.Component=null,this.pendingRemovals=0,this.pendingRemovalCb=null,this.anchor=nt("v-component"),J(this.el,this.anchor),this.el.removeAttribute("is"),this.el.removeAttribute(":is"),this.descriptor.ref&&this.el.removeAttribute("v-ref:"+u(this.descriptor.ref)),this.literal&&this.setComponent(this.expression))},update:function(t){this.literal||this.setComponent(t)},setComponent:function(t,e){if(this.invalidatePending(),t){var i=this;this.resolveComponent(t,function(){i.mountComponent(e)})}else this.unbuild(!0),this.remove(this.childVM,e),this.childVM=null},resolveComponent:function(t,e){var i=this;this.pendingComponentCb=w(function(n){i.ComponentName=n.options.name||("string"==typeof t?t:null),i.Component=n,e()}),this.vm._resolveComponent(t,this.pendingComponentCb)},mountComponent:function(t){this.unbuild(!0);var e=this,i=this.Component.options.activate,n=this.getCached(),r=this.build();i&&!n?(this.waitingFor=r,be(i,r,function(){e.waitingFor===r&&(e.waitingFor=null,e.transition(r,t))})):(n&&r._updateRef(),this.transition(r,t))},invalidatePending:function(){this.pendingComponentCb&&(this.pendingComponentCb.cancel(),this.pendingComponentCb=null)},build:function(t){var e=this.getCached();if(e)return e;if(this.Component){var i={name:this.ComponentName,el:Zt(this.el),template:this.inlineTemplate,parent:this._host||this.vm,_linkerCachable:!this.inlineTemplate,_ref:this.descriptor.ref,_asComponent:!0,_isRouterView:this._isRouterView,_context:this.vm,_scope:this._scope,_frag:this._frag};t&&v(i,t);var n=new this.Component(i);return this.keepAlive&&(this.cache[this.Component.cid]=n),n}},getCached:function(){return this.keepAlive&&this.cache[this.Component.cid]},unbuild:function(t){this.waitingFor&&(this.keepAlive||this.waitingFor.$destroy(),this.waitingFor=null);var e=this.childVM;return!e||this.keepAlive?void(e&&(e._inactive=!0,e._updateRef(!0))):void e.$destroy(!1,t)},remove:function(t,e){var i=this.keepAlive;if(t){this.pendingRemovals++,this.pendingRemovalCb=e;var n=this;t.$remove(function(){n.pendingRemovals--,i||t._cleanup(),!n.pendingRemovals&&n.pendingRemovalCb&&(n.pendingRemovalCb(),n.pendingRemovalCb=null)})}else e&&e()},transition:function(t,e){var i=this,n=this.childVM;switch(n&&(n._inactive=!0),t._inactive=!1,this.childVM=t,i.params.transitionMode){case"in-out":t.$before(i.anchor,function(){i.remove(n,e)});break;case"out-in":i.remove(n,function(){t.$before(i.anchor,e)});break;default:i.remove(n),t.$before(i.anchor,e)}},unbind:function(){if(this.invalidatePending(),this.unbuild(),this.cache){for(var t in this.cache)this.cache[t].$destroy();this.cache=null}}},$s=An._propBindingModes,ks={},xs=/^[$_a-zA-Z]+[\w$]*$/,As=An._propBindingModes,Os={bind:function(){var t=this.vm,e=t._context,i=this.descriptor.prop,n=i.path,r=i.parentPath,s=i.mode===As.TWO_WAY,o=this.parentWatcher=new Ut(e,r,function(e){xe(t,i,e)},{twoWay:s,filters:i.filters,scope:this._scope});if(ke(t,i,o.value),s){var a=this;t.$once("pre-hook:created",function(){a.childWatcher=new Ut(t,n,function(t){o.set(t)},{sync:!0})})}},unbind:function(){this.parentWatcher.teardown(),this.childWatcher&&this.childWatcher.teardown()}},Ts=[],Ns=!1,js="transition",Es="animation",Ss=Ji+"Duration",Fs=Qi+"Duration",Ds=Ri&&window.requestAnimationFrame,Ps=Ds?function(t){Ds(function(){Ds(t)})}:function(t){setTimeout(t,50)},Rs=Se.prototype;Rs.enter=function(t,e){this.cancelPending(),this.callHook("beforeEnter"),this.cb=e,X(this.el,this.enterClass),t(),this.entered=!1,this.callHookWithCb("enter"),this.entered||(this.cancel=this.hooks&&this.hooks.enterCancelled,je(this.enterNextTick))},Rs.enterNextTick=function(){var t=this;this.justEntered=!0,Ps(function(){t.justEntered=!1});var e=this.enterDone,i=this.getCssTransitionType(this.enterClass);this.pendingJsCb?i===js&&Y(this.el,this.enterClass):i===js?(Y(this.el,this.enterClass),this.setupCssCb(qi,e)):i===Es?this.setupCssCb(Gi,e):e()},Rs.enterDone=function(){this.entered=!0,this.cancel=this.pendingJsCb=null,Y(this.el,this.enterClass),this.callHook("afterEnter"),this.cb&&this.cb()},Rs.leave=function(t,e){this.cancelPending(),this.callHook("beforeLeave"),this.op=t,this.cb=e,X(this.el,this.leaveClass),this.left=!1,this.callHookWithCb("leave"),this.left||(this.cancel=this.hooks&&this.hooks.leaveCancelled,this.op&&!this.pendingJsCb&&(this.justEntered?this.leaveDone():je(this.leaveNextTick)))},Rs.leaveNextTick=function(){var t=this.getCssTransitionType(this.leaveClass);if(t){var e=t===js?qi:Gi;this.setupCssCb(e,this.leaveDone)}else this.leaveDone()},Rs.leaveDone=function(){this.left=!0,this.cancel=this.pendingJsCb=null,this.op(),Y(this.el,this.leaveClass),this.callHook("afterLeave"),this.cb&&this.cb(),this.op=null},Rs.cancelPending=function(){this.op=this.cb=null;var t=!1;this.pendingCssCb&&(t=!0,Q(this.el,this.pendingCssEvent,this.pendingCssCb),this.pendingCssEvent=this.pendingCssCb=null),this.pendingJsCb&&(t=!0,this.pendingJsCb.cancel(),this.pendingJsCb=null),t&&(Y(this.el,this.enterClass),Y(this.el,this.leaveClass)),this.cancel&&(this.cancel.call(this.vm,this.el),this.cancel=null)},Rs.callHook=function(t){this.hooks&&this.hooks[t]&&this.hooks[t].call(this.vm,this.el)},Rs.callHookWithCb=function(t){var e=this.hooks&&this.hooks[t];e&&(e.length>1&&(this.pendingJsCb=w(this[t+"Done"])),e.call(this.vm,this.el,this.pendingJsCb))},Rs.getCssTransitionType=function(t){if(!(!qi||document.hidden||this.hooks&&this.hooks.css===!1||Fe(this.el))){var e=this.type||this.typeCache[t];if(e)return e;var i=this.el.style,n=window.getComputedStyle(this.el),r=i[Ss]||n[Ss];if(r&&"0s"!==r)e=js;else{var s=i[Fs]||n[Fs];s&&"0s"!==s&&(e=Es)}return e&&(this.typeCache[t]=e),e}},Rs.setupCssCb=function(t,e){this.pendingCssEvent=t;var i=this,n=this.el,r=this.pendingCssCb=function(s){s.target===n&&(Q(n,t,r),i.pendingCssEvent=i.pendingCssCb=null,!i.pendingJsCb&&e&&e())};q(n,t,r)};var Ls={priority:Ir,update:function(t,e){var i=this.el,n=gt(this.vm.$options,"transitions",t);t=t||"v",e=e||"v",i.__v_trans=new Se(i,t,n,this.vm),Y(i,e+"-transition"),X(i,t+"-transition")}},Hs={style:ls,"class":ws,component:Cs,prop:Os,transition:Ls},Is=/^v-bind:|^:/,Ms=/^v-on:|^@/,Vs=/^v-([^:]+)(?:$|:(.*)$)/,Bs=/\.[^\.]+/g,Ws=/^(v-bind:|:)?transition$/,zs=1e3,Us=2e3;Ye.terminal=!0;var Js=/[^\w\-:\.]/,qs=Object.freeze({compile:De,compileAndLinkProps:Ie,compileRoot:Me,transclude:si,resolveSlots:li}),Qs=/^v-on:|^@/;di.prototype._bind=function(){var t=this.name,e=this.descriptor;if(("cloak"!==t||this.vm._isCompiled)&&this.el&&this.el.removeAttribute){var i=e.attr||"v-"+t;this.el.removeAttribute(i)}var n=e.def;if("function"==typeof n?this.update=n:v(this,n),this._setupParams(),this.bind&&this.bind(),this._bound=!0,this.literal)this.update&&this.update(e.raw);else if((this.expression||this.modifiers)&&(this.update||this.twoWay)&&!this._checkStatement()){var r=this;this.update?this._update=function(t,e){r._locked||r.update(t,e)}:this._update=pi;var s=this._preProcess?p(this._preProcess,this):null,o=this._postProcess?p(this._postProcess,this):null,a=this._watcher=new Ut(this.vm,this.expression,this._update,{filters:this.filters,twoWay:this.twoWay,deep:this.deep,preProcess:s,postProcess:o,scope:this._scope});this.afterBind?this.afterBind():this.update&&this.update(a.value)}},di.prototype._setupParams=function(){if(this.params){var t=this.params;this.params=Object.create(null);for(var e,i,n,r=t.length;r--;)e=u(t[r]),n=l(e),i=M(this.el,e),null!=i?this._setupParamWatcher(n,i):(i=I(this.el,e),null!=i&&(this.params[n]=""===i?!0:i))}},di.prototype._setupParamWatcher=function(t,e){var i=this,n=!1,r=(this._scope||this.vm).$watch(e,function(e,r){if(i.params[t]=e,n){var s=i.paramWatchers&&i.paramWatchers[t];s&&s.call(i,e,r)}else n=!0},{immediate:!0,user:!1});(this._paramUnwatchFns||(this._paramUnwatchFns=[])).push(r)},di.prototype._checkStatement=function(){var t=this.expression;if(t&&this.acceptStatement&&!Mt(t)){var e=It(t).get,i=this._scope||this.vm,n=function(t){i.$event=t,e.call(i,i),i.$event=null};return this.filters&&(n=i._applyFilters(n,null,this.filters)),this.update(n),!0}},di.prototype.set=function(t){this.twoWay&&this._withLock(function(){this._watcher.set(t)})},di.prototype._withLock=function(t){var e=this;e._locked=!0,t.call(e),Yi(function(){e._locked=!1})},di.prototype.on=function(t,e,i){q(this.el,t,e,i),(this._listeners||(this._listeners=[])).push([t,e])},di.prototype._teardown=function(){if(this._bound){this._bound=!1,this.unbind&&this.unbind(),this._watcher&&this._watcher.teardown();var t,e=this._listeners;if(e)for(t=e.length;t--;)Q(this.el,e[t][0],e[t][1]);var i=this._paramUnwatchFns;if(i)for(t=i.length;t--;)i[t]();this.vm=this.el=this._watcher=this._listeners=null}};var Gs=/[^|]\|[^|]/;xt(wi),ui(wi),fi(wi),vi(wi),mi(wi),gi(wi),_i(wi),yi(wi),bi(wi);var Zs={priority:Ur,params:["name"],bind:function(){var t=this.params.name||"default",e=this.vm._slotContents&&this.vm._slotContents[t];e&&e.hasChildNodes()?this.compile(e.cloneNode(!0),this.vm._context,this.vm):this.fallback()},compile:function(t,e,i){if(t&&e){if(this.el.hasChildNodes()&&1===t.childNodes.length&&1===t.childNodes[0].nodeType&&t.childNodes[0].hasAttribute("v-if")){var n=document.createElement("template");n.setAttribute("v-else",""),n.innerHTML=this.el.innerHTML,n._context=this.vm,t.appendChild(n)}var r=i?i._scope:this._scope;this.unlink=e.$compile(t,i,r,this._frag)}t?J(this.el,t):z(this.el)},fallback:function(){this.compile(K(this.el,!0),this.vm)},unbind:function(){this.unlink&&this.unlink()}},Xs={priority:Br,params:["name"],paramWatchers:{name:function(t){Qr.remove.call(this),t&&this.insert(t)}},bind:function(){this.anchor=nt("v-partial"),J(this.el,this.anchor),this.insert(this.params.name)},insert:function(t){var e=gt(this.vm.$options,"partials",t,!0);e&&(this.factory=new se(this.vm,e),Qr.insert.call(this))},unbind:function(){this.frag&&this.frag.destroy()}},Ys={slot:Zs,partial:Xs},Ks=qr._postProcess,to=/(\d{3})(?=\d)/g,eo={orderBy:ki,filterBy:$i,limitBy:Ci,json:{read:function(t,e){return"string"==typeof t?t:JSON.stringify(t,null,arguments.length>1?e:2)},write:function(t){try{return JSON.parse(t)}catch(e){return t}}},capitalize:function(t){return t||0===t?(t=t.toString(),t.charAt(0).toUpperCase()+t.slice(1)):""},uppercase:function(t){return t||0===t?t.toString().toUpperCase():""},lowercase:function(t){return t||0===t?t.toString().toLowerCase():""},currency:function(t,e,i){if(t=parseFloat(t),!isFinite(t)||!t&&0!==t)return"";e=null!=e?e:"$",i=null!=i?i:2;var n=Math.abs(t).toFixed(i),r=i?n.slice(0,-1-i):n,s=r.length%3,o=s>0?r.slice(0,s)+(r.length>3?",":""):"",a=i?n.slice(-1-i):"",h=0>t?"-":"";return h+e+o+r.slice(s).replace(to,"$1,")+a},pluralize:function(t){var e=d(arguments,1),i=e.length;if(i>1){var n=t%10-1;return n in e?e[n]:e[i-1]}return e[0]+(1===t?"":"s")},debounce:function(t,e){return t?(e||(e=300),y(t,e)):void 0}};return Ai(wi),wi.version="1.0.26",setTimeout(function(){An.devtools&&Li&&Li.emit("init",wi)},0),wi});
//# sourceMappingURL=vue.min.js.map
///<jscompress sourcefile="jrequest.js" />
; (function(window, document, Math) {
	

	JRequest.onsend_before = function() {

	}
	JRequest.onsend_after = function() {

	}

	function JRequest() {
		var _jrequest = this ;

		this.m_send = function(api, type, data, onok, onno, opts) { // 请求地址
			var _defaults = {
				async : true
			} ;
			var _settings = $.extend(_defaults, opts) ;
			
			var _args = {
				async : _settings.async,
				url : api,
				type : type,
				data : data,
				timeout : 1000 * 10, // 10 秒
				error : function(xr, status) {
					if("timeout" == status) {
						$(JRequest).trigger("timeout") ; // 请求成功
						var _ds = {
							status : -1,
							info : "timeout"
						} ;
						if($.isFunction(onno)) { // 有自己的处理方式
							onno(_ds) ;
						} else {
							
						}
					}
				},
				ontimeout : function() {
					console.log("timeout..") ;
				},
				complete : function() {
					JRequest.onsend_after() ;
				},
				success : function(ds) {
					if(200 == ds.status) {
						if($.isFunction(onok)) {
							onok(ds.data) ;	
						}
						$(JRequest).trigger("success", ds) ; // 请求成功
					} else {
						if($.isFunction(onno)) { // 有自己的处理方式
							onno(ds) ;
						} else {

						}
						$(JRequest).trigger("error", ds) ;
					}
				}
			} ;
			JRequest.onsend_before(_args) ;
			$.ajax(_args) ;
		}
	}
	window.JRequest = JRequest ;
})(window, document, Math) ;
///<jscompress sourcefile="jutil.js" />
;(function() {
	
	window.__lazyimage = "data:image/gif;base64,R0lGODlhLAEsAeZCAMzMzP///7e3t8vLy8nJycrKys3NzcjIyP7+/vn5+dDQ0M/Pz9LS0tHR0dTU1Pr6+vv7+/f3987Ozufn5/Hx8fj4+Pz8/PT09OTk5OHh4f39/e/v7+Dg4OLi4t7e3tPT093d3fLy8tvb29nZ2dzc3OPj49ra2u7u7vb29ujo6PPz89bW1uXl5fX19fDw8Ozs7Obm5u3t7enp6d/f3+vr69jY2NXV1cfHx+rq6tfX18XFxbKysru7u8TExLOzs8bGxr+/v7Gxsf///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS4zLWMwMTEgNjYuMTQ1NjYxLCAyMDEyLzAyLzA2LTE0OjU2OjI3ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjQ5MzAxNTQzMTU0N0U2MTE5QTc3RDM0REM4REU5NUQzIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjVENkJCNDEzNTlFMjExRTY5QjcwRTg0OTQxRDQ3NTgxIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjVENkJCNDEyNTlFMjExRTY5QjcwRTg0OTQxRDQ3NTgxIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzYgKFdpbmRvd3MpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MTU5ODIxODc1OTU1RTYxMUEwRjQ4REY5OEU0RjUwNkIiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NDczMDE1NDMxNTQ3RTYxMTlBNzdEMzREQzhERTk1RDMiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4B//79/Pv6+fj39vX08/Lx8O/u7ezr6uno5+bl5OPi4eDf3t3c29rZ2NfW1dTT0tHQz87NzMvKycjHxsXEw8LBwL++vby7urm4t7a1tLOysbCvrq2sq6qpqKempaSjoqGgn56dnJuamZiXlpWUk5KRkI+OjYyLiomIh4aFhIOCgYB/fn18e3p5eHd2dXRzcnFwb25tbGtqaWhnZmVkY2JhYF9eXVxbWllYV1ZVVFNSUVBPTk1MS0pJSEdGRURDQkFAPz49PDs6OTg3NjU0MzIxMC8uLSwrKikoJyYlJCMiISAfHh0cGxoZGBcWFRQTEhEQDw4NDAsKCQgHBgUEAwIBAAAh+QQBAABCACwAAAAALAEsAQAH/4BCgoOEhYaHiImKi4yNjo+QkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/AAMKHEiwoMGDCBMqXMiwocOHECNKnEixosWLGDNq3Mixo8ePIEOKHEmypMmTKFOqXMmypcuXMGPKnEmzps2bOHPq3Mmzp8+fQIMKHUq0qNGjSJMqXZowgQsZJEQ0UEC1atUGIkjIcJGA6bEHFDKsMACgrNmzaM8aWJGBwgOvv/8QhPCgIK3du2kVeAiBAG6uBxM+4B1QgIDhwgUSEzhAoMAAvB8mvPU7KwKHBXYTHyjQwEaGEhhe4KAQ4gUMDzNWMABQ+HHaBRwiUH4FYQJmtIUBOBCBgYKFAMCDCw+uAcWGEg0Ouza7YAKE2as2rD47oPGH2BqGa99OPESHEQYILC/LYAP0UxFEoK1ugIOK7Nzjy4+AgYF4tCJknxclHS2B9hHIJ+CAFnggAQFolbcfKBz4dwAHKAwo4YAJlFAdWhwsyEkCI1BXQA4xTCjigBR4MMB4I3Sl4SUJOHAWARJgAJ+EELiAQwosYIABCBlMcAIFCSAg4gkGFHCWAyquOEn/iy9+4IKEKLyQWgOMLXbAATcwlpgENmjVgoQViICgWUgqKQmTZRHmgZDyWRADCQZoOZ5dhBkGwAgyPCCgBSAcsFyZZjqCJgCEsSBgCx0kdx9ejDYGAAgqCFhCkWQmGWgiD7iY5gA4yFdBBgfOySij1Q1AQoTxuUBpWQ5MdukhCIBgFmEvxAfBC1SKOup6//lngKHxUbCAkWWB0NerhmCAFg3xPVCDn7sOVsABDXCQggTjVVcDqttFoMByGCBbyAZklVXADCi0cMG667ZAwQsfjBltWuzl8IIGMRigK4wYsOsvBShgQCwABpgnrhAVNICWvic2fCJjus4LYwcBBlAC/6GDiefww6I2UIG4AZgw78h3GZZBAsAhYIJjJO9qQgDIntDyzIQSUEOIwZUgL814nfCqBdPxHK2RMwxHA8tC48WABZdOkHS0B3wQqXA4IP30XRMEGoEEVzdaQwXDtYBx13dJoN+KGZB91wEYaAdBAwOrnVYGSlqgsNwvcrDdCDvjfVYDTGvotN9lEQDDdhP0TbhZWS+oQdB4E9C2dg9IEPfiZjGgwYIqLF6ACWwON4PimJelwoIe7Kpvy9WBrZ3YEWPuwX4Q3DaYCQvEbhcBKWyHQA6Xl87cc9CFsOvnKZBeMgjcXRC88GaFcF7ao56IQgcHlEsqANwOB4LyNOs+N/90CNgQLQETBMACENqX7EHz4o/8mAPxm2XDsX4l0P5gmgeAwQ/VuwB3dNa1E2GAfiMzgKW8QoGRFaBWAeAAtDJTA+5oIHdXG8ABaBAC8N2FArNJgQNHwCYWsIZOFOBOC+o3qgIYgAYIWMHzGJWC2ZCAZAeQQXDIdbkBLAAC3GGBB4e2gEil4AYzI8Fs1DPC0KngAwc4SwFIEJ8azDBa1VkByjQgw5mJYDZ3GxkBmBWcBGTAUQDIIXdqx8K0IKgDvwlA8mjWgNnYbl4D+ICehHOCFYinAE/aTgVWx7oD2CAEwUFAA9p4lgXMpi4tOwCwjKaAAuxROycYIr0IoIAShC7/AB244qgU8MiZPWYDgpTBjIbzAk2apTAGmAHKhNNARp6FlJSBZMsKoADXiUiI1ZuWbmBQMeF4S5SjLCXNCGACIIqoBjrY2IkK0xgJrKBf8TGBK/GCS7/ocmY6YJ6ITDAVAyzgnAtQwAhEUIINBEk+iXtaN+HyTVOywJkTgsADIMBPfoqIgPJUptBu0IERGVQ4oezaPL1yR6FlII4HlZAGMLDNXTmSMmFM2g1A4MuIxodPUSRbHSnDxKsRgAFk9Oh2LpAcuX2RMjckm5FgAFGVBkADHViV2pRIGRGqTYM1WGVEUxAvW0arhpRpYORO4FHA+BGZQgMhZfQXuTWJCAEo/5jACBSwGcwpcDblw5sP8SmcCqSAAhR4SgZEIBjDGLVl94MO9eRmuO1AIDyKOQz0zEK34vnNhzUNTgcq6jfpQad2fitACYQaALHt1S4/3E/q/EYAVGrnA2+92uz207nE3g+TUCXc6fbzOMIRoKDacUBo5aY5wdHrMQ5bJs6E84LM3qVhY5tT4xZkN7UYgGsSkMBvrYZHAJRgOIpcbfUG8FuyYMuc2gOckuY6xQhUoAUVqIB1Y4CtQvZOOBfobtJOFAMUVCBdEbgACmiwnL6uaGtpksAsjXaimR1gtsCJZ9IKcLjtMIBYZgvU4Fgjgk/mLKQkO9H7Esk3oR2AitpBQP9Cy7LbugVtjNwZrCkfdMkLjK1lBCDBJWmJ4KW9Smbm+gBZheMBJM6MAB9IAZtgUF8c5iCwKbPBwHz2qpC9slV25cCiEnyD/ABHgiQjwAhWHJzRmeVl4kqYWerKHQzUGMQNiMFvPIDgUR0ABDgOAAIw4GIAeOxgQiDXK2Fg4ODE4MMJhvEJKlACZCamA4wFzgkQXDA0C0JZmwrkdlSgAMJKsQALgMEIIladD6SQO8YDl58FEatZAQCR3PlUqcLHmf0VbgCyjE8LhmUWY01aEJl6pQEerUIQXCh8bhyACQS9HSINrFWnHsSgCiABCMYnBDXAq9AuJAJMx8d5f1rgqQf/RZgZhNmYHaCfW7HYGgl0oHtBFK9ulJ3rQQHAZiPmDgJU0AHcEepKhkn3YqqzALaoINy+88APkp1rRHj7pMYeEARQoAIWdIAFMwABCDoAAxaE4N0TQkAM4nUkbtdbEBySIgBI0FGbikgDJEBjWVL08EU06EUKwMCzLe62+lwuQx1nRH9m5cI8kTw+CHiBA7qaOYOlnBHp4VUDSlBxkltGtZfLz80hsfJZwWgEKZhvUzcAJ42Tx+ZDf0RtGlodF66gAxeIQJ4j/IAW4AA8026kc6JOCcs01FyJMfMIPOCjDbiAAhvAwQlwwAEPfCB3jREVbM5GdkoARjC3pea0GnMA/x1sBmIRi4yr+n4JudAlgaPcC/4YvwmwiKV9DWCA5je/+YyupS2LpzwonCIDEJigBzwQgA92EIQd+EAAPOiBCUCwFYeL/va4z73ud8/73vv+98APvvCHT/ziG//4yE++8pfPfKAI4PmIeL4AMiF9NFc/EdLP/vWxD/1DbF8I2ofE9181fkJo//zTHwT61z/974f/EeVfEPvfD/75p18Q9g+/+7NviPzbfzb+133lt38BiH/dpwgBmH+UkYDtd4Dq54D9B4HmJ4GFwIAKCB3jx38DSIEPeH8R6IHex4EGCIITSIJesYENSIIEaIHs14EIKILxxxQoWH8q6IAs+H8j+P+CJpiDGCiB1TeDHXiD6OeC3LeDNNiDPgh9QFgJMciD0QeDIpgU8feDSWiCTViCOpiFT2iEUkiBVFiDHsiAWLiFWhiCXIgUU6iEVViC/jeGZliGH4iEb7iENNiGRMh/TviGZAiAXqiGYFiBUfiBKeiGeliIfpGGgwiIIGiDgfiFhBiHe3iIiHiEisiGFxiEBAiHlbiAHOiImziCdoiJixiFTXiFRxGDnviICWiJf1iErsiJO5iKRPiKgjiJtAiJkhiLfoiLkaiIeOiLt8iGW3iGdcgIvxgSx4iFdCiGlIiCQkh/wLgIyWiGxHgR0+iCy7iK4CeMvviMRniN0aiD1Wi9ESuofzgIipcYjqLIguJojKZYjCJRjteXjoYojuOYhysChsc4f+54j5ToCO/YfBUofoEokAZ5kAiZkAq5kAzZkA75kBAZkRI5kRRZkRZ5kRiZkRq5kRzZkR75kSAZkiI5kiRZkiZ5kiiZkiq5kizZki75kjAZkzI5kzRZkzZ5kziZkzq5kzzZkz75k0AZlEI5lERZlEZ5lEiZlEq5lEzZlE75lFAZlVI5lVRZlVZ5lViZlVq5lVzZlV65e4EAADs=" ;
    window.__lazyimage_small = "data:image/jpg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAA8AAD/4QMraHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjMtYzAxMSA2Ni4xNDU2NjEsIDIwMTIvMDIvMDYtMTQ6NTY6MjcgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzYgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjRBNjgwOENGNTlGMzExRTZCMUMwRUZEMERDRjdBMEVDIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjRBNjgwOEQwNTlGMzExRTZCMUMwRUZEMERDRjdBMEVDIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NEE2ODA4Q0Q1OUYzMTFFNkIxQzBFRkQwRENGN0EwRUMiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NEE2ODA4Q0U1OUYzMTFFNkIxQzBFRkQwRENGN0EwRUMiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7/7gAOQWRvYmUAZMAAAAAB/9sAhAAGBAQEBQQGBQUGCQYFBgkLCAYGCAsMCgoLCgoMEAwMDAwMDBAMDg8QDw4MExMUFBMTHBsbGxwfHx8fHx8fHx8fAQcHBw0MDRgQEBgaFREVGh8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx//wAARCABkAGQDAREAAhEBAxEB/8QAfQABAAMBAQEBAAAAAAAAAAAAAAQFBgIDAQgBAQEAAAAAAAAAAAAAAAAAAAABEAABAwMBBQUFBAsBAAAAAAABAAIDEQQFITFRYRIiQXGREwahscEyUoFyMxTw0UJikrLCI0MkFSURAQEBAAMAAAAAAAAAAAAAAAARAUFxkf/aAAwDAQACEQMRAD8A/VKAgICAgICAgICAgICAgICAgICAgICAgICAgICAgEgCp0AQVN56it45PJtWG5mOgDPlr3itfsQeIl9UXHUxjLdp1AdSvt5kWOnQ+qW6ieJ/CjR/SEHH/Zylof8A0LT+32yx7PiESLWzv7W8j54Hh1PmbscO8IJCAgICAgIBIAqdAEGcvcg7J3RtIZmwWbfxZXEDmHCu3gEWJYu8LibcCAtkkd9BDnu7z2IKu49UZCRx8kMhb2acx8T+pBxBnc3JJyxu8530BgPuogsLT1Qwu8q+iDNeUyM6m/aNUI5vrSzjf+dxlzHFO3qMQeA1w4a+xCLPE5SO/g5vlmZpIz4jgUROQEBAQEFR6lvjBaCBhpJPUHgwbfFBkkCiCficTLkJTryQM/Ef8BxRUvM3UFq042xaI2Af7DxtcfpJ96FUqIUG5BLxd66zvGTA9FeWQb2nag3IIIBGoOoKAgICAgyPqaUvyZZ2Rta0DvHN8UEGxfA25a24FYJOiTgD+0O46oua9clibmxdVw8yE/JMNh3V3FCNTbxMxuJ2CsUZe/i+lT7UOWKc9z3Oe81c4lzjxOpRH1jHveGMaXPdo1oFSUEi8sjaNjjlP+y8cz4xqGN7AeJRUVEbjDymXGW7zqeXlJ+6eX4IJiAgICDHeogRl5uIZT+EIKxBoMJnI2xizvT0DSOR2op9LkVf3VvHdWz4HkhkgoS3bREVbPSuPBq58jhuqB7gil1dYrDxuZbRtN0Ro0anvc7bRBl5ZZJpXSyO5pHmrnHeiOEG1wAIxFvXc72uKCegICAgzXqu1LZorkDpeORx4jUexBRFjwKlpA30NEHKDW+n8i26tPyz3UuIW8vEt2Bw7kVR32Ry7JpLea4eCwlpDaNqOw9IG0IK7j2naUR9AJNACTuGqDpsUjntYGnmcaNBFKk6IN5awCC2ihH+Nob4BB6oCAgII9/Zx3lq+B+nMOl25w2FBWYm8pzYq/aBKwFjObY9u7wRVblsBPaudLbtMlttoNXM7944oKqKWSKRskTi2Rpq1w2hETb6/iv42yTN8u8YKF7R0yDjuKKi29tPcyCKBhkeewdneexEjT2Fha4e1fc3LgZSOt2791qK88XDNkL05O4byxN6baM9lO39O1EXiAgICAgIIOTxMF/GObomb+HKNo7+CCvZk8njSIshEZ4Ro24ZtpxOw/aivR1x6aveqTyw87eYcjvHRRcfPyvpaPqLojTe8u9lShNfX5/HwN8mwhMr9jWRt5W18KlVHMOLvshM24yjuWNurLZunju96FXbWta0NaAGgUAGwBEfUBAQEBAQEAgEUIqDtBQQ5cPjJTV9u2p7W1b/ACkIPNuAxINfIr3veR7XIu714lwWttAKQxNj+6AER6oCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIP/9k=" ;
    
	String.prototype.startWith=function(str){     
	  var reg=new RegExp("^"+str);     
	  return reg.test(this);        
	}  
	String.prototype.endWith=function(str){     
	  var reg=new RegExp(str+"$");     
	  return reg.test(this);        
	}
	function heredoc(fn) {
        return fn.toString()
            .replace(/^[^\/]+\/\*!?\s?/, '')
            .replace(/\*\/[^\/]+$/, '')
    }

    function m_shake(callback) {
    	var _shake = 4000 ;
      	var _last_update = 0 ;
      	var _count = 0 ;
      	var _x = 0 ;
      	var _y = 0 ;
      	var _z = 0 ;
      	var _last_x = 0 ;
      	var _last_y = 0 ;
      	var _last_z = 0 ;
        if(window.DeviceMotionEvent) {
       		window.addEventListener("devicemotion", function(ev) {
       			var _acceleration = ev.accelerationIncludingGravity ;
                var _curr_time = new Date().valueOf() ;
                var _diff_time = _curr_time - _last_update ;

                if(_diff_time > 100) {
                   _last_update = _curr_time ; 
                   _x = _acceleration.x ;
                   _y = _acceleration.y ;
                   _z = _acceleration.z ;

                   var _speed = Math.abs(_x + _y + _z - _last_x - _last_y - _last_z) / _diff_time * 15000 ;
                   if(_speed > _shake) {
                   		if($.isFunction(callback)) {
                   			callback() ;
                   		}
                   }
                   _last_x = _x ;  
                   _last_y = _y ;  
                   _last_z = _z ;  
                } 
       		}, false) ;
        } else {
       		
        }
    }

    window.m_shake = m_shake ;

    ; (function() {
	    var lastTime = 0;
	    var vendors = ['webkit', 'moz'];
	    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
	        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
	        window.cancelAnimationFrame =
	          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	    }

	    if (!window.requestAnimationFrame)
	        window.requestAnimationFrame = function(callback, element) {
	            var currTime = new Date().getTime();
	            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
	            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
	              timeToCall);
	            lastTime = currTime + timeToCall;
	            return id;
	        };

	    if (!window.cancelAnimationFrame)
	        window.cancelAnimationFrame = function(id) {
	            clearTimeout(id);
	        };
	}()) ;
    window.heredoc = heredoc ;

    String.prototype.zh_cn_number = function() { // 中文数字
    	var _text = this.toString() ;
    	_text = _text.replace("1", "一")
    		 .replace("2", "二")
    		 .replace("3", "三")
    		 .replace("4", "四")
    		 .replace("5", "五")
    		 .replace("6", "六")
    		 .replace("7", "七")
    		 .replace("8", "八")
    		 .replace("9", "九")
    		 .replace("10", "十") ;

    	return _text ;
    }
    Date.prototype.diff = function(format) {
    	var _time = this.getTime() ;
    	var _days = Math.floor(_time / (24*3600*1000)) ;
		//计算出小时数
		var _leave1 = _time % ( 24 * 3600 * 1000) ;    //计算天数后剩余的毫秒数
		var _hours = Math.floor(_leave1 / (3600 * 1000)) ;
		//计算相差分钟数
		var _leave2 = _leave1 % (3600 * 1000) ;       //计算小时数后剩余的毫秒数
		var _minutes = Math.floor(_leave2 / (60 * 1000)) ;
		 
		//计算相差秒数
		var _leave3 = _leave2 % (60 * 1000) ;      //计算分钟数后剩余的毫秒数
		var _seconds = Math.round(_leave3 / 1000) ;

		return format.replace("days", _days)
					.replace("hours", _hours)
					.replace("minutes", _minutes)
					.replace("seconds", _seconds)
					.replace("ms", _leave3) ;
    }

	Date.prototype.format = function(format){ 
		var o = { 
		"M+" : this.getMonth()+1, //month 
		"d+" : this.getDate(), //day 
		"h+" : this.getHours(), //hour 
		"m+" : this.getMinutes(), //minute 
		"s+" : this.getSeconds(), //second 
		"q+" : Math.floor((this.getMonth()+3)/3), //quarter 
		"S" : this.getMilliseconds() //millisecond 
		} 

		if(/(y+)/.test(format)) { 
		format = format.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length)); 
		} 

		for(var k in o) { 
		if(new RegExp("("+ k +")").test(format)) { 
		format = format.replace(RegExp.$1, RegExp.$1.length==1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length)); 
		} 
		} 
		return format; 
	} 
	function JPromise() {
		var _promise = this ;
		this.m_promise = function(callback) {
			return new Promise(function(next, fail) {
				callback.call(_promise, next, fail) ;
			}) ;
		}
	}
	function _m_device() { // 判断设置
	    var _ua = navigator.userAgent.toLowerCase() ;	
		if (/iphone|ipad|ipod/.test(_ua)) {
			return "iOS" ;		
		} else if (/android/.test(_ua)) {
			return "android" ;	
		} else {
			return "pc" ;
		}
	}
	function JSimpleTouch(selector) { // selector = 被点击的对象
		var _touch = new JTouch(selector, document) ;
		var _stouch = this ;
		var _down_scroll_left = 0 ;
		var _down_scroll_top = 0 ;
		var _up_scroll_left = 0 ;
		var _up_scroll_top = 0 ;
		var _e_scroll = null ;
		var _e_click = null ;
		var _is_cancel = false ;
		var _diff_x = 0 ;
		var _diff_y = 0 ;
		var _vr_is_overflow = false ;
		var _temp_x = null ;
		var _is_dowm = false ;
		this.ontrigger = function() { // 触发
			
		}
		this.oncancel = function() { // 取消

		}
		this.onstart = function() {

		}
		this.onend = function() {
			
		}
		
		_touch.onstart = function(ev, v) {
			_is_dowm = true ;
			_e_click = ev.currentTarget ;
			_e_scroll = $(_e_click).parents(".scroll").eq(0) ;
			if(0 === _e_scroll.length) {
				_vr_is_overflow = false ;
				_down_scroll_top = 0 ;
			} else {
				_e_scroll = _e_scroll.get(0) ;
				_down_scroll_top = _e_scroll.m_get_scroll_top() ; // 按下的
				_vr_is_overflow = (0 > _down_scroll_top) || (_down_scroll_top > _e_scroll.m_get_scroll_height() - _e_scroll.m_get_height()) ;
				if(_down_scroll_top != _up_scroll_top && _down_scroll_top != _e_scroll.m_get_record_scroll_top()) {
					_down_scroll_top = null ;
				}
			}
			
			_stouch.onstart.call(_e_click, ev, {
				vr_is_overflow : _vr_is_overflow
			}) ;

		}
		_touch.onmove = function(ev, v) {
			if(_is_dowm) {
				_diff_x = Math.abs(v.diff_x) ;
				_diff_y = Math.abs(v.diff_y) ;
				if(_diff_x > 4 || _diff_y > 4) {
					_is_cancel = true ;
					_stouch.oncancel.call(_e_click, ev, v) ;
				} else {
					_is_cancel = false ;
				}
			}
		}
		_touch.onend = function(ev, v) {
			if(_is_dowm) {
				if(0 === _e_scroll.length) {
					_up_scroll_top = 0 ;
				} else {
					_up_scroll_top = _e_scroll.m_get_scroll_top() ;
				}
				if(_down_scroll_top == _up_scroll_top && false == _is_cancel) {
					_stouch.ontrigger.call(_e_click, ev, v) ; // 触发了
				}
				_stouch.onend.call(_e_click, ev, v) ;
				_is_cancel = false ;
				_is_dowm = false ;
				_diff_x = 0 ;
				_diff_y = 0 ;
			}
		}
	}
	window.JSimpleTouch = JSimpleTouch ;
	function JTouch(selector, e_target) {
		var _down_x = 0 , _down_y = 0 ;
		var _move_x = 0 , _move_y = 0 ;
		var _diff_x = 0 , _diff_y = 0 ;
		var _action_x = -1 , _action_y = -1 ;
		var _is_down = false ;
		var _temp_x, _temp_y ;
		var _touch = this ;
		var _action = null ;
		var _e = null ;
		var _hr_power = 0 ;
		var _vr_power = 0 ;

		var _down_event = "pc" === _m_device() ? "mousedown" : "touchstart" ;
		var _move_event = "pc" === _m_device() ? "mousemove" : "touchmove" ;
		var _up_event = "pc" === _m_device() ? "mouseup" : "touchend" ;

		this.onstart = function() {

		}
		this.onmove = function() {

		}
		this.onend = function() {
			
		}

		$(e_target).on(_down_event, selector, function(ev) {
			if(ev) {
				if(2 !== ev.button) {
					_e = ev.currentTarget ;
					_is_down = true ;
					if(ev.touches && ev.touches[0]) {
						_down_x = ev.touches[0].pageX ;
						_down_y = ev.touches[0].pageY ;
						_temp_x = _down_x ;
						_temp_y = _down_y ;
					} else {
						_down_x = ev.pageX ;
						_down_y = ev.pageY ;
						_temp_x = _down_x ;
						_temp_y = _down_y ;
					}
					_touch.onstart.call(_e, ev, {
						down_x : _down_x,
						down_y : _down_y
					}) ;
				}
			}
			
		}) ;
		$(e_target).on(_move_event, selector, function(ev) {
			if(ev) {
				if(_is_down) {
					if(ev.touches && ev.touches[0]) {
						_move_x = ev.touches[0].pageX ;
						_move_y = ev.touches[0].pageY ;
					} else {
						_move_x = ev.pageX ;
						_move_y = ev.pageY ;
					}
					_diff_x = _move_x - _down_x ;
					_diff_y = _move_y - _down_y ;

					if(_move_x > _temp_x) {
						_action_x = 1 ;
					} else if(_move_x < _temp_x) {
						_action_x = 0 ;
					}
					if(_move_y > _temp_y) {
						_action_y = 1 ;
					} else if(_move_y < _temp_y) {
						_action_y = 0 ;
					}

					_hr_power = _temp_x - _move_x ;
					_vr_power = _temp_y - _move_y ;

					_temp_x = _move_x ;
					_temp_y = _move_y ;

					if(null === _action) {
						if(Math.abs(_diff_y) > 5) {
							_action = "vr" ;
						} else if(Math.abs(_diff_x) > 5) {
							_action = "hr" ;
						}
					}
					_touch.onmove.call(_e, ev, {
						action_x : _action_x,
						action_y : _action_y,
						diff_x : _diff_x,
						diff_y : _diff_y,
						action : _action,
						hr_power : _hr_power,
						vr_power : _vr_power
					}) ;
				}
			}
		}) ;
	
		$(document).on(_up_event, function(ev) {
			if(ev) {
				if(_is_down) {
					_touch.onend.call(_e, ev, {
						action_x : _action_x,
						action_y : _action_y,
						diff_x : _diff_x,
						diff_y : _diff_y,
						action : _action,
						hr_power : _hr_power,
						vr_power : _vr_power
					}) ;
				}
			}
			_action_x = 0 ;
			_action_y = 0 ;
			_diff_x = 0 ;
			_diff_y = 0 ;
			_hr_power = 0 ;
			_vr_power = 0 ;
			_action = null ;
			_is_down = false ;

		}) ;
	}

	window.JTouch = JTouch ;
	
	window.JPromise = JPromise ;

	/*
		事件管理器
	*/
	function JEvents() {
		var _events = [] ;
		this.m_list_events = function() {
			return _events ;
		}
		function _m_push(name, callback, one) {
			var _names = name.replace(/ /g, "").split(",") ;
			for(var i = 0; i < _names.length; i++) {
				var _name = _names[i] ;
				_events.push({name : _name, callback : callback, one : one}) ;
			}
		}
		this.m_on = function(name, callback) {
			_m_push(name, callback, false) ;
			return this ;
		}
		this.m_one = function(name, callback) {
			_m_push(name, callback, true) ;
			return this ;
		}
		this.m_trigger = function(name, params) {
			var _self = this ;
			var _vs = [] ; // 返回
			var _names = name.replace(/ /g, "").split(",") ;
			var _ones = [] ;
			_events.forEach(function(evt, x) {
				for(var i = 0; i < _names.length; i++) {
					var _name = _names[i] ;
					var _one = false ;
					if(evt.name === _name) {
						if(false === _one && true === evt.one) {
							_one = true ;
						}
						var _v = evt.callback.call(_self, evt, params) ;
						if(_v && _v.then) {
							_vs.push(_v) ;	
						}
					}
					if(true === _one) {
						_ones.push(x) ;
					}
				}
			}) ;
			for(var i = 0; i < _ones.length; i++) {
				var _index = _ones[i] ;
				_events.splice(_index, 1) ;
			}
			return new Promise(function(next, fail) {
				if(0 === _vs.length) {
					next(params) ;	
				} else {
					Promise.all(_vs).then(function() {
						next(params) ;
					}).catch(function(e) {
						fail(e) ;
					}) ;
				}
			}) ;
		}
	}
	window.JEvents = JEvents ;
	Array.prototype.contains = function(item){
	    return RegExp(item).test(this) ;
	} ;
	Array.prototype.empty = function() {
		var _counter = 0 ;
		for(var i = 0; i < this.length; i++) {
			if(null === this[i]) {
				_counter ++ ;
			}
		}
		return _counter ;
	}
	function uuid() {
		var s = [];
		var hexDigits = "0123456789abcdef";
		for (var i = 0; i < 36; i++) {
		s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
		}
		s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
		s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
		s[8] = s[13] = s[18] = s[23] = "-";
		var uuid = s.join("");
		return uuid;
	}


	
	$.fn.m_css3_clear_transform = function() {
		$(this).css({
			"transform" : "",
			"-webkit-transform" : ""
		}) ;
		return this ;
	}	

	$.fn.m_clear_z_index = function() {
		$(this).css({
			"z-index" : ""
		}) ;
		return this ;
	}	

	$.fn.m_get_x = function() {
	   var _v = $(this).css("transform") || $(this).css("-webkit-transform") ;
	   if(-1 != _v.indexOf("translate3d")) {
	   		return _v.replace(/translate3d\((.*)\)/, "$1").replace(/ /g, "").split(",")[0].replace(/px/, "").replace(/%/, "") ;
	   } else if(-1 != _v.indexOf("matrix")) {
	   		return _v.replace(/matrix\((.*)\)/, "$1").replace(/ /g, "").split(",")[4].replace(/px/, "").replace(/%/, "")  ;
	   }
	}

	$.fn.m_css3_duration = function() {
		var _animate_duration = parseFloat(($(this).css("-webkit-animation-duration") || $(this).css("animation-duration")).replace("s", "")) * 1000 ;
		var _duration = parseFloat(($(this).css("-webkit-transition-duration") || $(this).css("transition-duration")).replace("s", "")) * 1000 ;
		return _animate_duration || _duration ;	
	}

	$.fn.m_css3_translate3d = function(x, y, z) {
		$(this).css({
			"transform" : "translate3d("+ x +", "+ y +", "+ z +")",
			"-webkit-transform" : "translate3d("+ x +", "+ y +", "+ z +")"
		}) ;
	}


	$.fn.m_x = function(x, duration, callback) {
		return this.each(function() {
			var _mv = move(this).transform('translate3d(' + x + ', 0, 0)') ;
			if("number" === typeof duration) {
				_mv.duration(duration) ;
			} else {
				_mv.duration(0) ;
			}
			_mv.end(callback) ;
		}) ;
	}
	$.fn.m_scale = function(scale, duration, callback) {
		return this.each(function() {
			var _mv = move(this).scale(scale) ;
			if("number" === typeof duration) {
				_mv.duration(duration) ;
			} else {
				_mv.duration(0) ;
			}
			_mv.end(callback) ;
		}) ;
	}
	$.fn.m_y = function(y, duration, callback) {
		return this.each(function() {
			var _mv = move(this).transform('translate3d(0, ' + y + ', 0)') ;
			if("number" === typeof duration) {
				_mv.duration(duration) ;
			} else {
				_mv.duration(0) ;
			}
			_mv.end(callback) ;
		}) ;
	}

	function getObjectURL(file) {
		var url = null ; 
		if (window.createObjectURL!=undefined) { // basic
			url = window.createObjectURL(file) ;
		} else if (window.URL!=undefined) { // mozilla(firefox)
			url = window.URL.createObjectURL(file) ;
		} else if (window.webkitURL!=undefined) { // webkit or chrome
			url = window.webkitURL.createObjectURL(file) ;
		}
		return url ;
	}

	function m_get_object_url(file) {
	 	return getObjectURL(file) ;
	}
    function m_get_object_urls(files) {
    	var _urls = [] ;
    	var _files = files ;
    	for(var i = 0; i < _files.length; i++) {
    		var _file = _files[i] ;
    		_urls.push(getObjectURL(_file)) ;
    	}
    	return _urls ;
    }


    function clone(obj){
		var o;
		switch(typeof obj){
			case 'undefined': break;
			case 'string'   : o = obj + '';break;
			case 'number'   : o = obj - 0;break;
			case 'boolean'  : o = obj;break;
			case 'object'   :
				if(obj === null){
					o = null;
				}else{
					if(obj instanceof Array){
						o = [];
						for(var i = 0, len = obj.length; i < len; i++){
							o.push(clone(obj[i]));
						}
					}else{
						o = {};
						for(var k in obj){
							o[k] = clone(obj[k]);
						}
					}
				}
				break;
			default:		
				o = obj;break;
			}
			return o;	
	}

	window.clone = clone ;
    window.uuid = uuid ;
    window.m_get_object_url = m_get_object_url ;
    window.m_get_object_urls = m_get_object_urls ;


})($) ;
///<jscompress sourcefile="path.js" />
var Path = {
    'version': "0.8.4",
    'map': function (path) {
        if (Path.routes.defined.hasOwnProperty(path)) {
            return Path.routes.defined[path];
        } else {
            return new Path.core.route(path);
        }
    },
    'root': function (path) {
        Path.routes.root = path;
    },
    'rescue': function (fn) {
        Path.routes.rescue = fn;
    },
    'history': {
        'initial':{}, // Empty container for "Initial Popstate" checking variables.
        'pushState': function(state, title, path){
            if(Path.history.supported){
                if(Path.dispatch(path)){
                    history.pushState(state, title, path);
                }
            } else {
                if(Path.history.fallback){
                    window.location.hash = "#" + path;
                }
            }
        },
        'replaceState': function(state, title, path){
            if(Path.history.supported){
                if(Path.dispatch(path)){
                    history.replaceState(state, title, path);
                }
            } else {
                if(Path.history.fallback){
                    window.location.hash = "#" + path;
                }
            }
        },
        'popState': function(event){
            var initialPop = !Path.history.initial.popped && location.href == Path.history.initial.URL;
            Path.history.initial.popped = true;
            var _path = null ;
            if(initialPop) {
                _path = document.location.pathname ;
            } else {
                _path = document.location.hash ;                
            }
            Path.dispatch(_path) ;
        },
        'listen': function(fallback){
            Path.history.supported = !!(window.history && window.history.pushState);
            Path.history.fallback  = fallback;
            if(Path.history.supported){
                Path.history.initial.popped = ('state' in window.history), Path.history.initial.URL = location.href;
                // window.onpopstate = Path.history.popState;
                window.addEventListener("popstate", Path.history.popState) ;
            } else {
                if(Path.history.fallback){
                    for(route in Path.routes.defined){
                        if(route.charAt(0) != "#"){
                          Path.routes.defined["#"+route] = Path.routes.defined[route];
                          Path.routes.defined["#"+route].path = "#"+route;
                        }
                    }
                    Path.listen();
                }
            }
        }
    },

    'querystring' : function(url) {
        var _pos = url.indexOf("?") ;
        var _url = null ;
        if(-1 == _pos) {
            _url = url ;
        } else {
            _url = url.substring(_pos + 1) ;
        }
        var _params = _url.split("&") ;
        var _param = null ;
        var _reg = null ;
        var _rs = null ;
        var _name = null ;
        var _value = null ;
        var _query = {} ;
        for(var i = 0; i < _params.length; i++) {
            _param = _params[i].split("=") ;
            _reg = new RegExp("(^|&)" + _param[0] + "=([^&]*)(&|$)", "i") ;
            _rs = _url.match(_reg) ;
            if(null != _rs){
                _name = _param[0] ;
                _value = _rs[2] ;
                _query[_name] = decodeURI(_value) ;
            }
        }
        return _query ;
    },

    'match': function (path, parameterize) {
        var _pos = path.indexOf("?") ;
        if(-1 !== _pos) {
            var _search = path.substring(_pos) ;
            path = path.substring(0, _pos) ;
        }
        
        var params = {}, route = null, possible_routes, slice, i, j, compare;
        for (route in Path.routes.defined) {
            if (route !== null && route !== undefined) {
                route = Path.routes.defined[route];
                possible_routes = route.partition();
                for (j = 0; j < possible_routes.length; j++) {
                    slice = possible_routes[j];
                    compare = path;
                    if (slice.search(/:/) > 0) {
                        for (i = 0; i < slice.split("/").length; i++) {
                            if ((i < compare.split("/").length) && (slice.split("/")[i].charAt(0) === ":")) {
                                params[slice.split('/')[i].replace(/:/, '')] = compare.split("/")[i];
                                compare = compare.replace(compare.split("/")[i], slice.split("/")[i]);
                            }
                        }
                    }
                    if (slice === compare) {
                        if (parameterize) {
                            route.params = params;
                        }
                        return route;
                    }
                }
            }
        }
        return null;
    },
    'dispatch': function (passed_route) {
        var previous_route, matched_route;
        if (Path.routes.current !== passed_route) {
            Path.routes.previous = Path.routes.current;
            Path.routes.current = passed_route;
            matched_route = Path.match(passed_route, true);
            var _path = passed_route ;
            var _pos = _path.indexOf("?") ;
            var _query = {} ;
            if(-1 !== _pos) {
                var _search = _path.substring(_pos) ;
                _path = _path.substring(0, _pos) ;
                _query = this.querystring(_search) ;
                // 解析 query
            }
            if(matched_route) {
                matched_route.query = _query ;    
            }
            if (Path.routes.previous) {
                previous_route = Path.match(Path.routes.previous);
                if (previous_route !== null && previous_route.do_exit !== null) {
                    previous_route.do_exit();
                }
            }

            if (matched_route !== null) {
                matched_route.run();
                return true;
            } else {
                if (Path.routes.rescue !== null) {
                    Path.routes.rescue();
                }
            }
        }
    },
    'listen': function () {
        var fn = function() {
            Path.dispatch(location.hash);
        }
        Path.routes.root = Path.routes.root ? Path.routes.root : "/" ;
        if (location.hash === "") {
            if (Path.routes.root !== null) {
                location.hash = Path.routes.root;
            }
        }
        // The 'document.documentMode' checks below ensure that PathJS fires the right events
        // even in IE "Quirks Mode".


        if ("onhashchange" in window && (!document.documentMode || document.documentMode >= 8)) {

            window.onhashchange = fn;
        } else {
            Path.ir = setInterval(fn, 50);
        }

        if(location.hash !== "") {
            Path.dispatch(location.hash);
        }
    },
    'core': {
        'route': function (path) {
            this.path = path;
            this.action = null;
            this.do_enter = [];
            this.do_exit = null;
            this.params = {};
            Path.routes.defined[path] = this;
        }
    },
    'routes': {
        'current': null,
        'root': null,
        'rescue': null,
        'previous': null,
        'defined': {}
    }
};
Path.core.route.prototype = {
    'to': function (fn) {
        this.action = fn;
        return this;
    },
    'enter': function (fns) {
        if (fns instanceof Array) {
            this.do_enter = this.do_enter.concat(fns);
        } else {
            this.do_enter.push(fns);
        }
        return this;
    },
    'exit': function (fn) {
        this.do_exit = fn;
        return this;
    },
    'partition': function () {
        var parts = [], options = [], re = /\(([^}]+?)\)/g, text, i;
        while (text = re.exec(this.path)) {
            parts.push(text[1]);
        }
        options.push(this.path.split("(")[0]);
        for (i = 0; i < parts.length; i++) {
            options.push(options[options.length - 1] + parts[i]);
        }
        return options;
    },
    'run': function () {
        var halt_execution = false, i, result, previous;
        if (Path.routes.defined[this.path].hasOwnProperty("do_enter")) {
            if (Path.routes.defined[this.path].do_enter.length > 0) {
                for (i = 0; i < Path.routes.defined[this.path].do_enter.length; i++) {
                    result = Path.routes.defined[this.path].do_enter[i].apply(this, null);
                    if (result === false) {
                        halt_execution = true;
                        break;
                    }
                }
            }
        }
        if (!halt_execution) {
            Path.routes.defined[this.path].action();
        }
    }
};
///<jscompress sourcefile="jrouter.js" />
function JRouter(opts) { // 路由器
	var _defs = {
		root : "",
		prefix : "#",
		async : false
	} ;
	var _router = this ;
	var _settings = $.extend(_defs, opts) ;
	this.current = null ;
	this.previous = null ;
	var _to = null ;
	function _m_init() {
		
	}
	function _m_convert_path(path) {
		// $root?id=1
		var _pos = path.indexOf("?") ;
		var _path = null ;
		var _search = "" ;
		if(-1 != _pos) {
			_path = path.substring(0, _pos) ;
			_search = path.substring(_pos) ;
		} else {
			_path = path ;
		}
		if(_settings.root) {
			if(-1 != _path.indexOf("$root")) {
				path = _settings.prefix + _settings.root + _search ;
			} else {
				path = _settings.prefix + _settings.root + "." + path ;	
			}
		} else {
			if(-1 != _path.indexOf("$root")) {
				path = _settings.prefix + "/" + _search ;
			} else {
				path = _settings.prefix + path ;
			}
		}
		return path ;
	}
	this.m_push = function(path) {
		Path.history.pushState(null, "", _m_convert_path(path)) ;
	}
	this.m_redirect = function(path) {
		Path.history.replaceState(null, "", _m_convert_path(path)) ;	
	}
	this.m_dispatch = function(path) {
		console.log(_m_convert_path(path)) ;
		Path.dispatch(_m_convert_path(path)) ;
	}
	this.m_preloader = function(path) { // 预加载
		var _jvc_is_init = sessionStorage.getItem("#jvc.is.init#") ;
		if(!_jvc_is_init) {
			var _path = _m_convert_path(path) ;
			var _href = window.location.href ;
			window.history.replaceState(null, "", _path) ;
			window.history.pushState(null, "", _href) ;
		}
		return this ;
	}
	this.m_to = function(to) {
		_to = to ;
		return this ;
	}
	this.m_add = function(path, name) { // 添加路由
		Path.map(_m_convert_path(path)).to(function() {
			if($.isFunction(_to)) {
				var _current = {
					query : this.query,
					params : this.params,
					name : name,
					path : this.path.replace(_settings.prefix, "").replace(_settings.root + ".", "")
				} ;
				_to.call(_router, _current) ;
				_router.previous = _router.current ;
				_router.current = _current ;
			}
		}) ;
		return this ;
	}
	this.m_listen = function() {
		Path.history.listen() ;
		Path.listen() ;
	}
}
window.JRouter = JRouter ;
///<jscompress sourcefile="newui.js" />
// --------------------- 输出(end) -----------------------
// 开始开发组件


function JActive(selector) {
	JSimpleTouch.apply(this, [selector]) ;

	function _m_filter(e, ev) {
		var _e_src = ev.srcElement ;
		if($(_e_src).hasClass("disable") || $(e).hasClass("disable")) {
			return false ;	
		} else if("inlay" == $(_e_src).attr("type") || ("edit" == $(_e_src).attr("type") || "edit" == $(e).attr("type") || "inlay" == $(e).attr("type")) && e != _e_src) {
			return false ;
		} else {
			return true ;
		}
	}

	this.onstart = function(ev, v) {
		if(v.vr_is_overflow) { // 溢出

		} else {
			var _ele = this ;
			clearTimeout(this.active_tm) ;
			this.active_tm = setTimeout(function() {
				if(_m_filter(_ele, ev)) {
					$(_ele).addClass("active") ;
				}
			}, 150) ;
			this.$onwait = function() {
				return new Promise(function(next) {
					setTimeout(function() {
						next() ;
					}, $(_ele).m_css3_duration() * 0.5) ;
				}) ;
			}
		}
	}
	this.oncancel = function() { // 取消掉
		var _ele = this ;
		clearTimeout(this.active_tm) ;
		$(_ele).removeClass("active") ;
	}
	this.ontrigger = function(ev, v) {
		clearTimeout(this.active_tm) ;
		var _ele = this ;
		if(_m_filter(this, ev)) {
			$(_ele).addClass("active") ;
			setTimeout(function() {
				$(_ele).removeClass("active") ;
			}, $(_ele).m_css3_duration()) ;
		}
	}
	this.onend = function() {
		clearTimeout(this.active_tm) ;
	}
}

function JClick(selector, jvc, callback) {
	var _curr_view = null ;

	// $(document).on("touchend", ".button", function(ev) {
	// 	ev.stopPropagation() ;
	// 	ev.preventDefault() ;
	// }) ;
	
	$(document).on("touchstart", ".prevent", function(ev) {
		ev.preventDefault() ;
	}) ;

	$(document).on("touchstart", function(ev) {
		_curr_view = jvc.curr_view ;
		if(0 == $(ev.srcElement).filter("input,textarea").length) {
			_curr_view.m_get_ele().find("input,textarea").blur() ;
		}
	}) ;
	
	var _filter_child_classes = [
		"file",
		"radio",
		"button",
		"switch",
		"checkbox"
	] ;
	var _filter_find_classes = [
		"merge",
	] ;
	JSimpleTouch.apply(this, [selector]) ;
	/*
		过滤
	*/
	function _m_filter(e, ev) {
		var _e_src = ev.srcElement ;
		if($(_e_src).hasClass("disable") || $(e).hasClass("disable")) {
			return false ;	
		} else if(("edit" == $(_e_src).attr("type") || "edit" == $(e).attr("type")) && e != _e_src) {
			return false ;
		} else {
			return true ;
		}
	}
	this.onstart = function(ev) {
		_curr_view = jvc.curr_view ;
	}
	this.onend = function(ev) {

	}
	this.ontrigger = function(ev, v) {
		ev.stopPropagation() ;
		var _e = $(this) ;
		var _self = this ;
		var _e_src = ev.srcElement ; // 实际点击
		var _tagname = this.tagName.toLowerCase() ;
		for(var i = 0; i < _filter_child_classes.length; i++) {
			if($(this).hasClass(_filter_child_classes[i])) {
				_e = $(this).children("input:not([type=file])") ;
				if(0 === _e.length) {
					_e = $(this).children("input[type=file]") ;
				}
				break ;	
			}
		}
		for(var i = 0; i < _filter_find_classes.length; i++) {
			if($(this).hasClass(_filter_find_classes[i])) {
				_e = $(this).find("input:not([type=file])") ;
				if(0 === _e.length) {
					_e = $(this).children("input[type=file]") ;
				}
				break ;	
			}
		}
		if(_m_filter(this, ev)) {
			var _type = _e.prop("type") ;
			if(_type) {
				_type = _type.toLowerCase() ;	
			}
			if("radio" === _type) {
				var _checked = _e.prop("checked") ;
				if(false === _checked) {
					_e.prop("checked", true) ;		
					$(_e).trigger("change", true) ;
				} else if("undefined" !== typeof _e.attr("single")) {
					_e.prop("checked", false) ;
					$(_e).trigger("change", false) ;
					$(_e).trigger("cancel") ; // 取消选择
				}
			} else if("checkbox" === _type) {
				_e.prop("checked", !_e.prop("checked")) ;
				if("undefined" !== typeof _e.attr("single")) {
					// 只能选择一个
					var _name = _e.attr("name") ;
					var _e_ele = _curr_view.m_get_ele() ;
					var _e_siblings = _e_ele.find("input[type=checkbox][name="+ _name +"]").not(_e) ;
					_e_siblings.each(function() {
						var _checked = $(this).prop("checked") ;
						if(true === _checked) {
							$(this).prop("checked", false) ;
							$(this).trigger("change") ;	
						}
					}) ;
				}
				$(_e).trigger("change") ;
			} else if("file" === _type) {
				_e.trigger("click") ;
			} else if("tel" === _type || "text" === _type || "search" === _type || "number" === _type || "password" === _type || "textarea" === _tagname) {
				_e.focus() ;
			} else if("select" === _tagname) {
				setTimeout(function() {
					_e.trigger("focus") ;
				}, 60) ;
			}
			function _m_click() {
				if($.isFunction(callback)) {
					callback.call(_self, ev, v) ;
				}
				if($.isFunction(_self.$onclick)) {
					_self.$onclick(ev) ;
				}
				if($.isFunction(_self.m_click)) {
					_self.m_click(ev) ;
				}
			}
			if($.isFunction(this.$onwait)) {
				this.$onwait().then(function() {
					_m_click() ;
				}) ;
			} else {
				_m_click() ;
			}
		}
	}
}


// 创建导航条

function JNav(jvc, selector, navs) {
	var _vm = new Vue({
		el : selector,
		data : {
			navs : navs,
			current : null,
			previous : null,
			status : 0
		},
		watch : {
			current : function() {
				var _nav = null ;
				if(this.previous) {
					_nav = this.m_get(this.previous) ;
					if(_nav.__save_icon) {
						_nav.icon = _nav.__save_icon ;
					}
				}
				var _nav = this.m_get(this.current) ;
				if(_nav.onicon) {
					_nav.__save_icon = _nav.icon ;
					_nav.icon = _nav.onicon ;
				}
				this.previous = this.current ;

				this.$nextTick(function() {
					this.m_get_button(this.current).removeClass("dot") ;
				}) ;

			}
		},
		methods : {
			m_get : function(path) {
				var _navs = this.navs ;
				for(var i = 0; i < _navs.length; i++) {
					if(_navs[i].path === path) {
						return _navs[i] ;
					}
				}
				return null ;
			},
			m_hide : function() {
				this.status = 0 ;
				clearTimeout(this.tm) ;
                var _el = $(this.$el) ;
				_el.removeClass("on").addClass("off") ;
                this.tm = setTimeout(function() {
                    _el.hide() ;
                }, _el.m_css3_duration()) ;
			},
			m_get_button : function(name) {
				for(var i = 0; i < this.e_buttons.length; i++) {
					if(this.e_buttons.eq(i).find("input[type=radio]").val() === name) {
						return this.e_buttons.eq(i) ;
					}
				}
				return null ;
			},
			m_remove_dot : function(name) {
				var _e_button = this.m_get_button(name) ;
				if(_e_button) {
					_e_button.removeClass("dot") ;	
				}
				return this ;
			},
			m_set_dot : function(name) { // 开始设置点
				var _e_button = this.m_get_button(name) ;
				if(_e_button) {
					_e_button.addClass("dot") ;
				}
				return this ;
			},
			m_show : function() {
				this.status = 1 ;
				var _self = this ;
				clearTimeout(this.tm) ;
				var _el = $(this.$el) ;
				_el.show() ;
				this.tm = setTimeout(function() {
					_el.removeClass("off").addClass("on") ;
					Promise.resolve(_self.m_trigger("show.after")) ;
				}, _el.m_css3_duration()) ;
			}
		},
		init : function() {
			JEvents.apply(this) ;
			JPromise.apply(this) ;
		},
		ready : function() {
			this.e_buttons = $(this.$el).find(".button") ;
		}
	}) ;
	return _vm ;
}
window.JNav = JNav ;
///<jscompress sourcefile="jvalid.js" />
/*
	插件：vue 表单验证插件
	时间：2016-07-22
	作者：Spam、
	公司：坤晖软件
*/
; (function() {
	var _install = function(Vue, opts) {
		var _verifications = {
			required : function(value) {
				if(typeof value == "boolean") return value ;
				return !((value == null) || (value.length == 0)) ;
			},
			min : function(value, min) {
				return value >= min ;
			},
			max : function(value, max) {
				return value <= max ;
			},
			eq : function(value, eq) {
				return value == eq ;
			},
			alpha : function(value) {
				return (/^[a-zA-Z]+$/).test(value) ;
			},
			numeric: function (value) {
				return (/^-?(?:0$0(?=\d*\.)|[1-9]|0)\d*(\.\d+)?$/).test(value) ;
			},
			email: function (value) {
				return (/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/).test(value) ;
			},
			url: function (value) {
				if("" === value) {
					return true ;
				} else {
					return (/^(https?|ftp|rmtp|mms):\/\/(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+)(:(\d+))?\/?/i).test(value) ;	
				}
			},
			alphaNum: function (value) {
				return !(/\W/).test(value);
			},
			integer: function (value) {
				return (/^(-?[1-9]\d*|0)$/).test(value) ;
			},
			digits: function (value) {
				return (/^[\d() \.\:\-\+#]+$/).test(value) ;
			},
			minlength : function(value, min) {
				return null != value && value.length >= min ;
			},
			maxlength : function(value, max) {
				return null != value && value.length <= max ;
			},
			pattern: function (value, expression) {
				var match = expression.match(new RegExp('^/(.*?)/([gimy]*)$')) ;
				var regex = new RegExp(match[1], match[2]) ;
				return regex.test(value) ;
			}
		} ;


		Vue.directive("click", {
			acceptStatement : true,
			bind : function() {
				
			},
			update : function(fn) {
				if("function" !== typeof fn) {
					// return console.error('the param of directive = "v-click" must be a function') ;
				} else {
					$(this.el).attr("click", "yes") ;
					this.el.m_click = function(event) {
						fn.call(this, event) ;
					}	
				}
			},
			unbind : function() {
			}
		}) ;

		Vue.directive("validator", {
			priority: 10002,
			bind : function() {
				var _name = this.expression ;
				var _paths = {} ;
				var _self = this ;
				var _vm = this.vm.$root ;
				// var _events = new JEvents() ;
				_vm.validator = _name ;
				var _objects = {
					rules : [],
					errors : [],
					result : false,
					m_validate_all : function(callback) { // 验证全部
						var _fr = true ;
						this.rules.forEach(function(item) {
							if(!item.m_valid()) {
								_fr = false ;
								_vm.$broadcast("form.invalid") ;
							}
						}) ;
						if($.isFunction(callback)) {
							callback.call(this, _fr) ;
						}
					},
					m_auto : function() { // 自动检查
						var _self = this ;
						this.errors = [] ;
						_paths = {} ;
						this.rules.forEach(function(item) {
							if(!_paths[item.path]) {
								_paths[item.path] = true ;
								if(!item.result) {
									// console.log("error", item.path) ;
									_self.errors.push(item.msg) ;
								}	
							}
						}) ;
						if(this.errors.length) {
							this.result = false ;
						} else {
							this.result = true ;
						}
						return this ;
					}
				}
				JEvents.apply(_objects) ;
				JPromise.apply(_objects) ;
				// _objects.apply() ;
				// _vm.$set(_name, _objects) ;
				var _form = _vm.$get(_name) ;
				$.extend(_form, _objects) ;

				// 先做一次初始化
			}
		}) ;
		
		Vue.directive("rules", {
			params : [
				"index",
				"alias"
			],
			bind : function() {
				var _vm = this.vm.$root ;
				var _scope = _vm ;
				var _self = this ;
				var _isarray = null === this.el.getAttribute("array") ? false : true ;
				var _func = new Function("return " + this.expression) ;
				var _attr_model = this.el.getAttribute("v-model") ;
				var _attr_name = this.el.getAttribute("name") ;
				var _index = this.el.getAttribute("index") ;
				var _type = this.el.type ;
				var _path = null ;
				var _index = this.params.index ;
				var _alias = this.params.alias ;
				// 生成一个唯一的
				var _name = _attr_model ? _attr_model : _attr_name ? _attr_name : null ;
				if(!_name) {
					_name = "__" + new Date().valueOf() ;
					// console.log("警告： 验证元素请包含 v-model or name 属性, 系统生成随机：", _name) ;
				}

				var _expressions = _func() ;
				var __extend = {
					result : false,
					msg : "",
					path : null,
					m_injection : function() {
						var __validate = {
							result : false, // 验证结果
							msg : "" // 消息
						}
						var _splits = _name.split(".") ;
						var _prefix = _splits[0] ;
						_splits.splice(0, 1) ;
						var _prop = _splits.join(".") ;
						_path = _vm.validator + "." +  _prefix  ;
						if(_prop) {
							_path += "." + _prop ;
						}
						if("undefined" !== typeof _alias) {
							_path += "." + "$" + _alias ;
						} else if("undefined" != typeof _index) {
							_path += "["+ _index +"]"
						}
						_scope.$set(_path, {
							result : false,
							msg : ""
						}) ;
						for(var expression in _expressions) {
							var _str = _path + "." + expression ;
							_scope.$set(_str, {
								result : false,
								msg : ""
							}) ;
						}
						this.path = _path ;
					},
					m_valid : function() { // 验证
						var _fr = true ;
						if(_self.el) {
							var _value = _scope.$get(_name) ;
							if(null === _attr_model && !_value) {
								_value = _self.el.value ;
							}
							var _msg = "" ;
							var _ = _scope.$get(_path) ;
							for(var expression in _expressions) {
								var _arg = _expressions[expression] ;
								var _r = _verifications[expression](_value, _arg) ;
								var _vd = _scope.$get(_path + "." + expression) ;
								// 设置实体
								_vd.result = _r ;
								if(!_r) {
									_msg = _self.el.dataset[expression + "Msg"] ;
									if(_msg) {
										_vd.msg = _msg ;	
									}
									// 设置消息
									_fr = false ;
									break ;
								} else {
									_vd.msg = "" ;
								}
								// 都会去设置
							}
							this.result = _fr ;
							this.msg = _vd.msg ;
							_.msg = _msg ;
							_.result = _fr ;
							_validator.m_auto() ;
						}
						return _fr ;
					}
				} ;

				if(this._scope) { // 数组
					_scope = this._scope ;
				}
				this.__extend = __extend ;
				var _validator = _vm[_vm.validator] ;
				__extend.m_injection() ;
				_validator.rules.push(this.__extend) ;
				// 监视某个值
				_scope.$watch(_name, function() {
					__extend.m_valid() ; // 开始验证
				}) ;
			
				// 扩展对象
			},
			unbind : function() {
				var _vm = this.vm.$root ;
				var _validator = _vm[_vm.validator] ;
				for(var i = 0; i < _validator.rules.length; i++) {
					if(_validator.rules[i] === this.__extend) {
						_validator.rules.splice(i, 1) ;
					}
				}
			}
		}) ;
	}
	if(typeof exports === "object") {
		module.exports = _install ;
	} else if(typeof define === "function" && define.amd) {
		define([], function() {
			return _install ;
		})
	} else if(window.Vue) {
		Vue.use(_install) ;
	}
})() ;

///<jscompress sourcefile="jframework.js" />
function JTplSimpleVM() {
	this.m_init = function(tpl) {
		tpl.m_vm = function(opts) {
			var _vm = new JSimpleVM(tpl, opts) ;
			return _vm ;
		}
	}
}

function JImageLazy() {
	this.m_init = function(tpl) {
		if(tpl.scrolls && Object.keys(tpl.scrolls).length) {
			for(key in tpl.scrolls) {
				var _scroll = tpl.scrolls[key] ;
				var _tm = null ;
				_scroll.$el.m_on("scroll", function() {
					var _self = this ;
					clearTimeout(_tm) ;
					_tm = setTimeout(function() {
						$(_self).find(".image").each(function() {
							if($.isFunction(this.m_valid)) {
								this.m_valid() ;	
							}
						}) ;
					}, 150) ;
				}) ;
			}
		}
	}
}

function JDownPullRefresh(jvc) { // 下拉刷新组件
	this.m_init = function(tpl) {
		if(tpl.scrolls && Object.keys(tpl.scrolls).length) { // 存在滚动条
			var _view = tpl.view ;
			var _once = false ;
			var _scroll = tpl.scrolls.default ;
			var _e = null ;
			// 添加下拉刷新组件
			function _m_create_ctrl() {
				var _e = $("<div></div>") ;
				_e.addClass("ctrl") ;
				return _e ;
			} // 添加控件
			function _m_add_ctrl() { // 添加控件
				var _e = _m_create_ctrl() ;
				_e.appendTo(_scroll.e_downpull) ;
				return _e ;
			}
			_e = _m_add_ctrl() ;
			_scroll.m_on("downpull", function(ev, v) { // 下拉
				if(1 === v) {
					this.e_downpull.addClass("ready") ;
					// _e.addClass("ready") ;
				} else {
					this.e_downpull.removeClass("ready") ;
					// _e.removeClass("ready") ;
				}
			}) ;
			jvc.curr_view.m_on("request.error, request.timeout", function() {
				// 重置掉下拉
				_scroll.e_downpull.removeClass("ready").removeClass("trigger") ;
				Promise.resolve(_scroll.__m_reset_downpull()) ;
			}) ;

			tpl.m_downpull_refresh = function(callback) {
				var _self = this ;
				_scroll.m_native_downpull(function() {
					_scroll.e_downpull.addClass("trigger") ;
					return this.m_promise(function(next) {
						tpl.__m_refresh().then(function() {
							var _sleep = jvc.curr_view.stoages.ANIMATE_DURATION ;
							function _m_cache() {
								_scroll.e_downpull.removeClass("trigger") ;
								next() ;
								// 刷新结束
								if($.isFunction(callback)) {
									callback() ;
								}
							}
							if(_sleep) {
								setTimeout(function() {
									_m_cache() ;
								}, _sleep + 60) ;
							} else {
								_m_cache() ;
							}
							jvc.curr_view.stoages.ANIMATE_DURATION = 0 ;
						}) ;
					}) ;
				}) ;
			} ;
			
			tpl.m_refresh = function() { // 重写掉刷新
                // 这里去判断是否是需要每次都下拉, 还是说只需要一次
                if(_view.opts.async) {
                    var _downpull_refresh = _view.opts.downpull_refresh ;
                    if(null === _downpull_refresh.type) {
                        return this.__m_refresh() ;
                    } else if("loop" === _downpull_refresh.type) {
                    	if(null === jvc.prev_view) {
                    		return this.m_downpull_refresh() ;	
                    	} else if("redirect" == jvc.prev_view.action || null == jvc.prev_view.action) {
                    		return this.m_downpull_refresh() ;	
                    	} else {
                    		return this.__m_refresh() ;
                    	}
                    } else if("push" === _downpull_refresh.type) {
                        if("push" === this.action) {
                            return this.m_downpull_refresh() ;	
                        } else {
                            return this.__m_refresh() ;
                        }
                    } else if("once" === _downpull_refresh.type) {
                        if(false === _once) {
                            _once = true ;
                            return this.m_downpull_refresh() ;	
                        } else {
                            return this.__m_refresh() ;
                        }
                    }
                } else {
                    return this.__m_refresh() ;
                }
            }
            _scroll.m_on("touch.downpull.end", function() { // 手动触屏下拉
            	return this.m_promise(function(next) {
            		this.e_downpull.addClass("trigger").removeClass("ready") ;
            		tpl.__m_refresh().then(function() {
            			setTimeout(function() {
            				_scroll.e_downpull.removeClass("trigger") ;
            				next() ;
            			}, 100) ;
            		}) ;
            	}) ;
            }) ;
		}
	}
}

function JSlideBackSpeed() {
	var _jvc = null ;
	var _slide_back = this ;
	var _status = 1 ;
	function _m_add() {
		var _e = _m_create() ;
		_e.appendTo(_jvc.m_get_ele()) ;
		return _e ;
	}
	function _m_create() {
		var _e = $("<div></div>") ;
		_e.addClass("slide-back") ;
		return _e ;
	}
	this.m_disable = function() {
		_status = 0 ;
	}
	this.m_enable = function() {
		_status = 1 ;
	}
	this.m_init = function(jvc) {
		_jvc = jvc ;
		_jvc.slide_back = this ;
		var _e = _m_add() ;
		var _w = 0 ;
		var _move_x = 0 ;
		var _isother = false ;
		var _is_valid = false ;
		var _temp_touch = new JTouch(".swiper", _jvc.m_get_ele()) ;
		_temp_touch.onstart = function(ev, v) {
			if(false == this.m_is_beging()) {
				_isother = true ;
			}
		}
		_temp_touch.onmove = function(ev, v) {
			if(1 == v.action_x && this.m_is_beging()) {
				this.m_lock() ;
			} else {
				this.m_unlock() ;
			}
		}
		_temp_touch.onend = function() {
			_isother = false ;
		}
		_jvc.m_on("complete", function() {
			_w = _e.width() ;
		}) ;
		_jvc.m_on("view.active.end", function(ev, v) {
			if(false === v.opts.slide_back) {
				_slide_back.m_disable() ;
			} else {
				_slide_back.m_enable() ;
			}
		}) ;
		var _touch = new JTouch(null, _jvc.m_get_ele()) ;
		_touch.onstart = function(ev, e) {
			jvc.curr_view.m_get_ele().m_css3_clear_transform() ;
			var _status = jvc.curr_view.status ; // 正在运行中
			if(_status) {
				_is_valid = false ;
				
			} else {
				_is_valid = true ;
			}
		}
		_touch.onmove = function(ev, v) {
			if(false === _is_valid || true === _isother) {
				return false ;
			}
			if("hr" === v.action && 1 === _status) {
				_move_x = v.diff_x ;
				_move_x = _move_x >= _w ? _w : _move_x ;
				_move_x = _move_x <= 0 ? 0 : _move_x ;
				_e.m_x(_move_x + "px") ;
			}
		}
		_touch.onend = function(ev, v) {
			if(1 === _status) {
				if(0 !== _move_x) {
					_e.m_x(0, 300, function() {
						$(this.el).m_css3_clear_transform() ;
					}) ;
					if(_move_x >= _w) {
						if($.isFunction(_jvc.curr_view.onslide_back)) {
							_jvc.curr_view.onslide_back() ;
						} else {
							jvc.m_back() ;
						}
					}
				}
				_move_x = 0 ;
			}
		}
	}
}

/*
	滑动后退
*/
function JSlideBackFluent() {
	var _jvc = null ;
	var _slide_back = this ;
	var _status = 1 ;
	var _is_valid = false ;
	var _width = 0 ;
	function _m_add() {
		var _e = _m_create() ;
		_e.appendTo(_jvc.m_get_ele()) ;
		return _e ;
	}
	function _m_create() {
		var _e = $("<div></div>") ;
		_e.addClass("slide-back") ;
		return _e ;
	}
	this.m_disable = function() {
		_status = 0 ;
	}
	this.m_enable = function() {
		_status = 1 ;
	}
	this.m_init = function(jvc) {
		_jvc = jvc ;
		_jvc.slide_back = this ;
		var _e = _m_add() ;
		var _w = 0 ;
		var _move_x = 0 ;
		var _isother = false ;

		var _temp_touch = new JTouch(".swiper", _jvc.m_get_ele()) ;
		_temp_touch.onstart = function(ev, v) {
			if(false == this.m_is_beging()) {
				_isother = true ;
			}
		}
		_temp_touch.onmove = function(ev, v) {
			if(1 == v.action_x && this.m_is_beging()) {
				this.m_lock() ;
			} else {
				this.m_unlock() ;
			}
		}
		_temp_touch.onend = function() {
			_isother = false ;
		}

		_jvc.m_on("complete", function() {
			_width = _e.width() ;
		}) ;
		_jvc.m_on("view.active.end", function(ev, v) {
			if(false === v.opts.slide_back || "vr" === v.opts.animate.direction) {
				_slide_back.m_disable() ;
			} else {
				_slide_back.m_enable() ;
			}
		}) ;
		
		var _touch = new JTouch(null, _jvc.m_get_ele()) ;
		_touch.onstart = function(ev, v) {
			_w = jvc.curr_view.m_width() ;
			jvc.curr_view.m_get_ele().m_css3_clear_transform() ;
			var _status = jvc.curr_view.status ; // 正在运行中
			if(_status) {
				_is_valid = false ;
				
			} else {
				_is_valid = true ;
			}
		}
		_touch.onmove = function(ev, v) {
			// console.log(v, _isother) ;
			if(false == _is_valid || true === _isother) return false ;
			if("hr" === v.action && 1 === _status && v.diff_x > 0) {
				_move_x = v.diff_x * 0.75 ;
				_move_x = _move_x <= 0 ? 0 : _move_x ;
				var _prev = jvc.curr_view.prev ;
				if(_prev && "temp" != _prev.opts.type) {
					var _v = -30 + (_move_x / _w) * 30 ;
					var _opacity = 0.7 + (_move_x / _w) * 0.7 ;
					var _scale = 0.95 + (_move_x / _w) * 0.05 ;
					var _e_prev = _prev.m_get_ele().css({
						zIndex : 4,
						opacity : _opacity
					}) ;
					move(_e_prev.get(0)).scale(_scale).end() ;
					// .transform('translateX(' + _v + '%)')
					// .m_scale(_v).m_x(_v + "%") ;
					// 停止轮播
					// 找到当前的轮播
					if($.isFunction(jvc.curr_view.jtc.curr_tpl.m_swipers_stop_autoplay)) {
						jvc.curr_view.jtc.curr_tpl.m_swipers_stop_autoplay() ;	
					}
					jvc.curr_view.m_get_ele().css({
						zIndex : 5
					}).m_x(_move_x + "px") ;
				} else {
					_move_x = _move_x >= _width ? _width : _move_x ;
					_e.m_x(_move_x + "px") ;
				}
			}
		}
		_touch.onend = function(ev, v) {
			if(false === _is_valid || true === _isother) {
				return false ;
			}
			if(1 === _status) {
				var _prev = jvc.curr_view.prev ;
				if(_prev && "temp" != _prev.opts.type) {
					
					if("hr" == v.action && (_move_x >= _w / 4 || v.hr_power < -50)) {
						if($.isFunction(_jvc.curr_view.onslide_back)) {
							_jvc.curr_view.onslide_back() ;
						} else {
							jvc.m_back() ;
						}
					} else {
						if(0 !== _move_x) {
							jvc.curr_view.m_get_ele().m_x("0px", 150, function() {
								$(this.el).m_css3_clear_transform().m_clear_z_index() ;
							}) ;
							var _prev = jvc.curr_view.prev ;
							if(_prev) {
								_prev.m_get_ele().m_scale(1, 150, function() {
									$(this.el).removeClass("on").m_css3_clear_transform().m_clear_z_index() ;
								}) ;
								// _prev.m_get_ele().m_x("-30%", 120, function() {
								// 	$(this.el).removeClass("on").m_css3_clear_transform().m_clear_z_index() ;
								// }) ;
							}
						}
					}
				} else {
					if(0 !== _move_x) {
						_e.m_x(0, 300, function() {
							$(this.el).m_css3_clear_transform() ;
						}) ;
						if(_move_x >= _width) {
							if($.isFunction(_jvc.curr_view.onslide_back)) {
								_jvc.curr_view.onslide_back() ;
							} else {
								jvc.m_back() ;
							}
						}
					}
				}
				if($.isFunction(jvc.curr_view.jtc.curr_tpl.m_swipers_start_autoplay)) {
					jvc.curr_view.jtc.curr_tpl.m_swipers_start_autoplay() ;	
				}
			}
			_move_x = 0 ;
		}
	}
}

function JHeader(ele) {
	function _m_init() {
		$(ele).on("touchstart", function(ev) {
			// ev.preventDefault() ;
		}) ;
	}
	_m_init() ;
}

function JFooter(ele) {
	function _m_init() {
		$(ele).on("touchstart", function(ev) {
			// ev.preventDefault() ;
		}) ;
	}
	_m_init() ;
}

/*
	全局点击
*/
function m_ui_kernel(jvc) { // ui 内核
	var _click_selectors = [
		"input",
		"textarea",
		"select",
		".button",
		// "[push],[back],[redirect],[dispatch]",
		".switch",
		"[click=yes]"
	] ;

	var _active_selectors = [
		".button"
		// ".item.link",
		// ".item.link-arrow"
	] ;
	new JClick(_click_selectors.join(","), jvc) ;
	new JActive(_active_selectors.join(","),jvc) ;
	new JClick("[push],[back],[redirect],[dispatch]", jvc, function(ev) {
		ev.stopPropagation() ;
		jvc.util.m_to($(this)) ;
	}) ;
}

function JTplRequest() {
	this.m_init = function(tpl) {
		tpl.m_on("down.start", function() {
			app.loader.m_show(120) ;
		}) ;
		tpl.m_on("down.end", function() {
			app.loader.m_hide() ;
		}) ;
	}
}
function JTplUtil(jvc) {
	var _jvc = null ;
	this.m_init = function(tpl) {
		_jvc = jvc ;

		tpl.m_swipers_stop_autoplay = function() {
			if(this.swipers) {
				var _keys = Object.keys(this.swipers) ;
				for(var i = 0; i < _keys.length; i++) {
					var _key = _keys[i] ;
					this.swipers[_key].m_stop_autoplay() ;
				}
			}
		}
		tpl.m_swipers_start_autoplay = function() {
			if(this.swipers) {
				var _keys = Object.keys(this.swipers) ;
				for(var i = 0; i < _keys.length; i++) {
					var _key = _keys[i] ;
					this.swipers[_key].m_start_autoplay() ;
				}
			}
		}

	}
}



function JScroll(ele, e_target) {
	JEvents.apply(this) ;
	JPromise.apply(this) ;
	var _scroll = this ;
	var _min = 0 ;
	var _max = 0 ;
	var _y = 0 ;
	var _x = 0 ;
	var _save_ele = null ;

	this.m_get_ele = function() {
		return ele ;
	}

	this.m_get_scroll_top = function() {
		return $(ele).prop("scrollTop") ;
	}
	this.m_get_scroll_left = function() {
		return $(ele).prop("scrollLeft") ;
	}
	this.m_reset = function() {
		$(ele).prop("scrollLeft", 0) ;
		$(ele).prop("scrollTop", 0) ;
		return this ;
	}
	this.m_height = function() {
		return $(ele).height() ;
	}
	this.m_width = function() {
		return $(ele).width() ;
	}
	this.m_get_scroll_height = function() {
		return $(ele).prop("scrollHeight") ;
	}
	this.m_get_scroll_width = function() {
		return $(ele).prop("scrollWidth") ;
	}

	this.m_get_scroll_y_is_overflow = function() {
		return this.m_get_scroll_top() > this.m_get_max_scroll_height() || this.m_get_scroll_top() < 0 ;
	}

	this.m_get_scroll_x_is_overflow = function() {
		return this.m_get_scroll_left() > this.m_get_max_scroll_width() || this.m_get_scroll_left() < 0 ;
	}

	this.m_get_max_scroll_height = function() {
		return this.m_get_scroll_height() - this.m_height() ;
	}

	this.m_get_max_scroll_width = function() {
		return this.m_get_scroll_width() - this.m_width() ;
	}

	function _m_init() {
		$(ele).on("scroll", function() {

			// $(".header").html(_scroll.m_get_scroll_top() + " " + _scroll.m_get_max_scroll_height()) ;

			// _content.m_trigger("scroll", {
			// 	scrolltop : _scroll.m_get_scroll_top(),
			// 	scrollleft : _scroll.m_get_scroll_left()
			// }) ;
			// if(_content.m_vr_visual_area() >= _content.m_get_scroll_height()) {
			// 	_content.m_trigger("toend") ;
			// }
		}) ;

		var _touch = new JTouch(ele, e_target) ;
		_touch.onstart = function(ev, v) {
			if(_save_ele) {
				ele = _save_ele ;
			}
			var _e = $(ev.srcElement) ;
			var _e_parent = _e.parents(".scroll") ;
			var _e_srcoll = null ;
			if(_e.hasClass("scroll")) {
				_e_srcoll = _e ;
			} else if(_e_parent.hasClass("scroll")) {
				_e_srcoll = _e_parent ;
			}
			if(_e_srcoll) {
				_save_ele = ele ;
				ele = _e_srcoll ;
			}
		}
		_touch.onmove = function(ev, v) {
			var _scroll_height = _scroll.m_get_scroll_height() ;
			var _scroll_top = _scroll.m_get_scroll_top() ;
			_height = _scroll.m_height() ;
			_max = _scroll_height - _height ;
			if(0 === _scroll_height) {
				// ev.preventDefault() ;
			} else if(1 == v.action_y && _scroll_top <= _min) {
				// ev.preventDefault() ;
				// 开始下拉
			} else if(0 == v.action_y && _scroll_top >= _max) {
				// ev.preventDefault() ;
			}
		}
		_touch.onend = function() {

		}
	}
	_m_init() ;
}

window.JScroll = JScroll ;

function JTplHeader() {
	this.m_init = function(tpl) {
		var _e = tpl.m_get_ele().find(".header") ;
		JHeader.apply(this, [_e]) ;
	}
}
function JTplFooter() {
	this.m_init = function(tpl) {
		var _e = tpl.m_get_ele().find(".footer") ;
		JFooter.apply(this, [_e]) ;
	}
}

function JTplContent() {
	var _e = null ;
	var _content = this ;
	this.m_init = function(tpl) {
		tpl.content = this ;
		_e = tpl.m_get_ele().find(".header ~ .content").eq(0) ;
		JScroll.apply(this, [_e, tpl.m_get_ele()]) ;
		_e.on("scroll", function() {
			
		}) ;
		tpl.view.m_on("leave.back, exit", function() { // 退出
			_content.m_reset() ;
		}) ;
	}
}


function JTpl(opts, jtl, view, jvc) {
	JPromise.apply(this) ;
	JEvents.apply(this) ;
	var _tpl = this ;
	var _once = false ;
	var _e = null ;
	this.view = view ;
	this.opts = opts ;
	this.scrolls = {} ;
	this.swipers = {} ;
	this.m_get_ele = function() {
		return _e ;
	}

	// this.m_draw = function() { // 重绘
	// 	return this.m_promise(function(next) {
	// 		this.m_trigger("draw").then(function() {
	// 			next(_tpl) ;
	// 		}) ;
	// 	}) ;
	// }

	this.m_class_name = function() {
		return this.opts.name.replace(/\./g, "-") ;
	}

	this.m_use = function(install) { // 使用一个插件
		install.m_init(this) ;
		return this ;
	}

	this.m_var_name = function() {
		return this.opts.name.replace(/\./g, "_") ;
	}
	function _m_create() {
		var _e = $("<div></div>") ;
		_e.addClass("tpl").addClass(_tpl.m_class_name()) ;
		return _e ;
	}
	function _m_add() {
		var _e = _m_create() ;
		_e.appendTo(jtl.m_get_ele()) ;
		return _e ;
	}

	this.m_show = function() {
		_e.addClass("on") ;
		return this ;
	}
	this.m_hide = function() {
		_e.removeClass("on") ;
		return this ;
	}
	function _m_ajax() {
		return _tpl.m_promise(function(next) {
			var _url = this.opts.html_url ;
			$.ajax({
				// url : "./modules/" + opts.name + ".html",
				url : _url,
				success : function(html) {
					_tpl.m_trigger("down.end") ;
					_e.html(html) ;
					next() ; // 模板下载完成
				}
			}) ;
		}) ;
	}
	function _m_down_html() {
		return _tpl.m_promise(function(next) {
			_tpl.m_trigger("down.start").then(function() {
				return _m_ajax() ;
			}).then(function() {
				return _tpl.m_trigger("down.end") ;
			}).then(next) ;
		}) ;
	}

	function _m_load_module() {
		return _tpl.m_promise(function(next) {
			var _url = this.opts.module_url ;
			// "./modules/"+ asset_dir +"/" + opts.name + ".js" ;
			seajs.use(_url, function($class) {
				if($.isFunction($class)) {
					var _v = new $class(_tpl, view, jtl, jvc) ;
					if(_v && _v.then) {
						_v.then(function() {
							next() ;
						}) ;
					} else {
						next() ;
					}
				}
			}) ;
		}) ;
	}

	this.m_apply = function() {
		return this.m_promise(function(next) {
			// 1 、下载模板
			// 2、 加载模块
			if(_once) {
				_tpl.m_show() ;
				next(_tpl) ;
				// _tpl.m_refresh().then(next) ; // 默认不刷新了
			} else {
				_once = true ;
				// 初始化
				_tpl.m_use(new JTplRequest()) ;
				_m_down_html().then(function() {
					_tpl.m_use(new JTplSimpleVM()) ;
					return _m_load_module() ; // 加载模块
				}).then(function() {
					_tpl.m_show() ;
					return _tpl.m_trigger("init") ; // 出货后完成
				}).then(function() {
					_tpl.m_use(new JTplHeader()) ;
					_tpl.m_use(new JTplFooter()) ;
					_tpl.m_use(new JTplContent()) ;
					_tpl.m_use(new JTplUtil(jvc)) ;
					_tpl.m_use(new JDownPullRefresh(jvc)) ;
					_tpl.m_use(new JImageLazy()) ;
					return _tpl.m_trigger("init.end") ;
				}).then(function() {
					next(_tpl) ;
				}) ;
			}
		}) ;
	}
	// this.__m_refresh = function() {
	// 	this.content.m_reset() ;
	// 	return this.m_promise(function(next) {
	// 		// 判断是否需要刷新模板
	// 		_tpl.m_trigger("refresh").then(function() {
	// 			return _tpl.m_draw() ;
	// 		}).then(function() {
	// 			next(_tpl) ;
	// 		}) ;
	// 	}) ;
	// }
		
	this.__m_refresh = function() {
		this.content.m_reset() ;
		return this.m_promise(function(next) {
			_tpl.m_trigger("draw").then(function() {
				return _tpl.m_trigger("draw.end") ;
			}).then(next) ;
		}) ;
	}
	this.m_refresh = function() {
		return this.__m_refresh() ;
	}
	// 作为模板， 只需要判断是否需要刷新
	function _m_init() {
		_e = _m_add() ;
		// 开始监视视图行为
		// 1、 模板只需要监视刷新..

	}
	_m_init() ;
}

function JTplController(view, jvc) {
	JEvents.apply(this) ;
	JPromise.apply(this) ;
	var _tpls = {} ;
	var _e = null ;
	this.curr_tpl = null ;
	this.prev_tpl = null ;
	var _jtl = this ;
	function _m_create() {
		var _e = $("<div></div>") ;
		_e.addClass("tpls") ;
		return _e ;
	}
	this.m_get_ele = function() {
		return _e ;
	}
	function _m_add() {
		var _e = _m_create() ;
		_e.appendTo(view.m_get_ele()) ;
		return _e ;
	}
	function _m_init() {
		_e = _m_add() ;
	}
	
	this.m_add_tpl = function(name) {
		var _view = jvc.m_get_view_config_by_name(name) ;
		var _tpl = new JTpl(_view, this, view, jvc) ;
		return _tpl ;
	}

	this.m_apply = function(name) {
		// 先隐藏

		return this.m_promise(function(next) {
			this.m_get_or_add(name).then(function(tpl) {
				_jtl.prev_tpl = _jtl.curr_tpl ;	
				_jtl.curr_tpl = tpl ;
				return tpl.m_apply() ;
			}).then(function(tpl) {
				if(_jtl.prev_tpl && _jtl.prev_tpl != _jtl.curr_tpl) {
					_jtl.prev_tpl.m_hide() ;
				}
				next(tpl) ;
			}) ;
		}) ;
	}
	this.m_get_or_add = function(name) {
		return this.m_promise(function(next) {
			var _tpl = _tpls[name] ;
			if(_tpl) {
				next(_tpl) ;
			} else {
				_tpl = this.m_add_tpl(name) ;
				_tpls[name] = _tpl ;
				next(_tpl) ;
			}
		}) ;
	}
	_m_init() ;
}

$.fn.m_css3_duration = function() {
	var _animate_duration = parseFloat(($(this).css("-webkit-animation-duration") || $(this).css("animation-duration")).replace("s", "")) * 1000 ;
	var _duration = parseFloat(($(this).css("-webkit-transition-duration") || $(this).css("transition-duration")).replace("s", "")) * 1000 ;
	return _animate_duration || _duration ;
}

function JView(opts, jvc) {
	JEvents.apply(this) ;
	JPromise.apply(this) ;
	this.jtc = null ;
	var _e = null ;
	var _view = this ;
	var _tplname = null ;
	this.once = false ;
	this.jvc = jvc ;
	this.opts = opts ;
	this.query = {} ;
	this.params = {} ;
	this.stoages = {} ;
	// this.isfirst = false ;
	this.status = false ;
	this.animate_class = null ;
	this.active_once = false ;
	this.enter_once = false ;
	var _refresh_once = false ;
	var _baseclass = "view" ;
	this.next = null ;
	this.prev = null
	this.m_class_name = function() {
		return this.opts.name.replace(/\./g, "-") ;
	}
	
	this.m_width = function() {
		return _e.width() ;
	}
	this.m_update = function() {
		Promise.resolve(this.jtc.curr_tpl.m_trigger("update")) ;
		return this ;
	}
	this.m_var_name = function() {
		return this.opts.name.replace(/\./g, "_") ;
	}
	this.m_get_ele = function() {
		return _e ;
	}
	function _m_create() {
		var _e = $("<div></div>") ;
		_e.addClass(_baseclass) ;
		// _e.css({
		// 	zIndex : opts.index
		// }) ;
		return _e ;
	}
	function _m_add() {
		var _e = _m_create() ;
		_e.appendTo(jvc.m_get_ele()) ;
		return _e ;
	}
	function _m_init() {
		_tplname = opts.name ;
		_e = _m_add() ;
		_view.jtc = new JTplController(_view, jvc) ;
		_view.opts.pos = null ;
	}

	this.m_reset = function() {
		// _e.prop("className", _baseclass) ;
		_e.css({
			opacity : ""
		}) ;
		// this.status = false ;
		_e.m_clear_z_index() ;
		_e.m_css3_clear_transform() ;
	}
	this.m_show = function() {
		_e.addClass("on") ;
		return this ;
	}
	this.m_clear = function() {
		if(this.animate_class) {
			_e.removeClass(this.animate_class).css({
				zIndex : "",
				opacity : ""
			}) ;
			_e.m_css3_clear_transform() ;
		}
	}
	this.m_hide = function() {
		_e.removeClass("on").removeClass("use") ;
		return this ;
	}

	function _m_set_tpl() {
		return _view.m_promise(function(next) {
			_view.jtc.m_apply(_tplname).then(function(tpl) {
				next(tpl) ; // 使用完成
			}) ;
		}) ;
	}

	this.m_set_tpl = function(tplname) { // 设置模板
		this.jtc.curr_tpl.m_hide() ;
		if("undefined" !== tplname) {
			_tplname = tplname ;
		}
		return this.m_promise(function(next) {
			_m_set_tpl().then(function(tpl) {
				next() ;
			}) ;
		}) ;
	}

	function _m_apply() {
		// 1、 加载默认模板
		_view.action = jvc.action ;
		return _view.m_promise(function(next) {
			if(true === this.once) {
				_m_set_tpl().then(function() {
					next(_view) ;
				}) ;
			} else {
				_view.m_use(new JViewUtil()) ;
				// _view.m_use(new JMiniLoading()) ;
				this.once = true ;
				_m_set_tpl().then(function() {
					return _view.m_trigger("init") ;
				}).then(function() {
					next(_view) ;
				}) ;
			}
		}) ;
	}


	function _m_query_string(query) {
		var _query_string = "" ;
		if(Object.keys(query).length) {
			for(var key in query) {
				_query_string += key + "=" + query[key] + "&" ;
			}
		}
		if(_query_string) {
			_query_string = _query_string.substring(0, _query_string.length - 1) ;
		}
		return _query_string ;
	}

	this.m_apply = function() { // 开始使用我这个视图
		this.opts.action = jvc.action ;
		this.query = jvc.router.current.query ;
		this.params = jvc.router.current.params ;
		var _query_string = _m_query_string(this.query) ;
		var _fullname = this.opts.path ;
		if(_query_string) {
			_fullname += "?" + _query_string ;
		}
		this.opts.fullname = _fullname ;
		return this.m_promise(function(next) {
			_m_apply().then(function() {
				next() ;
			}) ;
		}) ;
	}

	this.__m_refresh = function() {
		return this.m_promise(function(next) {
			this.m_trigger("refresh", this).then(function() {
				// 调用模板开始刷新
				return _view.jtc.curr_tpl.m_refresh() ;
			}).then(next) ;
		}) ;
	}

	this.m_refresh = function() { // 刷新, 实际上就是刷新模板
		return this.__m_refresh() ;
	}

	this.__m_refresh_type = function() { // 是否刷新
		var _refresh = _view.opts.refresh ;
		var _action = _view.opts.action ;
		var _type = _refresh.type ;
		if("default" === _type) {
			return "push" === _action ;	
		} else if("loop" === _type) { // 循环刷新
			return true ;
		} else if("once" === _type) {
			if(false === _refresh_once) {
				_refresh_once = true ;
				return true ;
			} else {
				return false ;
			}
		} else {
			return true ;
		}
	}
	this.m_refresh_type = function() { // 是否刷新
		return this.__m_refresh_type() ;
	}

	function __m_active() {
		
		return _view.m_promise(function(next) {
			if(false === _view.opts.async && (_view.m_refresh_type() || null === this.action || false === this.active_once)) { // 异步的
				// 先刷新
				_view.m_refresh().then(function() {
					next(_view) ;
				}) ;
			} else {
				next(_view) ;	
			}
		}) ;
	}

	function _m_active() {
		return _view.m_promise(function(next) {
			this.status = true ;
			if(null === this.opts.pos) {
				_view.opts.pos = jvc.pos ;	
			}
			var _action = this.opts.action ;
			if("push" === _view.opts.action) {
				_view.m_trigger("active.push").then(function() {
					__m_active().then(next)
				}) ;
			} else {
				__m_active().then(next) ;
			}
			this.active_once = true ;
		}) ;
	}

	this.m_active = function() { // 激活一下视图
		
		this.opts.location = window.location.href ;

		_view.m_get_ele().find("input, textarea").attr("readonly", "readonly") ;

		return this.m_promise(function(next, fail) {
			jvc.m_trigger("view.active.start", _view).then(function() {
				return _view.m_trigger("active") ;
			}).then(function() {
				return _m_active() ;
			}).then(function() {
				return jvc.m_trigger("view.active.end", _view) ;
			}).then(function() {
				next(_view) ;
			}).catch(function(e) {
				fail(e) ;
			}) ;
			
		}) ;
	}

	
	this.m_end = function() {
		_view.m_get_ele().find("input, textarea").removeAttr("readonly") ;
		return _view.m_promise(function(next) {
			// _view.jtc.curr_tpl.m_draw().then(next) ;
			next() ;
			// next() ;
		}) ;
	}

	function _m_enter() {
		return _view.m_promise(function(next) {
			var _action = this.opts.action ;
			_view.m_show() ;
			if(true === _view.opts.async && (_view.m_refresh_type() || null === _action || false === this.enter_once)) { // 异步的
				// 先刷新
				_view.m_refresh().then(function() {
					next(_view) ;
				}) ;
			} else {
				next(_view) ;
			}
			this.enter_once = true ;
		}) ;
	}

	this.m_enter = function() { // 激活一下视图
		return this.m_promise(function(next, fail) {
			jvc.m_trigger("view.enter.start", _view).then(function() {
				return _view.m_trigger("enter") ;
			}).then(function() {
				return _m_enter() ;
			}).then(function() {
				return jvc.m_trigger("view.enter.end", _view) ;
			}).then(function() {
				next(_view) ;
				_view.m_clear() ;
				setTimeout(function() {
					_view.status = false ;
				}, 150) ;
			}).catch(function(e) {
				fail(e) ;
			}) ;
		}) ;
	}

	this.m_frozen = function() {
		return this.m_promise(function(next, fail) {
			this.m_trigger("frozen").then(function() {
				if("back" === jvc.action) {
					_view.m_trigger("frozen.back").then(next) ;
				} else {
					next() ;
				}
			}).catch(function(e) {
				fail(e) ;
			}) ;
		}) ;
	}
	
	this.m_leave = function() {
		return this.m_promise(function(next, fail) {
			this.m_trigger("leave").then(function() {
				_view.m_hide() ;
				if(-1 == jvc.dr) { // 后退
					_view.opts.pos = null ;
					_view.m_trigger("leave.back").then(next) ;
				} else {
					next() ;
				}
			}).catch(function(e) {
				fail(e) ;
			}) ;
		}) ;
	}

	this.m_exit = function() { // 退出
		this.m_reset() ;
		this.m_clear() ;
		this.m_trigger("exit") ;
		return this ;
	}
	this.m_use = function(install) {
		install.m_init(this) ;
	}
	_m_init() ;
}

function m_default_value(object, prop, default_value) {
	if("undefined" === typeof object[prop]) {
		object[prop] = default_value ;
	}
}

function JViewAnimate() {

	var _jvc = null ;
	this.m_init = function(jvc) {
		_jvc = jvc ;
		var _mode = jvc.m_get_mode() ;
		jvc.m_animate = function() {
			return _jvc.m_promise(function(next) {
				if("redirect" === this.action) {
					if(this.prev_view) {
						this.m_exit() ;
					}
					next(this.curr_view) ;
				} else {
					if(this.prev_view && false === _jvc.m_is_catch()) {

						var _curr_view = this.curr_view ;
						var _prev_view = this.prev_view ;
						var _curr_view_index = _curr_view.opts.index ;
						var _prev_view_index = _prev_view.opts.index ;
						var _e_curr_view = _curr_view.m_get_ele() ;
						var _e_prev_view = _prev_view.m_get_ele() ;
						_e_curr_view.addClass("use") ;
						_e_prev_view.addClass("use") ;
						if(_curr_view_index > _prev_view_index) { // 前进
							var _animate_direction = _curr_view.opts.animate.direction ;
							var _curr_animate_class = _animate_direction + "-forward-curr" ;
							var _prev_animate_class = _animate_direction + "-forward-prev" ;
							_curr_view.animate_class = _curr_animate_class ;
							_prev_view.animate_class = _prev_animate_class ;
							_e_prev_view.addClass(_prev_animate_class) ;
							_e_curr_view.addClass(_curr_animate_class) ;
							setTimeout(function() {
								_e_curr_view.removeClass("use") ;
								next(_curr_view) ;
							}, _e_curr_view.m_css3_duration() + 60) ;
						} else if(_curr_view_index < _prev_view_index) { // 后退
							var _animate_direction = _prev_view.opts.animate.direction ;
							var _curr_animate_class = _animate_direction + "-back-curr" ;
							var _prev_animate_class = _animate_direction + "-back-prev" ;
							_e_prev_view.addClass(_prev_animate_class) ;
							_e_curr_view.addClass(_curr_animate_class) ;
							_prev_view.animate_class = _prev_animate_class ;
							_curr_view.animate_class = _curr_animate_class ;
							setTimeout(function() {
								_e_prev_view.removeClass("use") ;
								next(_curr_view) ;
							}, _e_prev_view.m_css3_duration() + 60) ;
						}
					} else {
						next(this.curr_view) ;
					}
				}
			}) ;
		}
	}
}
function JViewController(e_container) { // 视图管理器
	JPromise.apply(this) ;
	JEvents.apply(this) ;
	var _views = {} ;
	var _e = null ;
	var _jvc = this ;
	var _defs = {
		root : "",
		vms_dir : "./vms",
		modules_dir : "./modules",
		async : true
	} ;
	
	var _settings = {} ;
	var _go = null ;
	this.router = null ;
	this.action = null ;
	this.curr_view = null ;
	this.prev_view = null ;
	this.last_view = null ;
	this.dr = null ;
	this.pos = 0 ;
	// this.curr_location = null ;
	// this.prev_location = null ;
	this.status = 0 ;
	this.h = 0 ;
	this.w = 0 ;

	this.m_get_view_by_pos = function(pos) {
		for(var name in _views) {
			var _view = _views[name] ;
			if(_view.opts.pos === pos) {
				return _view ;
			}
		}
		return null ;
	}

	var _msgs = [] ;
	var _status = 0 ;
	var _is_ghost = false ;
	var _mode = "fluent" ;
	
	this.m_set_mode = function(mode) {
		_mode = mode ;
		return this ;
	}

	this.m_exit = function() { // 关闭控制器
		sessionStorage.removeItem("#last.view.opts") ;
		sessionStorage.removeItem("#last.prev.view.opts") ;
	}
	
	this.m_get_mode = function() {
		return _mode ;
	}
	function _onghost() {

	}
	this.m_get_ele = function() {
		return _e ;
	}
	function _m_create() {
		var _e = $("<div></div>") ;
		_e.addClass("views") ;
		return _e ;
	}
	function _m_add() {
		var _e = _m_create() ;
		_e.appendTo(e_container) ;

		_jvc.w = _e.width() ;
		_jvc.h = _e.height() ;

		return _e ;
	}
	function _m_init() {
		_e = _m_add() ;
	}

	this.m_view_exit = function(name) { // 视图名称
		var _view = _views[name] ;
		if(_view) {
			_view.m_exit() ;
		}
		return this ;
	}

	this.m_get_view_config_by_name = function(name) {
		var _opts = null ;
		var _views = _settings.views ;
		for(var i = 0; i < _views.length; i++) {
			var _view = _views[i] ;
			if(_view.name === name || ("$root" === _view.path && name === _settings.root)) {
				_opts = _view ;
				break ;
			}
		}
		return _opts ;
	}

	function _m_convert_path(path) {
		if(path) {
			var _pos = path.indexOf("/") ;
			if(-1 !== _pos) {
				path = path.substring(0, _pos) ;
			}
		}
		return path ;
	}

	this.m_get_view_config_by_path = function(path) {
		var _opts = null ;
		var _views = _settings.views ;
		for(var i = 0; i < _views.length; i++) {
			var _view = _views[i] ;
			if(_m_convert_path(_view.path) === _m_convert_path(path)) {
				_opts = _view ;
				break ;
			}
		}
		return _opts ;
	}

	this.m_add_view = function(name) { // 添加视图
		// 通过名字查找
		var _opts = this.m_get_view_config_by_name(name) ;
		var _view = new JView(_opts, this) ;
		return _view ;
	}

	this.m_get_msg = function(view, name) {
		for(var i = 0; i < _msgs.length; i++) {
			if(_msgs[i].view.name === view.name && _msgs[i].name === name) {
				return true ;
			}
		}
		return false ;
	}

	/*
		压入消息
	*/
	this.m_put_msg = function(view, name, params) {
		if(!this.m_get_msg(view, name)) {
			_msgs.push({view : view, name : name, params : params}) ;	
		}
		return this ;
	}
	/*
		处理消息
	*/
	function _m_pop_msg(msg) {
		return _jvc.m_promise(function(next) {
			this.curr_view.m_trigger("message", msg).then(function() {
				next() ;
			}) ;
		}) ;
	}
	function _m_pop_msgs() { // 处理消息
		var _pop_msgs = [] ;
		for(var i = 0; i < _msgs.length; i++) {
			if(_msgs[i].view == _jvc.curr_view.opts.name) {
				_pop_msgs.push(_msgs[i]) ;
				_msgs.splice(i, 1) ;
				i -- ;
			}
		}
		return _jvc.m_promise(function(next) {
			(function _ () {
				var _msg = _pop_msgs.pop() ;
				if(_msg) {
					_m_pop_msg(_msg).then(_) ;
				} else {
					next() ;
				}
			})() ;
		}) ;
	}
	
	this.m_get = function(name) {
		return _views[name] ;
	}
	
	this.m_get_or_add = function(name) { // 获取或者添加
		return this.m_promise(function(next) {
			var _view = _views[name] ;
			if(_view) {
				next(_view) ;
			} else {
				_view = this.m_add_view(name) ;
				_views[name] = _view ;
				next(_view) ;
				// 添加到 session
			}
		}) ;
	}

	this.m_get_view = function(name) {
		var _v = _views[name] ;
		return _v ;
	}

	function _m_frozen() {
		return _jvc.m_promise(function(next) {
			if(this.prev_view) {
				this.prev_view.m_frozen().then(function() {
					next(_jvc.curr_view) ;
				}) ;
			} else {
				next(_jvc.curr_view) ;
			}
		}) ;
	}
	
	function _m_leave() {
		return _jvc.m_promise(function(next) {
			if(this.prev_view) {
				_jvc.prev_view.m_leave().then(function() {
					_jvc.prev_view.m_reset() ;
					next(_jvc.curr_view) ;
				}) ;
				// 找到每次激活的索引
				if(_go) {
					for(var name in _views) {
						var _view = _views[name] ;
						var _pos = _view.opts.pos ;
						if(null != _pos) {
							if(0 != _pos && 0 != this.pos) {
								if(_pos >= this.pos && _view.opts.name != this.curr_view.opts.name) {
									_view.m_exit() ;
								}
							}
						}
					}
					var _v = this.m_get_view_by_pos(this.pos).prev ;
					this.curr_view.prev = _v ;
					_go = null ;
				}
			} else {
				next(_jvc.curr_view) ;
			}
		}) ;

	}

	function _m_animate() { // 启用动画
		return _jvc.m_animate() ;
	}

	function _m_start(view) {

		return _jvc.m_promise(function(next, fail) {
			this.last_view = view ;
			this.last_view.action = this.action ;
			if(0 === this.status) {
				_jvc.prev_view = _jvc.curr_view ;
				_jvc.curr_view = view ;
				_jvc.m_save_last_view_opts() ;
				_jvc.m_save_last_prev_view_opts() ;
				// 开始确认是前进还是后退
				if(_jvc.prev_view && _jvc.prev_view.opts.name === _jvc.curr_view.opts.name) {
					// alert("重复压入..") ;
					
				} else {
					this.status = 1 ;
					if("redirect" != _jvc.action) {
						if((null === _jvc.action || "push" === _jvc.action || "back" === _jvc.action) && _jvc.prev_view) {
							var _prev_view_index = _jvc.prev_view.opts.index ;
							var _curr_view_index = _jvc.curr_view.opts.index ;
							if(_prev_view_index < _curr_view_index) { // 前进
								_jvc.action = "push" ;
								_jvc.dr = 1 ;

							} else if(_prev_view_index > _curr_view_index) { // 后退
								_jvc.action = "back" ;
								_jvc.dr = -1 ;
							}
						}
						if(1 == _jvc.dr) {
							_jvc.curr_view.prev = _jvc.prev_view ;
						}
					}
					next(view) ;
				}
			} else {
				
			}
		}) ;
	}
	function _m_end() {
		return _jvc.m_promise(function(next) {
			_jvc.action = null ;
			this.status = 0 ;
			this.dr = null ;
			_onghost = null ;
			_is_catch = false ;
			_force_reset = false ;
			// 判断
			if(_jvc.prev_view) {
				_jvc.prev_view.m_clear() ;
			}
			_jvc.m_trigger("end").then(function() {
				next() ;
			}) ;
			_e.addClass("on") ;
			// this.curr_view.m_clear() ;
			var _curr_view_name = this.curr_view.opts.name ;
			var _last_view_name = this.last_view.opts.name ;
			if(_curr_view_name != _last_view_name) {
				var _last_view = this.m_get(_last_view_name) ;
				this.action = _last_view.action ;
				var _opts = _jvc.m_get_view_config_by_name(_last_view_name) ;
				if("$root" === _opts.path) {
					this.m_apply_view(_opts.name) ;
				} else {
					this.m_apply_view(_last_view_name) ;
				}
			}
		}) ;
	}
	this.once = false ;
	function _m_complete() {
		return _jvc.m_promise(function(next) {
			if(false === this.once) {
				this.once = true ;
				// this.curr_view.isfirst = true ;
				return _jvc.m_trigger("complete", this.curr_view).then(next) ;
			} else {
				next() ;
			}
		}) ;
	}
	this.m_termination = function() {
		this.status = 0 ;
		return this ;
	}
	var _is_catch = false ;

	this.m_is_catch = function() {
		return _is_catch ;
	}
	this.m_apply_view = function(name) { // 使用视图
		// 1、 use // 使用视图 ( 确定模板 )
		// 2、 active  // 激活 ( 判断异步刷新， 还是同步刷新 )
		// 3   frozen // 冻结 ( 清理工作 )
		// 4、 animate // 动画 ( 如果有 2 个以上的页面开始切换 )
		// 5、 enter // 进入 (  判断异步刷新， 还是同步刷新  )
		// 6、 leave // ；离开 ( 清理工作 )
		this.m_get_or_add(name).then(function(view) {
			return _jvc.m_trigger("filter", view) ;
		}).then(function(view) {
			return _m_start(view) ;
		}).then(function(view) {
			return view.m_apply() ;
		}).then(function(view) {
			return _m_complete() ;
		}).then(function() {
			return _m_frozen() ;
		}).then(function(view) {
			return view.m_active() ;
		}).then(function() {
			return _m_animate() ;
		}).then(function(view) {
			return view.m_enter() ;
		}).then(function(view) {
			return view.m_end() ;
		}).then(function() {
			return _m_pop_msgs() ;
		}).then(function() {
			return _m_leave() ;
		}).then(function() {
			return _m_end() ;
		}).catch(function(e) {
			_is_catch = true ;
			_m_complete() ;
			_jvc.m_termination() ;
			Promise.resolve(_jvc.m_trigger("catch", e)) ;
		}) ;
	}
	
	this.m_refresh_view = function(name) {
		var _view = _views[name] ;
		if(_view && true === _view.once) {
			Promise.resolve(_view.m_refresh()) ;
		}
	}

	this.m_get_last_view_opts = function() {
		var _v = sessionStorage.getItem("#last.view.opts") ;
		if(_v) {
			return JSON.parse(_v) ;
		} else {
			return null ;
		}
	}
	this.m_get_last_prev_view_opts = function() {
		var _v = sessionStorage.getItem("#last.prev.view.opts") ;
		if(_v) {
			return JSON.parse(_v) ;
		} else {
			return null ;
		}
	}
	this.m_save_last_prev_view_opts = function() {
		if(this.prev_view) {
			return sessionStorage.setItem("#last.prev.view.opts", JSON.stringify(this.prev_view.opts)) ;	
		}
	}
	this.m_save_last_view_opts = function() {
		return sessionStorage.setItem("#last.view.opts", JSON.stringify(this.curr_view.opts)) ;
	}
	this.m_ghost_back = function(go, onghost) { // 幽灵后退
		_go = go ;
		// 当前这个页面需要被重置
		// console.log(this.curr_view.opts.name) ;			
		// _force_reset = true ;		
		_is_ghost = true ;
		_onghost = onghost ;
		this.pos -= _go ;
		window.history.go(-go) ;
		return this ;
	}

	this.m_back = function(path) {
		this.pos -- ;
		this.action = "back" ;
		var _opts = this.m_get_view_config_by_path(path) ;
		if(_opts) {
			if(_views[_opts.name]) { // 如果从缓存里面找到了
				window.history.back() ;
			} else {
				// 如果有上个, 就 back
				this.m_go(path) ;
			}
		} else {
			window.history.back() ;
		}
	}

	this.m_dispatch = function(path) {
		this.action = "dispatch" ;
		this.router.m_dispatch(path) ;
		return this ;
	}
	this.m_go = function(path) {
		this.action = "go" ;
		this.router.m_redirect(path) ;
		return this ;
	}
	this.m_redirect = function(path) { // 重定向
		this.action = "redirect" ;
		this.router.m_redirect(path) ;
		return this ;
	}
	this.m_push = function(path) { // 加载页面
		this.action = "push" ;
		this.router.m_push(path) ;
		this.pos ++ ;
		return this ;
	}
	
	this.m_preloader = function(path) {
		this.router.m_preloader(path) ;
	}

	this.m_config = function(opts) {
		_settings = $.extend(_defs, opts) ;
		_jvc.router = new JRouter({
			root : _settings.root
		}) ;
		return this ;
	}
	
	function _m_to(v) { // 具体的业务处理
		if(false === _is_ghost) {
			_jvc.m_apply_view(v.name) ;
		} else if(true === _is_ghost) {
			// 触发当前页面的离开事件
			_is_ghost = false ;
			if($.isFunction(_onghost)) {
				setTimeout(function() {
					_onghost.call(_jvc) ;	
				}, 30) ;
			}
		}
	}
	this.m_init = function() {
		sessionStorage.setItem("#jvc.is.init#", true) ;
		var _views = _settings.views ;
		var _async = _settings.async ;
		for(var i = 0; i < _views.length; i++) {
			var _view = _views[i] ;
			_view.index = i ;
			m_default_value(_view, "slide_back", true) ;
			m_default_value(_view, "type", "normal") ;
			// m_default_value(_view, "loading_effect", true) ; // 加载特效
			m_default_value(_view, "downpull_refresh", {
				type : null // 默认不刷新
			}) ;
			m_default_value(_view, "animate", {
				direction : "hr"
			}) ;
			m_default_value(_view, "refresh", {
				type : "default"
			}) ; // 前进刷新
			m_default_value(_view, "path", _view.name) ;
			m_default_value(_view, "async", _async) ;

			_view.module_url = _settings.modules_dir + "/" + _settings.vms_dir +"/" + _view.name + ".js" ;
			_view.html_url = _settings.modules_dir + "/" + _view.name + ".html" ;

			this.router.m_add(_view.path, _view.name) ;
		}
		this.router.m_to(_m_to) ;
		this.router.m_listen() ;
		this.m_use(new JViewControllerUtil()) ;
		this.m_use(new JComponents()) ;
		this.m_use(new JViewAnimate()) ;

		if("speed" == _mode) {
			this.m_use(new JSlideBackSpeed()) ;
		} else if("fluent" == _mode) {
			this.m_use(new JSlideBackFluent()) ;
		}
	}
	
	this.m_use = function(install) {
		install.m_init(this) ;
		return this ;
	}
	_m_init() ;
}

window.JViewController = JViewController ;

// 附加



function JViewUtil() {

	this.m_init = function(view) {
		view.onwxshare = function() {
			return new Promise(function(next) {
				next() ;
			}) ;
		}
		
		view.m_on("frozen", function() {
			this.m_get_ele().find("*").blur() ; // 离开焦点
		}) ;

		view.m_on("draws.start", function() {
			// if(this.opts.loading_effect) {
				// app.loader.m_show() ;
			// }
			// app.loader.m_show() ;
		}) ;
		
		view.m_on("request.timeout", function() {
			if(this.opts.loading_effect) {
				// app.loader.m_hide() 
			}
			// app.loader.m_hide() 
		}) ;

		view.m_on("draws.end", function() {
			// if(this.opts.loading_effect) {
			// 	app.loader.m_hide() ;
			// }
			app.loader.m_hide() ;
		}) ;
		// app.loader.m_show() ;
  		// app.loader.m_hide() ;

	}

}

function JViewControllerUtil() {

	var _jvc = null ;
	this.m_init = function(jvc) {

		m_ui_kernel(jvc) ; // 初始化 ui 内核

		_jvc = jvc ;
		_jvc.m_on("view.active.start", function(ev, v) {
			if(false === v.opts.async) {
			}
		}) ;

		_jvc.m_on("view.enter.end", function(ev, v) {
			if(false === v.opts.async) {
				
			} 
		}) ;

		_jvc.m_on("complete", function() {
			
		}) ;
		
		_jvc.util = {
			m_to : function(e) {
				var _e = e ;
				var _push = $(_e).attr("push") ;
				var _back = $(_e).attr("back") ;
				var _redirect = $(_e).attr("redirect") ;
				var _dispatch = $(_e).attr("dispatch") ;
				if(_redirect) {
					jvc.m_redirect(_redirect) ;
				} else if(_push) {
					jvc.m_push(_push) ;
				} else if(_dispatch) {
					jvc.m_dispatch(_dispatch) ;
				} else if(null !== _back) {
					jvc.m_back(_back) ;
				}
			}
		} ;
		return this ;
	}
	function _m_init() {
		$(JRequest).on("error", function(ev, ds) { // 请求异常
			if(_jvc.curr_view) {
				_jvc.curr_view.m_trigger("request.error", ds) ;
			}
			_jvc.m_termination() ;
		}) ;
		$(JRequest).on("timeout", function(ev, ds) { // 请求异常
			if(_jvc.curr_view) {
				_jvc.curr_view.m_trigger("request.timeout", ds) ;
			}
			_jvc.m_termination() ;
		}) ;
		$(JRequest).on("success", function(ev, ds) {
			if(_jvc.curr_view) {
				_jvc.curr_view.m_trigger("request.success", ds) ;
			}
		}) ;
	}
	_m_init() ;
}
///<jscompress sourcefile="move.js" />

;(function(){

/**
 * Require the module at `name`.
 *
 * @param {String} name
 * @return {Object} exports
 * @api public
 */

function require(name) {
  var module = require.modules[name];
  if (!module) throw new Error('failed to require "' + name + '"');

  if (!('exports' in module) && typeof module.definition === 'function') {
    module.client = module.component = true;
    module.definition.call(this, module.exports = {}, module);
    delete module.definition;
  }

  return module.exports;
}

/**
 * Meta info, accessible in the global scope unless you use AMD option.
 */

require.loader = 'component';

/**
 * Internal helper object, contains a sorting function for semantiv versioning
 */
require.helper = {};
require.helper.semVerSort = function(a, b) {
  var aArray = a.version.split('.');
  var bArray = b.version.split('.');
  for (var i=0; i<aArray.length; ++i) {
    var aInt = parseInt(aArray[i], 10);
    var bInt = parseInt(bArray[i], 10);
    if (aInt === bInt) {
      var aLex = aArray[i].substr((""+aInt).length);
      var bLex = bArray[i].substr((""+bInt).length);
      if (aLex === '' && bLex !== '') return 1;
      if (aLex !== '' && bLex === '') return -1;
      if (aLex !== '' && bLex !== '') return aLex > bLex ? 1 : -1;
      continue;
    } else if (aInt > bInt) {
      return 1;
    } else {
      return -1;
    }
  }
  return 0;
}

/**
 * Find and require a module which name starts with the provided name.
 * If multiple modules exists, the highest semver is used. 
 * This function can only be used for remote dependencies.

 * @param {String} name - module name: `user~repo`
 * @param {Boolean} returnPath - returns the canonical require path if true, 
 *                               otherwise it returns the epxorted module
 */
require.latest = function (name, returnPath) {
  function showError(name) {
    throw new Error('failed to find latest module of "' + name + '"');
  }
  // only remotes with semvers, ignore local files conataining a '/'
  var versionRegexp = /(.*)~(.*)@v?(\d+\.\d+\.\d+[^\/]*)$/;
  var remoteRegexp = /(.*)~(.*)/;
  if (!remoteRegexp.test(name)) showError(name);
  var moduleNames = Object.keys(require.modules);
  var semVerCandidates = [];
  var otherCandidates = []; // for instance: name of the git branch
  for (var i=0; i<moduleNames.length; i++) {
    var moduleName = moduleNames[i];
    if (new RegExp(name + '@').test(moduleName)) {
        var version = moduleName.substr(name.length+1);
        var semVerMatch = versionRegexp.exec(moduleName);
        if (semVerMatch != null) {
          semVerCandidates.push({version: version, name: moduleName});
        } else {
          otherCandidates.push({version: version, name: moduleName});
        } 
    }
  }
  if (semVerCandidates.concat(otherCandidates).length === 0) {
    showError(name);
  }
  if (semVerCandidates.length > 0) {
    var module = semVerCandidates.sort(require.helper.semVerSort).pop().name;
    if (returnPath === true) {
      return module;
    }
    return require(module);
  }
  // if the build contains more than one branch of the same module
  // you should not use this funciton
  var module = otherCandidates.sort(function(a, b) {return a.name > b.name})[0].name;
  if (returnPath === true) {
    return module;
  }
  return require(module);
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Register module at `name` with callback `definition`.
 *
 * @param {String} name
 * @param {Function} definition
 * @api private
 */

require.register = function (name, definition) {
  require.modules[name] = {
    definition: definition
  };
};

/**
 * Define a module's exports immediately with `exports`.
 *
 * @param {String} name
 * @param {Generic} exports
 * @api private
 */

require.define = function (name, exports) {
  require.modules[name] = {
    exports: exports
  };
};
require.register("component~transform-property@0.0.1", function (exports, module) {

var styles = [
  'webkitTransform',
  'MozTransform',
  'msTransform',
  'OTransform',
  'transform'
];

var el = document.createElement('p');
var style;

for (var i = 0; i < styles.length; i++) {
  style = styles[i];
  if (null != el.style[style]) {
    module.exports = style;
    break;
  }
}

});

require.register("component~has-translate3d@0.0.3", function (exports, module) {

var prop = require('component~transform-property@0.0.1');

// IE <=8 doesn't have `getComputedStyle`
if (!prop || !window.getComputedStyle) {
  module.exports = false;

} else {
  var map = {
    webkitTransform: '-webkit-transform',
    OTransform: '-o-transform',
    msTransform: '-ms-transform',
    MozTransform: '-moz-transform',
    transform: 'transform'
  };

  // from: https://gist.github.com/lorenzopolidori/3794226
  var el = document.createElement('div');
  el.style[prop] = 'translate3d(1px,1px,1px)';
  document.body.insertBefore(el, null);
  var val = getComputedStyle(el).getPropertyValue(map[prop]);
  document.body.removeChild(el);
  module.exports = null != val && val.length && 'none' != val;
}

});

require.register("yields~has-transitions@1.0.0", function (exports, module) {
/**
 * Check if `el` or browser supports transitions.
 *
 * @param {Element} el
 * @return {Boolean}
 * @api public
 */

exports = module.exports = function(el){
  switch (arguments.length) {
    case 0: return bool;
    case 1: return bool
      ? transitions(el)
      : bool;
  }
};

/**
 * Check if the given `el` has transitions.
 *
 * @param {Element} el
 * @return {Boolean}
 * @api private
 */

function transitions(el, styl){
  if (el.transition) return true;
  styl = window.getComputedStyle(el);
  return !! parseFloat(styl.transitionDuration, 10);
}

/**
 * Style.
 */

var styl = document.body.style;

/**
 * Export support.
 */

var bool = 'transition' in styl
  || 'webkitTransition' in styl
  || 'MozTransition' in styl
  || 'msTransition' in styl;

});

require.register("component~event@0.1.4", function (exports, module) {
var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
    prefix = bind !== 'addEventListener' ? 'on' : '';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  el[bind](prefix + type, fn, capture || false);
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  el[unbind](prefix + type, fn, capture || false);
  return fn;
};
});

require.register("ecarter~css-emitter@0.0.1", function (exports, module) {
/**
 * Module Dependencies
 */

var events = require('component~event@0.1.4');

// CSS events

var watch = [
  'transitionend'
, 'webkitTransitionEnd'
, 'oTransitionEnd'
, 'MSTransitionEnd'
, 'animationend'
, 'webkitAnimationEnd'
, 'oAnimationEnd'
, 'MSAnimationEnd'
];

/**
 * Expose `CSSnext`
 */

module.exports = CssEmitter;

/**
 * Initialize a new `CssEmitter`
 *
 */

function CssEmitter(element){
  if (!(this instanceof CssEmitter)) return new CssEmitter(element);
  this.el = element;
}

/**
 * Bind CSS events.
 *
 * @api public
 */

CssEmitter.prototype.bind = function(fn){
  for (var i=0; i < watch.length; i++) {
    events.bind(this.el, watch[i], fn);
  }
  return this;
};

/**
 * Unbind CSS events
 * 
 * @api public
 */

CssEmitter.prototype.unbind = function(fn){
  for (var i=0; i < watch.length; i++) {
    events.unbind(this.el, watch[i], fn);
  }
  return this;
};

/**
 * Fire callback only once
 * 
 * @api public
 */

CssEmitter.prototype.once = function(fn){
  var self = this;
  function on(){
    self.unbind(on);
    fn.apply(self.el, arguments);
  }
  self.bind(on);
  return this;
};


});

require.register("component~once@0.0.1", function (exports, module) {

/**
 * Identifier.
 */

var n = 0;

/**
 * Global.
 */

var global = (function(){ return this })();

/**
 * Make `fn` callable only once.
 *
 * @param {Function} fn
 * @return {Function}
 * @api public
 */

module.exports = function(fn) {
  var id = n++;

  function once(){
    // no receiver
    if (this == global) {
      if (once.called) return;
      once.called = true;
      return fn.apply(this, arguments);
    }

    // receiver
    var key = '__called_' + id + '__';
    if (this[key]) return;
    this[key] = true;
    return fn.apply(this, arguments);
  }

  return once;
};

});

require.register("yields~after-transition@0.0.1", function (exports, module) {

/**
 * dependencies
 */

var has = require('yields~has-transitions@1.0.0')
  , emitter = require('ecarter~css-emitter@0.0.1')
  , once = require('component~once@0.0.1');

/**
 * Transition support.
 */

var supported = has();

/**
 * Export `after`
 */

module.exports = after;

/**
 * Invoke the given `fn` after transitions
 *
 * It will be invoked only if the browser
 * supports transitions __and__
 * the element has transitions
 * set in `.style` or css.
 *
 * @param {Element} el
 * @param {Function} fn
 * @return {Function} fn
 * @api public
 */

function after(el, fn){
  if (!supported || !has(el)) return fn();
  emitter(el).bind(fn);
  return fn;
};

/**
 * Same as `after()` only the function is invoked once.
 *
 * @param {Element} el
 * @param {Function} fn
 * @return {Function}
 * @api public
 */

after.once = function(el, fn){
  var callback = once(fn);
  after(el, fn = function(){
    emitter(el).unbind(fn);
    callback();
  });
};

});

require.register("component~emitter@1.2.0", function (exports, module) {

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks['$' + event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});

require.register("yields~css-ease@0.0.1", function (exports, module) {

/**
 * CSS Easing functions
 */

module.exports = {
    'in':                'ease-in'
  , 'out':               'ease-out'
  , 'in-out':            'ease-in-out'
  , 'snap':              'cubic-bezier(0,1,.5,1)'
  , 'linear':            'cubic-bezier(0.250, 0.250, 0.750, 0.750)'
  , 'ease-in-quad':      'cubic-bezier(0.550, 0.085, 0.680, 0.530)'
  , 'ease-in-cubic':     'cubic-bezier(0.550, 0.055, 0.675, 0.190)'
  , 'ease-in-quart':     'cubic-bezier(0.895, 0.030, 0.685, 0.220)'
  , 'ease-in-quint':     'cubic-bezier(0.755, 0.050, 0.855, 0.060)'
  , 'ease-in-sine':      'cubic-bezier(0.470, 0.000, 0.745, 0.715)'
  , 'ease-in-expo':      'cubic-bezier(0.950, 0.050, 0.795, 0.035)'
  , 'ease-in-circ':      'cubic-bezier(0.600, 0.040, 0.980, 0.335)'
  , 'ease-in-back':      'cubic-bezier(0.600, -0.280, 0.735, 0.045)'
  , 'ease-out-quad':     'cubic-bezier(0.250, 0.460, 0.450, 0.940)'
  , 'ease-out-cubic':    'cubic-bezier(0.215, 0.610, 0.355, 1.000)'
  , 'ease-out-quart':    'cubic-bezier(0.165, 0.840, 0.440, 1.000)'
  , 'ease-out-quint':    'cubic-bezier(0.230, 1.000, 0.320, 1.000)'
  , 'ease-out-sine':     'cubic-bezier(0.390, 0.575, 0.565, 1.000)'
  , 'ease-out-expo':     'cubic-bezier(0.190, 1.000, 0.220, 1.000)'
  , 'ease-out-circ':     'cubic-bezier(0.075, 0.820, 0.165, 1.000)'
  , 'ease-out-back':     'cubic-bezier(0.175, 0.885, 0.320, 1.275)'
  , 'ease-out-quad':     'cubic-bezier(0.455, 0.030, 0.515, 0.955)'
  , 'ease-out-cubic':    'cubic-bezier(0.645, 0.045, 0.355, 1.000)'
  , 'ease-in-out-quart': 'cubic-bezier(0.770, 0.000, 0.175, 1.000)'
  , 'ease-in-out-quint': 'cubic-bezier(0.860, 0.000, 0.070, 1.000)'
  , 'ease-in-out-sine':  'cubic-bezier(0.445, 0.050, 0.550, 0.950)'
  , 'ease-in-out-expo':  'cubic-bezier(1.000, 0.000, 0.000, 1.000)'
  , 'ease-in-out-circ':  'cubic-bezier(0.785, 0.135, 0.150, 0.860)'
  , 'ease-in-out-back':  'cubic-bezier(0.680, -0.550, 0.265, 1.550)'
};

});

require.register("component~query@0.0.3", function (exports, module) {
function one(selector, el) {
  return el.querySelector(selector);
}

exports = module.exports = function(selector, el){
  el = el || document;
  return one(selector, el);
};

exports.all = function(selector, el){
  el = el || document;
  return el.querySelectorAll(selector);
};

exports.engine = function(obj){
  if (!obj.one) throw new Error('.one callback required');
  if (!obj.all) throw new Error('.all callback required');
  one = obj.one;
  exports.all = obj.all;
  return exports;
};

});

require.register("move", function (exports, module) {
/**
 * Module Dependencies.
 */

var Emitter = require('component~emitter@1.2.0');
var query = require('component~query@0.0.3');
var after = require('yields~after-transition@0.0.1');
var has3d = require('component~has-translate3d@0.0.3');
var ease = require('yields~css-ease@0.0.1');

/**
 * CSS Translate
 */

var translate = has3d
  ? ['translate3d(', ', 0)']
  : ['translate(', ')'];

/**
 * Export `Move`
 */

module.exports = Move;

/**
 * Get computed style.
 */

var style = window.getComputedStyle
  || window.currentStyle;

/**
 * Library version.
 */

Move.version = '0.5.0';

/**
 * Export `ease`
 */

Move.ease = ease;

/**
 * Defaults.
 *
 *   `duration` - default duration of 500ms
 *
 */

Move.defaults = {
  duration: 0
};

/**
 * Default element selection utilized by `move(selector)`.
 *
 * Override to implement your own selection, for example
 * with jQuery one might write:
 *
 *     move.select = function(selector) {
 *       return jQuery(selector).get(0);
 *     };
 *
 * @param {Object|String} selector
 * @return {Element}
 * @api public
 */

Move.select = function(selector){
  if ('string' != typeof selector) return selector;
  return query(selector);
};

/**
 * Initialize a new `Move` with the given `el`.
 *
 * @param {Element} el
 * @api public
 */

function Move(el) {
  if (!(this instanceof Move)) return new Move(el);
  if ('string' == typeof el) el = query(el);
  if (!el) throw new TypeError('Move must be initialized with element or selector');
  this.el = el;
  this._props = {};
  this._rotate = 0;
  this._transitionProps = [];
  this._transforms = [];
  // this.duration(Move.defaults.duration)
};


/**
 * Inherit from `EventEmitter.prototype`.
 */

Emitter(Move.prototype);

/**
 * Buffer `transform`.
 *
 * @param {String} transform
 * @return {Move} for chaining
 * @api private
 */

Move.prototype.transform = function(transform){
  this._transforms.push(transform);
  return this;
};

/**
 * Skew `x` and `y`.
 *
 * @param {Number} x
 * @param {Number} y
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.skew = function(x, y){
  return this.transform('skew('
    + x + 'deg, '
    + (y || 0)
    + 'deg)');
};

/**
 * Skew x by `n`.
 *
 * @param {Number} n
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.skewX = function(n){
  return this.transform('skewX(' + n + 'deg)');
};

/**
 * Skew y by `n`.
 *
 * @param {Number} n
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.skewY = function(n){
  return this.transform('skewY(' + n + 'deg)');
};

/**
 * Translate `x` and `y` axis.
 *
 * @param {Number} x
 * @param {Number} y
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.translate =
Move.prototype.to = function(x, y){
  return this.transform(translate.join(''
    + x +'px, '
    + (y || 0)
    + 'px'));
};

/**
 * Translate on the x axis to `n`.
 *
 * @param {Number} n
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.translateX =
Move.prototype.x = function(n){
  return this.transform('translateX(' + n + 'px)');
};

/**
 * Translate on the y axis to `n`.
 *
 * @param {Number} n
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.translateY =
Move.prototype.y = function(n){
  return this.transform('translateY(' + n + 'px)');
};

/**
 * Scale the x and y axis by `x`, or
 * individually scale `x` and `y`.
 *
 * @param {Number} x
 * @param {Number} y
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.scale = function(x, y){
  return this.transform('scale('
    + x + ', '
    + (y || x)
    + ')');
};

/**
 * Scale x axis by `n`.
 *
 * @param {Number} n
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.scaleX = function(n){
  return this.transform('scaleX(' + n + ')')
};

/**
 * Apply a matrix transformation
 *
 * @param {Number} m11 A matrix coefficient
 * @param {Number} m12 A matrix coefficient
 * @param {Number} m21 A matrix coefficient
 * @param {Number} m22 A matrix coefficient
 * @param {Number} m31 A matrix coefficient
 * @param {Number} m32 A matrix coefficient
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.matrix = function(m11, m12, m21, m22, m31, m32){
  return this.transform('matrix(' + [m11,m12,m21,m22,m31,m32].join(',') + ')');
};

/**
 * Scale y axis by `n`.
 *
 * @param {Number} n
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.scaleY = function(n){
  return this.transform('scaleY(' + n + ')')
};

/**
 * Rotate `n` degrees.
 *
 * @param {Number} n
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.rotate = function(n){
  return this.transform('rotate(' + n + 'deg)');
};

/**
 * Set transition easing function to to `fn` string.
 *
 * When:
 *
 *   - null "ease" is used
 *   - "in" "ease-in" is used
 *   - "out" "ease-out" is used
 *   - "in-out" "ease-in-out" is used
 *
 * @param {String} fn
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.ease = function(fn){
  fn = ease[fn] || fn || 'ease';
  return this.setVendorProperty('transition-timing-function', fn);
};

/**
 * Set animation properties
 *
 * @param {String} name
 * @param {Object} props
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.animate = function(name, props){
  for (var i in props){
    if (props.hasOwnProperty(i)){
      this.setVendorProperty('animation-' + i, props[i])
    }
  }
  return this.setVendorProperty('animation-name', name);
}

/**
 * Set duration to `n`.
 *
 * @param {Number|String} n
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.duration = function(n){
  n = this._duration = 'string' == typeof n
    ? parseFloat(n) * 1000
    : n;
  return this.setVendorProperty('transition-duration', n + 'ms');
};

/**
 * Delay the animation by `n`.
 *
 * @param {Number|String} n
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.delay = function(n){
  n = 'string' == typeof n
    ? parseFloat(n) * 1000
    : n;
  return this.setVendorProperty('transition-delay', n + 'ms');
};

/**
 * Set `prop` to `val`, deferred until `.end()` is invoked.
 *
 * @param {String} prop
 * @param {String} val
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.setProperty = function(prop, val){
  this._props[prop] = val;
  return this;
};

/**
 * Set a vendor prefixed `prop` with the given `val`.
 *
 * @param {String} prop
 * @param {String} val
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.setVendorProperty = function(prop, val){
  this.setProperty('-webkit-' + prop, val);
  this.setProperty('-moz-' + prop, val);
  this.setProperty('-ms-' + prop, val);
  this.setProperty('-o-' + prop, val);
  return this;
};

/**
 * Set `prop` to `value`, deferred until `.end()` is invoked
 * and adds the property to the list of transition props.
 *
 * @param {String} prop
 * @param {String} val
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.set = function(prop, val){
  this.transition(prop);
  this._props[prop] = val;
  return this;
};

/**
 * Increment `prop` by `val`, deferred until `.end()` is invoked
 * and adds the property to the list of transition props.
 *
 * @param {String} prop
 * @param {Number} val
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.add = function(prop, val){

  if (!style) return;
  var self = this;
  return this.on('start', function(){
    var curr = parseInt(self.current(prop), 10);
    self.set(prop, curr + val + 'px');
  });
};

/**
 * Decrement `prop` by `val`, deferred until `.end()` is invoked
 * and adds the property to the list of transition props.
 *
 * @param {String} prop
 * @param {Number} val
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.sub = function(prop, val){
  if (!style) return;
  var self = this;
  return this.on('start', function(){
    var curr = parseInt(self.current(prop), 10);
    self.set(prop, curr - val + 'px');
  });
};

/**
 * Get computed or "current" value of `prop`.
 *
 * @param {String} prop
 * @return {String}
 * @api public
 */

Move.prototype.current = function(prop){
  return style(this.el).getPropertyValue(prop);
};

/**
 * Add `prop` to the list of internal transition properties.
 *
 * @param {String} prop
 * @return {Move} for chaining
 * @api private
 */

Move.prototype.transition = function(prop){
  if (!this._transitionProps.indexOf(prop)) return this;
  this._transitionProps.push(prop);
  return this;
};

/**
 * Commit style properties, aka apply them to `el.style`.
 *
 * @return {Move} for chaining
 * @see Move#end()
 * @api private
 */

Move.prototype.applyProperties = function(){
  for (var prop in this._props) {
    this.el.style.setProperty(prop, this._props[prop], '');
  }
  return this;
};

/**
 * Re-select element via `selector`, replacing
 * the current element.
 *
 * @param {String} selector
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.move =
Move.prototype.select = function(selector){
  this.el = Move.select(selector);
  return this;
};

/**
 * Defer the given `fn` until the animation
 * is complete. `fn` may be one of the following:
 *
 *   - a function to invoke
 *   - an instanceof `Move` to call `.end()`
 *   - nothing, to return a clone of this `Move` instance for chaining
 *
 * @param {Function|Move} fn
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.then = function(fn){
  // invoke .end()
  if (fn instanceof Move) {
    this.on('end', function(){
      fn.end();
    });
  // callback
  } else if ('function' == typeof fn) {
    this.on('end', fn);
  // chain
  } else {
    var clone = new Move(this.el);
    clone._transforms = this._transforms.slice(0);
    this.then(clone);
    clone.parent = this;
    return clone;
  }

  return this;
};

/**
 * Pop the move context.
 *
 * @return {Move} parent Move
 * @api public
 */

Move.prototype.pop = function(){
  return this.parent;
};

/**
 * Reset duration.
 *
 * @return {Move}
 * @api public
 */

Move.prototype.reset = function(){
  this.el.style.webkitTransitionDuration =
  this.el.style.mozTransitionDuration =
  this.el.style.msTransitionDuration =
  this.el.style.oTransitionDuration = '';
  return this;
};

/**
 * Start animation, optionally calling `fn` when complete.
 *
 * @param {Function} fn
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.end = function(fn){
  var self = this;

  // emit "start" event
  this.emit('start');

  // transforms
  if (this._transforms.length) {
    this.setVendorProperty('transform', this._transforms.join(' '));
  }

  // transition properties


  this.setVendorProperty('transition-properties', this._transitionProps.join(', '));
  this.applyProperties();


  // callback given
  if (fn) this.then(fn);

  // emit "end" when complete
  after.once(this.el, function(){
    self.reset();
    self.emit('end');
  });

  return this;
};

});

if (typeof exports == "object") {
  module.exports = require("move");
} else if (typeof define == "function" && define.amd) {
  define("move", [], function(){ return require("move"); });
} else {
  (this || window)["move"] = require("move");
}
})()
///<jscompress sourcefile="jfilter.js" />
 Vue.filter("replace", {
    read : function(value, args) {
        console.log(value, args) ;
    },
    write : function(value) {
        return value ;
    }
})
Vue.filter("date", {
	read : function(value, args) {
		return new Date(value).format(args) ; ;
	},
	write : function(value) {
		return value ;
	}
}) ;


Vue.filter("zh-cn-number", {
  read : function(value, args) {
    return new String(value).toString().zh_cn_number() ;
  },
  write : function(value) {
    return value ;
  }
}) ;

Vue.filter("diff", {
  read : function(value, args) {
    return new Date(value).diff(args) ; ;
  },
  write : function(value) {
    return value ;
  }
}) ;

// 增加数组累加组件
Vue.filter("int", {
	read : function(value) {
		return value ;
	},
	write : function(value) {
		if(value != parseInt(value)) {
			return 1 ;
		} else {
			return parseInt(value) ;	
		}
	}
}) ;

Vue.filter("money", {
  // model -> view
  // 在更新 `<input>` 元素之前格式化值
  read: function(val) {
    if(val) {
      return val.toFixed(2) ;  
    } else {
      return val ;
    }
    
  },
  // view -> model
  // 在写回数据之前格式化值
  write: function(val) {
    var number = + val.replace(/[^\d.]/g, '') ;
    return isNaN(number) ? 0 : parseFloat(number.toFixed(2))
  }
}) ;
///<jscompress sourcefile="jcomponent.js" />



define(function(require, exports, module) {
	function _m_load_js(js) {
		return new Promise(function(next) {
			seajs.use([js], next) ;
		}) ;
	}
    _m_load_js("jtemplate").then(function(tpls) {
	    ; (function() {
		    $.fn.$click = function(onclick) {
		        return this.each(function() {
		            this.$onclick = onclick ;
		        }) ;
		    }
		    function m_func(method, args, object, event) {
		        return new Promise(function(next, fail) {
		            if($.isFunction(method)) {
		                var _v = method.call(object, args, event) ;
		                if(_v && _v.then) {
		                    _v.then(function() {
		                        next(_v) ;
		                    }).catch(fail) ;
		                } else {
		                    next(_v) ;
		                }
		            } else {
		                next() ;
		            }
		        }) ;
		    }
		    window.m_func = m_func ;
		    // 组件功能： 自动填充界面状态
		    function JSimpleVM(tpl, opts) {
		        var _tpl = tpl ;
		        var _view = _tpl.view ;
		        var _defs = {
		            el : "." + _tpl.m_class_name(),
		            data : {
		                renders : {
		                    
		                }
		            },
		            methods : {
		                
		            },
		            computed : {

		            }
		        } ;
		        var _settings = $.extend(_defs, opts) ;
		        $.extend(_settings.computed, {
		            "$model" : {
		            	get : function() {
		            		if(Object.keys(this.renders).length) {
			                    return this.renders.default.model ;
			                }
		            	},
		            	set : function(v) {
		            		this.renders.default.model = v ;
		            		return v ;
		            	}
		            }
		        }) ;
		        $.extend(_settings.data, {
		        	app : app,
		            other : {
		                user : app.data.user
		            },
		            // model : {},
		            util : {
		                m_link : function(link) {
		                	if(link) {
			                    var _pos = link.indexOf("#") ;
			                    if(-1 === _pos) {
			                        window.open(link, "_blank") ;
			                    } else {
			                        var _str = link.substring(_pos) ;
			                        var _v = Path.match(_str) ;
			                        if(_v) { // 匹配成功
			                            window.location.href = link ;
			                        } else {
			                            window.open(link, "_blank") ;
			                        }
			                    }
		                    }
		                }
		            }
		        }) ;
		        
		        $.extend(_settings.methods, {
		            m_get_model : function(name) {
		                if(_vm.renders && _vm.renders[name] && _vm.renders[name].model) {
		                    return JSON.parse(JSON.stringify(_vm.renders[name].model)) ;
		                } else if(this.model) {
		                    return JSON.parse(JSON.stringify(this.model)) ;
		                } else {
		                	return null ;
		                }
		            },
		            m_refresh : function() {
		                if($.isFunction(_vm.m_draws)) {
		                    return _vm.m_draws() ;     
		                } else {
		                    return new Promise(function(next) {
		                        next() ;
		                    }) ;
		                }
		            },
		            m_refresh_end : function() {
		                if($.isFunction(this.onrefresh_end)) {
		                    this.onrefresh_end() ;
		                }
		            }
		        }) ;
		        
		        if(_settings.data.form) {
		            _settings.data.form = $.extend(_settings.data.form, {
		                m_submit : function(event) { // 提交表单
		                    var _form = _vm.form ;
		                    _vm.form.m_validate_all(function(v, msg) {
		                        if(v) { // 验证成功
		                            this.m_trigger("submit.before").then(function() { // 表单提交之前
		                                m_func(_form.onsubmit, _vm.m_get_model("default"), _vm, event).then(function() {

		                                }) ;
		                            }) ;
		                        } else { // 验证失败
		                            if(_form.errors.length) {
		                                app.modal.m_alert("提示", _form.errors[0]) ;
		                            }
		                            m_func(_form.oninvalid, _form.errors, _vm, event).then(function() { // 表单无效

		                            }) ;
		                        }
		                    }) ;
		                }
		            }) ;
		        } else {
		            _settings.data.form = {} ;
		        }
		        $.extend(_settings.data, {
		            other : {
		                base : __base,
		                user : app.data.user
		            }
		        }) ;
		        _view.m_on("leave.back, exit", function() {
		            _vm.$broadcast("reset") ;
		        }) ;
		         _view.m_on("leave", function() {
		            _vm.$broadcast("leave") ;
		        }) ;
		        _view.m_on("frozen", function() {
		            _vm.$broadcast("frozen") ;
		        }) ;
		        _view.m_on("leave", function() {
		            _vm.$broadcast("leave") ;
		        }) ;
		        _view.m_on("request.error", function(ev, ds) {
		            if(500 == ds.status && ds.info) {
		                app.toast.m_show_text(ds.info) ;    
		            }
		        }) ;
		        _view.m_on("request.timeout", function(ev, ds) {
		            app.toast.m_show_text("请求超时,请重试") ;
		        }) ;
		        var _vm = new Vue(_settings) ;
		        return _vm ;
		    }
		    window.JSimpleVM = JSimpleVM ;
		})() ;
		function JLoader(e_container, opts) {
		    var _e = null ;
		    var _e_mask = null ;
		    var _e_box = null ;
		    var _tm = null ;
		    function _m_add() {
		        var _e = _m_create() ;
		        _e.appendTo(e_container) ;
		        return _e ;
		    }
		    function _m_create() {
		        return $(tpls.loader) ;
		    }

		    function _m_show() {
		    	_e.addClass("on") ;
		        _e_box.addClass("on") ;
		    }
		    this.m_show = function(sleep) {
		    	clearTimeout(_tm) ;
		    	if(sleep) { // 存在
		    		_tm = setTimeout(function() {
		    			_m_show() ;
		    		}, sleep) ;
		    	} else {
		    		_m_show() ;
		    	}
		    }
		    this.m_hide = function() {
		    	clearTimeout(_tm) ;
		        _e_box.removeClass("on") ;
		        _tm = setTimeout(function() {
		            _e.removeClass("on") ;    
		        }, _e_box.m_css3_duration()) ;
		    }
		    function _m_init() {
		        _e = _m_add() ;
		        _e_mask = _e.find(".mask") ;
		        _e_box = _e.find(".box") ;
		    }
		    _m_init() ; // 初始化
		}

		function JToastSuper(e_container) {
		    this.m_show_text = function(text, icon) {
		        return new JToast(e_container).m_show_text(text, icon) ;
		    }
		    this.m_show_ok = function(text) {
		        return new JToast(e_container).m_show_ok(text) ;
		    }
		    this.m_show_no = function(text) {
		        return new JToast(e_container).m_show_no(text) ;
		    }
		    this.m_show_warn = function(text) {
		        return new JToast(e_container).m_show_warn(text) ;
		    }
		}

		function JModalSuper(e_container) {
			var _modal_super = this ;
			this.status = null ;

		    this.m_alert = function(title, content, onok, oktext) {
		    	if("alert" != this.status) {
		    		this.status = "alert" ;
		    		this.modal = new JModal(e_container).m_alert(title, content, onok, oktext) ;
		    		this.modal.onhide_before = function() {
		    			_modal_super.status = null ;
		    		}
		    		return this.modal ;
		    	}
		    }
		    this.m_confirm = function(title, content, onok, onno, oktext, notext) {
		    	if("confirm" != this.status) {
		    		this.status = "confirm" ;
		    		this.modal = new JModal(e_container).m_confirm(title, content, onok, onno, oktext, notext) ;	
		    		this.modal.onhide_before = function() {
		    			_modal_super.status = null ;
		    		}
		    		return this.modal ;
		    	}
		    }
		    this.m_editor = function(title, type, value, place, onok, onno, oktext, notext) { // 编辑器
		    	if("editor" != this.status) {
		    		this.status = "editor" ;
		    		this.modal = new JModal(e_container).m_editor(title, type, value, place, onok, onno, oktext, notext) ;	
		    		this.modal.onhide_before = function() {
		    			_modal_super.status = null ;
		    		}
		    		return this.modal ;
		    	}
		    }
		}
		function JToast(e_container) { // toast 效果
		    var _e = null ;
		    var _e_box = null ;
		    var _e_mask = null ;
		    var _toast = this ;
		    var _e_i = null ;
		    var _e_text = null ;
		    var _tm = null ;
		    function _m_add() {
		        var _e = _m_create() ;
		        _e.appendTo(e_container) ;
		        return _e ;
		    }
		    function _m_create() {
		        return $(tpls.toast) ;
		    }
		    
		    this.m_hide = function() {
		        _e.removeClass("on") ;
		        if($.isFunction(this.onhide)) {
		            this.onhide() ;
		        }
		        _e.remove() ;
		        this.onhide = function() {

		        }
		    }
		    
		    this.onhide = function() {

		    }

		    this.m_show_text = function(text, icon) {
		        _e.addClass("on") ;
		        _e_mask.hide() ;
		        _e.addClass("mini") ;
		        _e_i.addClass(icon) ;
		        _e_text.text(text) ;
		        _tm = setTimeout(function() {
		            _toast.m_hide() ;
		        }, 2000) ;
		        return this ;
		    }
		    
		    function _m_show_media(text) {
		        clearTimeout(_tm) ;
		        _e.addClass("on") ;
		        _e_mask.hide() ;
		        _e.addClass("media") ;
		        _e_text.text(text) ;
		        _tm = setTimeout(function() {
		            _toast.m_hide() ;
		        }, 2000) ;
		    }

		    this.m_show_ok = function(text) {
		        _m_show_media(text) ;
		        _e_i.addClass("ok") ;
		    }

		    this.m_show_no = function(text) {
		        _m_show_media(text) ;
		        _e_i.addClass("no") ;
		    }

		    this.m_show_warn = function(text) {
		        _m_show_media(text) ;
		        _e_i.addClass("warn") ;
		    }

		    function _m_init() {
		        _e = _m_add() ;
		        _e_mask = _e.find(".mask") ;
		        _e_box = _e.find(".box") ;
		        _e_i = _e.find("i") ;
		        _e_text = _e.find("small") ;

		    }
		    _m_init() ;
		}
		window.JToast = JToast ;

		function JModal(e_container) {
		    var _e = null ;
		    var _e_mask = null ;
		    var _e_box = null ;
		    var _e_buttons = null ;
		    var _e_title = null ;
		    var _e_content = null ;
		    var _modal = this ;
		    function _m_create() { // 创建
		        return $(tpls.modal) ;
		    }

		    function _m_create_button() {
		        return $('<a click = "yes" class = "button"></a>') ;
		    }

		    function _m_add_button(onclick) {
		        var _e = _m_create_button() ;
		        _e.appendTo(_e_buttons) ;
		        _e[0].$onclick = function() {
		            _modal.m_hide() ;
		             if($.isFunction(onclick)) {
		                onclick() ;
		             }
		        }
		        return _e ;
		    }

		    this.m_alert = function(title, content, onok, oktext) {
		    	_status = 1 ;
		        _e.addClass("on") ;
		        _e_title.text(title) ;
		        _e_content.text(content) ;
		        var _e_button = _m_add_button(onok) ;
		        _e_button.text(oktext ? oktext : "确定") ;
		        _e_button.addClass("bold") ;
		        setTimeout(function() {
		            _e_mask.addClass("on") ;
		            _e_box.addClass("on") ;
		        }, 60) ;
		        return this ;
		    }


		    function _m_create_input(type) {
		        return $("<input />") ;
		    }
		    
		    this.m_editor = function(title, type, value, place, onok, onno, oktext, notext) {
		        _e.addClass("on") ;
		        _e_title.text(title) ;
		        var _e_input = _m_create_input() ;
		        _e_input.attr("type", type).val(value).attr("placeholder", place) ;
		        _e_input.appendTo(_e_content) ;
		        var _e_button_no = _m_add_button(onno) ;
		        var _e_button_ok = _m_add_button(function() {
		            if($.isFunction(onok)) {
		                onok(_e_input.val()) ;    
		            }
		        }) ;
		        _e_button_ok.text(oktext ? oktext : "确定") ;
		        _e_button_no.text(notext ? notext : "取消") ;
		        _e_button_ok.addClass("bold") ;
		        setTimeout(function() {
		            _e_mask.addClass("on") ;
		            _e_box.addClass("on") ;
		        }, 60) ;
		        return this ;
		    }

		    this.m_confirm = function(title, content, onok, onno, oktext, notext) {
	       		_e.addClass("on") ;
		        _e_title.text(title) ;
		        _e_content.text(content) ;
		        var _e_button_no = _m_add_button(onno) ;
		        var _e_button_ok = _m_add_button(onok) ;
		        _e_button_ok.text(oktext ? oktext : "确定") ;
		        _e_button_no.text(notext ? notext : "取消") ;
		        _e_button_ok.addClass("bold") ;
		        setTimeout(function() {
		            _e_mask.addClass("on") ;
		            _e_box.addClass("on") ;
		        }, 60) ;
		        return this ;
		    }

		    this.m_hide = function() {
		        _e_mask.removeClass("on").addClass("off") ;
		        _e_box.removeClass("on").addClass("off") ;
		        var _self = this ;

		    	if($.isFunction(this.onhide_before)) {
		        	this.onhide_before() ;
		        }
		        setTimeout(function() {
		            _e.removeClass("on") ;
		            _e.remove() ;
		            if($.isFunction(_self.onhide_after)) {
			        	_self.onhide_after() ;
			        }
		        }, _e_box.m_css3_duration()) ;
		        return this ;
		    }

		    function _m_add() { // 添加
		        var _e = _m_create() ;
		        _e.appendTo(e_container) ;
		        return _e ;
		    }

		    function _m_init() {
		        _e = _m_add() ;
		        _e_title = _e.find(".title") ;
		        _e_content = _e.find(".content") ;
		        _e_mask = _e.find(".mask") ;
		        _e_box = _e.find(".box") ;
		        _e_buttons = _e.find(".buttons") ;
		    }

		    _m_init() ;
		}
		window.JModal = JModal ;

		function JComponents() {
			var _jvc = null ;
			this.m_simple_transition = function(name) {
				Vue.transition(name, {
					enterClass : name + "-enter",
					leaveClass : name + "-leave",
					enter : function(el) {
						try {
							if(el) {
								var _duration = $(el).m_css3_duration() ;
				            	if(!_jvc.curr_view.stoages.ANIMATE_DURATION) {
				            		_jvc.curr_view.stoages.ANIMATE_DURATION = 0 ;
				            	}
				            	_jvc.curr_view.stoages.ANIMATE_DURATION += _duration ;	
							}
						} catch(e) {
							
						}
		               
		            }
				}) ;
			}
		    this.m_init = function(jvc) {
		    	window.$$ = function(selector) {
		    		return jvc.curr_view.m_get_ele().find(selector) ;
		    	}
		    	_jvc = jvc ;
		    	_jvc.jcomponents = this ;

		    	this.m_simple_transition("bounce") ;
		    	this.m_simple_transition("fade") ;
		    	this.m_simple_transition("fadein") ;

		    	

		        Vue.component("v-options", Vue.extend({
		        	props : {
		        		name : {
		        			type : String,
		        			default : "options"
		        		},
		        		title : {
		        			type : String,
		        			default : null
		        		}
		        	},
		        	template : tpls.options,
		        	data : function() {
		        		return {
		        			actionsheet : {}
		        		}
		        	},
		        	ready : function() {
		        		this.$root.$set(this.name, this) ;
		        	},
		        	methods : {
		        		m_show : function() {
		        			this.actionsheet.m_show() ;
		        		},
		        		m_hide : function() {
		        			this.actionsheet.m_hide() ;
		        		}
		        	}
		        })) ;

		        Vue.component("v-text-scroll", Vue.extend({
		        	props : {
		        		text : {
		        			type : String,
		        			default : "请输入需要滚动的文字..."
		        		},
		        		icon : {
		        			type : String,
		        			default : ""
		        		},
		        		sleep : {
		        			type : String,
		        			default : 0
		        		}
		        	},
		        	template : tpls.text_scroll,
		        	ready : function() {
		        		var _self = this ;
		        		var _el = this.$el ;
		        		this.status = 0 ;
		        		this.e_em = $(_el).find("em") ;
		        		this.e_i = $(_el).find("i") ;
		        		this.iw = 0 ;
		        		this.w = $(_el).width() ;
		        		this.mw = this.w ;
		        		if(this.e_i.length) {
		        			this.iw = this.e_i.width() ;
		        			this.mw -= this.iw ;
		        		}
		        		this.l = 0 ;
		        		if(this.sleep) {
		        			setTimeout(function() {
		        				_self.m_ready() ;
		        			}, this.sleep) ;
		        		} else {
		        			this.m_ready() ;	
		        		}
		        	},
		        	methods : {
		        		m_ready : function() {
		        			var _self = this ;
		        			_self.isactive = true ;
		        			jvc.curr_view.m_on("frozen", function() {
		        				_self.m_stop() ;
		        				_self.isactive = false ;
			                }) ;
			                jvc.curr_view.m_on("enter", function() {
			                	_self.isactive = true ;
			                    _self.m_start() ;
			                }) ;
			                this.m_start() ;
		        		},
		        		m_start : function() { // 开始
		        			if(0 === this.status && true == this.isactive) {
		        				this.status = 1 ;
			        			var _self = this ;
			        			; (function m_loop(){
								  	_self.anim = requestAnimationFrame(m_loop) ;
								  	_self.l -- ;
			        				if(_self.l <= - (_self.e_em.width())) {
			        					_self.l = _self.mw ;
			        				}
			        				_self.e_em.css({
			        					"left" : _self.l + "px"
			        				}) ;
								})() ;
							}
		        		},
		        		m_stop : function() { // 停止
		        			if(1 === this.status && true == this.isactive) {
		        				this.status = 0 ;
		        				cancelAnimationFrame(this.anim) ;
		        			}
		        		}
		        	},
		        	events : {
		            	"downpull" : function() {
		            		clearTimeout(this.tm) ;
		            		this.m_stop() ;
		            		return true ;
		            	},
		            	"touch.move" : function() {
		            		clearTimeout(this.tm) ;
		            		this.m_stop() ;
		            		return true ;
		            	},
		            	"touch.end" : function() {
		            		var _self = this ;
		            		this.tm = setTimeout(function() {
		            			_self.m_start() ;
		            		}, 600) ;
		            	}
		            }
		        })) ;
				
		        Vue.component("v-heat-scroll", Vue.extend({ // 头条轮播
		            props : {
		                sleep : {
		                    type : Number,
		                    default : 300
		                },
		                title : {
		            		type : String,
		            		default : "头条"
		            	}
		            },
		            template : tpls.heat_scroll,
		            data : function() {
		                return {status : null} ;
		            },
		            ready : function() {
		                var _self = this ;
		                this.e_list = $(this.$el).find(".list") ;
		                this.e_list_wrap = this.e_list.find(".wrap") ;
		                this.e_buttons = this.e_list.find(".button") ;
		                var _e_first_button = this.e_buttons.first() ;
		                var _e_first_next_button =  _e_first_button.next() ;
		                _e_first_button.clone().appendTo(this.e_list_wrap) ;
		                _e_first_next_button.clone().appendTo(this.e_list_wrap) ;
		                this.counter = this.e_buttons.length ;
		                this.index = 0 ;
		                this.m_start() ;
		                jvc.curr_view.m_on("frozen", function() {
		                    _self.m_stop() ;
		                }) ;
		                jvc.curr_view.m_on("enter", function() {
		                    _self.m_start() ;
		                }) ;
		            },
		            methods : {
		                m_reset_y : function() {
		                    this.e_list_wrap.m_y(0, 0) ;
		                    this.index = 0 ;
		                },
		                m_move_y_to : function(index) {
		                    var _self = this ;
		                    var _y = (this.index * 1.5 * 2) ;
		                    this.e_list_wrap.m_y(-_y + "rem", this.sleep) ;
		                },
		                m_start : function() {
		                    clearInterval(this.ir) ;
		                    var _self = this ;
		                    this.ir = setInterval(function() {
	                            _self.index ++ ;
	                            _self.m_move_y_to(_self.index) ;
	                            setTimeout(function() {
	                                if(_self.index === _self.counter - 3) {
	                                    _self.m_reset_y() ;
	                                }
	                            }, _self.sleep) ;
		                    }, 3000) ;
		                },
		                m_stop : function() {
		                	clearInterval(this.ir) ;
		                }
		            },
		            events : {
		            	"downpull" : function() {
		            		this.m_stop() ;
		            		return true ;
		            	},
		            	"downpull.reset" : function() {
		            		this.m_start() ;
		            		return true ;
		            	}
		            }
		        })) ;
		        Vue.component("v-swiper", Vue.extend({
		            props : {
		                name : {
		                    type : String,
		                    default : "swiper"
		                },
		                effect : {
		                	type : String,
		                	default : "slide"
		                },
		                pagination : {
		                    type : Boolean,
		                    default : false
		                },
		                autoplay : {
		                    type : Number,
		                    default : 1000
		                },
		                loop : {
		                    type : Boolean,
		                    default : false
		                },
		                lazy : {
		                	type : Boolean,
		                	default : false
		                }
		            },
		            template : tpls.swiper,
		            methods : {
		                m_update : function() {
		                    // this.swiper.slideTo(0, 0) ;
		                    this.$nextTick(function() {
		                        // this.swiper.update() ;
		                    }) ;
		                },
		                m_stop_autoplay : function() {
		                    this.swiper.stopAutoplay() ;
		                },
		                m_start_autoplay : function() {
		                    this.swiper.startAutoplay() ;
		                },
		                m_get_index : function() {
		                    return this.swiper.activeIndex ;
		                }
		            },
		            ready : function() {
		                var _self = this ;
		                var _loop = this.loop ;
		                var _pagination = this.pagination ;
		                this.$root.$set(this.name, this) ;
		                this.e_wrapper = $(this.$el).find(".swiper-wrapper") ;
		                this.e_container = $(this.$el).find(".swiper-container") ;
		                this.e_slides = this.e_wrapper.find(".swiper-slide") ;
		                if(true === _loop && 1 == this.e_slides.length) {
		                    _loop = false ;
		                }
		                var _settings = {
		                    // observer : true,
		                    // observeParents : true,
		                    effect : this.effect,
		                    lazyLoading : this.lazy,
		                    loop : _loop,
		                    resistanceRatio : 0,
		                    autoplay : this.autoplay
		                }
		                if(true === _pagination && 1 < this.e_slides.length) {
		                    _settings.pagination = ".swiper-pagination" ;
		                } 
		                this.swiper = new Swiper(this.e_container, _settings) ;
		                this.$el.m_is_beging = function() {
		                    return _self.swiper.isBeginning ;
		                }
		                this.$el.m_lock = function() {
		                    _self.swiper.lockSwipes() ;
		                }
		                this.$el.m_unlock = function() {
		                    _self.swiper.unlockSwipes() ;
		                }

		                jvc.curr_view.m_on("frozen", function() {
		                    _self.m_stop_autoplay() ;
		                }) ;
		                jvc.curr_view.m_on("enter", function() {
		                    _self.m_start_autoplay() ;
		                }) ;

		                var _curr_tpl = jvc.curr_view.jtc.curr_tpl ;
		                if(!_curr_tpl.swipers) {
		                    _curr_tpl.swipers = {} ;
		                }
		                _curr_tpl.swipers[this.name] = this ;
		            },
		            events : {
		            	"downpull" : function() {
		            		this.m_stop_autoplay() ;
		            		return true ;
		            	},
		            	"downpull.reset" : function() {
		            		this.m_start_autoplay() ;
		            		return true ;
		            	}
		            }
		        })) ;

				Vue.component("v-hljs", Vue.extend({
					template : tpls.hljs,
					symbol : {
						type : String,
						default : "html"
					},
					ready : function() { // 组件初始化完成
						var _e_code = $(this.$el).find("code") ;
						var _html = _e_code.html() ;
						_e_code.html(_html) ;
						seajs.use(["highlight.css", "highlight.js"], function() {
							hljs.highlightBlock(_e_code.get(0)) ;
						}) ;
					}
				})) ;
				
		        Vue.component("v-scroll", Vue.extend({
		            props : {
		                name : {
		                    type : String,
		                    default : "default"
		                },
		                downpullbg : {
		                    type : String,
		                    default : ""
		                },
		                child : {
		                    type : Boolean,
		                    default : false
		                },
		                hrlock : {
		                    type : Boolean,
		                    default : false
		                },
		                maxheight : {
		                    type : String,
		                    default : "auto"
		                },
		                vrlock : {
		                    type : Boolean,
		                    default : false
		                }
		            },
		            data : function() {
		                return {y : 0}
		            },
		            watch : {
		                "y" : function(y) {
		                    
		                }
		            },
		            methods : {
		            	ondownpull : function() {
		                    return this.m_promise(function(next) {
		                        next() ;
		                    }) ;
		                },
		                ondownpull_end :  function() {
		                     return this.m_promise(function(next) {
		                        next() ;
		                    }) ;
		                },
		                __m_reset_downpull : function() { // 重置下拉
		                	var _self = this ;
		                    this.status = 1 ;
		                    return this.m_promise(function(next) {
		                        $(this.e_box).m_y(0, 300, function() {
		                            $(this.el).m_css3_clear_transform() ;
		                            setTimeout(function() {
		                            	_self.y = 0 ;
		                                _self.status = 0 ;
		                                next() ;
		                            }, 60) ;
		                        }) ;
		                    }) ;
		                },
		                m_reset_downpull : function(istrigger) { // 重置下拉
		                	var _self = this ;
		                    return this.m_promise(function(next) {
		                    	_self.m_trigger("downpull.reset.before", istrigger).then(function() {
		                    		return _self.__m_reset_downpull() ;
		                    	}).then(function() {
		                        	_self.$broadcast("downpull.reset") ;
		                            _self.m_trigger("downpull.reset", istrigger).then(next) ;
		                            _self.y = 0 ;
		                        }) ;
		                    }) ;
		                },
		                m_native_downpull : function(onend) { // 下拉效果
		                	var _self = this ;
		                	this.y = this.target_y ;
		                    this.status = 1 ;
		                    return this.m_promise(function(next) {
		                        $(this.e_box).m_y(this.target_y + "px", 300, function() {
		                        	_self.m_trigger("native.downpull.end").then(function() {
		                        		if($.isFunction(onend)) {
			                                onend.call(_self).then(function() {
			                                    _self.m_reset_downpull(true).then(function() {
			                                        if($.isFunction(onreset)) {
			                                            onreset() ;
			                                        }
			                                    }) ;
			                                }) ;
			                            } else { // 判断是否被监听
			                                _self.m_reset_downpull(false).then(function() {
			                                    if($.isFunction(onreset)) {
			                                        onreset.call(_self) ;
			                                    }
			                                }) ;
			                            }
		                        	}) ;
		                        }) ;
		                    }) ;
		                },
		                m_touch_downpull : function() { // 触摸下拉
		                    return this.m_native_downpull(function() {
		                        return this.m_promise(function(next) {
		                            this.m_trigger("touch.downpull.end").then(next) ;
		                        }) ;
		                    }) ;
		                },
		                m_vr_flexible : function(v) { // 垂直灵活的
		                    var _scroll_top = this.$el.m_get_scroll_top() ;
		                    if(1 === this.status || false === this.is_valid) return false ;
		                    if("vr" == v.action) {
		                        if(this.down_scroll_top_zero) {
		                            if((0 === _scroll_top && 1 === v.action_y || (0 === _scroll_top && this.y >= 0 && 0 == v.action_y))) {
		                                this.y = v.diff_y ;
		                                this.y *= 0.45 ;
		                                this.y = this.y <= 0 ? 0 : this.y ;
		                                // $(this.e_box).m_css3_translate3d(0, this.y + "px", 0) ;
		                                $(this.e_box).m_y(this.y + "px") ;
		                            }
		                        } else {
		                            if(_scroll_top < 0) {
		                            	// 停止文字轮播
		                                this.y = Math.abs(_scroll_top) ;
		                            }
		                        }
		                        // vr 拉动
		                        var _v = this.y / this.target_y ;
		                        _v = _v >= 1 ? 1 : _v ;
		                        // if(this.e_downpull_bg.length) {
		                        //     this.e_downpull_bg.m_scale(1 + _v * 0.25) ;
		                        // }
		                        if(this.y) {
		                        	this.$broadcast("downpull", _v) ;
		                        	this.m_trigger("downpull", _v) ;
		                        }
		                    }
		                },
		              	m_get_scroll_top : function() {
		                    return this.e_box.prop("scrollTop") ;
		                },
		                m_get_y : function() {
		                	return this.y ;
		                },
		                m_get_scroll_height : function() {
		                    return this.e_box.prop("scrollHeight") ;
		                },
		                m_get_height : function() {
		                    return this.e_box.height() ;
		                },
		                m_get_record_scroll_top : function() {
		                	return this.record_scroll_top ;
		                }
		            },
		            init : function() {
		                JPromise.apply(this) ;
		                JEvents.apply(this) ;
		                if(!this.$root.$get("scrolls")) {
		                	this.$root.$set("scrolls", {}) ;
		                }
		            },
		            ready : function() {
		                var _scroll = this ;
		                var _el = this.$el ;
		                JEvents.apply(_el) ;
		                this.is_valid = false ;
		                this.status = 0 ;
		                this.curr_view = jvc.curr_view ;
		                this.curr_tpl = this.curr_view.jtc.curr_tpl ;
		                var _name = "scrolls." + this.name ;
		                var _v = this.$root.$get(_name) ;
		                if(!_v) {
		                	_v = {} ;
		                }
		                this.$root.$set(_name, $.extend(_v, this)) ;
		                this.curr_tpl.scrolls[this.name] = _scroll ;
		                // $.extend(, this) ;
		                this.e_box = $(_el).children(".box").eq(0) ;
		                this.e_wrap =  this.e_box.children(".wrap").eq(0) ;
		                var _touch = new JTouch(document, _el) ;
		                var _height = 0 ;
		                var _max = 0 ;
		                var _min = 0 ;
		                this.e_downpull = $(_el).find(".downpull") ;
		                // this.e_downpull_bg = this.e_downpull.find(".bg") ;
		                this.target_y = this.e_downpull.height() ;
		                // var _once = false ;
		                this.down_scroll_top_zero = false ;

		                this.record_scroll_top = 0 ;

		                // -------------------- start ------------------------
		                _el.m_get_scroll_top = this.m_get_scroll_top ;
		                _el.m_get_y = this.m_get_y ;
		                _el.m_get_scroll_height = this.m_get_scroll_height ;
		                _el.m_get_height = this.m_get_height ;
		                _el.m_get_record_scroll_top = this.m_get_record_scroll_top ;
		                // _el.apply(JEvents) ;
		                // _el.onscroll = function() {
		                	
		                // }
		                var _tm = null ;
		                var _touch_type = null ;
		                $(_scroll.e_box).on("scroll", function(ev) {
		                	// if("start" == _touch_type) {
		                	// 	_scroll.$broadcast("scroll.start") ; // 滚动
		                	// } else if("end" == _touch_type) {
		                	// 	clearTimeout(_tm) ;
		                	// 	_tm = setTimeout(function() {
		                	// 		_scroll.$broadcast("scroll.end") ; // 按下
		                	// 	}, 60) ;

		                	// }
		                	var _scroll_top = _el.m_get_scroll_top() ;
		                	var _height = _el.m_get_height() ;
		                	var _scroll_height = _el.m_get_scroll_height() ;
		                	clearTimeout(_tm) ;
		                	_tm = setTimeout(function() {
		                		_scroll.record_scroll_top = _scroll_top ;
		                	}, 300) ;
		                    var _args = {
		                        scroll_top : _scroll_top,
		                        height : _height,
		                        scroll_height : _scroll_height,
		                        vr_is_to_bottom : _scroll_height == (_scroll_top + _height),
		                        vr_is_screen_part : (_scroll_height * 0.5) <= (_scroll_top + _height)
		                    } ;
		                    if(_v && $.isFunction(_v.onscroll)) {
		                		_v.onscroll.call(_scroll.$root, _args) ;
		                	}
		                    if($.isFunction(_el.onscroll)) {
		                        _el.onscroll(_args) ;
		                    }
		                    _el.m_trigger("scroll", _args) ;
		                }) ;
		                _el.m_get_vr_visual_range = function() { // 可视范围
		                    return this.m_get_scroll_top() + this.m_get_height() - _scroll.e_downpull.height() ;
		                }
		                // -------------------- end ------------------------
		                _touch.onstart = function(ev, v) {
		                	// _touch_type = "start" ;
		                    // _target_y = _e_downpull.height() ;
		                    if(0 === _el.m_get_scroll_top()) {
		                        _scroll.down_scroll_top_zero = true ;
		                    } else {
		                        _scroll.down_scroll_top_zero = false ;
		                    }
		                    if(1 === _scroll.status) {
		                        _scroll.is_valid = false ;
		                    } else {
		                        _scroll.is_valid = true ;
		                    }
		                    _scroll.$broadcast("touch.start") ; // 按下
		                }
		                
		                _touch.onmove = function(ev, v) {
		                    var _scroll_height = _el.m_get_scroll_height() ;
		                    var _scroll_top = _el.m_get_scroll_top() ;
		                    _height = _el.m_get_height() ;
		                    _max = _scroll_height - _height ;
		                    if(0 === _scroll_height) {
		                        ev.preventDefault() ;
		                    } else if(1 == v.action_y && _scroll_top <= _min) {
		                        ev.preventDefault() ;
		                        // 开始下拉
		                    } else if(0 == v.action_y && _scroll_top >= _max) {
		                        ev.preventDefault() ;
		                    }
		                    if(false === _scroll.vrlock) {
		                        _scroll.m_vr_flexible(v) ; // 水平灵活
		                    }
		                    _scroll.$broadcast("touch.move") ; // 移动
		                }
		                
		                _touch.onend = function() {
		                    // 放开
		                    // _touch_type = "end" ;
		                    if(0 !== _scroll.y) {
		                        if(0 == _scroll.status) {
		                            if(_scroll.y >= _scroll.target_y) {
		                                _scroll.m_touch_downpull().then(function() {

		                                }) ;
		                            } else {
		                                _scroll.m_reset_downpull().then(function() {

		                                }) ;    
		                            }
		                        }
		                    }
		                    _scroll.$broadcast("touch.end") ; // 按下
		                    _scroll.status = 0 ;
		                    _scroll.is_valid = true ;
		                }
		            },
		            template : tpls.scroll
		        })) ;
		        
		        Vue.component("v-image", Vue.extend({
		            props : {
		                src : {
		                    type : String,
		                    default : null
		                },
		                args : {
		                	type : String,
		                	default : null
		                },
		                w : {
		                    type : String,
		                    default : "auto"
		                },
		                h : {
		                    type : String,
		                    default : "auto"
		                },
		                placeholder_image : {
		                    type : String,
		                    default : "data:image/jpg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAAyAAD/4QMraHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjMtYzAxMSA2Ni4xNDU2NjEsIDIwMTIvMDIvMDYtMTQ6NTY6MjcgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzYgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkQ5RTEzMUI4N0U0NTExRTZBODA3QTY3MTcxNjVGNTBGIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkQ5RTEzMUI5N0U0NTExRTZBODA3QTY3MTcxNjVGNTBGIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6RDlFMTMxQjY3RTQ1MTFFNkE4MDdBNjcxNzE2NUY1MEYiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6RDlFMTMxQjc3RTQ1MTFFNkE4MDdBNjcxNzE2NUY1MEYiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7/7gAOQWRvYmUAZMAAAAAB/9sAhAAIBgYGBgYIBgYIDAgHCAwOCggICg4QDQ0ODQ0QEQwODQ0ODBEPEhMUExIPGBgaGhgYIyIiIiMnJycnJycnJycnAQkICAkKCQsJCQsOCw0LDhEODg4OERMNDQ4NDRMYEQ8PDw8RGBYXFBQUFxYaGhgYGhohISAhIScnJycnJycnJyf/wAARCADIAMgDASIAAhEBAxEB/8QAdQABAAMBAQEBAAAAAAAAAAAAAAQFBgMCAQcBAQAAAAAAAAAAAAAAAAAAAAAQAAICAgADAwgIBgMAAAAAAAABAgMRBCESBTFRFUFhcbEikhM0kcHRMlJywtKB4UJiUxShI3MRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AP30AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABx2dmrVgrLW1FvlWFnjhv6iN4xpd8vdAnggeMaXfL3TtbvUU1V3Tb5LUnHC71kCSCB4xpd8vdOutv6+1N11NuSXM8rHDKX1gSgCDPq2nCcoScsxbT4eVATgQPGNLvl7p31t2jbclS2+XGcrHaBIBx2dmrVgrLW1FvlWFnjhv6iN4xpd8vdAnggeMaXfL3SenlJrygAAAAAAAAAAAAAAAAfGk+1Z9JnerVwq22q0oqUVJpdmTRmf6184vyL1sCT0Sqt12WOKc+bly+7GSyvsqpplZalyRXY/UVfSdmjX1rHdNR9vKT7XwXYjxO/xXahRzfCoi8qL7ZfzA89N0VtTlsXRxVl8sOxN/Yi8jCEFiEVFeZYEIRrgoQWIxWEkegBB6rTXLTsm4rnhhxljj2onETqXyN3oXrQFBpQjZtVQmsxclld5qVGMeEUl6Fgy2nZCnZqsm8Ri8t9peeL6P437r+wCa0nwayvOZrqdcKtyyNa5Y8HhdnFFx4vo/jfuv7Cm6hdXsbUranmDSw8Y7EBadFqr/wBaVjinNyacmuOElwLMrui/Jv8AO/UixAAAAAAAAAAAAAAAAAGf6184vyL1s0BnusSjLcwnnlik/TxYHvp+jTuatjlmNiliM15OC8hBupt1bXXYuWceKa/4aZb9DlH4NsM+0pZx5mv5Evf047dTXZbHjXLz93oYHLpm/wD7UPh2P/uguP8Acu8nmRrsnRYrIPlnB8DS6e7Vt1pxaViXtw8qf2ASSJ1L5G70L1olkPqk4x0rFJ4csKK73lAUWlCNm3VCa5oylhpmg8P0v8MTPaU417dM5PEVJZb8/A1QEbw/S/wxKLqVVdO3OFcVGKUcJeg0xmuqyjPescXlLCfpSAtOi/Jv879SLEreiyi9WUU/aU3lelIsgAAAAAAAAAAAAAAAAOOzrx2YKuUpQSfNmDw+xrz95D8E1X/XZ9Mf2lkAK5dF1ovMbLU+9SS/SSLtKu+quqU5qNawnFrL4Y9rh5iSAK3wTU/HZ9Mf2hdF1U8qyxNeVOP7SyAHmuCrhGtNtRSim+14WOJBs6Rr2zc52WNtt45lhZ7vZLAAVvgmp+Oz6Y/tJOrp16nN8Oc5KWFibTSx3YSJIA47OvHZrVc5Sgk85g8Psa8/eQ/BNT8dn0x/aWQAro9G1ovMbLU+9SS/SWKWEl3AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADeFnuAAr6t7lv2v9ibVVbioZi+Gc9uFnyHSXUaowum4TxTPkk1jtzjvK3YXNVsWv7tuyoLzqPMfbfluof+/6gLp2L4asWOKTSk8dvnIVG5bK7YjOUeWDSj7SWPRw4nex2x0ualN2KC5VHGc485C0J2VXS1JyklHlbXsv2pJNp8yfD0AdNPc2bYUynKElJyVreItJdmME62+qhRdslFSeE33lP0/4yu+E7HXTrSl8Rp9rbwk/4omdWrssqqVcHNqxPEVnyMD7dtzjvUUwniqazNY9JKjsUztdMZ5sS5nHjwXD7Sv2JyfVNaXw5JqLxF8uX97+7B0ohZ4tfbKuUIyrWHJcP6F2rK8gFiAAAAAAAAAAAAAAAAAAAAAHySbi1F4k08Ptw+8+gCDPpsJOhKxqqri6+3L7/wCJ5n0yU4bEfi4+NZzpY4LjniWAA42a1d1Cot4xXLnHD7pHq6bCq62cHyVzSUIx+8klx4vvJwArNjpKlOM9WSq7FKPHDx5SzAAiW6s7N2nZUko1rDXlfb9pLAA5qrFsreaT5klyt+ysdyFdSrc3zSlzy5vaeceZHQAeKavg1qvmlPGfam8viewAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//9k="
		                }
		            },
		            watch : {
		            	"src" : function() {
		            		this.m_load() ;
		            	}
		            },
		            ready : function() { // 初始化
		                var _image = this ;
		                // 判断是否是在可视区域
		                this.el = this.$el ;
		                this.e_img = $(this.el).find("img") ;
		                this.is = false ;
		                var _e_scroll = $(this.el).parents(".scroll") ;
		                if(_e_scroll.length) {
		                    this.e_scroll = _e_scroll.get(0) ;
		                }
		                this.e_img.one("load", function() {
		                		// 加上当前滚动条的元素位置
		                   	if(_image.src) {
		                   		_image.m_load() ;
		                   	}
		                }) ;
		                this.$el.m_valid = function() {
		                    _image.m_valid() ;
		                }
		            },
		            methods : {
		            	m_load : function() {
		            		if(this.e_scroll) {
		                        this.m_valid() ;
		                    } else {
		                        this.m_show() ;
		                    }
		            	},
		            	m_get_top : function() {
		            		var _v = $(this.el).offset().top ;
		            		if(this.e_scroll) {
		            			_v = (_v - this.e_scroll.m_get_y() - $(this.e_scroll).offset().top) + this.e_scroll.m_get_scroll_top() ;
		            		}
		            		return _v ;
		            	},
		            	m_get_bottom : function() {
		            		return this.m_get_top() + this.m_get_height() ;
		            	},
		            	m_get_height : function() {
		            		return $(this.el).height() ;
		            	},
		                m_valid : function() { // 开始检测
		                    var _top = this.m_get_top() ;
		                    var _bottom = this.m_get_bottom() ;
		                    // 判断是否在可是范围
		                    var _vr_visual_range = this.e_scroll.m_get_vr_visual_range() ;
		                    var _scroll_top = this.e_scroll.m_get_scroll_top() ;
		                    if(_vr_visual_range + _vr_visual_range >= _top) {
		                        this.m_show() ;
		                    }
		                    if(_vr_visual_range <= (_top - this.m_get_height() - jvc.h * 10)) {
		                        this.m_hide() ;
		                    }
		                    if(_scroll_top >= (_bottom + this.m_get_height() + jvc.h * 10)) {
		                       this.m_hide() ;
		                    }
		                },
		                m_hide : function() { // 隐藏
		                    if(this.is) { // 已加载过
		                        this.e_img.attr("src", this.placeholder_image) ;    
		                    }
		                },
		                m_show : function() {
		                    var _self = this ;
		                    if(this.is) {
		                        var _src = this.e_img.prop("$src") ;
		                        this.e_img.attr("src", _src) ;
		                    } else {
		                        this.is = true ;
		                        var _image = new Image() ;
		                        if(this.args) {
		                        	_image.src = this.src + "?" + _self.args ;
	                           	} else {
	                           		_image.src = this.src ;
	                           	}
		                        _image.onload = function() {
		                           setTimeout(function() {
			                           _self.e_img.addClass("fadein") ;
			                           var _src = _image.src ;
			                           _self.e_img.prop("$src", _src) ;
			                           _self.e_img.attr("src", _src) ;
		                           }, 150) ;
		                           // 判断是否需要显示
		                        }
		                    }
		                }
		            },
		            template : tpls.image
		        })) ;
				
		        Vue.component("v-zan", Vue.extend({
		            props : {
		            	headimgs : {
		            		type : Array,
		            		default : []
		            	},
		            	onappend : {
		            		type : Function,
		            		default : function() {

		            		}
		            	}
		            },
		            ready : function() { 
		                var _self = this ;
		                this.e_zan = $(this.$el) ;
		                this.e_box = this.e_zan.find(".box") ;
		                this.e_mouth = this.e_zan.find(".mouth") ;
		                JPromise.apply(this) ;
		                JEvents.apply(this) ;
		                this.i = 0 ;
		                this.animates = ["anim-001", "anim-002", "anim-003", "anim-004"] ;
		                jvc.curr_view.m_on("enter", function() {
		                    _self.m_start() ;
		                }) ;
		                jvc.curr_view.m_on("leave", function() {
		                    _self.m_stop() ;
		                }) ;
		            },
		            methods : {
		                m_start : function() {
		                    var _self = this ;
		                    this.ir = setInterval(function() {
		                    	if(_self.headimgs.length) {
		                    		var _sleep = parseInt(Math.random() * 1000) ;
			                        _sleep = _sleep < 500 ? 500 : _sleep ;
			                        setTimeout(function() {
			                            _self.m_shoot().then(function() {
			                                _self.m_add() ;
			                            }) ;
			                            _self.i ++ ;
			                            if(_self.i > _self.headimgs.length - 1) {
			                                _self.i = 0 ;
			                                // clearInterval(_self.ir) ;
			                            }
			                        }, _sleep) ;
		                    	}
		                    }, 120) ;
		                },
		                m_shoot : function() {
		                    return this.m_promise(function(next) {
		                        var _self = this ;
		                        var _sleep = this.e_mouth.m_css3_duration() ;
		                        this.e_mouth.addClass("on") ;
		                        setTimeout(function() {
		                            _self.e_mouth.removeClass("on") ;
		                            setTimeout(function() {
		                                next() ;
		                            }, _sleep) ;
		                        }, _sleep) ;
		                    }) ;
		                },
		                m_close : function() {
		                	clearInterval(this.ir) ;
		                	$(this.$el).remove() ;
		                },
		                m_append : function() { // 追加一个赞
		                	var _self = this ;
		                	if($.isFunction(this.onappend)) {
		                		this.onappend(function(image) {
		                			if(image) {
		                				var _e_item = _self.m_add(image, "self") ;
		                				_self.e_mouth.addClass("trigger") ;
		                				setTimeout(function() {
		                					_self.headimgs.push(image) ;
		                					_self.e_mouth.removeClass("trigger") ;
		                				}, _self.e_mouth.m_css3_duration()) ;
		                			}
		                		}) ;
		                	}
		                },
		                m_add : function(image, classname) {
		                    var _e_item = this.m_create(image, classname) ;
		                    var _anim = this.animates[parseInt(Math.random() * this.animates.length)] ;
		                    _e_item.addClass(_anim) ;
		                    setTimeout(function() {
		                        _e_item.remove() ;
		                    }, _e_item.m_css3_duration()) ;
		                    return _e_item ;
		                },
		                m_create : function(image, classname) {
		                    var _e_item = $("<div></div>") ;
		                    var _e_img = $("<img />") ;
		                    var _image = null ;
		                    _e_item.addClass(classname) ;
		                    _e_item.addClass("item") ;
		                    _e_img.appendTo(_e_item) ;
		                    _e_item.appendTo(this.e_box) ;
		                    if(image) {
		                    	_image = image ;
		                    } else {
		                    	_image = this.headimgs[this.i] ;
		                    }
		                    _e_img.attr("src", _image) ;
		                    return _e_item ;
		                },
		                m_stop : function() {
		                    clearInterval(this.ir) ;
		                }
		            },
		            template : tpls.zan
		        })) ;
				
		        Vue.component("v-pop", Vue.extend({
		            props : {
		                modal : {
		                    type : Boolean,
		                    default : false
		                },
		                name : {
		                    type : String,
		                    default : "pop"
		                }
		            },
		            data : function() {
		                return {
		                    base_on : false,
		                    mask_on : false,
		                    box_class : null,
		                    model : {}
		                } ;
		            },
		            events : {
		                "reset" : function() {
		                    this.m_hide() ;
		                    return this ;
		                }
		            },
		            ready : function() {
		                var _pop = this.$parent.$get(this.name) ;
		                $.extend(this, _pop) ;
		                this.$parent.$set(this.name, this) ;
		            },
		            template : tpls.pop,
		            methods : {
		                _m_hide : function() {
		                    if(false === this.modal) {
		                        this.m_hide() ;
		                    }
		                },
		                m_show : function() {
		                    this.base_on = true ;
		                    if($.isFunction(this.onshow_before)) {
		                        this.onshow_before() ;
		                    }
		                    var _self = this ;
		                    setTimeout(function() {
		                    	 _self.mask_on = true ;
		                    }, 30) ;
	                        this.box_class = "on" ;
		                    setTimeout(function() {
		                        if($.isFunction(_self.onshow_after)) {
		                            _self.onshow_after() ;
		                        }
		                    }, 300) ;
		                },
		                m_hide : function() {
		                    if($.isFunction(this.onhide_before)) {
		                        this.onhide_before() ;
		                    }
		                    var _self = this ;
		                    this.mask_on = false ;
		                    this.box_class = "off" ;
		                    setTimeout(function() {
		                         _self.base_on = false ;
		                        if($.isFunction(_self.onhide_after)) {
		                            _self.onhide_after() ;
		                        }
		                    }, 300) ;
		                }
		            }
		        })) ;


		        Vue.component("v-links-selector", Vue.extend({
		            props : {
		                type : {
		                    type : String,
		                    default : "single"
		                },
		                name : {
		                    type : String,
		                    default : "links_selector"
		                }
		            },
		            data : function() {
		                return {
		                    id : null,
		                    ids : [],
		                    link : null,
		                    links_selector_actionsheet : {},
		                    model : {},
		                    on_set_link : function() {

		                    }
		                }
		            },
		            ready : function() {
		                var _links_selector = this.$parent.$get(this.name) ;
		                $.extend(this, _links_selector) ;
		                this.$parent.$set(this.name, this) ;
		            },
		            template : tpls.links_selector,
		            methods : {
		                m_show : function() {
		                    this.links_selector_actionsheet.m_show() ;
		                },
		                m_hide : function() {
		                    this.links_selector_actionsheet.m_hide() ;
		                },
		                m_set_link : function() {
		                	var _self = this ;
		                	app.modal.m_editor("设置链接", "text", this.link, "请输入链接", function(value) { // 确定
		                		_self.on_set_link(value) ;
		                	}, function() {
		                		
		                	}, "确定", "取消") ;
		                }
		            }
		        })) ;

		        Vue.component("v-icons-selector", Vue.extend({
		            props : {
		                prefix : {
		                    type : String,
		                    default : ""
		                },
		                value : {
		                    type : String,
		                    default : null
		                }, 
		                name : {
		                    type : String,
		                    default : "icons_selector"
		                }
		            },
		            data : function() {
		                return {
		                    icons_selector_actionsheet : {},
		                    model : {},
		                    icons : [
		                        
		                    ]
		                }
		            },
		            init : function() {
		            	JPromise.apply(this) ;
		            },
		            ready : function() {
		            	var _self = this ;
		                var _icons_selector = this.$parent.$get(this.name) ;
		                $.extend(this, _icons_selector) ;
		                this.$parent.$set(this.name, this) ;

		                // 发送请求
		                this.m_request_icon_classes().then(function(icon_classes) {
		                	icon_classes.forEach(function(icon_class) {
		                		_self.icons.push({v : icon_class}) ;
		                	}) ;
		                	// _self.icons = icon_classes ;
		                }) ;
		            },
		            template : tpls.icons_selector,
		            methods : {
		            	m_request_icon_classes : function() {
		            		return this.m_promise(function(next) {
		            			$.get(app.data.iconfont_libary_src, function(css) {
									var _express = /(icon-\w+)/g ;
									var _icon_classes = css.match(_express) ;
									next(_icon_classes) ;
								}) ;
		            		}) ;
		            	},
		                m_show : function() {
		                    this.icons_selector_actionsheet.m_show() ;
		                },
		                m_hide : function() {
		                    this.icons_selector_actionsheet.m_hide() ;
		                }
		            }
		        })) ;
		       

		        Vue.component("v-colors-selector", Vue.extend({
		            props : {
		                prefix : {
		                    type : String,
		                    default : ""
		                },
		                value : {
		                    type : String,
		                    default : null
		                }, 
		                name : {
		                    type : String,
		                    default : "colors_selector"
		                }
		            },
		            watch : {
		            	value : function(v) {
		            		if($.isFunction(this.onchoose)) {
		            			this.onchoose(v) ;	
		            		}
		            	}
		            },
		            data : function() {
		                return {
		                    colors_selector_actionsheet : {},
		                    model : {},
		                    colors : [

		                    ]
		                }
		            },
		            init : function() {
		            	JPromise.apply(this) ;
		            },
		            ready : function() {
		            	var _self = this ;
		                var _colors_selector = this.$parent.$get(this.name) ;
		                $.extend(this, _colors_selector) ;
		                this.$parent.$set(this.name, this) ;

		                // 发送请求
		                this.m_request_color_classes().then(function(color_classes) {
		                	color_classes.forEach(function(color_class) {
		                		_self.colors.push({v : color_class.replace("fg", "bg")}) ;
		                	}) ;
		                }) ;
		            },
		            template : tpls.colors_selector,
		            methods : {
		            	m_request_color_classes : function() {
		            		return this.m_promise(function(next) {
								var _src_css = seajs.data.alias["src.css"] ;
		            			$.get(_src_css, function(css) {
		            				var _express = /(fg-\w+)/g ;
									var _classes = css.match(_express) ;
									next(_classes) ;
		            			}) ;
		            		}) ;
		            	},
		                m_show : function() {
		                    this.colors_selector_actionsheet.m_show() ;
		                },
		                m_hide : function() {
		                    this.colors_selector_actionsheet.m_hide() ;
		                }
		            }
		        })) ;

		        Vue.component("v-spinner", Vue.extend({
		            props : {
		                args : null,
		                onchange : {
		                    type : Function,
		                    default : function() {

		                    }
		                },
		                min : {
		                    type : Number,
		                    default : 1
		                },
		                max : {
		                    type : Number,
		                    default : 5
		                },
		                value : {
		                    type : Number,
		                    default : 1
		                }
		            },
		            ready : function() {
		                this.m_valid() ;
		            },
		            data : function() {
		                return {
		                    min_disable : false,
		                    max_disable : false,
		                }
		            },
		            watch : {
		                "value" : function() {
		                    var _self = this ;
		                    setTimeout(function() {
		                        _self.m_valid() ;
		                        _self.onchange(_self.args, _self.value) ;
		                    }, 60) ;
		                },
		                "min" : function() {
		                    this.m_valid() ;
		                },
		                "max" : function() {
		                    this.m_valid() ;
		                }
		            },
		            events : {
		                onchange : function() {

		                }
		            },
		            methods : {
		                m_valid : function() {
		                    if(this.min > this.value) {
		                        this.value = this.min ;
		                    }
		                    if(this.min === this.value) {
		                        this.min_disable = true ;
		                    } else {
		                        this.min_disable = false ;
		                    }
		                    if(this.max < this.value) {
		                        this.value = this.max ;
		                    }
		                    if(this.max === this.value) {
		                        this.max_disable = true ;
		                    } else {
		                        this.max_disable = false ;
		                    }
		                },
		                m_add : function() {
		                    if(this.value < this.max) {
		                        this.value ++ ; 
		                    }
		                },
		                m_sub : function() {
		                    if(this.value > this.min) {
		                        this.value -- ; 
		                    }
		                }
		            },
		            template : tpls.spinner
		        })) ;
		        /*
		            actionsheet(start)
		        */
		        Vue.component("v-actionsheet", Vue.extend({
		            props : {
		                direction : {
		                    type : String,
		                    default : "bottom"
		                },
		                name : {
		                    type : String,
		                    default : "actionsheet"
		                },
		                prevent : {
		                	type : Boolean,
		                	default : true
		                }
		            },
		            data : function() {
		                return {
		                    base_on : false,
		                    mask_on : false,
		                    box_on : false,
		                    model : {}
		                } ;
		            },
		            events : {
		                "reset" : function() {
		                    this.m_hide() ;
		                    return this ;
		                }
		            },
		            ready : function() {
		                var _actionsheet = this.$parent.$get(this.name) ;
		                $.extend(this, _actionsheet) ;
		                this.$parent.$set(this.name, this) ;
		                this.status = 0 ;
		            },
		            template : tpls.actionsheet,
		            methods : {
		                // onshow_before : function() {
		                	
		                // },
		                // onshow_after : function() {
		                	
		                // },
		                // onhide_before : function() {
		                	
		                // },
		                // onhide_after : function() {
		                	
		                // },
		                m_show : function() {
		                	if(0 == this.status) {
			                	this.status = 1 ;
			                    this.base_on = true ;
			                    if($.isFunction(this.onshow_before)) {
			                        this.onshow_before() ;
			                    }
			                    var _self = this ;
			                    setTimeout(function() {
			                        _self.mask_on = true ;
			                        _self.box_on = true ;
			                    }, 30) ;
			                    setTimeout(function() {
			                        if($.isFunction(_self.onshow_after)) {
			                            _self.onshow_after() ;
			                        }
			                    }, 300) ;
		                    }
		                },
		                m_hide : function() {
		                	if(1 == this.status) {
			                	this.status = 0 ;
			                    if($.isFunction(this.onhide_before)) {
			                        this.onhide_before() ;
			                    }
			                    var _self = this ;
			                    this.mask_on = false ;
			                    this.box_on = false ;
			                    setTimeout(function() {
			                         _self.base_on = false ;
			                        if($.isFunction(_self.onhide_after)) {
			                            _self.onhide_after() ;
			                        }
			                    }, 300) ;
		                    }
		                }
		            }
		        })) ;

		        // --------------------------------------------- 文件上传 start ------------------------------------
		        Vue.component("v-file", Vue.extend({
		            props : {
		                accept : {
		                    type : String,
		                    default : "image/*"
		                },
		                multi : {
		                    type : Boolean,
		                    default : false
		                },
		                prop : {
		                    type : String,
		                    default : "image"
		                },
		                message : {
		                    type : String,
		                    default : null
		                },
		                max : {
		                    type : Number,
		                    default : 5
		                },
		                collection : {
		                    type : Array,
		                    default : null
		                },
		                model : null,
		                onchoose : {
		                    type : Function,
		                    default : function() {

		                    }
		                }
		            },
		            data : function() {
		                return {

		                }
		            },
		            ready : function() { // 这边
		                var _self =this ;
		                var _filequeue = this.$root.$get("files") ;
		                if(_filequeue) {

		                } else {
		                    _filequeue = [] ;
		                    this.$root.$set("filequeue", _filequeue) ;
		                }
		                JEvents.apply(_self) ;
		                JPromise.apply(_self) ;
		                // 监视表单提交
		                this.$root.form.m_on("submit.before", function() {
		                    return this.m_promise(function(next) {
		                        // 开始上传文件
		                        _self.m_upload().then(function(url) { // 上传成功
		                            next() ;
		                        }) ;
		                    }) ;
		                }) ;
		                this.filequeue = _filequeue ;
		            },
		            watch : {
		                collection : function(collection) {
		                    for(var i = 0; i < this.filequeue.length; i++) {
		                        var _url = this.filequeue[i].url ;
		                        if(false === this.m_get_url(_url)) {
		                            this.filequeue.splice(i, 1) ;
		                            i-- ;
		                        }
		                    }
		                }
		            },
		            methods : {
		                m_get_prop : function(object) {
		                    if("string" === $.type(object)) {
		                        return object ;
		                    } else if("object" === $.type(object)) {
		                        return object[this.prop] ;
		                    } else {
		                        return object ;
		                    }
		                },
		                m_get_url : function(url) {
		                    for(var i = 0; i < this.collection.length; i++) {
		                        var _collection_prop = this.m_get_prop(this.collection[i]) ;
		                        var _model_prop = this.m_get_prop(this.model) ;
		                        if(_collection_prop === url || _model_prop === url) {
		                            return true ;
		                        }
		                    }
		                    return false ;
		                },
		                m_upload : function() {
		                    var _self = this ;
		                    return this.m_promise(function(next) {
		                        if(0 === this.filequeue.length) {
		                            next() ;
		                        } else {
		                            var _pvs = [] ;
		                            var _index = 0 ;
		                            var _pv = 0 ;
		                            var _len = this.filequeue.length ;
		                            for(var i = 0; i < _len; i++) {
		                                _pvs.push(0) ;
		                            }
		                            function _m_current_pv() {
		                                var _current_pv = 0 ;
		                                for(var i = 0; i < _pvs.length; i++) {
		                                    _current_pv += _pvs[i] ;
		                                }
		                                return _current_pv ;
		                            }
		                            function _m_clear() { // 清除掉
		                                var _v = _self.filequeue.pop() ;
		                                if(_v) {
		                                    app.service.upload.m_start([_v.file], function(pv) {
		                                        // 总进度
		                                        _pvs[_index] = pv ;
		                                        _pv = (_m_current_pv() / (_len * 100)) * 100 ;
		                                        console.log(_pv + "%") ;
		                                    }, function(files) { // 文件上传完成
		                                        _index ++ ;
		                                        var _url = __image_base + "/" + files[0] ;
		                                        _v.m_set(_url) ;
		                                        _m_clear() ;
		                                    }, function() {
			                                	_v.m_set("") ;
			                                	_m_clear() ;
		                                    }) ;
		                                } else {
		                                    next() ;
		                                }
		                            }
		                            _m_clear() ;
		                        }
		                    }) ;
		                },
		                $onchoose : function() {
		                    var _self = this ;
		                    if($.isArray(this.collection)) {

		                        var _files = event.srcElement.files ;
		                        for(var i = 0; i < _files.length; i++) {
		                            if(this.collection.length < this.max) {
		                                this.filequeue.push(function(i) {
		                                    var _file = _files[i] ;
		                                    var _url = m_get_object_url(_file) ;
		                                    var _index = _self.collection.length ;
		                                    var _v = _self.onchoose(_url) ;
		                                    if(_v) {
		                                        _self.collection.push(_v) ;
		                                    } else {
		                                        _self.collection.push(_url) ;    
		                                    }
		                                    return {
		                                        url : _url,
		                                        file : _file,
		                                        m_set : function(url) {
		                                            var _v = _self.collection[_index] ;
		                                            if("object" === $.type(_v)) {
		                                                _self.collection[_index][_self.prop] = url ;
		                                            } else if("string" === $.type(_v)) {
		                                                _self.collection[_index] = url ;    
		                                            }
		                                        }
		                                    }
		                                }(i)) ;
		                            } else {
		                                if(_self.message) {
		                                    
		                                }
		                            }
		                        }
		                    } else {
		                        this.filequeue = [] ;

		                        this.filequeue.push(function() {
		                            var _file = event.srcElement.files[0] ;
		                            var _url = m_get_object_url(_file) ;
		                            var _v = _self.onchoose(_url) ;
		                            // if(_v) {
		                            //     _self.model = _v ;
		                            // } else {
		                            //     _self.model = _url ;
		                            // }

		                            var _object = {
		                                url : _url,
		                                file : _file,
		                                m_set : function(url) {
		                                    if("object" === $.type(_self.model)) {
		                                       _self.model[_self.prop] = url ;
		                                    } else if("string" === $.type(_self.model)) {
		                                        _self.model = url ;    
		                                    }
		                                }
		                            } ;

		                            _object.m_set(_v ? _v : _url) ;

		                            return _object ;
		                        }()) ;
		                    }
		                    event.srcElement.value = "" ;
		                }
		            },
		            template : tpls.file
		        })) ;
		        // --------------------------------------------- 文件上传 end ------------------------------------


		        Vue.component("v-menu", Vue.extend({
		            props : {
		                name : {
		                    type : String,
		                    default : "menu"
		                }
		            },
		            ready : function() {
		                var _menu = this ;
		                var _root = this.$root ;
		                var _e_menu = $(this.$el).attr("name", this.name) ;
		                var _e_menu_trigger = _e_menu.prev(".menu-trigger") ;
		                var _tpl = jvc.curr_view.jtc.curr_tpl ;
		                this.tpl = _tpl ;
		                _e_menu_trigger = _e_menu_trigger.length ? _e_menu_trigger : _tpl.m_get_ele().find(".menu-trigger[name="+ this.name +"]") ;
		                if(_e_menu_trigger) {
		                    _e_menu_trigger.$click(function() {
		                        _menu.m_toggle() ;
		                    }) ;
		                }
		                _e_menu.prop("menu", this) ;
		                if(!_root.$get("V_MENU_ONCE")) {
		                    _root.$set("V_MENU_ONCE", true) ;
		                    var _touch = new JTouch("*", this.tpl.m_get_ele()) ;
		                    _touch.onend = function(ev, v) {
		                        var _e = ev.srcElement ;
		                        if($(_e).parent(".menu-trigger").length || $(_e).hasClass("menu-trigger")) {
		                            
		                        } else {
		                            _root.m_hide_all_menu() ;
		                        }
		                    }
		                    _root.m_hide_all_menu = function(e_skip) {
		                        _tpl.m_get_ele().find(".menu").not(e_skip).each(function() {
		                            $(this).prop("menu").m_close() ;
		                        }) ;
		                    }
		                }
		            },
		            data : function() {
		                return {
		                    toggle : false
		                }
		            },
		            methods : {
		                m_close : function() {
		                    this.toggle = false ;
		                },
		                m_toggle : function() {
		                    this.$root.m_hide_all_menu(this.$el) ;
		                    this.toggle = !this.toggle ;
		                }
		            },
		            template : tpls.menu
		        })) ;
				JComponents.button = {
					m_reset : function(element) {
						if($(element).length) {
							element.get(0).m_reset() ;
						}
						return this ;
					},
					m_resets : function(elements) {
						for(var i = 0; i < elements.length; i++) {
							this.m_reset($(elements).eq(i)) ;
						}
						return this ;
					},
					m_click : function(element) {
						if($(element).length) {
							element.get(0).m_click() ;
						}
						return this ;
					}
				} ;

		        Vue.component("v-button", Vue.extend({
		            props : {
		                wtext : {
		                    type : String,
		                    default : ""
		                },
		                disable : {
		                    type : Boolean,
		                    default : false,
		                },
		                icon : {
		                    type : String,
		                    default : ""
		                },
		                hidetext : {
		                    type : Boolean,
		                    default : false
		                },
		                loading : {
		                	type : Boolean,
		                	default : null
		                },
		                text : ""
		            },
		            events : {
		                "reset" : function() { // 重置
		                    this.m_reset() ;
		                    return true ;
		                },
		                "leave" : function() { // 页面离开
		                    this.m_reset() ;
		                    return true ;
		                }
		            },
		            ready : function() {
		                this.$el.$onclick = this.m_click ;
		                var _button = this ;
		                this.$el.m_reset = function() {
		                    _button.m_reset() ;
		                }
		            },
		            data : function() {
		                return {
		                    status : 0,
		                    loading_status : 0,
		                    wtext_status : 0,
		                    text_status : 1
		                }
		            },
		            methods : {
		                m_reset : function() {
		                    if(1 === this.status) {
		                        this.status = 0 ;
		                        this.loading_status = 0 ;
		                        this.wtext_status = 0 ;
		                        this.text_status = 1 ;
		                        $(this.$el).removeClass("disable") ;
		                    }
		                },
		                m_click : function() {
		                    if(0 === this.status) {
		                        var _el = this.$el ;
		                        $(_el).addClass("disable") ;
		                        this.status = 1 ;
		                        if(this.wtext) {
		                        	this.wtext_status = 1 ;
		                        	if(false != this.loading) { 
		                        		this.loading_status = 1 ;
		                        	}
		                        }
		                        if(true == this.loading) {
		                        	this.loading_status = 1 ;
		                        }
		                        if(true == this.hidetext) { // 异常文本
		                        	this.text_status = 0 ;
		                        }
		                    }
		                }
		            },
		            template : tpls.button
		        })) ;
		    

		        Vue.component("v-empty", Vue.extend({
		            props : {
		                text : {
		                    type : String,
		                    default : "暂无记录"
		                },
		                icon : {
		                    type : String,
		                    default : "icon-factory-r"
		                }
		            },
		            template : tpls.empty
		        })) ;
 
		        Vue.component("v-invalid", Vue.extend({
		            props : {
		                text : {
		                    type : String,
		                    default : null
		                },
		                icon : {
		                    type : String,
		                    default : null
		                }
		            },
		            template : tpls.invalid
		        })) ;

		         Vue.component("v-sessionless", Vue.extend({
		            props : {
		                text : {
		                    type : String,
		                    default : "登录过期或尚未登录"
		                },
		                icon : {
		                    type : String,
		                    default : "icon-my"
		                }
		            },
		            template : tpls.sessionless
		        })) ;

		        Vue.component("v-lively-loader", Vue.extend({
		            template : tpls.livey_loader
		        })) ;

		        Vue.component("v-dev", Vue.extend({
		        	data : function() {
		        		var _copyright = window.__copyright ;
		        		if(!_copyright) {
			        		_copyright = {
			        			name : "技术支持 坤晖软件"
			        		} ;
			        	}
		        		return {
		        			copyright : _copyright
		        		}
		        	},
		            template : tpls.dev
		        })) ;
		       	
		        /* 自动视图 */
		        Vue.component("v-render", Vue.extend({
		            props : {
		                name : {
		                    type : String,
		                    default : "default"
		                },
		                anim : {
		                    type : String,
		                    default : "fadein"
		                }
		            },
		            init : function() {
		                JPromise.apply(this) ;
		            },
		            ready : function() {
		                var _view = jvc.curr_view ;
		                var _vm = this.$root ;
		                this.ref = _vm.renders[this.name] ;
		                if(!_vm.$get("V_render_ONCE")) {
		                  _vm.$set("V_render_ONCE", true) ;
		                  this.m_once() ;
		                }
		                var _render = this ;
		                var _prop = null ;
		                var _model = null ;
		                this.copy_model = null ;
		                this.copy_query = null ;
		                // -------------------- 数据监听 -----------------------
		                if(this.ref && this.ref.model) {
		                  _model = this.ref.model ;
		                  this.copy_model = clone(_model) ;
		                  this.copy_query = clone(this.ref.query) ;
		                  if(_model.list && _model.list.push) { // 数组
		                        this.type = "list" ;
		                        _prop = "renders." + this.name + ".model.list" ;
		                        _vm.$watch(_prop, function(list) {
		                          if($.isArray(list) && list.length) {
		                            _render.m_entity() ;
		                          } else {
		                            _render.m_empty() ;
		                          }
		                        }) ;
		                  } else {
		                        if(_model) {
		                            this.type = "object" ;
		                            _prop = "renders." + this.name + ".model" ;
		                            _vm.$watch(_prop, function(model) {
		                                if(Object.keys(model).length) { // 有数据
		                                    _render.m_entity() ;
		                                } else {
		                                    _render.m_empty() ;
		                                }
		                            }) ;
		                        } else {
		                            _render.m_empty() ;
		                        }
		                  }
		                }
		                _vm.$renders.push(this) ;
		                _view.m_on("leave.back, exit", function() {
		                    _render.m_reset() ;
		                }) ;
		                 _view.m_on("active.push", function() {
		                    _render.status = 100 ;
		                }) ;
		                $.extend(this.ref, this) ;
		                if(false !== this.ref.use) {
		                    this.status = 100 ;
		                }
		            },
		            data : function() {
		                return {
		                      
		                      type : null,
		                      status : null,
		                      append_status : 0, // 添加状态
		                      __next : function() {

		                      },
		                      m_continue : null // 等待
		                      // request_from : "render#" + this.name
		                }
		            },
		            methods : {
		                m_skip : function() {
		                    this.__next() ;
		                    return this ;
		                },
		                m_error : function() {
		                    this.m_clear() ;
		                    this.status = 500 ;
		                    if($.isFunction(this.ref.onerror)) {
		                        this.ref.onerror() ;
		                    }
		                },
		                m_invalid : function() { // 无效
		                    this.m_clear() ;
		                    this.status = -3 ;
		                    if($.isFunction(this.ref.oninvalid)) {
		                        this.ref.oninvalid() ;
		                    }
		                },
		                m_sessionless : function() {
		                    this.m_clear() ;
		                    this.status = -1 ;
		                },
		                m_clear : function() {
		                	this.status = null ;
		                    return this ;
		                },
		                m_timeout : function() {
		                	
		                    this.m_clear() ;
		                    this.status = -2 ;
		                    if($.isFunction(this.ref.ontimeout)) {
		                        this.ref.ontimeout() ;
		                    }
		                },
		                m_empty : function() {
		                    this.m_clear() ;
		                    this.status = 0 ;
		                },
		                m_entity : function() {
		                    this.m_clear() ;
		                    this.status = 1 ;
		                },
		                m_reset : function() {
		                    this.ref.model = clone(this.copy_model) ;
		                    this.ref.query = clone(this.copy_query) ;
		                    this.$nextTick(function() {
		                        this.status = null ;
		                        // if("list" === this.type) {
		                        //     this.status = null ;
		                        // } else if("object" === this.type) {
		                        //     this.ref.model = clone(this.copy_model) ;
		                        // }
		                    }) ;
		                },
		                m_adds : function(callback) { // 开始追加
		                	var _self = this ;
		                	if(0 == this.append_status) { // 当前追加状态为 0
		                		if($.isFunction(this.ref.onadds)) {
		                			var _v = this.ref.onadds(this.ref) ;
		                			if(false != _v) {
		                				this.append_status = 1 ;
			                			this.m_work().then(function(data) {
			                				_self.m_append(data) ;
			                				setTimeout(function() {
			                					_self.append_status = 0 ;
			                				}, 150) ;
			                				if($.isFunction(callback)) {
			                					callback() ;
			                				}
			                				if($.isFunction(_self.m_continue)) {
			                					_self.m_continue() ;
			                				} else {
			                					_self.m_continue = null ;
			                				}
			                			}) ;
		                			}
		                		}
		                	} else {
		                		this.m_continue = function() {
	                				this.m_adds(callback) ;
	                			}
		                	}
		                },
		                m_append : function(data) { // 追加
		                    if($.isFunction(this.ref.onappend_before)) {
		                        this.ref.onappend_before(data) ;    
		                    }
		                    // this.ref.model = data ;
		                    if(data && $.isArray(data.list)) { 
		                        for(var i = 0; i < data.list.length; i++) {
		                        	this.ref.model.list.push(data.list[i]) ;
		                        }
		                    }
		                    if($.isFunction(this.ref.onappend_after)) {
		                        this.ref.onappend_after(this.ref.model) ; 
		                    }
		                },
		                __m_draw : function() {
		                    if(false !== this.ref.use) {
		                        return this.m_draw() ;
		                    } else {
		                        return new Promise(function(next) {
		                            next() ;
		                        }) ;
		                    }
		                },
		                m_work : function() {
		                	var _render = this ;
		                	return this.m_promise(function(next, fail) {
	                            this.__next = next ;
	                            if(this.ref) {
	                                m_func(this.ref.ondraw, this.ref, this.ref).then(function(data) {
	                                    next(data) ;
	                                }).catch(function(ds) { // 处理异常

	                                	console.log(ds) ;

	                                    if(500 == ds.status) { // 500 错误
	                                        _render.m_error(ds.info) ;
	                                        fail() ;
	                                    } else if(100 == ds.status) { // 100 错误
	                                    	// app.toast.m_show_warn("尚未登录") ;
	                                        _render.m_sessionless(ds.info) ;
	                                        fail() ;
	                                    } else if(203 == ds.status) { // 其他错误
	                                        _render.m_invalid(ds.info) ;
	                                        fail() ;
	                                    }
	                                }) ;
	                            } else {
	                                next() ;
	                            }
	                        }) ;
		                },
		                m_draw : function() { // 开始绘制
		                	var _render = this ;
	                        return this.m_promise(function(next, fail) {
	                        	this.m_work().then(function(data) {
		                        	_render.m_inject(data) ;
		                        	next(data) ;
		                        }).catch(function(e) {
		                        	fail(e) ;
		                        }) ;
	                        }) ;
		                    // if(false === this.ref.use) {
		                    //     return this.m_promise(function(next) {
		                    //         next() ;
		                    //     }) ;
		                    // } else {
		                        
		                    // }
		                },
		                m_inject : function(data) {
		                    this.ref.model = clone(this.copy_model) ;
		                    if($.isFunction(this.ref.oninject_before)) {
		                        this.ref.oninject_before(data) ;    
		                    }
		                    this.ref.model = data ;
		                    if(null == data) { 
		                        this.ref.model = clone(this.copy_model) ;
		                    }
		                    if($.isFunction(this.ref.oninject_after)) {
		                        this.ref.oninject_after(this.ref.model) ; 
		                    }
		                },
		                m_once : function() {
		                    var _vm = this.$root ;
		                    var _view = jvc.curr_view ;
		                    _vm.$renders = [] ;
		                    _vm.m_draws = function() { // 开始刷新
		                        return new Promise(function(next, fail) {
		                            var _methods = [] ;
		                            _vm.$renders.forEach(function(render) {
		                            	_methods.push(render.__m_draw()) ;
		                            }) ;
		                            _view.m_trigger("draws.start").then(function() {
		                                return Promise.all(_methods) ;
		                            }).then(function() {
		                                    // 刷新结束
		                                _vm.m_refresh_end() ;
		                                return _view.m_trigger("draws.end") ;
		                            }).then(function() {
		                            	next() ;
		                            }).catch(function(e) {
		                            	next() ;
		                            }) ;
		                        }) ;
		                    }
		                }
		            },
		            template : tpls.render
		        })) ;
		    }   
		}
		window.JComponents = JComponents ;
		window.JLoader = JLoader ;
		window.JModal = JModal ;
		window.JToastSuper = JToastSuper ;
		window.JModalSuper = JModalSuper ;
		if($.isFunction(app.oncomponent_load)) { // 组件初始化完成
			app.oncomponent_load() ;
		}
		
	}).catch(function(e) {
		console.log(e) ;
	}) ;
}) ;
///<jscompress sourcefile="swiper.js" />
/**
 * Swiper 3.3.1
 * Most modern mobile touch slider and framework with hardware accelerated transitions
 * 
 * http://www.idangero.us/swiper/
 * 
 * Copyright 2016, Vladimir Kharlampidi
 * The iDangero.us
 * http://www.idangero.us/
 * 
 * Licensed under MIT
 * 
 * Released on: February 7, 2016
 */
(function () {
    'use strict';
    var $;
    /*===========================
    Swiper
    ===========================*/
    var Swiper = function (container, params) {
        if (!(this instanceof Swiper)) return new Swiper(container, params);

        var defaults = {
            direction: 'horizontal',
            touchEventsTarget: 'container',
            initialSlide: 0,
            speed: 300,
            // autoplay
            autoplay: false,
            autoplayDisableOnInteraction: true,
            autoplayStopOnLast: false,
            // To support iOS's swipe-to-go-back gesture (when being used in-app, with UIWebView).
            iOSEdgeSwipeDetection: false,
            iOSEdgeSwipeThreshold: 20,
            // Free mode
            freeMode: false,
            freeModeMomentum: true,
            freeModeMomentumRatio: 1,
            freeModeMomentumBounce: true,
            freeModeMomentumBounceRatio: 1,
            freeModeSticky: false,
            freeModeMinimumVelocity: 0.02,
            // Autoheight
            autoHeight: false,
            // Set wrapper width
            setWrapperSize: false,
            // Virtual Translate
            virtualTranslate: false,
            // Effects
            effect: 'slide', // 'slide' or 'fade' or 'cube' or 'coverflow' or 'flip'
            coverflow: {
                rotate: 50,
                stretch: 0,
                depth: 100,
                modifier: 1,
                slideShadows : true
            },
            flip: {
                slideShadows : true,
                limitRotation: true
            },
            cube: {
                slideShadows: true,
                shadow: true,
                shadowOffset: 20,
                shadowScale: 0.94
            },
            fade: {
                crossFade: false
            },
            // Parallax
            parallax: false,
            // Scrollbar
            scrollbar: null,
            scrollbarHide: true,
            scrollbarDraggable: false,
            scrollbarSnapOnRelease: false,
            // Keyboard Mousewheel
            keyboardControl: false,
            mousewheelControl: false,
            mousewheelReleaseOnEdges: false,
            mousewheelInvert: false,
            mousewheelForceToAxis: false,
            mousewheelSensitivity: 1,
            // Hash Navigation
            hashnav: false,
            // Breakpoints
            breakpoints: undefined,
            // Slides grid
            spaceBetween: 0,
            slidesPerView: 1,
            slidesPerColumn: 1,
            slidesPerColumnFill: 'column',
            slidesPerGroup: 1,
            centeredSlides: false,
            slidesOffsetBefore: 0, // in px
            slidesOffsetAfter: 0, // in px
            // Round length
            roundLengths: false,
            // Touches
            touchRatio: 1,
            touchAngle: 45,
            simulateTouch: true,
            shortSwipes: true,
            longSwipes: true,
            longSwipesRatio: 0.5,
            longSwipesMs: 300,
            followFinger: true,
            onlyExternal: false,
            threshold: 0,
            touchMoveStopPropagation: false,
            // Unique Navigation Elements
            uniqueNavElements: true,
            // Pagination
            pagination: null,
            paginationElement: 'span',
            paginationClickable: false,
            paginationHide: false,
            paginationBulletRender: null,
            paginationProgressRender: null,
            paginationFractionRender: null,
            paginationCustomRender: null,
            paginationType: 'bullets', // 'bullets' or 'progress' or 'fraction' or 'custom'
            // Resistance
            resistance: true,
            resistanceRatio: 0.85,
            // Next/prev buttons
            nextButton: null,
            prevButton: null,
            // Progress
            watchSlidesProgress: false,
            watchSlidesVisibility: false,
            // Cursor
            grabCursor: false,
            // Clicks
            preventClicks: true,
            preventClicksPropagation: true,
            slideToClickedSlide: false,
            // Lazy Loading
            lazyLoading: false,
            lazyLoadingInPrevNext: false,
            lazyLoadingInPrevNextAmount: 1,
            lazyLoadingOnTransitionStart: false,
            // Images
            preloadImages: true,
            updateOnImagesReady: true,
            // loop
            loop: false,
            loopAdditionalSlides: 0,
            loopedSlides: null,
            // Control
            control: undefined,
            controlInverse: false,
            controlBy: 'slide', //or 'container'
            // Swiping/no swiping
            allowSwipeToPrev: true,
            allowSwipeToNext: true,
            swipeHandler: null, //'.swipe-handler',
            noSwiping: true,
            noSwipingClass: 'swiper-no-swiping',
            // NS
            slideClass: 'swiper-slide',
            slideActiveClass: 'swiper-slide-active',
            slideVisibleClass: 'swiper-slide-visible',
            slideDuplicateClass: 'swiper-slide-duplicate',
            slideNextClass: 'swiper-slide-next',
            slidePrevClass: 'swiper-slide-prev',
            wrapperClass: 'swiper-wrapper',
            bulletClass: 'swiper-pagination-bullet',
            bulletActiveClass: 'swiper-pagination-bullet-active',
            buttonDisabledClass: 'swiper-button-disabled',
            paginationCurrentClass: 'swiper-pagination-current',
            paginationTotalClass: 'swiper-pagination-total',
            paginationHiddenClass: 'swiper-pagination-hidden',
            paginationProgressbarClass: 'swiper-pagination-progressbar',
            // Observer
            observer: false,
            observeParents: false,
            // Accessibility
            a11y: false,
            prevSlideMessage: 'Previous slide',
            nextSlideMessage: 'Next slide',
            firstSlideMessage: 'This is the first slide',
            lastSlideMessage: 'This is the last slide',
            paginationBulletMessage: 'Go to slide {{index}}',
            // Callbacks
            runCallbacksOnInit: true
            /*
            Callbacks:
            onInit: function (swiper)
            onDestroy: function (swiper)
            onClick: function (swiper, e)
            onTap: function (swiper, e)
            onDoubleTap: function (swiper, e)
            onSliderMove: function (swiper, e)
            onSlideChangeStart: function (swiper)
            onSlideChangeEnd: function (swiper)
            onTransitionStart: function (swiper)
            onTransitionEnd: function (swiper)
            onImagesReady: function (swiper)
            onProgress: function (swiper, progress)
            onTouchStart: function (swiper, e)
            onTouchMove: function (swiper, e)
            onTouchMoveOpposite: function (swiper, e)
            onTouchEnd: function (swiper, e)
            onReachBeginning: function (swiper)
            onReachEnd: function (swiper)
            onSetTransition: function (swiper, duration)
            onSetTranslate: function (swiper, translate)
            onAutoplayStart: function (swiper)
            onAutoplayStop: function (swiper),
            onLazyImageLoad: function (swiper, slide, image)
            onLazyImageReady: function (swiper, slide, image)
            */
        
        };
        var initialVirtualTranslate = params && params.virtualTranslate;
        
        params = params || {};
        var originalParams = {};
        for (var param in params) {
            if (typeof params[param] === 'object' && params[param] !== null && !(params[param].nodeType || params[param] === window || params[param] === document || (typeof Dom7 !== 'undefined' && params[param] instanceof Dom7) || (typeof jQuery !== 'undefined' && params[param] instanceof jQuery))) {
                originalParams[param] = {};
                for (var deepParam in params[param]) {
                    originalParams[param][deepParam] = params[param][deepParam];
                }
            }
            else {
                originalParams[param] = params[param];
            }
        }
        for (var def in defaults) {
            if (typeof params[def] === 'undefined') {
                params[def] = defaults[def];
            }
            else if (typeof params[def] === 'object') {
                for (var deepDef in defaults[def]) {
                    if (typeof params[def][deepDef] === 'undefined') {
                        params[def][deepDef] = defaults[def][deepDef];
                    }
                }
            }
        }
        
        // Swiper
        var s = this;
        
        // Params
        s.params = params;
        s.originalParams = originalParams;
        
        // Classname
        s.classNames = [];
        /*=========================
          Dom Library and plugins
          ===========================*/
        if (typeof $ !== 'undefined' && typeof Dom7 !== 'undefined'){
            $ = Dom7;
        }
        if (typeof $ === 'undefined') {
            if (typeof Dom7 === 'undefined') {
                $ = window.Dom7 || window.Zepto || window.jQuery;
            }
            else {
                $ = Dom7;
            }
            if (!$) return;
        }
        // Export it to Swiper instance
        s.$ = $;
        
        /*=========================
          Breakpoints
          ===========================*/
        s.currentBreakpoint = undefined;
        s.getActiveBreakpoint = function () {
            //Get breakpoint for window width
            if (!s.params.breakpoints) return false;
            var breakpoint = false;
            var points = [], point;
            for ( point in s.params.breakpoints ) {
                if (s.params.breakpoints.hasOwnProperty(point)) {
                    points.push(point);
                }
            }
            points.sort(function (a, b) {
                return parseInt(a, 10) > parseInt(b, 10);
            });
            for (var i = 0; i < points.length; i++) {
                point = points[i];
                if (point >= window.innerWidth && !breakpoint) {
                    breakpoint = point;
                }
            }
            return breakpoint || 'max';
        };
        s.setBreakpoint = function () {
            //Set breakpoint for window width and update parameters
            var breakpoint = s.getActiveBreakpoint();
            if (breakpoint && s.currentBreakpoint !== breakpoint) {
                var breakPointsParams = breakpoint in s.params.breakpoints ? s.params.breakpoints[breakpoint] : s.originalParams;
                var needsReLoop = s.params.loop && (breakPointsParams.slidesPerView !== s.params.slidesPerView);
                for ( var param in breakPointsParams ) {
                    s.params[param] = breakPointsParams[param];
                }
                s.currentBreakpoint = breakpoint;
                if(needsReLoop && s.destroyLoop) {
                    s.reLoop(true);
                }
            }
        };
        // Set breakpoint on load
        if (s.params.breakpoints) {
            s.setBreakpoint();
        }
        
        /*=========================
          Preparation - Define Container, Wrapper and Pagination
          ===========================*/
        s.container = $(container);
        if (s.container.length === 0) return;
        if (s.container.length > 1) {
            var swipers = [];
            s.container.each(function () {
                var container = this;
                swipers.push(new Swiper(this, params));
            });
            return swipers;
        }
        
        // Save instance in container HTML Element and in data
        s.container[0].swiper = s;
        s.container.data('swiper', s);
        
        s.classNames.push('swiper-container-' + s.params.direction);
        
        if (s.params.freeMode) {
            s.classNames.push('swiper-container-free-mode');
        }
        if (!s.support.flexbox) {
            s.classNames.push('swiper-container-no-flexbox');
            s.params.slidesPerColumn = 1;
        }
        if (s.params.autoHeight) {
            s.classNames.push('swiper-container-autoheight');
        }
        // Enable slides progress when required
        if (s.params.parallax || s.params.watchSlidesVisibility) {
            s.params.watchSlidesProgress = true;
        }
        // Coverflow / 3D
        if (['cube', 'coverflow', 'flip'].indexOf(s.params.effect) >= 0) {
            if (s.support.transforms3d) {
                s.params.watchSlidesProgress = true;
                s.classNames.push('swiper-container-3d');
            }
            else {
                s.params.effect = 'slide';
            }
        }
        if (s.params.effect !== 'slide') {
            s.classNames.push('swiper-container-' + s.params.effect);
        }
        if (s.params.effect === 'cube') {
            s.params.resistanceRatio = 0;
            s.params.slidesPerView = 1;
            s.params.slidesPerColumn = 1;
            s.params.slidesPerGroup = 1;
            s.params.centeredSlides = false;
            s.params.spaceBetween = 0;
            s.params.virtualTranslate = true;
            s.params.setWrapperSize = false;
        }
        if (s.params.effect === 'fade' || s.params.effect === 'flip') {
            s.params.slidesPerView = 1;
            s.params.slidesPerColumn = 1;
            s.params.slidesPerGroup = 1;
            s.params.watchSlidesProgress = true;
            s.params.spaceBetween = 0;
            s.params.setWrapperSize = false;
            if (typeof initialVirtualTranslate === 'undefined') {
                s.params.virtualTranslate = true;
            }
        }
        
        // Grab Cursor
        if (s.params.grabCursor && s.support.touch) {
            s.params.grabCursor = false;
        }
        
        // Wrapper
        s.wrapper = s.container.children('.' + s.params.wrapperClass);
        
        // Pagination
        if (s.params.pagination) {
            s.paginationContainer = $(s.params.pagination);
            if (s.params.uniqueNavElements && typeof s.params.pagination === 'string' && s.paginationContainer.length > 1 && s.container.find(s.params.pagination).length === 1) {
                s.paginationContainer = s.container.find(s.params.pagination);
            }
        
            if (s.params.paginationType === 'bullets' && s.params.paginationClickable) {
                s.paginationContainer.addClass('swiper-pagination-clickable');
            }
            else {
                s.params.paginationClickable = false;
            }
            s.paginationContainer.addClass('swiper-pagination-' + s.params.paginationType);
        }
        // Next/Prev Buttons
        if (s.params.nextButton || s.params.prevButton) {
            if (s.params.nextButton) {
                s.nextButton = $(s.params.nextButton);
                if (s.params.uniqueNavElements && typeof s.params.nextButton === 'string' && s.nextButton.length > 1 && s.container.find(s.params.nextButton).length === 1) {
                    s.nextButton = s.container.find(s.params.nextButton);
                }
            }
            if (s.params.prevButton) {
                s.prevButton = $(s.params.prevButton);
                if (s.params.uniqueNavElements && typeof s.params.prevButton === 'string' && s.prevButton.length > 1 && s.container.find(s.params.prevButton).length === 1) {
                    s.prevButton = s.container.find(s.params.prevButton);
                }
            }
        }
        
        // Is Horizontal
        s.isHorizontal = function () {
            return s.params.direction === 'horizontal';
        };
        // s.isH = isH;
        
        // RTL
        s.rtl = s.isHorizontal() && (s.container[0].dir.toLowerCase() === 'rtl' || s.container.css('direction') === 'rtl');
        if (s.rtl) {
            s.classNames.push('swiper-container-rtl');
        }
        
        // Wrong RTL support
        if (s.rtl) {
            s.wrongRTL = s.wrapper.css('display') === '-webkit-box';
        }
        
        // Columns
        if (s.params.slidesPerColumn > 1) {
            s.classNames.push('swiper-container-multirow');
        }
        
        // Check for Android
        if (s.device.android) {
            s.classNames.push('swiper-container-android');
        }
        
        // Add classes
        s.container.addClass(s.classNames.join(' '));
        
        // Translate
        s.translate = 0;
        
        // Progress
        s.progress = 0;
        
        // Velocity
        s.velocity = 0;
        
        /*=========================
          Locks, unlocks
          ===========================*/
        s.lockSwipeToNext = function () {
            s.params.allowSwipeToNext = false;
        };
        s.lockSwipeToPrev = function () {
            s.params.allowSwipeToPrev = false;
        };
        s.lockSwipes = function () {
            s.params.allowSwipeToNext = s.params.allowSwipeToPrev = false;
        };
        s.unlockSwipeToNext = function () {
            s.params.allowSwipeToNext = true;
        };
        s.unlockSwipeToPrev = function () {
            s.params.allowSwipeToPrev = true;
        };
        s.unlockSwipes = function () {
            s.params.allowSwipeToNext = s.params.allowSwipeToPrev = true;
        };
        
        /*=========================
          Round helper
          ===========================*/
        function round(a) {
            return Math.floor(a);
        }
        /*=========================
          Set grab cursor
          ===========================*/
        if (s.params.grabCursor) {
            s.container[0].style.cursor = 'move';
            s.container[0].style.cursor = '-webkit-grab';
            s.container[0].style.cursor = '-moz-grab';
            s.container[0].style.cursor = 'grab';
        }
        /*=========================
          Update on Images Ready
          ===========================*/
        s.imagesToLoad = [];
        s.imagesLoaded = 0;
        
        s.loadImage = function (imgElement, src, srcset, checkForComplete, callback) {
            var image;
            function onReady () {
                if (callback) callback();
            }
            if (!imgElement.complete || !checkForComplete) {
                if (src) {
                    image = new window.Image();
                    image.onload = onReady;
                    image.onerror = onReady;
                    if (srcset) {
                        image.srcset = srcset;
                    }
                    if (src) {
                        image.src = src;
                    }
                } else {
                    onReady();
                }
        
            } else {//image already loaded...
                onReady();
            }
        };
        s.preloadImages = function () {
            s.imagesToLoad = s.container.find('img');
            function _onReady() {
                if (typeof s === 'undefined' || s === null) return;
                if (s.imagesLoaded !== undefined) s.imagesLoaded++;
                if (s.imagesLoaded === s.imagesToLoad.length) {
                    if (s.params.updateOnImagesReady) s.update();
                    s.emit('onImagesReady', s);
                }
            }
            for (var i = 0; i < s.imagesToLoad.length; i++) {
                s.loadImage(s.imagesToLoad[i], (s.imagesToLoad[i].currentSrc || s.imagesToLoad[i].getAttribute('src')), (s.imagesToLoad[i].srcset || s.imagesToLoad[i].getAttribute('srcset')), true, _onReady);
            }
        };
        
        /*=========================
          Autoplay
          ===========================*/
        s.autoplayTimeoutId = undefined;
        s.autoplaying = false;
        s.autoplayPaused = false;
        function autoplay() {
            s.autoplayTimeoutId = setTimeout(function () {
                if (s.params.loop) {
                    s.fixLoop();
                    s._slideNext();
                    s.emit('onAutoplay', s);
                }
                else {
                    if (!s.isEnd) {
                        s._slideNext();
                        s.emit('onAutoplay', s);
                    }
                    else {
                        if (!params.autoplayStopOnLast) {
                            s._slideTo(0);
                            s.emit('onAutoplay', s);
                        }
                        else {
                            s.stopAutoplay();
                        }
                    }
                }
            }, s.params.autoplay);
        }
        s.startAutoplay = function () {
            if (typeof s.autoplayTimeoutId !== 'undefined') return false;
            if (!s.params.autoplay) return false;
            if (s.autoplaying) return false;
            s.autoplaying = true;
            s.emit('onAutoplayStart', s);
            autoplay();
        };
        s.stopAutoplay = function (internal) {
            if (!s.autoplayTimeoutId) return;
            if (s.autoplayTimeoutId) clearTimeout(s.autoplayTimeoutId);
            s.autoplaying = false;
            s.autoplayTimeoutId = undefined;
            s.emit('onAutoplayStop', s);
        };
        s.pauseAutoplay = function (speed) {
            if (s.autoplayPaused) return;
            if (s.autoplayTimeoutId) clearTimeout(s.autoplayTimeoutId);
            s.autoplayPaused = true;
            if (speed === 0) {
                s.autoplayPaused = false;
                autoplay();
            }
            else {
                s.wrapper.transitionEnd(function () {
                    if (!s) return;
                    s.autoplayPaused = false;
                    if (!s.autoplaying) {
                        s.stopAutoplay();
                    }
                    else {
                        autoplay();
                    }
                });
            }
        };
        /*=========================
          Min/Max Translate
          ===========================*/
        s.minTranslate = function () {
            return (-s.snapGrid[0]);
        };
        s.maxTranslate = function () {
            return (-s.snapGrid[s.snapGrid.length - 1]);
        };
        /*=========================
          Slider/slides sizes
          ===========================*/
        s.updateAutoHeight = function () {
            // Update Height
            var slide = s.slides.eq(s.activeIndex)[0];
            if (typeof slide !== 'undefined') {
                var newHeight = slide.offsetHeight;
                if (newHeight) s.wrapper.css('height', newHeight + 'px');
            }
        };
        s.updateContainerSize = function () {
            var width, height;
            if (typeof s.params.width !== 'undefined') {
                width = s.params.width;
            }
            else {
                width = s.container[0].clientWidth;
            }
            if (typeof s.params.height !== 'undefined') {
                height = s.params.height;
            }
            else {
                height = s.container[0].clientHeight;
            }
            if (width === 0 && s.isHorizontal() || height === 0 && !s.isHorizontal()) {
                return;
            }
        
            //Subtract paddings
            width = width - parseInt(s.container.css('padding-left'), 10) - parseInt(s.container.css('padding-right'), 10);
            height = height - parseInt(s.container.css('padding-top'), 10) - parseInt(s.container.css('padding-bottom'), 10);
        
            // Store values
            s.width = width;
            s.height = height;
            s.size = s.isHorizontal() ? s.width : s.height;
        };
        
        s.updateSlidesSize = function () {
            s.slides = s.wrapper.children('.' + s.params.slideClass);
            s.snapGrid = [];
            s.slidesGrid = [];
            s.slidesSizesGrid = [];
        
            var spaceBetween = s.params.spaceBetween,
                slidePosition = -s.params.slidesOffsetBefore,
                i,
                prevSlideSize = 0,
                index = 0;
            if (typeof s.size === 'undefined') return;
            if (typeof spaceBetween === 'string' && spaceBetween.indexOf('%') >= 0) {
                spaceBetween = parseFloat(spaceBetween.replace('%', '')) / 100 * s.size;
            }
        
            s.virtualSize = -spaceBetween;
            // reset margins
            if (s.rtl) s.slides.css({marginLeft: '', marginTop: ''});
            else s.slides.css({marginRight: '', marginBottom: ''});
        
            var slidesNumberEvenToRows;
            if (s.params.slidesPerColumn > 1) {
                if (Math.floor(s.slides.length / s.params.slidesPerColumn) === s.slides.length / s.params.slidesPerColumn) {
                    slidesNumberEvenToRows = s.slides.length;
                }
                else {
                    slidesNumberEvenToRows = Math.ceil(s.slides.length / s.params.slidesPerColumn) * s.params.slidesPerColumn;
                }
                if (s.params.slidesPerView !== 'auto' && s.params.slidesPerColumnFill === 'row') {
                    slidesNumberEvenToRows = Math.max(slidesNumberEvenToRows, s.params.slidesPerView * s.params.slidesPerColumn);
                }
            }
        
            // Calc slides
            var slideSize;
            var slidesPerColumn = s.params.slidesPerColumn;
            var slidesPerRow = slidesNumberEvenToRows / slidesPerColumn;
            var numFullColumns = slidesPerRow - (s.params.slidesPerColumn * slidesPerRow - s.slides.length);
            for (i = 0; i < s.slides.length; i++) {
                slideSize = 0;
                var slide = s.slides.eq(i);
                if (s.params.slidesPerColumn > 1) {
                    // Set slides order
                    var newSlideOrderIndex;
                    var column, row;
                    if (s.params.slidesPerColumnFill === 'column') {
                        column = Math.floor(i / slidesPerColumn);
                        row = i - column * slidesPerColumn;
                        if (column > numFullColumns || (column === numFullColumns && row === slidesPerColumn-1)) {
                            if (++row >= slidesPerColumn) {
                                row = 0;
                                column++;
                            }
                        }
                        newSlideOrderIndex = column + row * slidesNumberEvenToRows / slidesPerColumn;
                        slide
                            .css({
                                '-webkit-box-ordinal-group': newSlideOrderIndex,
                                '-moz-box-ordinal-group': newSlideOrderIndex,
                                '-ms-flex-order': newSlideOrderIndex,
                                '-webkit-order': newSlideOrderIndex,
                                'order': newSlideOrderIndex
                            });
                    }
                    else {
                        row = Math.floor(i / slidesPerRow);
                        column = i - row * slidesPerRow;
                    }
                    slide
                        .css({
                            'margin-top': (row !== 0 && s.params.spaceBetween) && (s.params.spaceBetween + 'px')
                        })
                        .attr('data-swiper-column', column)
                        .attr('data-swiper-row', row);
        
                }
                if (slide.css('display') === 'none') continue;
                if (s.params.slidesPerView === 'auto') {
                    slideSize = s.isHorizontal() ? slide.outerWidth(true) : slide.outerHeight(true);
                    if (s.params.roundLengths) slideSize = round(slideSize);
                }
                else {
                    slideSize = (s.size - (s.params.slidesPerView - 1) * spaceBetween) / s.params.slidesPerView;
                    if (s.params.roundLengths) slideSize = round(slideSize);
        
                    if (s.isHorizontal()) {
                        s.slides[i].style.width = slideSize + 'px';
                    }
                    else {
                        s.slides[i].style.height = slideSize + 'px';
                    }
                }
                s.slides[i].swiperSlideSize = slideSize;
                s.slidesSizesGrid.push(slideSize);
        
        
                if (s.params.centeredSlides) {
                    slidePosition = slidePosition + slideSize / 2 + prevSlideSize / 2 + spaceBetween;
                    if (i === 0) slidePosition = slidePosition - s.size / 2 - spaceBetween;
                    if (Math.abs(slidePosition) < 1 / 1000) slidePosition = 0;
                    if ((index) % s.params.slidesPerGroup === 0) s.snapGrid.push(slidePosition);
                    s.slidesGrid.push(slidePosition);
                }
                else {
                    if ((index) % s.params.slidesPerGroup === 0) s.snapGrid.push(slidePosition);
                    s.slidesGrid.push(slidePosition);
                    slidePosition = slidePosition + slideSize + spaceBetween;
                }
        
                s.virtualSize += slideSize + spaceBetween;
        
                prevSlideSize = slideSize;
        
                index ++;
            }
            s.virtualSize = Math.max(s.virtualSize, s.size) + s.params.slidesOffsetAfter;
            var newSlidesGrid;
        
            if (
                s.rtl && s.wrongRTL && (s.params.effect === 'slide' || s.params.effect === 'coverflow')) {
                s.wrapper.css({width: s.virtualSize + s.params.spaceBetween + 'px'});
            }
            if (!s.support.flexbox || s.params.setWrapperSize) {
                if (s.isHorizontal()) s.wrapper.css({width: s.virtualSize + s.params.spaceBetween + 'px'});
                else s.wrapper.css({height: s.virtualSize + s.params.spaceBetween + 'px'});
            }
        
            if (s.params.slidesPerColumn > 1) {
                s.virtualSize = (slideSize + s.params.spaceBetween) * slidesNumberEvenToRows;
                s.virtualSize = Math.ceil(s.virtualSize / s.params.slidesPerColumn) - s.params.spaceBetween;
                s.wrapper.css({width: s.virtualSize + s.params.spaceBetween + 'px'});
                if (s.params.centeredSlides) {
                    newSlidesGrid = [];
                    for (i = 0; i < s.snapGrid.length; i++) {
                        if (s.snapGrid[i] < s.virtualSize + s.snapGrid[0]) newSlidesGrid.push(s.snapGrid[i]);
                    }
                    s.snapGrid = newSlidesGrid;
                }
            }
        
            // Remove last grid elements depending on width
            if (!s.params.centeredSlides) {
                newSlidesGrid = [];
                for (i = 0; i < s.snapGrid.length; i++) {
                    if (s.snapGrid[i] <= s.virtualSize - s.size) {
                        newSlidesGrid.push(s.snapGrid[i]);
                    }
                }
                s.snapGrid = newSlidesGrid;
                if (Math.floor(s.virtualSize - s.size) - Math.floor(s.snapGrid[s.snapGrid.length - 1]) > 1) {
                    s.snapGrid.push(s.virtualSize - s.size);
                }
            }
            if (s.snapGrid.length === 0) s.snapGrid = [0];
        
            if (s.params.spaceBetween !== 0) {
                if (s.isHorizontal()) {
                    if (s.rtl) s.slides.css({marginLeft: spaceBetween + 'px'});
                    else s.slides.css({marginRight: spaceBetween + 'px'});
                }
                else s.slides.css({marginBottom: spaceBetween + 'px'});
            }
            if (s.params.watchSlidesProgress) {
                s.updateSlidesOffset();
            }
        };
        s.updateSlidesOffset = function () {
            for (var i = 0; i < s.slides.length; i++) {
                s.slides[i].swiperSlideOffset = s.isHorizontal() ? s.slides[i].offsetLeft : s.slides[i].offsetTop;
            }
        };
        
        /*=========================
          Slider/slides progress
          ===========================*/
        s.updateSlidesProgress = function (translate) {
            if (typeof translate === 'undefined') {
                translate = s.translate || 0;
            }
            if (s.slides.length === 0) return;
            if (typeof s.slides[0].swiperSlideOffset === 'undefined') s.updateSlidesOffset();
        
            var offsetCenter = -translate;
            if (s.rtl) offsetCenter = translate;
        
            // Visible Slides
            s.slides.removeClass(s.params.slideVisibleClass);
            for (var i = 0; i < s.slides.length; i++) {
                var slide = s.slides[i];
                var slideProgress = (offsetCenter - slide.swiperSlideOffset) / (slide.swiperSlideSize + s.params.spaceBetween);
                if (s.params.watchSlidesVisibility) {
                    var slideBefore = -(offsetCenter - slide.swiperSlideOffset);
                    var slideAfter = slideBefore + s.slidesSizesGrid[i];
                    var isVisible =
                        (slideBefore >= 0 && slideBefore < s.size) ||
                        (slideAfter > 0 && slideAfter <= s.size) ||
                        (slideBefore <= 0 && slideAfter >= s.size);
                    if (isVisible) {
                        s.slides.eq(i).addClass(s.params.slideVisibleClass);
                    }
                }
                slide.progress = s.rtl ? -slideProgress : slideProgress;
            }
        };
        s.updateProgress = function (translate) {
            if (typeof translate === 'undefined') {
                translate = s.translate || 0;
            }
            var translatesDiff = s.maxTranslate() - s.minTranslate();
            var wasBeginning = s.isBeginning;
            var wasEnd = s.isEnd;
            if (translatesDiff === 0) {
                s.progress = 0;
                s.isBeginning = s.isEnd = true;
            }
            else {
                s.progress = (translate - s.minTranslate()) / (translatesDiff);
                s.isBeginning = s.progress <= 0;
                s.isEnd = s.progress >= 1;
            }
            if (s.isBeginning && !wasBeginning) s.emit('onReachBeginning', s);
            if (s.isEnd && !wasEnd) s.emit('onReachEnd', s);
        
            if (s.params.watchSlidesProgress) s.updateSlidesProgress(translate);
            s.emit('onProgress', s, s.progress);
        };
        s.updateActiveIndex = function () {
            var translate = s.rtl ? s.translate : -s.translate;
            var newActiveIndex, i, snapIndex;
            for (i = 0; i < s.slidesGrid.length; i ++) {
                if (typeof s.slidesGrid[i + 1] !== 'undefined') {
                    if (translate >= s.slidesGrid[i] && translate < s.slidesGrid[i + 1] - (s.slidesGrid[i + 1] - s.slidesGrid[i]) / 2) {
                        newActiveIndex = i;
                    }
                    else if (translate >= s.slidesGrid[i] && translate < s.slidesGrid[i + 1]) {
                        newActiveIndex = i + 1;
                    }
                }
                else {
                    if (translate >= s.slidesGrid[i]) {
                        newActiveIndex = i;
                    }
                }
            }
            // Normalize slideIndex
            if (newActiveIndex < 0 || typeof newActiveIndex === 'undefined') newActiveIndex = 0;
            // for (i = 0; i < s.slidesGrid.length; i++) {
                // if (- translate >= s.slidesGrid[i]) {
                    // newActiveIndex = i;
                // }
            // }
            snapIndex = Math.floor(newActiveIndex / s.params.slidesPerGroup);
            if (snapIndex >= s.snapGrid.length) snapIndex = s.snapGrid.length - 1;
        
            if (newActiveIndex === s.activeIndex) {
                return;
            }
            s.snapIndex = snapIndex;
            s.previousIndex = s.activeIndex;
            s.activeIndex = newActiveIndex;
            s.updateClasses();
        };
        
        /*=========================
          Classes
          ===========================*/
        s.updateClasses = function () {
            s.slides.removeClass(s.params.slideActiveClass + ' ' + s.params.slideNextClass + ' ' + s.params.slidePrevClass);
            var activeSlide = s.slides.eq(s.activeIndex);
            // Active classes
            activeSlide.addClass(s.params.slideActiveClass);
            // Next Slide
            var nextSlide = activeSlide.next('.' + s.params.slideClass).addClass(s.params.slideNextClass);
            if (s.params.loop && nextSlide.length === 0) {
                s.slides.eq(0).addClass(s.params.slideNextClass);
            }
            // Prev Slide
            var prevSlide = activeSlide.prev('.' + s.params.slideClass).addClass(s.params.slidePrevClass);
            if (s.params.loop && prevSlide.length === 0) {
                s.slides.eq(-1).addClass(s.params.slidePrevClass);
            }
        
            // Pagination
            if (s.paginationContainer && s.paginationContainer.length > 0) {
                // Current/Total
                var current,
                    total = s.params.loop ? Math.ceil((s.slides.length - s.loopedSlides * 2) / s.params.slidesPerGroup) : s.snapGrid.length;
                if (s.params.loop) {
                    current = Math.ceil((s.activeIndex - s.loopedSlides)/s.params.slidesPerGroup);
                    if (current > s.slides.length - 1 - s.loopedSlides * 2) {
                        current = current - (s.slides.length - s.loopedSlides * 2);
                    }
                    if (current > total - 1) current = current - total;
                    if (current < 0 && s.params.paginationType !== 'bullets') current = total + current;
                }
                else {
                    if (typeof s.snapIndex !== 'undefined') {
                        current = s.snapIndex;
                    }
                    else {
                        current = s.activeIndex || 0;
                    }
                }
                // Types
                if (s.params.paginationType === 'bullets' && s.bullets && s.bullets.length > 0) {
                    s.bullets.removeClass(s.params.bulletActiveClass);
                    if (s.paginationContainer.length > 1) {
                        s.bullets.each(function () {
                            if ($(this).index() === current) $(this).addClass(s.params.bulletActiveClass);
                        });
                    }
                    else {
                        s.bullets.eq(current).addClass(s.params.bulletActiveClass);
                    }
                }
                if (s.params.paginationType === 'fraction') {
                    s.paginationContainer.find('.' + s.params.paginationCurrentClass).text(current + 1);
                    s.paginationContainer.find('.' + s.params.paginationTotalClass).text(total);
                }
                if (s.params.paginationType === 'progress') {
                    var scale = (current + 1) / total,
                        scaleX = scale,
                        scaleY = 1;
                    if (!s.isHorizontal()) {
                        scaleY = scale;
                        scaleX = 1;
                    }
                    s.paginationContainer.find('.' + s.params.paginationProgressbarClass).transform('translate3d(0,0,0) scaleX(' + scaleX + ') scaleY(' + scaleY + ')').transition(s.params.speed);
                }
                if (s.params.paginationType === 'custom' && s.params.paginationCustomRender) {
                    s.paginationContainer.html(s.params.paginationCustomRender(s, current + 1, total));
                    s.emit('onPaginationRendered', s, s.paginationContainer[0]);
                }
            }
        
            // Next/active buttons
            if (!s.params.loop) {
                if (s.params.prevButton && s.prevButton && s.prevButton.length > 0) {
                    if (s.isBeginning) {
                        s.prevButton.addClass(s.params.buttonDisabledClass);
                        if (s.params.a11y && s.a11y) s.a11y.disable(s.prevButton);
                    }
                    else {
                        s.prevButton.removeClass(s.params.buttonDisabledClass);
                        if (s.params.a11y && s.a11y) s.a11y.enable(s.prevButton);
                    }
                }
                if (s.params.nextButton && s.nextButton && s.nextButton.length > 0) {
                    if (s.isEnd) {
                        s.nextButton.addClass(s.params.buttonDisabledClass);
                        if (s.params.a11y && s.a11y) s.a11y.disable(s.nextButton);
                    }
                    else {
                        s.nextButton.removeClass(s.params.buttonDisabledClass);
                        if (s.params.a11y && s.a11y) s.a11y.enable(s.nextButton);
                    }
                }
            }
        };
        
        /*=========================
          Pagination
          ===========================*/
        s.updatePagination = function () {
            if (!s.params.pagination) return;
            if (s.paginationContainer && s.paginationContainer.length > 0) {
                var paginationHTML = '';
                if (s.params.paginationType === 'bullets') {
                    var numberOfBullets = s.params.loop ? Math.ceil((s.slides.length - s.loopedSlides * 2) / s.params.slidesPerGroup) : s.snapGrid.length;
                    for (var i = 0; i < numberOfBullets; i++) {
                        if (s.params.paginationBulletRender) {
                            paginationHTML += s.params.paginationBulletRender(i, s.params.bulletClass);
                        }
                        else {
                            paginationHTML += '<' + s.params.paginationElement+' class="' + s.params.bulletClass + '"></' + s.params.paginationElement + '>';
                        }
                    }
                    s.paginationContainer.html(paginationHTML);
                    s.bullets = s.paginationContainer.find('.' + s.params.bulletClass);
                    if (s.params.paginationClickable && s.params.a11y && s.a11y) {
                        s.a11y.initPagination();
                    }
                }
                if (s.params.paginationType === 'fraction') {
                    if (s.params.paginationFractionRender) {
                        paginationHTML = s.params.paginationFractionRender(s, s.params.paginationCurrentClass, s.params.paginationTotalClass);
                    }
                    else {
                        paginationHTML =
                            '<span class="' + s.params.paginationCurrentClass + '"></span>' +
                            ' / ' +
                            '<span class="' + s.params.paginationTotalClass+'"></span>';
                    }
                    s.paginationContainer.html(paginationHTML);
                }
                if (s.params.paginationType === 'progress') {
                    if (s.params.paginationProgressRender) {
                        paginationHTML = s.params.paginationProgressRender(s, s.params.paginationProgressbarClass);
                    }
                    else {
                        paginationHTML = '<span class="' + s.params.paginationProgressbarClass + '"></span>';
                    }
                    s.paginationContainer.html(paginationHTML);
                }
                if (s.params.paginationType !== 'custom') {
                    s.emit('onPaginationRendered', s, s.paginationContainer[0]);
                }
            }
        };
        /*=========================
          Common update method
          ===========================*/
        s.update = function (updateTranslate) {
            s.updateContainerSize();
            s.updateSlidesSize();
            s.updateProgress();
            s.updatePagination();
            s.updateClasses();
            if (s.params.scrollbar && s.scrollbar) {
                s.scrollbar.set();
            }
            function forceSetTranslate() {
                newTranslate = Math.min(Math.max(s.translate, s.maxTranslate()), s.minTranslate());
                s.setWrapperTranslate(newTranslate);
                s.updateActiveIndex();
                s.updateClasses();
            }
            if (updateTranslate) {
                var translated, newTranslate;
                if (s.controller && s.controller.spline) {
                    s.controller.spline = undefined;
                }
                if (s.params.freeMode) {
                    forceSetTranslate();
                    if (s.params.autoHeight) {
                        s.updateAutoHeight();
                    }
                }
                else {
                    if ((s.params.slidesPerView === 'auto' || s.params.slidesPerView > 1) && s.isEnd && !s.params.centeredSlides) {
                        translated = s.slideTo(s.slides.length - 1, 0, false, true);
                    }
                    else {
                        translated = s.slideTo(s.activeIndex, 0, false, true);
                    }
                    if (!translated) {
                        forceSetTranslate();
                    }
                }
            }
            else if (s.params.autoHeight) {
                s.updateAutoHeight();
            }
        };
        
        /*=========================
          Resize Handler
          ===========================*/
        s.onResize = function (forceUpdatePagination) {
            //Breakpoints
            if (s.params.breakpoints) {
                s.setBreakpoint();
            }
        
            // Disable locks on resize
            var allowSwipeToPrev = s.params.allowSwipeToPrev;
            var allowSwipeToNext = s.params.allowSwipeToNext;
            s.params.allowSwipeToPrev = s.params.allowSwipeToNext = true;
        
            s.updateContainerSize();
            s.updateSlidesSize();
            if (s.params.slidesPerView === 'auto' || s.params.freeMode || forceUpdatePagination) s.updatePagination();
            if (s.params.scrollbar && s.scrollbar) {
                s.scrollbar.set();
            }
            if (s.controller && s.controller.spline) {
                s.controller.spline = undefined;
            }
            var slideChangedBySlideTo = false;
            if (s.params.freeMode) {
                var newTranslate = Math.min(Math.max(s.translate, s.maxTranslate()), s.minTranslate());
                s.setWrapperTranslate(newTranslate);
                s.updateActiveIndex();
                s.updateClasses();
        
                if (s.params.autoHeight) {
                    s.updateAutoHeight();
                }
            }
            else {
                s.updateClasses();
                if ((s.params.slidesPerView === 'auto' || s.params.slidesPerView > 1) && s.isEnd && !s.params.centeredSlides) {
                    slideChangedBySlideTo = s.slideTo(s.slides.length - 1, 0, false, true);
                }
                else {
                    slideChangedBySlideTo = s.slideTo(s.activeIndex, 0, false, true);
                }
            }
            if (s.params.lazyLoading && !slideChangedBySlideTo && s.lazy) {
                s.lazy.load();
            }
            // Return locks after resize
            s.params.allowSwipeToPrev = allowSwipeToPrev;
            s.params.allowSwipeToNext = allowSwipeToNext;
        };
        
        /*=========================
          Events
          ===========================*/
        
        //Define Touch Events
        var desktopEvents = ['mousedown', 'mousemove', 'mouseup'];
        if (window.navigator.pointerEnabled) desktopEvents = ['pointerdown', 'pointermove', 'pointerup'];
        else if (window.navigator.msPointerEnabled) desktopEvents = ['MSPointerDown', 'MSPointerMove', 'MSPointerUp'];
        s.touchEvents = {
            start : s.support.touch || !s.params.simulateTouch  ? 'touchstart' : desktopEvents[0],
            move : s.support.touch || !s.params.simulateTouch ? 'touchmove' : desktopEvents[1],
            end : s.support.touch || !s.params.simulateTouch ? 'touchend' : desktopEvents[2]
        };
        
        
        // WP8 Touch Events Fix
        if (window.navigator.pointerEnabled || window.navigator.msPointerEnabled) {
            (s.params.touchEventsTarget === 'container' ? s.container : s.wrapper).addClass('swiper-wp8-' + s.params.direction);
        }
        
        // Attach/detach events
        s.initEvents = function (detach) {
            var actionDom = detach ? 'off' : 'on';
            var action = detach ? 'removeEventListener' : 'addEventListener';
            var touchEventsTarget = s.params.touchEventsTarget === 'container' ? s.container[0] : s.wrapper[0];
            var target = s.support.touch ? touchEventsTarget : document;
        
            var moveCapture = s.params.nested ? true : false;
        
            //Touch Events
            if (s.browser.ie) {
                touchEventsTarget[action](s.touchEvents.start, s.onTouchStart, false);
                target[action](s.touchEvents.move, s.onTouchMove, moveCapture);
                target[action](s.touchEvents.end, s.onTouchEnd, false);
            }
            else {
                if (s.support.touch) {
                    touchEventsTarget[action](s.touchEvents.start, s.onTouchStart, false);
                    touchEventsTarget[action](s.touchEvents.move, s.onTouchMove, moveCapture);
                    touchEventsTarget[action](s.touchEvents.end, s.onTouchEnd, false);
                }
                if (params.simulateTouch && !s.device.ios && !s.device.android) {
                    touchEventsTarget[action]('mousedown', s.onTouchStart, false);
                    document[action]('mousemove', s.onTouchMove, moveCapture);
                    document[action]('mouseup', s.onTouchEnd, false);
                }
            }
            window[action]('resize', s.onResize);
        
            // Next, Prev, Index
            if (s.params.nextButton && s.nextButton && s.nextButton.length > 0) {
                s.nextButton[actionDom]('click', s.onClickNext);
                if (s.params.a11y && s.a11y) s.nextButton[actionDom]('keydown', s.a11y.onEnterKey);
            }
            if (s.params.prevButton && s.prevButton && s.prevButton.length > 0) {
                s.prevButton[actionDom]('click', s.onClickPrev);
                if (s.params.a11y && s.a11y) s.prevButton[actionDom]('keydown', s.a11y.onEnterKey);
            }
            if (s.params.pagination && s.params.paginationClickable) {
                s.paginationContainer[actionDom]('click', '.' + s.params.bulletClass, s.onClickIndex);
                if (s.params.a11y && s.a11y) s.paginationContainer[actionDom]('keydown', '.' + s.params.bulletClass, s.a11y.onEnterKey);
            }
        
            // Prevent Links Clicks
            if (s.params.preventClicks || s.params.preventClicksPropagation) touchEventsTarget[action]('click', s.preventClicks, true);
        };
        s.attachEvents = function () {
            s.initEvents();
        };
        s.detachEvents = function () {
            s.initEvents(true);
        };
        
        /*=========================
          Handle Clicks
          ===========================*/
        // Prevent Clicks
        s.allowClick = true;
        s.preventClicks = function (e) {
            if (!s.allowClick) {
                if (s.params.preventClicks) e.preventDefault();
                if (s.params.preventClicksPropagation && s.animating) {
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                }
            }
        };
        // Clicks
        s.onClickNext = function (e) {
            e.preventDefault();
            if (s.isEnd && !s.params.loop) return;
            s.slideNext();
        };
        s.onClickPrev = function (e) {
            e.preventDefault();
            if (s.isBeginning && !s.params.loop) return;
            s.slidePrev();
        };
        s.onClickIndex = function (e) {
            e.preventDefault();
            var index = $(this).index() * s.params.slidesPerGroup;
            if (s.params.loop) index = index + s.loopedSlides;
            s.slideTo(index);
        };
        
        /*=========================
          Handle Touches
          ===========================*/
        function findElementInEvent(e, selector) {
            var el = $(e.target);
            if (!el.is(selector)) {
                if (typeof selector === 'string') {
                    el = el.parents(selector);
                }
                else if (selector.nodeType) {
                    var found;
                    el.parents().each(function (index, _el) {
                        if (_el === selector) found = selector;
                    });
                    if (!found) return undefined;
                    else return selector;
                }
            }
            if (el.length === 0) {
                return undefined;
            }
            return el[0];
        }
        s.updateClickedSlide = function (e) {
            var slide = findElementInEvent(e, '.' + s.params.slideClass);
            var slideFound = false;
            if (slide) {
                for (var i = 0; i < s.slides.length; i++) {
                    if (s.slides[i] === slide) slideFound = true;
                }
            }
        
            if (slide && slideFound) {
                s.clickedSlide = slide;
                s.clickedIndex = $(slide).index();
            }
            else {
                s.clickedSlide = undefined;
                s.clickedIndex = undefined;
                return;
            }
            if (s.params.slideToClickedSlide && s.clickedIndex !== undefined && s.clickedIndex !== s.activeIndex) {
                var slideToIndex = s.clickedIndex,
                    realIndex,
                    duplicatedSlides;
                if (s.params.loop) {
                    if (s.animating) return;
                    realIndex = $(s.clickedSlide).attr('data-swiper-slide-index');
                    if (s.params.centeredSlides) {
                        if ((slideToIndex < s.loopedSlides - s.params.slidesPerView/2) || (slideToIndex > s.slides.length - s.loopedSlides + s.params.slidesPerView/2)) {
                            s.fixLoop();
                            slideToIndex = s.wrapper.children('.' + s.params.slideClass + '[data-swiper-slide-index="' + realIndex + '"]:not(.swiper-slide-duplicate)').eq(0).index();
                            setTimeout(function () {
                                s.slideTo(slideToIndex);
                            }, 0);
                        }
                        else {
                            s.slideTo(slideToIndex);
                        }
                    }
                    else {
                        if (slideToIndex > s.slides.length - s.params.slidesPerView) {
                            s.fixLoop();
                            slideToIndex = s.wrapper.children('.' + s.params.slideClass + '[data-swiper-slide-index="' + realIndex + '"]:not(.swiper-slide-duplicate)').eq(0).index();
                            setTimeout(function () {
                                s.slideTo(slideToIndex);
                            }, 0);
                        }
                        else {
                            s.slideTo(slideToIndex);
                        }
                    }
                }
                else {
                    s.slideTo(slideToIndex);
                }
            }
        };
        
        var isTouched,
            isMoved,
            allowTouchCallbacks,
            touchStartTime,
            isScrolling,
            currentTranslate,
            startTranslate,
            allowThresholdMove,
            // Form elements to match
            formElements = 'input, select, textarea, button',
            // Last click time
            lastClickTime = Date.now(), clickTimeout,
            //Velocities
            velocities = [],
            allowMomentumBounce;
        
        // Animating Flag
        s.animating = false;
        
        // Touches information
        s.touches = {
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            diff: 0
        };
        
        // Touch handlers
        var isTouchEvent, startMoving;
        s.onTouchStart = function (e) {
            if (e.originalEvent) e = e.originalEvent;
            isTouchEvent = e.type === 'touchstart';
            if (!isTouchEvent && 'which' in e && e.which === 3) return;
            if (s.params.noSwiping && findElementInEvent(e, '.' + s.params.noSwipingClass)) {
                s.allowClick = true;
                return;
            }
            if (s.params.swipeHandler) {
                if (!findElementInEvent(e, s.params.swipeHandler)) return;
            }
        
            var startX = s.touches.currentX = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
            var startY = s.touches.currentY = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
        
            // Do NOT start if iOS edge swipe is detected. Otherwise iOS app (UIWebView) cannot swipe-to-go-back anymore
            if(s.device.ios && s.params.iOSEdgeSwipeDetection && startX <= s.params.iOSEdgeSwipeThreshold) {
                return;
            }
        
            isTouched = true;
            isMoved = false;
            allowTouchCallbacks = true;
            isScrolling = undefined;
            startMoving = undefined;
            s.touches.startX = startX;
            s.touches.startY = startY;
            touchStartTime = Date.now();
            s.allowClick = true;
            s.updateContainerSize();
            s.swipeDirection = undefined;
            if (s.params.threshold > 0) allowThresholdMove = false;
            if (e.type !== 'touchstart') {
                var preventDefault = true;
                if ($(e.target).is(formElements)) preventDefault = false;
                if (document.activeElement && $(document.activeElement).is(formElements)) {
                    document.activeElement.blur();
                }
                if (preventDefault) {
                    e.preventDefault();
                }
            }
            s.emit('onTouchStart', s, e);
        };
        
        s.onTouchMove = function (e) {
            if (e.originalEvent) e = e.originalEvent;
            if (isTouchEvent && e.type === 'mousemove') return;
            if (e.preventedByNestedSwiper) {
                s.touches.startX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
                s.touches.startY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
                return;
            }
            if (s.params.onlyExternal) {
                // isMoved = true;
                s.allowClick = false;
                if (isTouched) {
                    s.touches.startX = s.touches.currentX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
                    s.touches.startY = s.touches.currentY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
                    touchStartTime = Date.now();
                }
                return;
            }
            if (isTouchEvent && document.activeElement) {
                if (e.target === document.activeElement && $(e.target).is(formElements)) {
                    isMoved = true;
                    s.allowClick = false;
                    return;
                }
            }
            if (allowTouchCallbacks) {
                s.emit('onTouchMove', s, e);
            }
            if (e.targetTouches && e.targetTouches.length > 1) return;
        
            s.touches.currentX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
            s.touches.currentY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
        
            if (typeof isScrolling === 'undefined') {
                var touchAngle = Math.atan2(Math.abs(s.touches.currentY - s.touches.startY), Math.abs(s.touches.currentX - s.touches.startX)) * 180 / Math.PI;
                isScrolling = s.isHorizontal() ? touchAngle > s.params.touchAngle : (90 - touchAngle > s.params.touchAngle);
            }
            if (isScrolling) {
                s.emit('onTouchMoveOpposite', s, e);
            }
            if (typeof startMoving === 'undefined' && s.browser.ieTouch) {
                if (s.touches.currentX !== s.touches.startX || s.touches.currentY !== s.touches.startY) {
                    startMoving = true;
                }
            }
            if (!isTouched) return;
            if (isScrolling)  {
                isTouched = false;
                return;
            }
            if (!startMoving && s.browser.ieTouch) {
                return;
            }
            s.allowClick = false;
            s.emit('onSliderMove', s, e);
            e.preventDefault();
            if (s.params.touchMoveStopPropagation && !s.params.nested) {
                e.stopPropagation();
            }
        
            if (!isMoved) {
                if (params.loop) {
                    s.fixLoop();
                }
                startTranslate = s.getWrapperTranslate();
                s.setWrapperTransition(0);
                if (s.animating) {
                    s.wrapper.trigger('webkitTransitionEnd transitionend oTransitionEnd MSTransitionEnd msTransitionEnd');
                }
                if (s.params.autoplay && s.autoplaying) {
                    if (s.params.autoplayDisableOnInteraction) {
                        s.stopAutoplay();
                    }
                    else {
                        s.pauseAutoplay();
                    }
                }
                allowMomentumBounce = false;
                //Grab Cursor
                if (s.params.grabCursor) {
                    s.container[0].style.cursor = 'move';
                    s.container[0].style.cursor = '-webkit-grabbing';
                    s.container[0].style.cursor = '-moz-grabbin';
                    s.container[0].style.cursor = 'grabbing';
                }
            }
            isMoved = true;
        
            var diff = s.touches.diff = s.isHorizontal() ? s.touches.currentX - s.touches.startX : s.touches.currentY - s.touches.startY;
        
            diff = diff * s.params.touchRatio;
            if (s.rtl) diff = -diff;
        
            s.swipeDirection = diff > 0 ? 'prev' : 'next';
            currentTranslate = diff + startTranslate;
        
            var disableParentSwiper = true;
            if ((diff > 0 && currentTranslate > s.minTranslate())) {
                disableParentSwiper = false;
                if (s.params.resistance) currentTranslate = s.minTranslate() - 1 + Math.pow(-s.minTranslate() + startTranslate + diff, s.params.resistanceRatio);
            }
            else if (diff < 0 && currentTranslate < s.maxTranslate()) {
                disableParentSwiper = false;
                if (s.params.resistance) currentTranslate = s.maxTranslate() + 1 - Math.pow(s.maxTranslate() - startTranslate - diff, s.params.resistanceRatio);
            }
        
            if (disableParentSwiper) {
                e.preventedByNestedSwiper = true;
            }
        
            // Directions locks
            if (!s.params.allowSwipeToNext && s.swipeDirection === 'next' && currentTranslate < startTranslate) {
                currentTranslate = startTranslate;
            }
            if (!s.params.allowSwipeToPrev && s.swipeDirection === 'prev' && currentTranslate > startTranslate) {
                currentTranslate = startTranslate;
            }
        
            if (!s.params.followFinger) return;
        
            // Threshold
            if (s.params.threshold > 0) {
                if (Math.abs(diff) > s.params.threshold || allowThresholdMove) {
                    if (!allowThresholdMove) {
                        allowThresholdMove = true;
                        s.touches.startX = s.touches.currentX;
                        s.touches.startY = s.touches.currentY;
                        currentTranslate = startTranslate;
                        s.touches.diff = s.isHorizontal() ? s.touches.currentX - s.touches.startX : s.touches.currentY - s.touches.startY;
                        return;
                    }
                }
                else {
                    currentTranslate = startTranslate;
                    return;
                }
            }
            // Update active index in free mode
            if (s.params.freeMode || s.params.watchSlidesProgress) {
                s.updateActiveIndex();
            }
            if (s.params.freeMode) {
                //Velocity
                if (velocities.length === 0) {
                    velocities.push({
                        position: s.touches[s.isHorizontal() ? 'startX' : 'startY'],
                        time: touchStartTime
                    });
                }
                velocities.push({
                    position: s.touches[s.isHorizontal() ? 'currentX' : 'currentY'],
                    time: (new window.Date()).getTime()
                });
            }
            // Update progress
            s.updateProgress(currentTranslate);
            // Update translate
            s.setWrapperTranslate(currentTranslate);
        };
        s.onTouchEnd = function (e) {
            if (e.originalEvent) e = e.originalEvent;
            if (allowTouchCallbacks) {
                s.emit('onTouchEnd', s, e);
            }
            allowTouchCallbacks = false;
            if (!isTouched) return;
            //Return Grab Cursor
            if (s.params.grabCursor && isMoved && isTouched) {
                s.container[0].style.cursor = 'move';
                s.container[0].style.cursor = '-webkit-grab';
                s.container[0].style.cursor = '-moz-grab';
                s.container[0].style.cursor = 'grab';
            }
        
            // Time diff
            var touchEndTime = Date.now();
            var timeDiff = touchEndTime - touchStartTime;
        
            // Tap, doubleTap, Click
            if (s.allowClick) {
                s.updateClickedSlide(e);
                s.emit('onTap', s, e);
                if (timeDiff < 300 && (touchEndTime - lastClickTime) > 300) {
                    if (clickTimeout) clearTimeout(clickTimeout);
                    clickTimeout = setTimeout(function () {
                        if (!s) return;
                        if (s.params.paginationHide && s.paginationContainer.length > 0 && !$(e.target).hasClass(s.params.bulletClass)) {
                            s.paginationContainer.toggleClass(s.params.paginationHiddenClass);
                        }
                        s.emit('onClick', s, e);
                    }, 300);
        
                }
                if (timeDiff < 300 && (touchEndTime - lastClickTime) < 300) {
                    if (clickTimeout) clearTimeout(clickTimeout);
                    s.emit('onDoubleTap', s, e);
                }
            }
        
            lastClickTime = Date.now();
            setTimeout(function () {
                if (s) s.allowClick = true;
            }, 0);
        
            if (!isTouched || !isMoved || !s.swipeDirection || s.touches.diff === 0 || currentTranslate === startTranslate) {
                isTouched = isMoved = false;
                return;
            }
            isTouched = isMoved = false;
        
            var currentPos;
            if (s.params.followFinger) {
                currentPos = s.rtl ? s.translate : -s.translate;
            }
            else {
                currentPos = -currentTranslate;
            }
            if (s.params.freeMode) {
                if (currentPos < -s.minTranslate()) {
                    s.slideTo(s.activeIndex);
                    return;
                }
                else if (currentPos > -s.maxTranslate()) {
                    if (s.slides.length < s.snapGrid.length) {
                        s.slideTo(s.snapGrid.length - 1);
                    }
                    else {
                        s.slideTo(s.slides.length - 1);
                    }
                    return;
                }
        
                if (s.params.freeModeMomentum) {
                    if (velocities.length > 1) {
                        var lastMoveEvent = velocities.pop(), velocityEvent = velocities.pop();
        
                        var distance = lastMoveEvent.position - velocityEvent.position;
                        var time = lastMoveEvent.time - velocityEvent.time;
                        s.velocity = distance / time;
                        s.velocity = s.velocity / 2;
                        if (Math.abs(s.velocity) < s.params.freeModeMinimumVelocity) {
                            s.velocity = 0;
                        }
                        // this implies that the user stopped moving a finger then released.
                        // There would be no events with distance zero, so the last event is stale.
                        if (time > 150 || (new window.Date().getTime() - lastMoveEvent.time) > 300) {
                            s.velocity = 0;
                        }
                    } else {
                        s.velocity = 0;
                    }
        
                    velocities.length = 0;
                    var momentumDuration = 1000 * s.params.freeModeMomentumRatio;
                    var momentumDistance = s.velocity * momentumDuration;
        
                    var newPosition = s.translate + momentumDistance;
                    if (s.rtl) newPosition = - newPosition;
                    var doBounce = false;
                    var afterBouncePosition;
                    var bounceAmount = Math.abs(s.velocity) * 20 * s.params.freeModeMomentumBounceRatio;
                    if (newPosition < s.maxTranslate()) {
                        if (s.params.freeModeMomentumBounce) {
                            if (newPosition + s.maxTranslate() < -bounceAmount) {
                                newPosition = s.maxTranslate() - bounceAmount;
                            }
                            afterBouncePosition = s.maxTranslate();
                            doBounce = true;
                            allowMomentumBounce = true;
                        }
                        else {
                            newPosition = s.maxTranslate();
                        }
                    }
                    else if (newPosition > s.minTranslate()) {
                        if (s.params.freeModeMomentumBounce) {
                            if (newPosition - s.minTranslate() > bounceAmount) {
                                newPosition = s.minTranslate() + bounceAmount;
                            }
                            afterBouncePosition = s.minTranslate();
                            doBounce = true;
                            allowMomentumBounce = true;
                        }
                        else {
                            newPosition = s.minTranslate();
                        }
                    }
                    else if (s.params.freeModeSticky) {
                        var j = 0,
                            nextSlide;
                        for (j = 0; j < s.snapGrid.length; j += 1) {
                            if (s.snapGrid[j] > -newPosition) {
                                nextSlide = j;
                                break;
                            }
        
                        }
                        if (Math.abs(s.snapGrid[nextSlide] - newPosition) < Math.abs(s.snapGrid[nextSlide - 1] - newPosition) || s.swipeDirection === 'next') {
                            newPosition = s.snapGrid[nextSlide];
                        } else {
                            newPosition = s.snapGrid[nextSlide - 1];
                        }
                        if (!s.rtl) newPosition = - newPosition;
                    }
                    //Fix duration
                    if (s.velocity !== 0) {
                        if (s.rtl) {
                            momentumDuration = Math.abs((-newPosition - s.translate) / s.velocity);
                        }
                        else {
                            momentumDuration = Math.abs((newPosition - s.translate) / s.velocity);
                        }
                    }
                    else if (s.params.freeModeSticky) {
                        s.slideReset();
                        return;
                    }
        
                    if (s.params.freeModeMomentumBounce && doBounce) {
                        s.updateProgress(afterBouncePosition);
                        s.setWrapperTransition(momentumDuration);
                        s.setWrapperTranslate(newPosition);
                        s.onTransitionStart();
                        s.animating = true;
                        s.wrapper.transitionEnd(function () {
                            if (!s || !allowMomentumBounce) return;
                            s.emit('onMomentumBounce', s);
        
                            s.setWrapperTransition(s.params.speed);
                            s.setWrapperTranslate(afterBouncePosition);
                            s.wrapper.transitionEnd(function () {
                                if (!s) return;
                                s.onTransitionEnd();
                            });
                        });
                    } else if (s.velocity) {
                        s.updateProgress(newPosition);
                        s.setWrapperTransition(momentumDuration);
                        s.setWrapperTranslate(newPosition);
                        s.onTransitionStart();
                        if (!s.animating) {
                            s.animating = true;
                            s.wrapper.transitionEnd(function () {
                                if (!s) return;
                                s.onTransitionEnd();
                            });
                        }
        
                    } else {
                        s.updateProgress(newPosition);
                    }
        
                    s.updateActiveIndex();
                }
                if (!s.params.freeModeMomentum || timeDiff >= s.params.longSwipesMs) {
                    s.updateProgress();
                    s.updateActiveIndex();
                }
                return;
            }
        
            // Find current slide
            var i, stopIndex = 0, groupSize = s.slidesSizesGrid[0];
            for (i = 0; i < s.slidesGrid.length; i += s.params.slidesPerGroup) {
                if (typeof s.slidesGrid[i + s.params.slidesPerGroup] !== 'undefined') {
                    if (currentPos >= s.slidesGrid[i] && currentPos < s.slidesGrid[i + s.params.slidesPerGroup]) {
                        stopIndex = i;
                        groupSize = s.slidesGrid[i + s.params.slidesPerGroup] - s.slidesGrid[i];
                    }
                }
                else {
                    if (currentPos >= s.slidesGrid[i]) {
                        stopIndex = i;
                        groupSize = s.slidesGrid[s.slidesGrid.length - 1] - s.slidesGrid[s.slidesGrid.length - 2];
                    }
                }
            }
        
            // Find current slide size
            var ratio = (currentPos - s.slidesGrid[stopIndex]) / groupSize;
        
            if (timeDiff > s.params.longSwipesMs) {
                // Long touches
                if (!s.params.longSwipes) {
                    s.slideTo(s.activeIndex);
                    return;
                }
                if (s.swipeDirection === 'next') {
                    if (ratio >= s.params.longSwipesRatio) s.slideTo(stopIndex + s.params.slidesPerGroup);
                    else s.slideTo(stopIndex);
        
                }
                if (s.swipeDirection === 'prev') {
                    if (ratio > (1 - s.params.longSwipesRatio)) s.slideTo(stopIndex + s.params.slidesPerGroup);
                    else s.slideTo(stopIndex);
                }
            }
            else {
                // Short swipes
                if (!s.params.shortSwipes) {
                    s.slideTo(s.activeIndex);
                    return;
                }
                if (s.swipeDirection === 'next') {
                    s.slideTo(stopIndex + s.params.slidesPerGroup);
        
                }
                if (s.swipeDirection === 'prev') {
                    s.slideTo(stopIndex);
                }
            }
        };
        /*=========================
          Transitions
          ===========================*/
        s._slideTo = function (slideIndex, speed) {
            return s.slideTo(slideIndex, speed, true, true);
        };
        s.slideTo = function (slideIndex, speed, runCallbacks, internal) {
            if (typeof runCallbacks === 'undefined') runCallbacks = true;
            if (typeof slideIndex === 'undefined') slideIndex = 0;
            if (slideIndex < 0) slideIndex = 0;
            s.snapIndex = Math.floor(slideIndex / s.params.slidesPerGroup);
            if (s.snapIndex >= s.snapGrid.length) s.snapIndex = s.snapGrid.length - 1;
        
            var translate = - s.snapGrid[s.snapIndex];
            // Stop autoplay
            if (s.params.autoplay && s.autoplaying) {
                if (internal || !s.params.autoplayDisableOnInteraction) {
                    s.pauseAutoplay(speed);
                }
                else {
                    s.stopAutoplay();
                }
            }
            // Update progress
            s.updateProgress(translate);
        
            // Normalize slideIndex
            for (var i = 0; i < s.slidesGrid.length; i++) {
                if (- Math.floor(translate * 100) >= Math.floor(s.slidesGrid[i] * 100)) {
                    slideIndex = i;
                }
            }
        
            // Directions locks
            if (!s.params.allowSwipeToNext && translate < s.translate && translate < s.minTranslate()) {
                return false;
            }
            if (!s.params.allowSwipeToPrev && translate > s.translate && translate > s.maxTranslate()) {
                if ((s.activeIndex || 0) !== slideIndex ) return false;
            }
        
            // Update Index
            if (typeof speed === 'undefined') speed = s.params.speed;
            s.previousIndex = s.activeIndex || 0;
            s.activeIndex = slideIndex;
        
            if ((s.rtl && -translate === s.translate) || (!s.rtl && translate === s.translate)) {
                // Update Height
                if (s.params.autoHeight) {
                    s.updateAutoHeight();
                }
                s.updateClasses();
                if (s.params.effect !== 'slide') {
                    s.setWrapperTranslate(translate);
                }
                return false;
            }
            s.updateClasses();
            s.onTransitionStart(runCallbacks);
        
            if (speed === 0) {
                s.setWrapperTranslate(translate);
                s.setWrapperTransition(0);
                s.onTransitionEnd(runCallbacks);
            }
            else {
                s.setWrapperTranslate(translate);
                s.setWrapperTransition(speed);
                if (!s.animating) {
                    s.animating = true;
                    s.wrapper.transitionEnd(function () {
                        if (!s) return;
                        s.onTransitionEnd(runCallbacks);
                    });
                }
        
            }
        
            return true;
        };
        
        s.onTransitionStart = function (runCallbacks) {
            if (typeof runCallbacks === 'undefined') runCallbacks = true;
            if (s.params.autoHeight) {
                s.updateAutoHeight();
            }
            if (s.lazy) s.lazy.onTransitionStart();
            if (runCallbacks) {
                s.emit('onTransitionStart', s);
                if (s.activeIndex !== s.previousIndex) {
                    s.emit('onSlideChangeStart', s);
                    if (s.activeIndex > s.previousIndex) {
                        s.emit('onSlideNextStart', s);
                    }
                    else {
                        s.emit('onSlidePrevStart', s);
                    }
                }
        
            }
        };
        s.onTransitionEnd = function (runCallbacks) {
            s.animating = false;
            s.setWrapperTransition(0);
            if (typeof runCallbacks === 'undefined') runCallbacks = true;
            if (s.lazy) s.lazy.onTransitionEnd();
            if (runCallbacks) {
                s.emit('onTransitionEnd', s);
                if (s.activeIndex !== s.previousIndex) {
                    s.emit('onSlideChangeEnd', s);
                    if (s.activeIndex > s.previousIndex) {
                        s.emit('onSlideNextEnd', s);
                    }
                    else {
                        s.emit('onSlidePrevEnd', s);
                    }
                }
            }
            if (s.params.hashnav && s.hashnav) {
                s.hashnav.setHash();
            }
        
        };
        s.slideNext = function (runCallbacks, speed, internal) {
            if (s.params.loop) {
                if (s.animating) return false;
                s.fixLoop();
                var clientLeft = s.container[0].clientLeft;
                return s.slideTo(s.activeIndex + s.params.slidesPerGroup, speed, runCallbacks, internal);
            }
            else return s.slideTo(s.activeIndex + s.params.slidesPerGroup, speed, runCallbacks, internal);
        };
        s._slideNext = function (speed) {
            return s.slideNext(true, speed, true);
        };
        s.slidePrev = function (runCallbacks, speed, internal) {
            if (s.params.loop) {
                if (s.animating) return false;
                s.fixLoop();
                var clientLeft = s.container[0].clientLeft;
                return s.slideTo(s.activeIndex - 1, speed, runCallbacks, internal);
            }
            else return s.slideTo(s.activeIndex - 1, speed, runCallbacks, internal);
        };
        s._slidePrev = function (speed) {
            return s.slidePrev(true, speed, true);
        };
        s.slideReset = function (runCallbacks, speed, internal) {
            return s.slideTo(s.activeIndex, speed, runCallbacks);
        };
        
        /*=========================
          Translate/transition helpers
          ===========================*/
        s.setWrapperTransition = function (duration, byController) {
            s.wrapper.transition(duration);
            if (s.params.effect !== 'slide' && s.effects[s.params.effect]) {
                s.effects[s.params.effect].setTransition(duration);
            }
            if (s.params.parallax && s.parallax) {
                s.parallax.setTransition(duration);
            }
            if (s.params.scrollbar && s.scrollbar) {
                s.scrollbar.setTransition(duration);
            }
            if (s.params.control && s.controller) {
                s.controller.setTransition(duration, byController);
            }
            s.emit('onSetTransition', s, duration);
        };
        s.setWrapperTranslate = function (translate, updateActiveIndex, byController) {
            var x = 0, y = 0, z = 0;
            if (s.isHorizontal()) {
                x = s.rtl ? -translate : translate;
            }
            else {
                y = translate;
            }
        
            if (s.params.roundLengths) {
                x = round(x);
                y = round(y);
            }
        
            if (!s.params.virtualTranslate) {
                if (s.support.transforms3d) s.wrapper.transform('translate3d(' + x + 'px, ' + y + 'px, ' + z + 'px)');
                else s.wrapper.transform('translate(' + x + 'px, ' + y + 'px)');
            }
        
            s.translate = s.isHorizontal() ? x : y;
        
            // Check if we need to update progress
            var progress;
            var translatesDiff = s.maxTranslate() - s.minTranslate();
            if (translatesDiff === 0) {
                progress = 0;
            }
            else {
                progress = (translate - s.minTranslate()) / (translatesDiff);
            }
            if (progress !== s.progress) {
                s.updateProgress(translate);
            }
        
            if (updateActiveIndex) s.updateActiveIndex();
            if (s.params.effect !== 'slide' && s.effects[s.params.effect]) {
                s.effects[s.params.effect].setTranslate(s.translate);
            }
            if (s.params.parallax && s.parallax) {
                s.parallax.setTranslate(s.translate);
            }
            if (s.params.scrollbar && s.scrollbar) {
                s.scrollbar.setTranslate(s.translate);
            }
            if (s.params.control && s.controller) {
                s.controller.setTranslate(s.translate, byController);
            }
            s.emit('onSetTranslate', s, s.translate);
        };
        
        s.getTranslate = function (el, axis) {
            var matrix, curTransform, curStyle, transformMatrix;
        
            // automatic axis detection
            if (typeof axis === 'undefined') {
                axis = 'x';
            }
        
            if (s.params.virtualTranslate) {
                return s.rtl ? -s.translate : s.translate;
            }
        
            curStyle = window.getComputedStyle(el, null);
            if (window.WebKitCSSMatrix) {
                curTransform = curStyle.transform || curStyle.webkitTransform;
                if (curTransform.split(',').length > 6) {
                    curTransform = curTransform.split(', ').map(function(a){
                        return a.replace(',','.');
                    }).join(', ');
                }
                // Some old versions of Webkit choke when 'none' is passed; pass
                // empty string instead in this case
                transformMatrix = new window.WebKitCSSMatrix(curTransform === 'none' ? '' : curTransform);
            }
            else {
                transformMatrix = curStyle.MozTransform || curStyle.OTransform || curStyle.MsTransform || curStyle.msTransform  || curStyle.transform || curStyle.getPropertyValue('transform').replace('translate(', 'matrix(1, 0, 0, 1,');
                matrix = transformMatrix.toString().split(',');
            }
        
            if (axis === 'x') {
                //Latest Chrome and webkits Fix
                if (window.WebKitCSSMatrix)
                    curTransform = transformMatrix.m41;
                //Crazy IE10 Matrix
                else if (matrix.length === 16)
                    curTransform = parseFloat(matrix[12]);
                //Normal Browsers
                else
                    curTransform = parseFloat(matrix[4]);
            }
            if (axis === 'y') {
                //Latest Chrome and webkits Fix
                if (window.WebKitCSSMatrix)
                    curTransform = transformMatrix.m42;
                //Crazy IE10 Matrix
                else if (matrix.length === 16)
                    curTransform = parseFloat(matrix[13]);
                //Normal Browsers
                else
                    curTransform = parseFloat(matrix[5]);
            }
            if (s.rtl && curTransform) curTransform = -curTransform;
            return curTransform || 0;
        };
        s.getWrapperTranslate = function (axis) {
            if (typeof axis === 'undefined') {
                axis = s.isHorizontal() ? 'x' : 'y';
            }
            return s.getTranslate(s.wrapper[0], axis);
        };
        
        /*=========================
          Observer
          ===========================*/
        s.observers = [];
        function initObserver(target, options) {
            options = options || {};
            // create an observer instance
            var ObserverFunc = window.MutationObserver || window.WebkitMutationObserver;
            var observer = new ObserverFunc(function (mutations) {
                mutations.forEach(function (mutation) {
                    s.onResize(true);
                    s.emit('onObserverUpdate', s, mutation);
                });
            });
        
            observer.observe(target, {
                attributes: typeof options.attributes === 'undefined' ? true : options.attributes,
                childList: typeof options.childList === 'undefined' ? true : options.childList,
                characterData: typeof options.characterData === 'undefined' ? true : options.characterData
            });
        
            s.observers.push(observer);
        }
        s.initObservers = function () {
            if (s.params.observeParents) {
                var containerParents = s.container.parents();
                for (var i = 0; i < containerParents.length; i++) {
                    initObserver(containerParents[i]);
                }
            }
        
            // Observe container
            initObserver(s.container[0], {childList: false});
        
            // Observe wrapper
            initObserver(s.wrapper[0], {attributes: false});
        };
        s.disconnectObservers = function () {
            for (var i = 0; i < s.observers.length; i++) {
                s.observers[i].disconnect();
            }
            s.observers = [];
        };
        /*=========================
          Loop
          ===========================*/
        // Create looped slides
        s.createLoop = function () {
            // Remove duplicated slides
            s.wrapper.children('.' + s.params.slideClass + '.' + s.params.slideDuplicateClass).remove();
        
            var slides = s.wrapper.children('.' + s.params.slideClass);
        
            if(s.params.slidesPerView === 'auto' && !s.params.loopedSlides) s.params.loopedSlides = slides.length;
        
            s.loopedSlides = parseInt(s.params.loopedSlides || s.params.slidesPerView, 10);
            s.loopedSlides = s.loopedSlides + s.params.loopAdditionalSlides;
            if (s.loopedSlides > slides.length) {
                s.loopedSlides = slides.length;
            }
        
            var prependSlides = [], appendSlides = [], i;
            slides.each(function (index, el) {
                var slide = $(this);
                if (index < s.loopedSlides) appendSlides.push(el);
                if (index < slides.length && index >= slides.length - s.loopedSlides) prependSlides.push(el);
                slide.attr('data-swiper-slide-index', index);
            });
            for (i = 0; i < appendSlides.length; i++) {
                s.wrapper.append($(appendSlides[i].cloneNode(true)).addClass(s.params.slideDuplicateClass));
            }
            for (i = prependSlides.length - 1; i >= 0; i--) {
                s.wrapper.prepend($(prependSlides[i].cloneNode(true)).addClass(s.params.slideDuplicateClass));
            }
        };
        s.destroyLoop = function () {
            s.wrapper.children('.' + s.params.slideClass + '.' + s.params.slideDuplicateClass).remove();
            s.slides.removeAttr('data-swiper-slide-index');
        };
        s.reLoop = function (updatePosition) {
            var oldIndex = s.activeIndex - s.loopedSlides;
            s.destroyLoop();
            s.createLoop();
            s.updateSlidesSize();
            if (updatePosition) {
                s.slideTo(oldIndex + s.loopedSlides, 0, false);
            }
        
        };
        s.fixLoop = function () {
            var newIndex;
            //Fix For Negative Oversliding
            if (s.activeIndex < s.loopedSlides) {
                newIndex = s.slides.length - s.loopedSlides * 3 + s.activeIndex;
                newIndex = newIndex + s.loopedSlides;
                s.slideTo(newIndex, 0, false, true);
            }
            //Fix For Positive Oversliding
            else if ((s.params.slidesPerView === 'auto' && s.activeIndex >= s.loopedSlides * 2) || (s.activeIndex > s.slides.length - s.params.slidesPerView * 2)) {
                newIndex = -s.slides.length + s.activeIndex + s.loopedSlides;
                newIndex = newIndex + s.loopedSlides;
                s.slideTo(newIndex, 0, false, true);
            }
        };
        /*=========================
          Append/Prepend/Remove Slides
          ===========================*/
        s.appendSlide = function (slides) {
            if (s.params.loop) {
                s.destroyLoop();
            }
            if (typeof slides === 'object' && slides.length) {
                for (var i = 0; i < slides.length; i++) {
                    if (slides[i]) s.wrapper.append(slides[i]);
                }
            }
            else {
                s.wrapper.append(slides);
            }
            if (s.params.loop) {
                s.createLoop();
            }
            if (!(s.params.observer && s.support.observer)) {
                s.update(true);
            }
        };
        s.prependSlide = function (slides) {
            if (s.params.loop) {
                s.destroyLoop();
            }
            var newActiveIndex = s.activeIndex + 1;
            if (typeof slides === 'object' && slides.length) {
                for (var i = 0; i < slides.length; i++) {
                    if (slides[i]) s.wrapper.prepend(slides[i]);
                }
                newActiveIndex = s.activeIndex + slides.length;
            }
            else {
                s.wrapper.prepend(slides);
            }
            if (s.params.loop) {
                s.createLoop();
            }
            if (!(s.params.observer && s.support.observer)) {
                s.update(true);
            }
            s.slideTo(newActiveIndex, 0, false);
        };
        s.removeSlide = function (slidesIndexes) {
            if (s.params.loop) {
                s.destroyLoop();
                s.slides = s.wrapper.children('.' + s.params.slideClass);
            }
            var newActiveIndex = s.activeIndex,
                indexToRemove;
            if (typeof slidesIndexes === 'object' && slidesIndexes.length) {
                for (var i = 0; i < slidesIndexes.length; i++) {
                    indexToRemove = slidesIndexes[i];
                    if (s.slides[indexToRemove]) s.slides.eq(indexToRemove).remove();
                    if (indexToRemove < newActiveIndex) newActiveIndex--;
                }
                newActiveIndex = Math.max(newActiveIndex, 0);
            }
            else {
                indexToRemove = slidesIndexes;
                if (s.slides[indexToRemove]) s.slides.eq(indexToRemove).remove();
                if (indexToRemove < newActiveIndex) newActiveIndex--;
                newActiveIndex = Math.max(newActiveIndex, 0);
            }
        
            if (s.params.loop) {
                s.createLoop();
            }
        
            if (!(s.params.observer && s.support.observer)) {
                s.update(true);
            }
            if (s.params.loop) {
                s.slideTo(newActiveIndex + s.loopedSlides, 0, false);
            }
            else {
                s.slideTo(newActiveIndex, 0, false);
            }
        
        };
        s.removeAllSlides = function () {
            var slidesIndexes = [];
            for (var i = 0; i < s.slides.length; i++) {
                slidesIndexes.push(i);
            }
            s.removeSlide(slidesIndexes);
        };
        

        /*=========================
          Effects
          ===========================*/
        s.effects = {
            fade: {
                setTranslate: function () {
                    for (var i = 0; i < s.slides.length; i++) {
                        var slide = s.slides.eq(i);
                        var offset = slide[0].swiperSlideOffset;
                        var tx = -offset;
                        if (!s.params.virtualTranslate) tx = tx - s.translate;
                        var ty = 0;
                        if (!s.isHorizontal()) {
                            ty = tx;
                            tx = 0;
                        }
                        var slideOpacity = s.params.fade.crossFade ?
                                Math.max(1 - Math.abs(slide[0].progress), 0) :
                                1 + Math.min(Math.max(slide[0].progress, -1), 0);
                        slide
                            .css({
                                opacity: slideOpacity
                            })
                            .transform('translate3d(' + tx + 'px, ' + ty + 'px, 0px)');
        
                    }
        
                },
                setTransition: function (duration) {
                    s.slides.transition(duration);
                    if (s.params.virtualTranslate && duration !== 0) {
                        var eventTriggered = false;
                        s.slides.transitionEnd(function () {
                            if (eventTriggered) return;
                            if (!s) return;
                            eventTriggered = true;
                            s.animating = false;
                            var triggerEvents = ['webkitTransitionEnd', 'transitionend', 'oTransitionEnd', 'MSTransitionEnd', 'msTransitionEnd'];
                            for (var i = 0; i < triggerEvents.length; i++) {
                                s.wrapper.trigger(triggerEvents[i]);
                            }
                        });
                    }
                }
            },
            flip: {
                setTranslate: function () {
                    for (var i = 0; i < s.slides.length; i++) {
                        var slide = s.slides.eq(i);
                        var progress = slide[0].progress;
                        if (s.params.flip.limitRotation) {
                            progress = Math.max(Math.min(slide[0].progress, 1), -1);
                        }
                        var offset = slide[0].swiperSlideOffset;
                        var rotate = -180 * progress,
                            rotateY = rotate,
                            rotateX = 0,
                            tx = -offset,
                            ty = 0;
                        if (!s.isHorizontal()) {
                            ty = tx;
                            tx = 0;
                            rotateX = -rotateY;
                            rotateY = 0;
                        }
                        else if (s.rtl) {
                            rotateY = -rotateY;
                        }
        
                        slide[0].style.zIndex = -Math.abs(Math.round(progress)) + s.slides.length;
        
                        if (s.params.flip.slideShadows) {
                            //Set shadows
                            var shadowBefore = s.isHorizontal() ? slide.find('.swiper-slide-shadow-left') : slide.find('.swiper-slide-shadow-top');
                            var shadowAfter = s.isHorizontal() ? slide.find('.swiper-slide-shadow-right') : slide.find('.swiper-slide-shadow-bottom');
                            if (shadowBefore.length === 0) {
                                shadowBefore = $('<div class="swiper-slide-shadow-' + (s.isHorizontal() ? 'left' : 'top') + '"></div>');
                                slide.append(shadowBefore);
                            }
                            if (shadowAfter.length === 0) {
                                shadowAfter = $('<div class="swiper-slide-shadow-' + (s.isHorizontal() ? 'right' : 'bottom') + '"></div>');
                                slide.append(shadowAfter);
                            }
                            if (shadowBefore.length) shadowBefore[0].style.opacity = Math.max(-progress, 0);
                            if (shadowAfter.length) shadowAfter[0].style.opacity = Math.max(progress, 0);
                        }
        
                        slide
                            .transform('translate3d(' + tx + 'px, ' + ty + 'px, 0px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)');
                    }
                },
                setTransition: function (duration) {
                    s.slides.transition(duration).find('.swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left').transition(duration);
                    if (s.params.virtualTranslate && duration !== 0) {
                        var eventTriggered = false;
                        s.slides.eq(s.activeIndex).transitionEnd(function () {
                            if (eventTriggered) return;
                            if (!s) return;
                            if (!$(this).hasClass(s.params.slideActiveClass)) return;
                            eventTriggered = true;
                            s.animating = false;
                            var triggerEvents = ['webkitTransitionEnd', 'transitionend', 'oTransitionEnd', 'MSTransitionEnd', 'msTransitionEnd'];
                            for (var i = 0; i < triggerEvents.length; i++) {
                                s.wrapper.trigger(triggerEvents[i]);
                            }
                        });
                    }
                }
            },
            cube: {
                setTranslate: function () {
                    var wrapperRotate = 0, cubeShadow;
                    if (s.params.cube.shadow) {
                        if (s.isHorizontal()) {
                            cubeShadow = s.wrapper.find('.swiper-cube-shadow');
                            if (cubeShadow.length === 0) {
                                cubeShadow = $('<div class="swiper-cube-shadow"></div>');
                                s.wrapper.append(cubeShadow);
                            }
                            cubeShadow.css({height: s.width + 'px'});
                        }
                        else {
                            cubeShadow = s.container.find('.swiper-cube-shadow');
                            if (cubeShadow.length === 0) {
                                cubeShadow = $('<div class="swiper-cube-shadow"></div>');
                                s.container.append(cubeShadow);
                            }
                        }
                    }
                    for (var i = 0; i < s.slides.length; i++) {
                        var slide = s.slides.eq(i);
                        var slideAngle = i * 90;
                        var round = Math.floor(slideAngle / 360);
                        if (s.rtl) {
                            slideAngle = -slideAngle;
                            round = Math.floor(-slideAngle / 360);
                        }
                        var progress = Math.max(Math.min(slide[0].progress, 1), -1);
                        var tx = 0, ty = 0, tz = 0;
                        if (i % 4 === 0) {
                            tx = - round * 4 * s.size;
                            tz = 0;
                        }
                        else if ((i - 1) % 4 === 0) {
                            tx = 0;
                            tz = - round * 4 * s.size;
                        }
                        else if ((i - 2) % 4 === 0) {
                            tx = s.size + round * 4 * s.size;
                            tz = s.size;
                        }
                        else if ((i - 3) % 4 === 0) {
                            tx = - s.size;
                            tz = 3 * s.size + s.size * 4 * round;
                        }
                        if (s.rtl) {
                            tx = -tx;
                        }
        
                        if (!s.isHorizontal()) {
                            ty = tx;
                            tx = 0;
                        }
        
                        var transform = 'rotateX(' + (s.isHorizontal() ? 0 : -slideAngle) + 'deg) rotateY(' + (s.isHorizontal() ? slideAngle : 0) + 'deg) translate3d(' + tx + 'px, ' + ty + 'px, ' + tz + 'px)';
                        if (progress <= 1 && progress > -1) {
                            wrapperRotate = i * 90 + progress * 90;
                            if (s.rtl) wrapperRotate = -i * 90 - progress * 90;
                        }
                        slide.transform(transform);
                        if (s.params.cube.slideShadows) {
                            //Set shadows
                            var shadowBefore = s.isHorizontal() ? slide.find('.swiper-slide-shadow-left') : slide.find('.swiper-slide-shadow-top');
                            var shadowAfter = s.isHorizontal() ? slide.find('.swiper-slide-shadow-right') : slide.find('.swiper-slide-shadow-bottom');
                            if (shadowBefore.length === 0) {
                                shadowBefore = $('<div class="swiper-slide-shadow-' + (s.isHorizontal() ? 'left' : 'top') + '"></div>');
                                slide.append(shadowBefore);
                            }
                            if (shadowAfter.length === 0) {
                                shadowAfter = $('<div class="swiper-slide-shadow-' + (s.isHorizontal() ? 'right' : 'bottom') + '"></div>');
                                slide.append(shadowAfter);
                            }
                            if (shadowBefore.length) shadowBefore[0].style.opacity = Math.max(-progress, 0);
                            if (shadowAfter.length) shadowAfter[0].style.opacity = Math.max(progress, 0);
                        }
                    }
                    s.wrapper.css({
                        '-webkit-transform-origin': '50% 50% -' + (s.size / 2) + 'px',
                        '-moz-transform-origin': '50% 50% -' + (s.size / 2) + 'px',
                        '-ms-transform-origin': '50% 50% -' + (s.size / 2) + 'px',
                        'transform-origin': '50% 50% -' + (s.size / 2) + 'px'
                    });
        
                    if (s.params.cube.shadow) {
                        if (s.isHorizontal()) {
                            cubeShadow.transform('translate3d(0px, ' + (s.width / 2 + s.params.cube.shadowOffset) + 'px, ' + (-s.width / 2) + 'px) rotateX(90deg) rotateZ(0deg) scale(' + (s.params.cube.shadowScale) + ')');
                        }
                        else {
                            var shadowAngle = Math.abs(wrapperRotate) - Math.floor(Math.abs(wrapperRotate) / 90) * 90;
                            var multiplier = 1.5 - (Math.sin(shadowAngle * 2 * Math.PI / 360) / 2 + Math.cos(shadowAngle * 2 * Math.PI / 360) / 2);
                            var scale1 = s.params.cube.shadowScale,
                                scale2 = s.params.cube.shadowScale / multiplier,
                                offset = s.params.cube.shadowOffset;
                            cubeShadow.transform('scale3d(' + scale1 + ', 1, ' + scale2 + ') translate3d(0px, ' + (s.height / 2 + offset) + 'px, ' + (-s.height / 2 / scale2) + 'px) rotateX(-90deg)');
                        }
                    }
                    var zFactor = (s.isSafari || s.isUiWebView) ? (-s.size / 2) : 0;
                    s.wrapper.transform('translate3d(0px,0,' + zFactor + 'px) rotateX(' + (s.isHorizontal() ? 0 : wrapperRotate) + 'deg) rotateY(' + (s.isHorizontal() ? -wrapperRotate : 0) + 'deg)');
                },
                setTransition: function (duration) {
                    s.slides.transition(duration).find('.swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left').transition(duration);
                    if (s.params.cube.shadow && !s.isHorizontal()) {
                        s.container.find('.swiper-cube-shadow').transition(duration);
                    }
                }
            },
            coverflow: {
                setTranslate: function () {
                    var transform = s.translate;
                    var center = s.isHorizontal() ? -transform + s.width / 2 : -transform + s.height / 2;
                    var rotate = s.isHorizontal() ? s.params.coverflow.rotate: -s.params.coverflow.rotate;
                    var translate = s.params.coverflow.depth;
                    //Each slide offset from center
                    for (var i = 0, length = s.slides.length; i < length; i++) {
                        var slide = s.slides.eq(i);
                        var slideSize = s.slidesSizesGrid[i];
                        var slideOffset = slide[0].swiperSlideOffset;
                        var offsetMultiplier = (center - slideOffset - slideSize / 2) / slideSize * s.params.coverflow.modifier;
        
                        var rotateY = s.isHorizontal() ? rotate * offsetMultiplier : 0;
                        var rotateX = s.isHorizontal() ? 0 : rotate * offsetMultiplier;
                        // var rotateZ = 0
                        var translateZ = -translate * Math.abs(offsetMultiplier);
        
                        var translateY = s.isHorizontal() ? 0 : s.params.coverflow.stretch * (offsetMultiplier);
                        var translateX = s.isHorizontal() ? s.params.coverflow.stretch * (offsetMultiplier) : 0;
        
                        //Fix for ultra small values
                        if (Math.abs(translateX) < 0.001) translateX = 0;
                        if (Math.abs(translateY) < 0.001) translateY = 0;
                        if (Math.abs(translateZ) < 0.001) translateZ = 0;
                        if (Math.abs(rotateY) < 0.001) rotateY = 0;
                        if (Math.abs(rotateX) < 0.001) rotateX = 0;
        
                        var slideTransform = 'translate3d(' + translateX + 'px,' + translateY + 'px,' + translateZ + 'px)  rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
        
                        slide.transform(slideTransform);
                        slide[0].style.zIndex = -Math.abs(Math.round(offsetMultiplier)) + 1;
                        if (s.params.coverflow.slideShadows) {
                            //Set shadows
                            var shadowBefore = s.isHorizontal() ? slide.find('.swiper-slide-shadow-left') : slide.find('.swiper-slide-shadow-top');
                            var shadowAfter = s.isHorizontal() ? slide.find('.swiper-slide-shadow-right') : slide.find('.swiper-slide-shadow-bottom');
                            if (shadowBefore.length === 0) {
                                shadowBefore = $('<div class="swiper-slide-shadow-' + (s.isHorizontal() ? 'left' : 'top') + '"></div>');
                                slide.append(shadowBefore);
                            }
                            if (shadowAfter.length === 0) {
                                shadowAfter = $('<div class="swiper-slide-shadow-' + (s.isHorizontal() ? 'right' : 'bottom') + '"></div>');
                                slide.append(shadowAfter);
                            }
                            if (shadowBefore.length) shadowBefore[0].style.opacity = offsetMultiplier > 0 ? offsetMultiplier : 0;
                            if (shadowAfter.length) shadowAfter[0].style.opacity = (-offsetMultiplier) > 0 ? -offsetMultiplier : 0;
                        }
                    }
        
                    //Set correct perspective for IE10
                    if (s.browser.ie) {
                        var ws = s.wrapper[0].style;
                        ws.perspectiveOrigin = center + 'px 50%';
                    }
                },
                setTransition: function (duration) {
                    s.slides.transition(duration).find('.swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left').transition(duration);
                }
            }
        };

        /*=========================
          Images Lazy Loading
          ===========================*/
        s.lazy = {
            initialImageLoaded: false,
            loadImageInSlide: function (index, loadInDuplicate) {
                if (typeof index === 'undefined') return;
                if (typeof loadInDuplicate === 'undefined') loadInDuplicate = true;
                if (s.slides.length === 0) return;
        
                var slide = s.slides.eq(index);
                var img = slide.find('.swiper-lazy:not(.swiper-lazy-loaded):not(.swiper-lazy-loading)');
                if (slide.hasClass('swiper-lazy') && !slide.hasClass('swiper-lazy-loaded') && !slide.hasClass('swiper-lazy-loading')) {
                    img = img.add(slide[0]);
                }
                if (img.length === 0) return;
        
                img.each(function () {
                    var _img = $(this);
                    _img.addClass('swiper-lazy-loading');
                    var background = _img.attr('data-background');
                    var src = _img.attr('data-src'),
                        srcset = _img.attr('data-srcset');
                    s.loadImage(_img[0], (src || background), srcset, false, function () {
                        if (background) {
                            _img.css('background-image', 'url("' + background + '")');
                            _img.removeAttr('data-background');
                        }
                        else {
                            if (srcset) {
                                _img.attr('srcset', srcset);
                                _img.removeAttr('data-srcset');
                            }
                            if (src) {
                                _img.attr('src', src);
                                _img.removeAttr('data-src');
                            }
        
                        }
        
                        _img.addClass('swiper-lazy-loaded').removeClass('swiper-lazy-loading');
                        slide.find('.swiper-lazy-preloader, .preloader').remove();
                        if (s.params.loop && loadInDuplicate) {
                            var slideOriginalIndex = slide.attr('data-swiper-slide-index');
                            if (slide.hasClass(s.params.slideDuplicateClass)) {
                                var originalSlide = s.wrapper.children('[data-swiper-slide-index="' + slideOriginalIndex + '"]:not(.' + s.params.slideDuplicateClass + ')');
                                s.lazy.loadImageInSlide(originalSlide.index(), false);
                            }
                            else {
                                var duplicatedSlide = s.wrapper.children('.' + s.params.slideDuplicateClass + '[data-swiper-slide-index="' + slideOriginalIndex + '"]');
                                s.lazy.loadImageInSlide(duplicatedSlide.index(), false);
                            }
                        }
                        s.emit('onLazyImageReady', s, slide[0], _img[0]);
                    });
        
                    s.emit('onLazyImageLoad', s, slide[0], _img[0]);
                });
        
            },
            load: function () {
                var i;
                if (s.params.watchSlidesVisibility) {
                    s.wrapper.children('.' + s.params.slideVisibleClass).each(function () {
                        s.lazy.loadImageInSlide($(this).index());
                    });
                }
                else {
                    if (s.params.slidesPerView > 1) {
                        for (i = s.activeIndex; i < s.activeIndex + s.params.slidesPerView ; i++) {
                            if (s.slides[i]) s.lazy.loadImageInSlide(i);
                        }
                    }
                    else {
                        s.lazy.loadImageInSlide(s.activeIndex);
                    }
                }
                if (s.params.lazyLoadingInPrevNext) {
                    if (s.params.slidesPerView > 1 || (s.params.lazyLoadingInPrevNextAmount && s.params.lazyLoadingInPrevNextAmount > 1)) {
                        var amount = s.params.lazyLoadingInPrevNextAmount;
                        var spv = s.params.slidesPerView;
                        var maxIndex = Math.min(s.activeIndex + spv + Math.max(amount, spv), s.slides.length);
                        var minIndex = Math.max(s.activeIndex - Math.max(spv, amount), 0);
                        // Next Slides
                        for (i = s.activeIndex + s.params.slidesPerView; i < maxIndex; i++) {
                            if (s.slides[i]) s.lazy.loadImageInSlide(i);
                        }
                        // Prev Slides
                        for (i = minIndex; i < s.activeIndex ; i++) {
                            if (s.slides[i]) s.lazy.loadImageInSlide(i);
                        }
                    }
                    else {
                        var nextSlide = s.wrapper.children('.' + s.params.slideNextClass);
                        if (nextSlide.length > 0) s.lazy.loadImageInSlide(nextSlide.index());
        
                        var prevSlide = s.wrapper.children('.' + s.params.slidePrevClass);
                        if (prevSlide.length > 0) s.lazy.loadImageInSlide(prevSlide.index());
                    }
                }
            },
            onTransitionStart: function () {
                if (s.params.lazyLoading) {
                    if (s.params.lazyLoadingOnTransitionStart || (!s.params.lazyLoadingOnTransitionStart && !s.lazy.initialImageLoaded)) {
                        s.lazy.load();
                    }
                }
            },
            onTransitionEnd: function () {
                if (s.params.lazyLoading && !s.params.lazyLoadingOnTransitionStart) {
                    s.lazy.load();
                }
            }
        };
        

        /*=========================
          Scrollbar
          ===========================*/
        s.scrollbar = {
            isTouched: false,
            setDragPosition: function (e) {
                var sb = s.scrollbar;
                var x = 0, y = 0;
                var translate;
                var pointerPosition = s.isHorizontal() ?
                    ((e.type === 'touchstart' || e.type === 'touchmove') ? e.targetTouches[0].pageX : e.pageX || e.clientX) :
                    ((e.type === 'touchstart' || e.type === 'touchmove') ? e.targetTouches[0].pageY : e.pageY || e.clientY) ;
                var position = (pointerPosition) - sb.track.offset()[s.isHorizontal() ? 'left' : 'top'] - sb.dragSize / 2;
                var positionMin = -s.minTranslate() * sb.moveDivider;
                var positionMax = -s.maxTranslate() * sb.moveDivider;
                if (position < positionMin) {
                    position = positionMin;
                }
                else if (position > positionMax) {
                    position = positionMax;
                }
                position = -position / sb.moveDivider;
                s.updateProgress(position);
                s.setWrapperTranslate(position, true);
            },
            dragStart: function (e) {
                var sb = s.scrollbar;
                sb.isTouched = true;
                e.preventDefault();
                e.stopPropagation();
        
                sb.setDragPosition(e);
                clearTimeout(sb.dragTimeout);
        
                sb.track.transition(0);
                if (s.params.scrollbarHide) {
                    sb.track.css('opacity', 1);
                }
                s.wrapper.transition(100);
                sb.drag.transition(100);
                s.emit('onScrollbarDragStart', s);
            },
            dragMove: function (e) {
                var sb = s.scrollbar;
                if (!sb.isTouched) return;
                if (e.preventDefault) e.preventDefault();
                else e.returnValue = false;
                sb.setDragPosition(e);
                s.wrapper.transition(0);
                sb.track.transition(0);
                sb.drag.transition(0);
                s.emit('onScrollbarDragMove', s);
            },
            dragEnd: function (e) {
                var sb = s.scrollbar;
                if (!sb.isTouched) return;
                sb.isTouched = false;
                if (s.params.scrollbarHide) {
                    clearTimeout(sb.dragTimeout);
                    sb.dragTimeout = setTimeout(function () {
                        sb.track.css('opacity', 0);
                        sb.track.transition(400);
                    }, 1000);
        
                }
                s.emit('onScrollbarDragEnd', s);
                if (s.params.scrollbarSnapOnRelease) {
                    s.slideReset();
                }
            },
            enableDraggable: function () {
                var sb = s.scrollbar;
                var target = s.support.touch ? sb.track : document;
                $(sb.track).on(s.touchEvents.start, sb.dragStart);
                $(target).on(s.touchEvents.move, sb.dragMove);
                $(target).on(s.touchEvents.end, sb.dragEnd);
            },
            disableDraggable: function () {
                var sb = s.scrollbar;
                var target = s.support.touch ? sb.track : document;
                $(sb.track).off(s.touchEvents.start, sb.dragStart);
                $(target).off(s.touchEvents.move, sb.dragMove);
                $(target).off(s.touchEvents.end, sb.dragEnd);
            },
            set: function () {
                if (!s.params.scrollbar) return;
                var sb = s.scrollbar;
                sb.track = $(s.params.scrollbar);
                if (s.params.uniqueNavElements && typeof s.params.scrollbar === 'string' && sb.track.length > 1 && s.container.find(s.params.scrollbar).length === 1) {
                    sb.track = s.container.find(s.params.scrollbar);
                }
                sb.drag = sb.track.find('.swiper-scrollbar-drag');
                if (sb.drag.length === 0) {
                    sb.drag = $('<div class="swiper-scrollbar-drag"></div>');
                    sb.track.append(sb.drag);
                }
                sb.drag[0].style.width = '';
                sb.drag[0].style.height = '';
                sb.trackSize = s.isHorizontal() ? sb.track[0].offsetWidth : sb.track[0].offsetHeight;
        
                sb.divider = s.size / s.virtualSize;
                sb.moveDivider = sb.divider * (sb.trackSize / s.size);
                sb.dragSize = sb.trackSize * sb.divider;
        
                if (s.isHorizontal()) {
                    sb.drag[0].style.width = sb.dragSize + 'px';
                }
                else {
                    sb.drag[0].style.height = sb.dragSize + 'px';
                }
        
                if (sb.divider >= 1) {
                    sb.track[0].style.display = 'none';
                }
                else {
                    sb.track[0].style.display = '';
                }
                if (s.params.scrollbarHide) {
                    sb.track[0].style.opacity = 0;
                }
            },
            setTranslate: function () {
                if (!s.params.scrollbar) return;
                var diff;
                var sb = s.scrollbar;
                var translate = s.translate || 0;
                var newPos;
        
                var newSize = sb.dragSize;
                newPos = (sb.trackSize - sb.dragSize) * s.progress;
                if (s.rtl && s.isHorizontal()) {
                    newPos = -newPos;
                    if (newPos > 0) {
                        newSize = sb.dragSize - newPos;
                        newPos = 0;
                    }
                    else if (-newPos + sb.dragSize > sb.trackSize) {
                        newSize = sb.trackSize + newPos;
                    }
                }
                else {
                    if (newPos < 0) {
                        newSize = sb.dragSize + newPos;
                        newPos = 0;
                    }
                    else if (newPos + sb.dragSize > sb.trackSize) {
                        newSize = sb.trackSize - newPos;
                    }
                }
                if (s.isHorizontal()) {
                    if (s.support.transforms3d) {
                        sb.drag.transform('translate3d(' + (newPos) + 'px, 0, 0)');
                    }
                    else {
                        sb.drag.transform('translateX(' + (newPos) + 'px)');
                    }
                    sb.drag[0].style.width = newSize + 'px';
                }
                else {
                    if (s.support.transforms3d) {
                        sb.drag.transform('translate3d(0px, ' + (newPos) + 'px, 0)');
                    }
                    else {
                        sb.drag.transform('translateY(' + (newPos) + 'px)');
                    }
                    sb.drag[0].style.height = newSize + 'px';
                }
                if (s.params.scrollbarHide) {
                    clearTimeout(sb.timeout);
                    sb.track[0].style.opacity = 1;
                    sb.timeout = setTimeout(function () {
                        sb.track[0].style.opacity = 0;
                        sb.track.transition(400);
                    }, 1000);
                }
            },
            setTransition: function (duration) {
                if (!s.params.scrollbar) return;
                s.scrollbar.drag.transition(duration);
            }
        };

        /*=========================
          Controller
          ===========================*/
        s.controller = {
            LinearSpline: function (x, y) {
                this.x = x;
                this.y = y;
                this.lastIndex = x.length - 1;
                // Given an x value (x2), return the expected y2 value:
                // (x1,y1) is the known point before given value,
                // (x3,y3) is the known point after given value.
                var i1, i3;
                var l = this.x.length;
        
                this.interpolate = function (x2) {
                    if (!x2) return 0;
        
                    // Get the indexes of x1 and x3 (the array indexes before and after given x2):
                    i3 = binarySearch(this.x, x2);
                    i1 = i3 - 1;
        
                    // We have our indexes i1 & i3, so we can calculate already:
                    // y2 := ((x2−x1) × (y3−y1)) ÷ (x3−x1) + y1
                    return ((x2 - this.x[i1]) * (this.y[i3] - this.y[i1])) / (this.x[i3] - this.x[i1]) + this.y[i1];
                };
        
                var binarySearch = (function() {
                    var maxIndex, minIndex, guess;
                    return function(array, val) {
                        minIndex = -1;
                        maxIndex = array.length;
                        while (maxIndex - minIndex > 1)
                            if (array[guess = maxIndex + minIndex >> 1] <= val) {
                                minIndex = guess;
                            } else {
                                maxIndex = guess;
                            }
                        return maxIndex;
                    };
                })();
            },
            //xxx: for now i will just save one spline function to to
            getInterpolateFunction: function(c){
                if(!s.controller.spline) s.controller.spline = s.params.loop ?
                    new s.controller.LinearSpline(s.slidesGrid, c.slidesGrid) :
                    new s.controller.LinearSpline(s.snapGrid, c.snapGrid);
            },
            setTranslate: function (translate, byController) {
               var controlled = s.params.control;
               var multiplier, controlledTranslate;
               function setControlledTranslate(c) {
                    // this will create an Interpolate function based on the snapGrids
                    // x is the Grid of the scrolled scroller and y will be the controlled scroller
                    // it makes sense to create this only once and recall it for the interpolation
                    // the function does a lot of value caching for performance
                    translate = c.rtl && c.params.direction === 'horizontal' ? -s.translate : s.translate;
                    if (s.params.controlBy === 'slide') {
                        s.controller.getInterpolateFunction(c);
                        // i am not sure why the values have to be multiplicated this way, tried to invert the snapGrid
                        // but it did not work out
                        controlledTranslate = -s.controller.spline.interpolate(-translate);
                    }
        
                    if(!controlledTranslate || s.params.controlBy === 'container'){
                        multiplier = (c.maxTranslate() - c.minTranslate()) / (s.maxTranslate() - s.minTranslate());
                        controlledTranslate = (translate - s.minTranslate()) * multiplier + c.minTranslate();
                    }
        
                    if (s.params.controlInverse) {
                        controlledTranslate = c.maxTranslate() - controlledTranslate;
                    }
                    c.updateProgress(controlledTranslate);
                    c.setWrapperTranslate(controlledTranslate, false, s);
                    c.updateActiveIndex();
               }
               if (s.isArray(controlled)) {
                   for (var i = 0; i < controlled.length; i++) {
                       if (controlled[i] !== byController && controlled[i] instanceof Swiper) {
                           setControlledTranslate(controlled[i]);
                       }
                   }
               }
               else if (controlled instanceof Swiper && byController !== controlled) {
        
                   setControlledTranslate(controlled);
               }
            },
            setTransition: function (duration, byController) {
                var controlled = s.params.control;
                var i;
                function setControlledTransition(c) {
                    c.setWrapperTransition(duration, s);
                    if (duration !== 0) {
                        c.onTransitionStart();
                        c.wrapper.transitionEnd(function(){
                            if (!controlled) return;
                            if (c.params.loop && s.params.controlBy === 'slide') {
                                c.fixLoop();
                            }
                            c.onTransitionEnd();
        
                        });
                    }
                }
                if (s.isArray(controlled)) {
                    for (i = 0; i < controlled.length; i++) {
                        if (controlled[i] !== byController && controlled[i] instanceof Swiper) {
                            setControlledTransition(controlled[i]);
                        }
                    }
                }
                else if (controlled instanceof Swiper && byController !== controlled) {
                    setControlledTransition(controlled);
                }
            }
        };

        /*=========================
          Hash Navigation
          ===========================*/
        s.hashnav = {
            init: function () {
                if (!s.params.hashnav) return;
                s.hashnav.initialized = true;
                var hash = document.location.hash.replace('#', '');
                if (!hash) return;
                var speed = 0;
                for (var i = 0, length = s.slides.length; i < length; i++) {
                    var slide = s.slides.eq(i);
                    var slideHash = slide.attr('data-hash');
                    if (slideHash === hash && !slide.hasClass(s.params.slideDuplicateClass)) {
                        var index = slide.index();
                        s.slideTo(index, speed, s.params.runCallbacksOnInit, true);
                    }
                }
            },
            setHash: function () {
                if (!s.hashnav.initialized || !s.params.hashnav) return;
                document.location.hash = s.slides.eq(s.activeIndex).attr('data-hash') || '';
            }
        };

        /*=========================
          Keyboard Control
          ===========================*/
        function handleKeyboard(e) {
            if (e.originalEvent) e = e.originalEvent; //jquery fix
            var kc = e.keyCode || e.charCode;
            // Directions locks
            if (!s.params.allowSwipeToNext && (s.isHorizontal() && kc === 39 || !s.isHorizontal() && kc === 40)) {
                return false;
            }
            if (!s.params.allowSwipeToPrev && (s.isHorizontal() && kc === 37 || !s.isHorizontal() && kc === 38)) {
                return false;
            }
            if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) {
                return;
            }
            if (document.activeElement && document.activeElement.nodeName && (document.activeElement.nodeName.toLowerCase() === 'input' || document.activeElement.nodeName.toLowerCase() === 'textarea')) {
                return;
            }
            if (kc === 37 || kc === 39 || kc === 38 || kc === 40) {
                var inView = false;
                //Check that swiper should be inside of visible area of window
                if (s.container.parents('.swiper-slide').length > 0 && s.container.parents('.swiper-slide-active').length === 0) {
                    return;
                }
                var windowScroll = {
                    left: window.pageXOffset,
                    top: window.pageYOffset
                };
                var windowWidth = window.innerWidth;
                var windowHeight = window.innerHeight;
                var swiperOffset = s.container.offset();
                if (s.rtl) swiperOffset.left = swiperOffset.left - s.container[0].scrollLeft;
                var swiperCoord = [
                    [swiperOffset.left, swiperOffset.top],
                    [swiperOffset.left + s.width, swiperOffset.top],
                    [swiperOffset.left, swiperOffset.top + s.height],
                    [swiperOffset.left + s.width, swiperOffset.top + s.height]
                ];
                for (var i = 0; i < swiperCoord.length; i++) {
                    var point = swiperCoord[i];
                    if (
                        point[0] >= windowScroll.left && point[0] <= windowScroll.left + windowWidth &&
                        point[1] >= windowScroll.top && point[1] <= windowScroll.top + windowHeight
                    ) {
                        inView = true;
                    }
        
                }
                if (!inView) return;
            }
            if (s.isHorizontal()) {
                if (kc === 37 || kc === 39) {
                    if (e.preventDefault) e.preventDefault();
                    else e.returnValue = false;
                }
                if ((kc === 39 && !s.rtl) || (kc === 37 && s.rtl)) s.slideNext();
                if ((kc === 37 && !s.rtl) || (kc === 39 && s.rtl)) s.slidePrev();
            }
            else {
                if (kc === 38 || kc === 40) {
                    if (e.preventDefault) e.preventDefault();
                    else e.returnValue = false;
                }
                if (kc === 40) s.slideNext();
                if (kc === 38) s.slidePrev();
            }
        }
        s.disableKeyboardControl = function () {
            s.params.keyboardControl = false;
            $(document).off('keydown', handleKeyboard);
        };
        s.enableKeyboardControl = function () {
            s.params.keyboardControl = true;
            $(document).on('keydown', handleKeyboard);
        };
        

        /*=========================
          Mousewheel Control
          ===========================*/
        s.mousewheel = {
            event: false,
            lastScrollTime: (new window.Date()).getTime()
        };
        if (s.params.mousewheelControl) {
            try {
                new window.WheelEvent('wheel');
                s.mousewheel.event = 'wheel';
            } catch (e) {
                if (window.WheelEvent || (s.container[0] && 'wheel' in s.container[0])) {
                    s.mousewheel.event = 'wheel';
                }
            }
            if (!s.mousewheel.event && window.WheelEvent) {
        
            }
            if (!s.mousewheel.event && document.onmousewheel !== undefined) {
                s.mousewheel.event = 'mousewheel';
            }
            if (!s.mousewheel.event) {
                s.mousewheel.event = 'DOMMouseScroll';
            }
        }
        function handleMousewheel(e) {
            if (e.originalEvent) e = e.originalEvent; //jquery fix
            var we = s.mousewheel.event;
            var delta = 0;
            var rtlFactor = s.rtl ? -1 : 1;
        
            //WebKits
            if (we === 'mousewheel') {
                if (s.params.mousewheelForceToAxis) {
                    if (s.isHorizontal()) {
                        if (Math.abs(e.wheelDeltaX) > Math.abs(e.wheelDeltaY)) delta = e.wheelDeltaX * rtlFactor;
                        else return;
                    }
                    else {
                        if (Math.abs(e.wheelDeltaY) > Math.abs(e.wheelDeltaX)) delta = e.wheelDeltaY;
                        else return;
                    }
                }
                else {
                    delta = Math.abs(e.wheelDeltaX) > Math.abs(e.wheelDeltaY) ? - e.wheelDeltaX * rtlFactor : - e.wheelDeltaY;
                }
            }
            //Old FireFox
            else if (we === 'DOMMouseScroll') delta = -e.detail;
            //New FireFox
            else if (we === 'wheel') {
                if (s.params.mousewheelForceToAxis) {
                    if (s.isHorizontal()) {
                        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) delta = -e.deltaX * rtlFactor;
                        else return;
                    }
                    else {
                        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) delta = -e.deltaY;
                        else return;
                    }
                }
                else {
                    delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? - e.deltaX * rtlFactor : - e.deltaY;
                }
            }
            if (delta === 0) return;
        
            if (s.params.mousewheelInvert) delta = -delta;
        
            if (!s.params.freeMode) {
                if ((new window.Date()).getTime() - s.mousewheel.lastScrollTime > 60) {
                    if (delta < 0) {
                        if ((!s.isEnd || s.params.loop) && !s.animating) s.slideNext();
                        else if (s.params.mousewheelReleaseOnEdges) return true;
                    }
                    else {
                        if ((!s.isBeginning || s.params.loop) && !s.animating) s.slidePrev();
                        else if (s.params.mousewheelReleaseOnEdges) return true;
                    }
                }
                s.mousewheel.lastScrollTime = (new window.Date()).getTime();
        
            }
            else {
                //Freemode or scrollContainer:
                var position = s.getWrapperTranslate() + delta * s.params.mousewheelSensitivity;
                var wasBeginning = s.isBeginning,
                    wasEnd = s.isEnd;
        
                if (position >= s.minTranslate()) position = s.minTranslate();
                if (position <= s.maxTranslate()) position = s.maxTranslate();
        
                s.setWrapperTransition(0);
                s.setWrapperTranslate(position);
                s.updateProgress();
                s.updateActiveIndex();
        
                if (!wasBeginning && s.isBeginning || !wasEnd && s.isEnd) {
                    s.updateClasses();
                }
        
                if (s.params.freeModeSticky) {
                    clearTimeout(s.mousewheel.timeout);
                    s.mousewheel.timeout = setTimeout(function () {
                        s.slideReset();
                    }, 300);
                }
                else {
                    if (s.params.lazyLoading && s.lazy) {
                        s.lazy.load();
                    }
                }
        
                // Return page scroll on edge positions
                if (position === 0 || position === s.maxTranslate()) return;
            }
            if (s.params.autoplay) s.stopAutoplay();
        
            if (e.preventDefault) e.preventDefault();
            else e.returnValue = false;
            return false;
        }
        s.disableMousewheelControl = function () {
            if (!s.mousewheel.event) return false;
            s.container.off(s.mousewheel.event, handleMousewheel);
            return true;
        };
        
        s.enableMousewheelControl = function () {
            if (!s.mousewheel.event) return false;
            s.container.on(s.mousewheel.event, handleMousewheel);
            return true;
        };
        

        /*=========================
          Parallax
          ===========================*/
        function setParallaxTransform(el, progress) {
            el = $(el);
            var p, pX, pY;
            var rtlFactor = s.rtl ? -1 : 1;
        
            p = el.attr('data-swiper-parallax') || '0';
            pX = el.attr('data-swiper-parallax-x');
            pY = el.attr('data-swiper-parallax-y');
            if (pX || pY) {
                pX = pX || '0';
                pY = pY || '0';
            }
            else {
                if (s.isHorizontal()) {
                    pX = p;
                    pY = '0';
                }
                else {
                    pY = p;
                    pX = '0';
                }
            }
        
            if ((pX).indexOf('%') >= 0) {
                pX = parseInt(pX, 10) * progress * rtlFactor + '%';
            }
            else {
                pX = pX * progress * rtlFactor + 'px' ;
            }
            if ((pY).indexOf('%') >= 0) {
                pY = parseInt(pY, 10) * progress + '%';
            }
            else {
                pY = pY * progress + 'px' ;
            }
        
            el.transform('translate3d(' + pX + ', ' + pY + ',0px)');
        }
        s.parallax = {
            setTranslate: function () {
                s.container.children('[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y]').each(function(){
                    setParallaxTransform(this, s.progress);
        
                });
                s.slides.each(function () {
                    var slide = $(this);
                    slide.find('[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y]').each(function () {
                        var progress = Math.min(Math.max(slide[0].progress, -1), 1);
                        setParallaxTransform(this, progress);
                    });
                });
            },
            setTransition: function (duration) {
                if (typeof duration === 'undefined') duration = s.params.speed;
                s.container.find('[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y]').each(function(){
                    var el = $(this);
                    var parallaxDuration = parseInt(el.attr('data-swiper-parallax-duration'), 10) || duration;
                    if (duration === 0) parallaxDuration = 0;
                    el.transition(parallaxDuration);
                });
            }
        };
        

        /*=========================
          Plugins API. Collect all and init all plugins
          ===========================*/
        s._plugins = [];
        for (var plugin in s.plugins) {
            var p = s.plugins[plugin](s, s.params[plugin]);
            if (p) s._plugins.push(p);
        }
        // Method to call all plugins event/method
        s.callPlugins = function (eventName) {
            for (var i = 0; i < s._plugins.length; i++) {
                if (eventName in s._plugins[i]) {
                    s._plugins[i][eventName](arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
                }
            }
        };

        /*=========================
          Events/Callbacks/Plugins Emitter
          ===========================*/
        function normalizeEventName (eventName) {
            if (eventName.indexOf('on') !== 0) {
                if (eventName[0] !== eventName[0].toUpperCase()) {
                    eventName = 'on' + eventName[0].toUpperCase() + eventName.substring(1);
                }
                else {
                    eventName = 'on' + eventName;
                }
            }
            return eventName;
        }
        s.emitterEventListeners = {
        
        };
        s.emit = function (eventName) {
            // Trigger callbacks
            if (s.params[eventName]) {
                s.params[eventName](arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
            }
            var i;
            // Trigger events
            if (s.emitterEventListeners[eventName]) {
                for (i = 0; i < s.emitterEventListeners[eventName].length; i++) {
                    s.emitterEventListeners[eventName][i](arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
                }
            }
            // Trigger plugins
            if (s.callPlugins) s.callPlugins(eventName, arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
        };
        s.on = function (eventName, handler) {
            eventName = normalizeEventName(eventName);
            if (!s.emitterEventListeners[eventName]) s.emitterEventListeners[eventName] = [];
            s.emitterEventListeners[eventName].push(handler);
            return s;
        };
        s.off = function (eventName, handler) {
            var i;
            eventName = normalizeEventName(eventName);
            if (typeof handler === 'undefined') {
                // Remove all handlers for such event
                s.emitterEventListeners[eventName] = [];
                return s;
            }
            if (!s.emitterEventListeners[eventName] || s.emitterEventListeners[eventName].length === 0) return;
            for (i = 0; i < s.emitterEventListeners[eventName].length; i++) {
                if(s.emitterEventListeners[eventName][i] === handler) s.emitterEventListeners[eventName].splice(i, 1);
            }
            return s;
        };
        s.once = function (eventName, handler) {
            eventName = normalizeEventName(eventName);
            var _handler = function () {
                handler(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]);
                s.off(eventName, _handler);
            };
            s.on(eventName, _handler);
            return s;
        };

        // Accessibility tools
        s.a11y = {
            makeFocusable: function ($el) {
                $el.attr('tabIndex', '0');
                return $el;
            },
            addRole: function ($el, role) {
                $el.attr('role', role);
                return $el;
            },
        
            addLabel: function ($el, label) {
                $el.attr('aria-label', label);
                return $el;
            },
        
            disable: function ($el) {
                $el.attr('aria-disabled', true);
                return $el;
            },
        
            enable: function ($el) {
                $el.attr('aria-disabled', false);
                return $el;
            },
        
            onEnterKey: function (event) {
                if (event.keyCode !== 13) return;
                if ($(event.target).is(s.params.nextButton)) {
                    s.onClickNext(event);
                    if (s.isEnd) {
                        s.a11y.notify(s.params.lastSlideMessage);
                    }
                    else {
                        s.a11y.notify(s.params.nextSlideMessage);
                    }
                }
                else if ($(event.target).is(s.params.prevButton)) {
                    s.onClickPrev(event);
                    if (s.isBeginning) {
                        s.a11y.notify(s.params.firstSlideMessage);
                    }
                    else {
                        s.a11y.notify(s.params.prevSlideMessage);
                    }
                }
                if ($(event.target).is('.' + s.params.bulletClass)) {
                    $(event.target)[0].click();
                }
            },
        
            liveRegion: $('<span class="swiper-notification" aria-live="assertive" aria-atomic="true"></span>'),
        
            notify: function (message) {
                var notification = s.a11y.liveRegion;
                if (notification.length === 0) return;
                notification.html('');
                notification.html(message);
            },
            init: function () {
                // Setup accessibility
                if (s.params.nextButton && s.nextButton && s.nextButton.length > 0) {
                    s.a11y.makeFocusable(s.nextButton);
                    s.a11y.addRole(s.nextButton, 'button');
                    s.a11y.addLabel(s.nextButton, s.params.nextSlideMessage);
                }
                if (s.params.prevButton && s.prevButton && s.prevButton.length > 0) {
                    s.a11y.makeFocusable(s.prevButton);
                    s.a11y.addRole(s.prevButton, 'button');
                    s.a11y.addLabel(s.prevButton, s.params.prevSlideMessage);
                }
        
                $(s.container).append(s.a11y.liveRegion);
            },
            initPagination: function () {
                if (s.params.pagination && s.params.paginationClickable && s.bullets && s.bullets.length) {
                    s.bullets.each(function () {
                        var bullet = $(this);
                        s.a11y.makeFocusable(bullet);
                        s.a11y.addRole(bullet, 'button');
                        s.a11y.addLabel(bullet, s.params.paginationBulletMessage.replace(/{{index}}/, bullet.index() + 1));
                    });
                }
            },
            destroy: function () {
                if (s.a11y.liveRegion && s.a11y.liveRegion.length > 0) s.a11y.liveRegion.remove();
            }
        };
        

        /*=========================
          Init/Destroy
          ===========================*/
        s.init = function () {
            if (s.params.loop) s.createLoop();
            s.updateContainerSize();
            s.updateSlidesSize();
            s.updatePagination();
            if (s.params.scrollbar && s.scrollbar) {
                s.scrollbar.set();
                if (s.params.scrollbarDraggable) {
                    s.scrollbar.enableDraggable();
                }
            }
            if (s.params.effect !== 'slide' && s.effects[s.params.effect]) {
                if (!s.params.loop) s.updateProgress();
                s.effects[s.params.effect].setTranslate();
            }
            if (s.params.loop) {
                s.slideTo(s.params.initialSlide + s.loopedSlides, 0, s.params.runCallbacksOnInit);
            }
            else {
                s.slideTo(s.params.initialSlide, 0, s.params.runCallbacksOnInit);
                if (s.params.initialSlide === 0) {
                    if (s.parallax && s.params.parallax) s.parallax.setTranslate();
                    if (s.lazy && s.params.lazyLoading) {
                        s.lazy.load();
                        s.lazy.initialImageLoaded = true;
                    }
                }
            }
            s.attachEvents();
            if (s.params.observer && s.support.observer) {
                s.initObservers();
            }
            if (s.params.preloadImages && !s.params.lazyLoading) {
                s.preloadImages();
            }
            if (s.params.autoplay) {
                s.startAutoplay();
            }
            if (s.params.keyboardControl) {
                if (s.enableKeyboardControl) s.enableKeyboardControl();
            }
            if (s.params.mousewheelControl) {
                if (s.enableMousewheelControl) s.enableMousewheelControl();
            }
            if (s.params.hashnav) {
                if (s.hashnav) s.hashnav.init();
            }
            if (s.params.a11y && s.a11y) s.a11y.init();
            s.emit('onInit', s);
        };
        
        // Cleanup dynamic styles
        s.cleanupStyles = function () {
            // Container
            s.container.removeClass(s.classNames.join(' ')).removeAttr('style');
        
            // Wrapper
            s.wrapper.removeAttr('style');
        
            // Slides
            if (s.slides && s.slides.length) {
                s.slides
                    .removeClass([
                      s.params.slideVisibleClass,
                      s.params.slideActiveClass,
                      s.params.slideNextClass,
                      s.params.slidePrevClass
                    ].join(' '))
                    .removeAttr('style')
                    .removeAttr('data-swiper-column')
                    .removeAttr('data-swiper-row');
            }
        
            // Pagination/Bullets
            if (s.paginationContainer && s.paginationContainer.length) {
                s.paginationContainer.removeClass(s.params.paginationHiddenClass);
            }
            if (s.bullets && s.bullets.length) {
                s.bullets.removeClass(s.params.bulletActiveClass);
            }
        
            // Buttons
            if (s.params.prevButton) $(s.params.prevButton).removeClass(s.params.buttonDisabledClass);
            if (s.params.nextButton) $(s.params.nextButton).removeClass(s.params.buttonDisabledClass);
        
            // Scrollbar
            if (s.params.scrollbar && s.scrollbar) {
                if (s.scrollbar.track && s.scrollbar.track.length) s.scrollbar.track.removeAttr('style');
                if (s.scrollbar.drag && s.scrollbar.drag.length) s.scrollbar.drag.removeAttr('style');
            }
        };
        
        // Destroy
        s.destroy = function (deleteInstance, cleanupStyles) {
            // Detach evebts
            s.detachEvents();
            // Stop autoplay
            s.stopAutoplay();
            // Disable draggable
            if (s.params.scrollbar && s.scrollbar) {
                if (s.params.scrollbarDraggable) {
                    s.scrollbar.disableDraggable();
                }
            }
            // Destroy loop
            if (s.params.loop) {
                s.destroyLoop();
            }
            // Cleanup styles
            if (cleanupStyles) {
                s.cleanupStyles();
            }
            // Disconnect observer
            s.disconnectObservers();
            // Disable keyboard/mousewheel
            if (s.params.keyboardControl) {
                if (s.disableKeyboardControl) s.disableKeyboardControl();
            }
            if (s.params.mousewheelControl) {
                if (s.disableMousewheelControl) s.disableMousewheelControl();
            }
            // Disable a11y
            if (s.params.a11y && s.a11y) s.a11y.destroy();
            // Destroy callback
            s.emit('onDestroy');
            // Delete instance
            if (deleteInstance !== false) s = null;
        };
        
        s.init();
        

    
        // Return swiper instance
        return s;
    };
    

    /*==================================================
        Prototype
    ====================================================*/
    Swiper.prototype = {
        isSafari: (function () {
            var ua = navigator.userAgent.toLowerCase();
            return (ua.indexOf('safari') >= 0 && ua.indexOf('chrome') < 0 && ua.indexOf('android') < 0);
        })(),
        isUiWebView: /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent),
        isArray: function (arr) {
            return Object.prototype.toString.apply(arr) === '[object Array]';
        },
        /*==================================================
        Browser
        ====================================================*/
        browser: {
            ie: window.navigator.pointerEnabled || window.navigator.msPointerEnabled,
            ieTouch: (window.navigator.msPointerEnabled && window.navigator.msMaxTouchPoints > 1) || (window.navigator.pointerEnabled && window.navigator.maxTouchPoints > 1)
        },
        /*==================================================
        Devices
        ====================================================*/
        device: (function () {
            var ua = navigator.userAgent;
            var android = ua.match(/(Android);?[\s\/]+([\d.]+)?/);
            var ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
            var ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
            var iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/);
            return {
                ios: ipad || iphone || ipod,
                android: android
            };
        })(),
        /*==================================================
        Feature Detection
        ====================================================*/
        support: {
            touch : (window.Modernizr && Modernizr.touch === true) || (function () {
                return !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
            })(),
    
            transforms3d : (window.Modernizr && Modernizr.csstransforms3d === true) || (function () {
                var div = document.createElement('div').style;
                return ('webkitPerspective' in div || 'MozPerspective' in div || 'OPerspective' in div || 'MsPerspective' in div || 'perspective' in div);
            })(),
    
            flexbox: (function () {
                var div = document.createElement('div').style;
                var styles = ('alignItems webkitAlignItems webkitBoxAlign msFlexAlign mozBoxAlign webkitFlexDirection msFlexDirection mozBoxDirection mozBoxOrient webkitBoxDirection webkitBoxOrient').split(' ');
                for (var i = 0; i < styles.length; i++) {
                    if (styles[i] in div) return true;
                }
            })(),
    
            observer: (function () {
                return ('MutationObserver' in window || 'WebkitMutationObserver' in window);
            })()
        },
        /*==================================================
        Plugins
        ====================================================*/
        plugins: {}
    };
    

    /*===========================
    Dom7 Library
    ===========================*/
    var Dom7 = (function () {
        var Dom7 = function (arr) {
            var _this = this, i = 0;
            // Create array-like object
            for (i = 0; i < arr.length; i++) {
                _this[i] = arr[i];
            }
            _this.length = arr.length;
            // Return collection with methods
            return this;
        };
        var $ = function (selector, context) {
            var arr = [], i = 0;
            if (selector && !context) {
                if (selector instanceof Dom7) {
                    return selector;
                }
            }
            if (selector) {
                // String
                if (typeof selector === 'string') {
                    var els, tempParent, html = selector.trim();
                    if (html.indexOf('<') >= 0 && html.indexOf('>') >= 0) {
                        var toCreate = 'div';
                        if (html.indexOf('<li') === 0) toCreate = 'ul';
                        if (html.indexOf('<tr') === 0) toCreate = 'tbody';
                        if (html.indexOf('<td') === 0 || html.indexOf('<th') === 0) toCreate = 'tr';
                        if (html.indexOf('<tbody') === 0) toCreate = 'table';
                        if (html.indexOf('<option') === 0) toCreate = 'select';
                        tempParent = document.createElement(toCreate);
                        tempParent.innerHTML = selector;
                        for (i = 0; i < tempParent.childNodes.length; i++) {
                            arr.push(tempParent.childNodes[i]);
                        }
                    }
                    else {
                        if (!context && selector[0] === '#' && !selector.match(/[ .<>:~]/)) {
                            // Pure ID selector
                            els = [document.getElementById(selector.split('#')[1])];
                        }
                        else {
                            // Other selectors
                            els = (context || document).querySelectorAll(selector);
                        }
                        for (i = 0; i < els.length; i++) {
                            if (els[i]) arr.push(els[i]);
                        }
                    }
                }
                // Node/element
                else if (selector.nodeType || selector === window || selector === document) {
                    arr.push(selector);
                }
                //Array of elements or instance of Dom
                else if (selector.length > 0 && selector[0].nodeType) {
                    for (i = 0; i < selector.length; i++) {
                        arr.push(selector[i]);
                    }
                }
            }
            return new Dom7(arr);
        };
        Dom7.prototype = {
            // Classes and attriutes
            addClass: function (className) {
                if (typeof className === 'undefined') {
                    return this;
                }
                var classes = className.split(' ');
                for (var i = 0; i < classes.length; i++) {
                    for (var j = 0; j < this.length; j++) {
                        this[j].classList.add(classes[i]);
                    }
                }
                return this;
            },
            removeClass: function (className) {
                var classes = className.split(' ');
                for (var i = 0; i < classes.length; i++) {
                    for (var j = 0; j < this.length; j++) {
                        this[j].classList.remove(classes[i]);
                    }
                }
                return this;
            },
            hasClass: function (className) {
                if (!this[0]) return false;
                else return this[0].classList.contains(className);
            },
            toggleClass: function (className) {
                var classes = className.split(' ');
                for (var i = 0; i < classes.length; i++) {
                    for (var j = 0; j < this.length; j++) {
                        this[j].classList.toggle(classes[i]);
                    }
                }
                return this;
            },
            attr: function (attrs, value) {
                if (arguments.length === 1 && typeof attrs === 'string') {
                    // Get attr
                    if (this[0]) return this[0].getAttribute(attrs);
                    else return undefined;
                }
                else {
                    // Set attrs
                    for (var i = 0; i < this.length; i++) {
                        if (arguments.length === 2) {
                            // String
                            this[i].setAttribute(attrs, value);
                        }
                        else {
                            // Object
                            for (var attrName in attrs) {
                                this[i][attrName] = attrs[attrName];
                                this[i].setAttribute(attrName, attrs[attrName]);
                            }
                        }
                    }
                    return this;
                }
            },
            removeAttr: function (attr) {
                for (var i = 0; i < this.length; i++) {
                    this[i].removeAttribute(attr);
                }
                return this;
            },
            data: function (key, value) {
                if (typeof value === 'undefined') {
                    // Get value
                    if (this[0]) {
                        var dataKey = this[0].getAttribute('data-' + key);
                        if (dataKey) return dataKey;
                        else if (this[0].dom7ElementDataStorage && (key in this[0].dom7ElementDataStorage)) return this[0].dom7ElementDataStorage[key];
                        else return undefined;
                    }
                    else return undefined;
                }
                else {
                    // Set value
                    for (var i = 0; i < this.length; i++) {
                        var el = this[i];
                        if (!el.dom7ElementDataStorage) el.dom7ElementDataStorage = {};
                        el.dom7ElementDataStorage[key] = value;
                    }
                    return this;
                }
            },
            // Transforms
            transform : function (transform) {
                for (var i = 0; i < this.length; i++) {
                    var elStyle = this[i].style;
                    elStyle.webkitTransform = elStyle.MsTransform = elStyle.msTransform = elStyle.MozTransform = elStyle.OTransform = elStyle.transform = transform;
                }
                return this;
            },
            transition: function (duration) {
                if (typeof duration !== 'string') {
                    duration = duration + 'ms';
                }
                for (var i = 0; i < this.length; i++) {
                    var elStyle = this[i].style;
                    elStyle.webkitTransitionDuration = elStyle.MsTransitionDuration = elStyle.msTransitionDuration = elStyle.MozTransitionDuration = elStyle.OTransitionDuration = elStyle.transitionDuration = duration;
                }
                return this;
            },
            //Events
            on: function (eventName, targetSelector, listener, capture) {
                function handleLiveEvent(e) {
                    var target = e.target;
                    if ($(target).is(targetSelector)) listener.call(target, e);
                    else {
                        var parents = $(target).parents();
                        for (var k = 0; k < parents.length; k++) {
                            if ($(parents[k]).is(targetSelector)) listener.call(parents[k], e);
                        }
                    }
                }
                var events = eventName.split(' ');
                var i, j;
                for (i = 0; i < this.length; i++) {
                    if (typeof targetSelector === 'function' || targetSelector === false) {
                        // Usual events
                        if (typeof targetSelector === 'function') {
                            listener = arguments[1];
                            capture = arguments[2] || false;
                        }
                        for (j = 0; j < events.length; j++) {
                            this[i].addEventListener(events[j], listener, capture);
                        }
                    }
                    else {
                        //Live events
                        for (j = 0; j < events.length; j++) {
                            if (!this[i].dom7LiveListeners) this[i].dom7LiveListeners = [];
                            this[i].dom7LiveListeners.push({listener: listener, liveListener: handleLiveEvent});
                            this[i].addEventListener(events[j], handleLiveEvent, capture);
                        }
                    }
                }
    
                return this;
            },
            off: function (eventName, targetSelector, listener, capture) {
                var events = eventName.split(' ');
                for (var i = 0; i < events.length; i++) {
                    for (var j = 0; j < this.length; j++) {
                        if (typeof targetSelector === 'function' || targetSelector === false) {
                            // Usual events
                            if (typeof targetSelector === 'function') {
                                listener = arguments[1];
                                capture = arguments[2] || false;
                            }
                            this[j].removeEventListener(events[i], listener, capture);
                        }
                        else {
                            // Live event
                            if (this[j].dom7LiveListeners) {
                                for (var k = 0; k < this[j].dom7LiveListeners.length; k++) {
                                    if (this[j].dom7LiveListeners[k].listener === listener) {
                                        this[j].removeEventListener(events[i], this[j].dom7LiveListeners[k].liveListener, capture);
                                    }
                                }
                            }
                        }
                    }
                }
                return this;
            },
            once: function (eventName, targetSelector, listener, capture) {
                var dom = this;
                if (typeof targetSelector === 'function') {
                    targetSelector = false;
                    listener = arguments[1];
                    capture = arguments[2];
                }
                function proxy(e) {
                    listener(e);
                    dom.off(eventName, targetSelector, proxy, capture);
                }
                dom.on(eventName, targetSelector, proxy, capture);
            },
            trigger: function (eventName, eventData) {
                for (var i = 0; i < this.length; i++) {
                    var evt;
                    try {
                        evt = new window.CustomEvent(eventName, {detail: eventData, bubbles: true, cancelable: true});
                    }
                    catch (e) {
                        evt = document.createEvent('Event');
                        evt.initEvent(eventName, true, true);
                        evt.detail = eventData;
                    }
                    this[i].dispatchEvent(evt);
                }
                return this;
            },
            transitionEnd: function (callback) {
                var events = ['webkitTransitionEnd', 'transitionend', 'oTransitionEnd', 'MSTransitionEnd', 'msTransitionEnd'],
                    i, j, dom = this;
                function fireCallBack(e) {
                    /*jshint validthis:true */
                    if (e.target !== this) return;
                    callback.call(this, e);
                    for (i = 0; i < events.length; i++) {
                        dom.off(events[i], fireCallBack);
                    }
                }
                if (callback) {
                    for (i = 0; i < events.length; i++) {
                        dom.on(events[i], fireCallBack);
                    }
                }
                return this;
            },
            // Sizing/Styles
            width: function () {
                if (this[0] === window) {
                    return window.innerWidth;
                }
                else {
                    if (this.length > 0) {
                        return parseFloat(this.css('width'));
                    }
                    else {
                        return null;
                    }
                }
            },
            outerWidth: function (includeMargins) {
                if (this.length > 0) {
                    if (includeMargins)
                        return this[0].offsetWidth + parseFloat(this.css('margin-right')) + parseFloat(this.css('margin-left'));
                    else
                        return this[0].offsetWidth;
                }
                else return null;
            },
            height: function () {
                if (this[0] === window) {
                    return window.innerHeight;
                }
                else {
                    if (this.length > 0) {
                        return parseFloat(this.css('height'));
                    }
                    else {
                        return null;
                    }
                }
            },
            outerHeight: function (includeMargins) {
                if (this.length > 0) {
                    if (includeMargins)
                        return this[0].offsetHeight + parseFloat(this.css('margin-top')) + parseFloat(this.css('margin-bottom'));
                    else
                        return this[0].offsetHeight;
                }
                else return null;
            },
            offset: function () {
                if (this.length > 0) {
                    var el = this[0];
                    var box = el.getBoundingClientRect();
                    var body = document.body;
                    var clientTop  = el.clientTop  || body.clientTop  || 0;
                    var clientLeft = el.clientLeft || body.clientLeft || 0;
                    var scrollTop  = window.pageYOffset || el.scrollTop;
                    var scrollLeft = window.pageXOffset || el.scrollLeft;
                    return {
                        top: box.top  + scrollTop  - clientTop,
                        left: box.left + scrollLeft - clientLeft
                    };
                }
                else {
                    return null;
                }
            },
            css: function (props, value) {
                var i;
                if (arguments.length === 1) {
                    if (typeof props === 'string') {
                        if (this[0]) return window.getComputedStyle(this[0], null).getPropertyValue(props);
                    }
                    else {
                        for (i = 0; i < this.length; i++) {
                            for (var prop in props) {
                                this[i].style[prop] = props[prop];
                            }
                        }
                        return this;
                    }
                }
                if (arguments.length === 2 && typeof props === 'string') {
                    for (i = 0; i < this.length; i++) {
                        this[i].style[props] = value;
                    }
                    return this;
                }
                return this;
            },
    
            //Dom manipulation
            each: function (callback) {
                for (var i = 0; i < this.length; i++) {
                    callback.call(this[i], i, this[i]);
                }
                return this;
            },
            html: function (html) {
                if (typeof html === 'undefined') {
                    return this[0] ? this[0].innerHTML : undefined;
                }
                else {
                    for (var i = 0; i < this.length; i++) {
                        this[i].innerHTML = html;
                    }
                    return this;
                }
            },
            text: function (text) {
                if (typeof text === 'undefined') {
                    if (this[0]) {
                        return this[0].textContent.trim();
                    }
                    else return null;
                }
                else {
                    for (var i = 0; i < this.length; i++) {
                        this[i].textContent = text;
                    }
                    return this;
                }
            },
            is: function (selector) {
                if (!this[0]) return false;
                var compareWith, i;
                if (typeof selector === 'string') {
                    var el = this[0];
                    if (el === document) return selector === document;
                    if (el === window) return selector === window;
    
                    if (el.matches) return el.matches(selector);
                    else if (el.webkitMatchesSelector) return el.webkitMatchesSelector(selector);
                    else if (el.mozMatchesSelector) return el.mozMatchesSelector(selector);
                    else if (el.msMatchesSelector) return el.msMatchesSelector(selector);
                    else {
                        compareWith = $(selector);
                        for (i = 0; i < compareWith.length; i++) {
                            if (compareWith[i] === this[0]) return true;
                        }
                        return false;
                    }
                }
                else if (selector === document) return this[0] === document;
                else if (selector === window) return this[0] === window;
                else {
                    if (selector.nodeType || selector instanceof Dom7) {
                        compareWith = selector.nodeType ? [selector] : selector;
                        for (i = 0; i < compareWith.length; i++) {
                            if (compareWith[i] === this[0]) return true;
                        }
                        return false;
                    }
                    return false;
                }
    
            },
            index: function () {
                if (this[0]) {
                    var child = this[0];
                    var i = 0;
                    while ((child = child.previousSibling) !== null) {
                        if (child.nodeType === 1) i++;
                    }
                    return i;
                }
                else return undefined;
            },
            eq: function (index) {
                if (typeof index === 'undefined') return this;
                var length = this.length;
                var returnIndex;
                if (index > length - 1) {
                    return new Dom7([]);
                }
                if (index < 0) {
                    returnIndex = length + index;
                    if (returnIndex < 0) return new Dom7([]);
                    else return new Dom7([this[returnIndex]]);
                }
                return new Dom7([this[index]]);
            },
            append: function (newChild) {
                var i, j;
                for (i = 0; i < this.length; i++) {
                    if (typeof newChild === 'string') {
                        var tempDiv = document.createElement('div');
                        tempDiv.innerHTML = newChild;
                        while (tempDiv.firstChild) {
                            this[i].appendChild(tempDiv.firstChild);
                        }
                    }
                    else if (newChild instanceof Dom7) {
                        for (j = 0; j < newChild.length; j++) {
                            this[i].appendChild(newChild[j]);
                        }
                    }
                    else {
                        this[i].appendChild(newChild);
                    }
                }
                return this;
            },
            prepend: function (newChild) {
                var i, j;
                for (i = 0; i < this.length; i++) {
                    if (typeof newChild === 'string') {
                        var tempDiv = document.createElement('div');
                        tempDiv.innerHTML = newChild;
                        for (j = tempDiv.childNodes.length - 1; j >= 0; j--) {
                            this[i].insertBefore(tempDiv.childNodes[j], this[i].childNodes[0]);
                        }
                        // this[i].insertAdjacentHTML('afterbegin', newChild);
                    }
                    else if (newChild instanceof Dom7) {
                        for (j = 0; j < newChild.length; j++) {
                            this[i].insertBefore(newChild[j], this[i].childNodes[0]);
                        }
                    }
                    else {
                        this[i].insertBefore(newChild, this[i].childNodes[0]);
                    }
                }
                return this;
            },
            insertBefore: function (selector) {
                var before = $(selector);
                for (var i = 0; i < this.length; i++) {
                    if (before.length === 1) {
                        before[0].parentNode.insertBefore(this[i], before[0]);
                    }
                    else if (before.length > 1) {
                        for (var j = 0; j < before.length; j++) {
                            before[j].parentNode.insertBefore(this[i].cloneNode(true), before[j]);
                        }
                    }
                }
            },
            insertAfter: function (selector) {
                var after = $(selector);
                for (var i = 0; i < this.length; i++) {
                    if (after.length === 1) {
                        after[0].parentNode.insertBefore(this[i], after[0].nextSibling);
                    }
                    else if (after.length > 1) {
                        for (var j = 0; j < after.length; j++) {
                            after[j].parentNode.insertBefore(this[i].cloneNode(true), after[j].nextSibling);
                        }
                    }
                }
            },
            next: function (selector) {
                if (this.length > 0) {
                    if (selector) {
                        if (this[0].nextElementSibling && $(this[0].nextElementSibling).is(selector)) return new Dom7([this[0].nextElementSibling]);
                        else return new Dom7([]);
                    }
                    else {
                        if (this[0].nextElementSibling) return new Dom7([this[0].nextElementSibling]);
                        else return new Dom7([]);
                    }
                }
                else return new Dom7([]);
            },
            nextAll: function (selector) {
                var nextEls = [];
                var el = this[0];
                if (!el) return new Dom7([]);
                while (el.nextElementSibling) {
                    var next = el.nextElementSibling;
                    if (selector) {
                        if($(next).is(selector)) nextEls.push(next);
                    }
                    else nextEls.push(next);
                    el = next;
                }
                return new Dom7(nextEls);
            },
            prev: function (selector) {
                if (this.length > 0) {
                    if (selector) {
                        if (this[0].previousElementSibling && $(this[0].previousElementSibling).is(selector)) return new Dom7([this[0].previousElementSibling]);
                        else return new Dom7([]);
                    }
                    else {
                        if (this[0].previousElementSibling) return new Dom7([this[0].previousElementSibling]);
                        else return new Dom7([]);
                    }
                }
                else return new Dom7([]);
            },
            prevAll: function (selector) {
                var prevEls = [];
                var el = this[0];
                if (!el) return new Dom7([]);
                while (el.previousElementSibling) {
                    var prev = el.previousElementSibling;
                    if (selector) {
                        if($(prev).is(selector)) prevEls.push(prev);
                    }
                    else prevEls.push(prev);
                    el = prev;
                }
                return new Dom7(prevEls);
            },
            parent: function (selector) {
                var parents = [];
                for (var i = 0; i < this.length; i++) {
                    if (selector) {
                        if ($(this[i].parentNode).is(selector)) parents.push(this[i].parentNode);
                    }
                    else {
                        parents.push(this[i].parentNode);
                    }
                }
                return $($.unique(parents));
            },
            parents: function (selector) {
                var parents = [];
                for (var i = 0; i < this.length; i++) {
                    var parent = this[i].parentNode;
                    while (parent) {
                        if (selector) {
                            if ($(parent).is(selector)) parents.push(parent);
                        }
                        else {
                            parents.push(parent);
                        }
                        parent = parent.parentNode;
                    }
                }
                return $($.unique(parents));
            },
            find : function (selector) {
                var foundElements = [];
                for (var i = 0; i < this.length; i++) {
                    var found = this[i].querySelectorAll(selector);
                    for (var j = 0; j < found.length; j++) {
                        foundElements.push(found[j]);
                    }
                }
                return new Dom7(foundElements);
            },
            children: function (selector) {
                var children = [];
                for (var i = 0; i < this.length; i++) {
                    var childNodes = this[i].childNodes;
    
                    for (var j = 0; j < childNodes.length; j++) {
                        if (!selector) {
                            if (childNodes[j].nodeType === 1) children.push(childNodes[j]);
                        }
                        else {
                            if (childNodes[j].nodeType === 1 && $(childNodes[j]).is(selector)) children.push(childNodes[j]);
                        }
                    }
                }
                return new Dom7($.unique(children));
            },
            remove: function () {
                for (var i = 0; i < this.length; i++) {
                    if (this[i].parentNode) this[i].parentNode.removeChild(this[i]);
                }
                return this;
            },
            add: function () {
                var dom = this;
                var i, j;
                for (i = 0; i < arguments.length; i++) {
                    var toAdd = $(arguments[i]);
                    for (j = 0; j < toAdd.length; j++) {
                        dom[dom.length] = toAdd[j];
                        dom.length++;
                    }
                }
                return dom;
            }
        };
        $.fn = Dom7.prototype;
        $.unique = function (arr) {
            var unique = [];
            for (var i = 0; i < arr.length; i++) {
                if (unique.indexOf(arr[i]) === -1) unique.push(arr[i]);
            }
            return unique;
        };
    
        return $;
    })();
    

    /*===========================
     Get Dom libraries
     ===========================*/
    var swiperDomPlugins = ['jQuery', 'Zepto', 'Dom7'];
    for (var i = 0; i < swiperDomPlugins.length; i++) {
    	if (window[swiperDomPlugins[i]]) {
    		addLibraryPlugin(window[swiperDomPlugins[i]]);
    	}
    }
    // Required DOM Plugins
    var domLib;
    if (typeof Dom7 === 'undefined') {
    	domLib = window.Dom7 || window.Zepto || window.jQuery;
    }
    else {
    	domLib = Dom7;
    }

    /*===========================
    Add .swiper plugin from Dom libraries
    ===========================*/
    function addLibraryPlugin(lib) {
        lib.fn.swiper = function (params) {
            var firstInstance;
            lib(this).each(function () {
                var s = new Swiper(this, params);
                if (!firstInstance) firstInstance = s;
            });
            return firstInstance;
        };
    }
    
    if (domLib) {
        if (!('transitionEnd' in domLib.fn)) {
            domLib.fn.transitionEnd = function (callback) {
                var events = ['webkitTransitionEnd', 'transitionend', 'oTransitionEnd', 'MSTransitionEnd', 'msTransitionEnd'],
                    i, j, dom = this;
                function fireCallBack(e) {
                    /*jshint validthis:true */
                    if (e.target !== this) return;
                    callback.call(this, e);
                    for (i = 0; i < events.length; i++) {
                        dom.off(events[i], fireCallBack);
                    }
                }
                if (callback) {
                    for (i = 0; i < events.length; i++) {
                        dom.on(events[i], fireCallBack);
                    }
                }
                return this;
            };
        }
        if (!('transform' in domLib.fn)) {
            domLib.fn.transform = function (transform) {
                for (var i = 0; i < this.length; i++) {
                    var elStyle = this[i].style;
                    elStyle.webkitTransform = elStyle.MsTransform = elStyle.msTransform = elStyle.MozTransform = elStyle.OTransform = elStyle.transform = transform;
                }
                return this;
            };
        }
        if (!('transition' in domLib.fn)) {
            domLib.fn.transition = function (duration) {
                if (typeof duration !== 'string') {
                    duration = duration + 'ms';
                }
                for (var i = 0; i < this.length; i++) {
                    var elStyle = this[i].style;
                    elStyle.webkitTransitionDuration = elStyle.MsTransitionDuration = elStyle.msTransitionDuration = elStyle.MozTransitionDuration = elStyle.OTransitionDuration = elStyle.transitionDuration = duration;
                }
                return this;
            };
        }
    }

    window.Swiper = Swiper;
})();
/*===========================
Swiper AMD Export
===========================*/
if (typeof(module) !== 'undefined')
{
    module.exports = window.Swiper;
}
else if (typeof define === 'function' && define.amd) {
    define([], function () {
        'use strict';
        return window.Swiper;
    });
}
//# sourceMappingURL=maps/swiper.js.map

