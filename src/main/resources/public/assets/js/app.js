/**
 * 管理系统公用方法
 * 公用命名空间 window.app
 * 注意：easyUI控件options中 所有自定义属性必须加下划线 如: _url
 * @createBy TanYong
 * @createDate 2015-06-19
 */
(function ($) {

  window.app = {

    /**
     * 通用ajax方法
     * 自动在url前加 项目名
     * @param options 和$.ajax参数一样
     * @createBy TanYong
     * @createDate 2015-06-23
     */
    commonAjax: function (options) {
      var defaultOptions = {method: "POST"};
      options.url = this.ctx + options.url;
      options = $.extend(defaultOptions, options);
      $.ajax(options);
    },

    /**
     * 根据 asci 码 生成 正则表达式
     * @param str
     * @returns {string}
     */
    asciiFormat: function (str) {
      var list = str.split(',');
      var result = '';
      $.each(list, function (i, obj) {
        if (obj) {
          result += String.fromCharCode(obj);
        }
      })
      return result;
    },

    /**
     *
     * @param data 需要遍历的节点数组
     * @param callback 每个节点的回调函数  return false; 停止遍历
     * @param parent 父节点 根节点不传或传null
     * @param level 层级
     */
    eachTree: function (data, callback, parent, level) {
      var _this = this;
      level = level || 0;
      for (var a = 0; a < data.length; a++) {
        var node = data[a];
        if (callback.call(node, node, parent, a, level) === false) {
          return false;
        }
        if (node.children && node.children.length) {
          if (this.eachTree(node.children, callback, node, level + 1) === false) {
            return false;
          }
        }
      }
    },

    /**
     * 解析URL参数
     * @param url 要解析的url地址
     * @return JSON格式的参数
     * @createBy TanYong
     * @createDate 2015-06-24
     */
    parseParams: function (url) {
      if (url.indexOf("?") != -1) {
        url = url.substr(url.indexOf("?") + 1);
      }
      var paramsArr = url.match(/[^\?\=\&]*\=[^\?\=\&]*/g);
      var params = {};
      if (paramsArr != null) {
        $.each(paramsArr, function () {
          var kv = this.split("=");
          params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
        });
      }
      return params;
    },

    /**
     * 给一个url添加参数
     * @param url 要添加参数的url
     * @param params 要添加的参数对象 Object
     * @param isUrl 是否url，默认true, 为true不存在？则会自动添加？ false则不会添加
     */
    addUrlParams: function (url, params, isUrl) {
      if (isUrl !== false && url.indexOf("?") == -1) {
        url += "?";
      }
      for (var item in params) {
        var value = params[item];
        if (typeof(value) === "object") {
          value = JSON.stringify(value);
        }
        if (!url || (url.substr(url.length - 1) != "&" && url.substr(url.length - 1) != "?")) {
          url += "&";
        }
        url += decodeURIComponent(item) + "=" + encodeURIComponent(value);
      }
      return url;
    },




    /**
     * 初始化
     * @createBy TanYong
     * @createDate 2015-06-23
     */
    init: function () {
      this.params = this.parseParams(window.location.search);
    }
  };
  app.init();
})($);