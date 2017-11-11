/**
 * Created by lenovo on 2017/11/11.
 */
var EventUtil = {
    addHandler:function(element,type,handler){
        if(element.addEventListener){
            element.addEventListener(type,handler,false);
        }else if(element.attachEvent){
            element.attachEvent("on"+type,handler);
        }else{
            element["on"+type] = handler;
        }
    },
    removeHandler:function(element,type,handler){
        if(element.removeEventListener){
            element.removeEventListener(type,handler,false);
        }else if(element.detachEvent){
            element.detachEvent("on"+type,handler);
        }else{
            element["on"+type] = null;
        }
    },
    getEvent:function(event){
        return event ? event:window.event;
    },
    getTarget:function(event){
        return event.target || event.srcElement;
    },
    preventDefault:function(event){
        if(event.preventDefault){
            event.preventDefault();
        }else{
            event.returnValue = false;
        }
    },
    stopPropagation:function(event){//阻止冒泡
        if(event.stopPropagation){
            event.stopPropagation();
        }else{
            event.cancelBubble = true;
        }
    },
    getRelatedTarget:function(event){
        if(event.relatedTarget){
            return event.relatedTarget;
        }else if(event.toElement){
            return event.toElement;
        }else if(event.fromElement){
            return event.fromElement;
        }else{
            return null;
        }
    },
    getButton:function(event){//0鼠标左键，1中间滚轮，2右键
        if(document.implementation.hasFeature("MouseEvents","2.0")){
            return event.button;
        }else{
            switch(event.button){
                case 0:
                case 1:
                case 3:
                case 5:
                case 7:
                    return 0;
                case 2:
                case 6:
                    return 2;
                case 4:
                    return 1;
            }
        }
    },
    getWheelDelta:function(event){//鼠标滚动事件
        if(event.wheelDelta){
            //client 对象在javascript高级程序设计  P242
            return (client.engine.opera && client.engine.opera<9.5? -			event.wheelDelta:event.wheelDelta);
        }else{
            return -event.detail*40;//firefox浏览器
        }
    },
    getCharCode:function(event){//键盘按键
        if(typeof event.charCode=="number"){
            return event.charCode;
        }else{
            return event.keyCode;
        }
    },
//剪切板
    getClipboardText:function(event){
        var clipboardData = (event.clipboardData||window.clipboardData);
        return clipboardData.getData("text");
    },
    setClipboardText:function(event,value){
        if(event.clipboardData){
            return event.clipboardData.setData("text/plain",value);
        }else if(window.clipboardData){
            return window.clipboardData.setData("text",value);
        }
    },

    getElementByClassName:function(classname){
        if(document.getElementsByClassName){
            // alert("该浏览器支持getElementsByClassName");
            return document.getElementsByClassName(classname);
        }else{
            var arr=[];
            var divs=document.getElementsByTagName("*");//获取所有的div标签
            for(var i=0;i<divs.length;i++){//遍历,挑出所有满足情况的div
                if(divs[i].className==classname){
                    arr.push(divs[i]);
                }
            }
            return arr;
        }
    }
}
