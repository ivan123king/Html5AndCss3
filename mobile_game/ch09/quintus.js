(function(){
    var initializing = false,
        fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
    // The base Class implementation (does nothing)
    this.Class = function(){};

    // Create a new Class that inherits from this class
    Class.extend = function(prop) {
        var _super = this.prototype;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;

        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" &&
            typeof _super[name] == "function" &&
            fnTest.test(prop[name]) ?
                (function(name, fn){
                    return function() {
                        var tmp = this._super;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = _super[name];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);
                        this._super = tmp;

                        return ret;
                    };
                })(name, prop[name]) :
                prop[name];
        }

        // The dummy class constructor
        function Class() {
            // All construction is actually done in the init method
            if ( !initializing && this.init )
                this.init.apply(this, arguments);
        }

        // Populate our constructed prototype object
        Class.prototype = prototype;

        // Enforce the constructor to be what we expect
        Class.prototype.constructor = Class;
        // And make this class extendable
        Class.extend = arguments.callee;

        return Class;
    };
})();


(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
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
}());


var Quintus = function(opts){
    var Q = {};

    // Some base options to be filled in later
    Q.options = {
        imagePath: "images/",
        audioPath: "audio/",
        dataPath:  "data/",
        audioSupported: [ 'mp3','ogg' ],
        sound: true
    };
    if(opts) { _(Q.options).extend(opts); }


    Q._normalizeArg = function(arg) {
        if(_.isString(arg)) {
            arg = arg.replace(/\s+/g,'').split(",");
        }
        if(!_.isArray(arg)) {
            arg = [ arg ];
        }
        return arg;
    };

    // Shortcut to extend Quintus with new functionality
    // binding the methods to Q
    Q.extend = function(obj) {
        _(Q).extend(obj);
        return Q;
    };

    // Syntax for including other modules into quintus
    Q.include = function(mod) {
        _.each(Q._normalizeArg(mod),function(m) {
            m = Quintus[m] || m;
            m(Q);
        });
        return Q;
    };

    Q.gameLoop = function(callback) {
        Q.lastGameLoopFrame = new Date().getTime();

        Q.gameLoopCallbackWrapper = function(now) {
            Q.loop = requestAnimationFrame(Q.gameLoopCallbackWrapper);
            var dt = now - Q.lastGameLoopFrame;
            if(dt > 100) { dt = 100; }
            callback.apply(Q,[dt / 1000]);
            Q.lastGameLoopFrame = now;
        };

        requestAnimationFrame(Q.gameLoopCallbackWrapper);
    };

    Q.pauseGame = function() {
        if(Q.loop) {
            cancelAnimationFrame(Q.loop);
        }
        Q.loop = null;
    };

    Q.unpauseGame = function() {
        if(!Q.loop) {
            Q.lastGameLoopFrame = new Date().getTime();
            Q.loop = requestAnimationFrame(Q.gameLoopCallbackWrapper);
        }
    }

    Q.Evented = Class.extend({
        bind: function(event,target,callback) {
            // Handle the case where there is no target provided
            if(!callback) {
                callback = target;
                target = null;
            }
            // Handle case for callback that is a string
            if(_.isString(callback)) {
                callback = target[callback];
            }

            this.listeners = this.listeners || {};
            this.listeners[event] = this.listeners[event] || [];
            this.listeners[event].push([ target || this, callback]);
            if(target) {
                if(!target.binds) { target.binds = []; }
                target.binds.push([this,event,callback]);
            }
        },

        trigger: function(event,data) {
            if(this.listeners && this.listeners[event]) {
                for(var i=0,len = this.listeners[event].length;i<len;i++) {
                    var listener = this.listeners[event][i];
                    listener[1].call(listener[0],data);
                }
            }
        },

        unbind: function(event,target,callback) {
            if(!target) {
                if(this.listeners[event]) {
                    delete this.listeners[event];
                }
            } else {
                var l = this.listeners && this.listeners[event];
                if(l) {
                    for(var i = l.length-1;i>=0;i--) {
                        if(l[i][0] == target) {
                            if(!callback || callback == l[i][1]) {
                                this.listeners[event].splice(i,1);
                            }
                        }
                    }
                }
            }
        },

        debind: function() {
            if(this.binds) {
                for(var i=0,len=this.binds.length;i<len;i++) {
                    var boundEvent = this.binds[i],
                        source = boundEvent[0],
                        event = boundEvent[1];
                    source.unbind(event,this);
                }
            }
        }

    });

    Q.components = {};

    Q.register = function(name,methods) {
        methods.name = name;
        Q.components[name] = Q.Component.extend(methods);
    };

    Q.Component = Q.Evented.extend({
        init: function(entity) {
            this.entity = entity;
            if(this.extend) _.extend(entity,this.extend);
            entity[this.name] = this;
            entity.activeComponents.push(this.name);
            if(this.added) this.added();
        },

        destroy: function() {
            if(this.extend) {
                var extensions = _.keys(this.extend);
                for(var i=0,len=extensions.length;i<len;i++) {
                    delete this.entity[extensions[i]];
                }
            }
            delete this.entity[this.name];
            var idx = this.entity.activeComponents.indexOf(this.name);
            if(idx != -1) {
                this.entity.activeComponents.splice(idx,1);
            }
            this.debind();
            if(this.destroyed) this.destroyed();
        }
    });

    Q.GameObject = Q.Evented.extend({
        has: function(component) {
            return this[component] ? true : false;
        },
        add: function(components) {
            components = Q._normalizeArg(components);
            if(!this.activeComponents) { this.activeComponents = []; }
            for(var i=0,len=components.length;i<len;i++) {
                var name = components[i],
                    comp = Q.components[name];
                if(!this.has(name) && comp) {
                    var c = new comp(this);
                    this.trigger('addComponent',c);
                }
            }
            return this;
        },
        del: function(components) {
            components = Q._normalizeArg(components);
            for(var i=0,len=components.length;i<len;i++) {
                var name = components[i];
                if(name && this.has(name)) {
                    this.trigger('delComponent',this[name]);
                    this[name].destroy();
                }
            }
            return this;
        },

        destroy: function() {
            if(this.destroyed) { return; }
            this.debind();
            if(this.parent && this.parent.remove) {
                this.parent.remove(this);
            }
            this.trigger('removed');
            this.destroyed = true;
        }
    });

    Q.setup = function(id, options) {
        var touchDevice = 'ontouchstart' in document;
        options = options || {};
        id = id || "quintus";
        Q.el = $(_.isString(id) ? "#" + id : id);

        if(Q.el.length === 0) {
            Q.el = $("<canvas width='320' height='420'></canvas>")
                .attr('id',id).appendTo("body");
        }

        var maxWidth = options.maxWidth || 5000,
            maxHeight = options.maxHeight || 5000,
            resampleWidth = options.resampleWidth,
            resampleHeight = options.resampleHeight;

        if(options.maximize) {
            $("html, body").css({ padding:0, margin: 0 });
            var w = Math.min(window.innerWidth,maxWidth);
            var h = Math.min(window.innerHeight - 5,maxHeight)

            if(touchDevice) {
                Q.el.css({height: h * 2});
                window.scrollTo(0,1);

                w = Math.min(window.innerWidth,maxWidth);
                h = Math.min(window.innerHeight - 5,maxHeight);
            }

            if(((resampleWidth && w > resampleWidth) ||
                (resampleHeight && h > resampleHeight)) &&
                touchDevice) {
                Q.el.css({  width:w, height:h })
                    .attr({ width:w/2, height:h/2 });
            } else {
                Q.el.css({  width:w, height:h })
                    .attr({ width:w, height:h });
            }

        }

        Q.wrapper = Q.el
            .wrap("<div id='" + id + "_container'/>")
            .parent()
            .css({ width: Q.el.width(),
                margin: '0 auto' });

        Q.el.css('position','relative');

        Q.ctx = Q.el[0].getContext &&
            Q.el[0].getContext("2d");


        if(touchDevice) { window.scrollTo(0,1); }
        Q.width = parseInt(Q.el.attr('width'),10);
        Q.height = parseInt(Q.el.attr('height'),10);

        $(window).bind('orientationchange',function() {
            setTimeout(function() { window.scrollTo(0,1); }, 0);
        });

        return Q;
    };
    Q.clear = function(){
        Q.ctx.clearRect(0,0,Q.el[0].width,Q.el[0].height);
    };

    //定义资产类型
    Q.assetTypes = {
        png:"Image",jpg:"Image",gif:"Image",jpeg:"Image",
        ogg:'Audio',wav:'Audio',m4a:'Audio',mp3:'Audio'
    };
    Q.assetType = function(asset){
        var fileExt = _(asset.split(".")).last().toLowerCase();
        return Q.assetTypes[fileExt] || 'Other';
    };
    Q.loadAssetImage = function(key,src,callback,errorCallback){
        var img = new Image();
        $(img).on('load',function(){
           callback(key,img);
        });
        $(img).on('error',errorCallback);
        img.src = Q.options.imagePath+src;
    }
    Q.audioMimeTypes = {mp3:'audio/mpeg',ogg:'audio/ogg;codecs="vorbis"',
                            m4a:'audio/m4a',wav:'audio/wav'};
    Q.loadAssetAudio = function(key,src,callback,errorCallback){
      if(!document.createElement("audio").play||!Q.options.sound){
          callback(key,null);
          return;
      }
      var snd = new Audio(),
          baseName = Q._removeExtension(src),
          extension = null,
          filename = null;
        extension = _(Q.options.audioSupported).detect(function(extension){
            return snd.canPlayType(Q.audioMimeTypes[extension])? extension:null;
        });
        if(!extension){
            callback(key,null);
            return;
        }
        $(snd).on('error',errorCallback);
        $(snd).on('canplaythrough',function(){
           callback(key,snd);
        });
        snd.src = Q.options.audioPath+baseName+"."+extension;
        snd.load();
        return snd;
    };
    Q.loadAssetOther = function(key,src,callback,errorCallback){
        $.get(Q.options.dataPath+src,function(data){
            callback(key,data);
        }).fail(errorCallback);
    };
    Q._removeExtension = function(filename){
        return filename.replace(/\.(\w{3,4})$/,"");
    }
    Q.assets = {};
    Q.asset = function(name){
        return Q.assets[name];
    };
    Q.load = function(assets,callback,options){
        var assetObj = {};
        if(!options) {options = {};}
        var progressCallback = options.progressCallback;
        var errors = false,
            errorCallback = function(itm){
                errors = true;
                (options.errorCallback ||
                    function(itm){alert("Error Loading"+itm);})(itm);//(A)(B)这种格式是函数调用
            }
            if(_.isArray(assets)){
                _.each(assets,function(itm){
                   if(_.isObject(itm)){
                       _.extend(assetObj,itm);
                   }else{
                       assetObj[itm] = itm;
                   }
                });
            }else if(_.isString(assets)){
                assetObj[assets] = assets;
            }
            else{
                assetObj = assets;
            }
            var assetsTotal = _(assetObj).keys().length,
                assetsRemaining = assetsTotal;
        var loadedCallback = function(key,obj){
            if(errors) return;
            Q.assets[key] = obj;
            assetsRemaining--;
            if(progressCallback){
                progressCallback(assetsTotal-assetsRemaining,assetsTotal);
            }
            if(assetsRemaining===0&&callback){
                callback.apply(Q);
            }
        };
        _.each(assetObj,function(itm,key){
           var assetType = Q.assetType(itm);
            if(Q.assets[key]){
                loadedCallback(key,Q.assets[key]);
            }else{
                Q['loadAsset'+assetType](key,itm,loadedCallback,function(){
                   errorCallback(itm);
                });
            }
        });
    };

    //预加载支持
    Q.preloads = [];
    Q.preload = function(arg,options){
        if(_(arg).isFunction()){//判断是否是函数underscore中的方法
            Q.load(_(Q.preloads).uniq(),arg,options);
            Q.preloads = [];
        }else{
            Q.preloads = Q.preloads.concat(arg);
        }
    }

    return Q;
}

