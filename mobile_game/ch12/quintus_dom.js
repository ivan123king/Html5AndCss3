/**
 * Created by lenovo on 2017/11/2.
 */
Quintus.DOM = function (Q) {
    Q.setupDOM = function (id, options) {
        options = options || {};
        id = id || "quintus";
        Q.el = $(_.isString(id) ? "#" + id : id);
        if (Q.el.length === 0) {
            Q.el = $("<div>").attr("id", id).css({width: 320, height: 420}).appendTo("body");
        }
        if (options.maximize) {
            var w = $(window).width();
            var h = $(window).height();
            Q.el.css({width: w, height: h});
        }
        Q.wrapper = Q.el.wrap("<div id='" + id + "_container'>").parent().css({width:Q.el.width(),
        height:Q.el.height(),margin:'0 auto'});
        Q.el.css({position:'relative',overflow:'hidden'});
        Q.width = Q.el.width();
        Q.height = Q.el.height();
        setTimeout(function(){
            window.scrollTo(0,1);
        },0);
        $(window).bind('orientationchange',function(){
         settimeout(function(){
             window.scrollTo(0,1);
         },0)
        });
        return Q;
    }

    (function(){
       function translateBuilder(attribute){
           return function(dom,x,y){
               dom.style[attribute] = 'translate('+Math.floor(x)+"px,"+Math.floor(y)+"px)";
           };
       }
       function translate3DBuilder(attribute){
           return function(dom,x,y){
               dom.style[attribute] = "translate3d"+Math.floor(x)+"px,"+Math.floor(y)+"px,0px)";
           };
       }
       function scaleBuilder(attribute){
           return function(dom,scale){
               dom.style[attribute+"Origin"] = "0% 0%";
               dom.style[attribute] = 'scale('+scale+")";
           };
       }
       function fallbackTranslate(dom,x,y){
           dom.style.left = x+"px";
           dom.style.top = y+"px";
       }
        var has3d = ('WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix());
        var dummyStyle = $("<div>")[0].style;
        var transformMethods = ['transform','webkitTransform','MozTransform','msTransform'];
        for(var i=0;i<transformMethods.length;i++){
            var transformName = transformMethods[i];
            if(!_.isUndefined(dummyStyle[transformName])){
                if(has3d){
                    Q.positionDOM = translate3DBuilder(transformmName);
                }else{
                    Q.positionDOM = translateBuilder(transformName);
                }
                Q.scaleDOM = scaleBuilder(transformName);
                break;
            }
        }
        Q.positionDOM = Q.positionDOM || fallbackTranslate ;
        Q.scaleDOM = Q.scaleDOM || function(scale){};
    })();
}