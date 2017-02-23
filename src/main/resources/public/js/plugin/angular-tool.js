/**
 * Created by Administrator on 2017/2/23.
 */


(function () {
    var tools = angular.module('tools', []);

    /**
     * 获取唯一索引（自动增长）
     */
    tools.factory('tIndexSer', [function () {
        var indexObj = {def: 0};
        return {
            get: function (key) {
                key = key || "def";
                if (indexObj[key] === undefined) {
                    return indexObj[key] = 1;
                }
                return ++indexObj[key];
            }
        }
    }]);

    /**
     * 样式表操作服务类
     */
    tools.factory('tStyleSer', [function () {
        return {
            insert: function (styleSheet, selector, cssTxt, position) {
                position = position || 0;
                if (styleSheet.insertRule) {
                    styleSheet.insertRule(selector + "{" + cssTxt + "}", position);
                } else {
                    styleSheet.addRule(selector, cssTxt, position);
                }
            },

            remove: function (styleSheet, index) {
                if (styleSheet.deleteRule) {
                    styleSheet.deleteRule(index);
                } else {
                    styleSheet.removeRule(index);
                }
            },

            update: function (styleSheet, index, cssObj) {
                var rules = styleSheet[index].cssRules || styleSheet[index].rules;
                for (var name in cssObj) {
                    rules[index][name] = cssObj[name];
                }
            }
        }
    }]);


    // 在 ng-repeate最后一个元素 加载完成后向他的父元素发送消息
    tools.directive('repeatFinish', function ($timeout) {
        return {
            restrict: "EA",
            link: function (scope, element, attr) {
                if (scope.$last == true) {
                    $timeout(function () {
                        scope.$emit('to-parent');
                    });
                }
            }
        }
    });



    /**
     * 可以重复使用的transclude, 由于angular transclude不能再其他指令中重复使用
     */
    tools.directive('showTransclude', function () {
        return {
            restrict: 'EA',
            link: function ($scope, $element) {
                if (!$scope.transclude) {
                    throw minErr('showTransclude')('',
                        '作用域中不存在transclude');
                }

                $scope.transclude($scope, function (clone) {
                    $element.after(clone);
                    $element.remove();
                });
            }
        }
    });

    /**
     * 回车事件
     */
    tools.directive('myEnter', function () {
        return {
            restrict: 'A',
            require: '?ngModel',
            link: function (scope, ele, attr, controller) {
                ele.bind('keydown keypress', function (event) {
                    if (event.which === 13) {
                        scope.$apply(function () {
                            scope.$eval(attr.myEnter);
                        });
                        event.preventDefault();
                    }
                });
            }
        }
    });




    /**
     * 表格指令 格式化某列指令
     */
    tools.directive('tFormatCol', function () {

        return {
            restrict: 'A',
            template: '<div ng-if="isReplace" ng-transclude></div>',
            transclude: true,
            link: function ($scope, $element, attrs, ctrls, $transclude) {
                var isReplace = !$scope.isFormat && $scope.col.field == attrs.tFormatCol;
                if (isReplace) {
                    $scope.isReplace = isReplace;
                    $scope.isFormat = true;
                } else {
                    // 如果不是该列则删除自身这个节点
                    $element.remove();
                }
            }
        }
    });


    // 列默认属性
    var defaultCol = {
        field: "",
        align: "center",
        width: "",
        sortable: true,
        title: ""
    };


    /**
     * 通用树形表格
     */
    tools.directive('tTree', ['$http', 'tStyleSer', 'tIndexSer', function ($http, tStyleSer, tIndexSer) {
        // 默认配置
        var tableConf = {
            // 展开收起显示位置
            treeField: "name",
            idField:'XAT_ID',
            columns: [],
            // 单击事件
            onClick: $.noop,
            // 动态加载URL
            url: null,
            // 请求URL的参数
            params: {},
            // 开始加载之前的事件
            onLoadBef: $.noop,
            // 加载之后调用处理事件的方法
            loadFilter: null,
            // 加载成功之后的事件
            onLoadSuccess: $.noop,
            data: []
        };


        /**
         * 加载数据方法
         * @param node 要加载数据的节点 不传或传null为刷新所有
         * @param params 需要附加的URL参数 可以为空
         */
        var load = function (node, params) {
            var scope = this;
            // 当前树配置对象
            var curConf = scope.tableConf;

            var curParams = $.extend({}, curConf.params, params);
            // 触发加载前事件 可以修改参数 返回false停止加载
            if (curConf.onLoadBef(curParams, node) === false) {
                return;
            }
            // 记录加载状态
            if (node) {
                node._isLoad = true;
            }


            var httpConf = {method: 'get', url: curConf.url, params: curParams, loading: this.tableEle};
            // 刷新的时候显示加载动画

            $http(httpConf).success(function (data) {
                // 数据转换方法
                if ($.isFunction(curConf.loadFilter)) {
                    data = curConf.loadFilter(data);
                }

                // 数据格式为 {rows: [], columns: [], total: 总条数}
                if (data && data.columns) {
                    curConf.columns = data.columns;
                }
                if (node) {
                    //刷新父节点
                    if(curParams.refreshParent){
                        if(!node._parent){
                            curConf.data = data.data;
                        }else{
                            node._parent.children = data.data;
                        }
                    }else{
                        //刷新自己
                        if(curParams.refreshSelf){
                            if(!node._parent){
                                $.each(curConf.data, function (i) {
                                    if(this == node){
                                        curConf.data[i] = data.data[0];
                                    }
                                });
                            }else{
                                $.each(node._parent.children, function (i) {
                                    if(this == node){
                                        node._parent.children[i] = data.data[0]
                                    }
                                })
                            }
                        }else{
                            node.children = data.rows || data.data;
                            node._isLoad = false;
                        }
                    }
                } else {
                    scope.data = curConf.data = data.rows || data.data;
                }

                // 触发加载成功事件
                curConf.onLoadSuccess(data);
            }).error(function () {
                if (node) {
                    node._isLoad = false;
                }
            });
        };


        /**
         * 单选一行
         * @param row
         */
        var singleSelect = function (row) {
            var scope = this;
            var curConf = scope.tableConf;
            app.eachTree(curConf.data, function () {
                if (this == row) {
                    this._selected = !this._selected;
                } else {
                    this._selected = false;
                }
            });

        };
        /**
         * 行鼠标按下事件 多选
         */
        var rowMouseDown = function (row, $event) {
            var scope = this;
            // 当前配置对象
            var curConf = scope.tableConf;
            // 按住ctrl是多选
            if ($event.ctrlKey) {
                if ($event.button == 2) {
                    row._selected = true;
                } else {
                    row._selected = !row._selected;
                }
            } else {
                // 如果当前行为选中状态 且点击右键 则什么都不做（有可能多选状态点击右键应该继续冒泡到下一个事件）
                if (!row._selected || $event.button != 2) {
                    singleSelect.call(this, row);
                }
            }
            if (scope.menuConf) {
                scope.menuConf.show();
            }
        };

        /**
         *鼠标的移出事件
         * @param row
         * @param $event
         */
        var rowMouseLeave = function (row, $event) {
            row._moveIn = false;
        }

        /**
         * 鼠标的移入事件
         * @param row
         * @param $event
         */
        var rowMouseEnter = function (row, $event) {
            row._moveIn = true;
        }


        /**
         * 创建列样式（设置宽度）
         */
        var createColStyle = function () {
            var scope = this;
            // 当前配置对象
            var curConf = scope.tableConf;
            var sheet = scope.sheet;
            var columns = curConf.columns;
            var defaultWidth = scope.tableEle.width() / columns.length;
            $(columns).each(function (index) {
                tStyleSer.insert(sheet, ".t-tree-" + scope.index + "-" + this.field, "width:" + (this.width || defaultWidth) + "px", index);
            });
        };

        /**
         * 展开图标单击事件
         * @param node 当前单击的节点数据
         * @param $event 事件对象
         */
        var iconClick = function (node, $event) {
            var scope = this;

            if (node.children.length) {
                node.close = !node.close;
            } else if (node._hasChild && !node._isLoad) {
                // 如果_hasChild为true则需要动态加载子节点
                scope.load(node);
                node.close = false;
                node._hasChild = false;
            }
            ;
            // 阻止冒泡 否则会触发节点的click事件
            $event && $event.stopPropagation();
        };

        return {
            restrict: 'AE',
            templateUrl: "/template/treegrid.html",
            scope: {
                tableConf: "=tTree"
            },
            transclude: true,
            link: function (scope, ele, $attr, ctrl, $transclude) {

                scope.treeScope = scope;
                var tempConf = $.extend({}, tableConf, scope.tableConf);
                var curConf = $.extend(scope.tableConf, tempConf);
                // 模版中需要使用
                scope.data = curConf.data;
                scope.tableScope = scope;
                scope.tableEle = $(ele);
                // 获取唯一标识
                scope.index = tIndexSer.get("tTree");
                scope.load = load;
                scope.transclude = $transclude;
                scope.rowMouseLeave = rowMouseLeave;
                scope.rowMouseEnter = rowMouseEnter;
                scope.rowMouseDown = rowMouseDown;


                scope.iconClick = iconClick;

                curConf.reload = function(){
                    //load.apply(scope,)
                }

                curConf.iconClick = function () {
                    iconClick.apply(scope, arguments);
                };
                // 获取当前选中行
                curConf.getSelected = function () {
                    var result = [];
                    app.eachTree(this.data, function () {
                        if (this._selected) {
                            result.push(this);
                        }
                    });
                    return result;
                };

                // 样式表sheet对象
                scope.sheet = ele.find("style").get(0).sheet || ele.find("style").get(0).styleSheet;
                if (curConf.columns.length) {
                    createColStyle.call(scope);
                } else {
                    var unWatch = scope.$watch("tableConf.columns", function (newValue) {
                        if (newValue.length) {
                            createColStyle.call(scope);
                            unWatch();
                        }
                    });
                }
                // 菜单配置文件
                if (curConf.menus && curConf.menus.length) {
                    scope.menuConf = {
                        menus: curConf.menus
                    };
                }
                // 给调用者使用
                curConf.load = function () {
                    scope.load.apply(scope, arguments);
                };
                // 如果有url则调用load刷新
                if (curConf.url) {
                    scope.load();
                }
            }

        }
    }]);




})();
