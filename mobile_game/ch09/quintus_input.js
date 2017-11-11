/**
 * Created by lenovo on 2017/10/21.
 */
Quintus.Input = function(Q){
    var KEY_NAMES = {LEFT:37,RIGHT:39,SPACE:32,UP:38,DOWN:40,Z:90,X:88};//键码值
    var DEFAULT_KEYS = {LEFT:'left',RIGHT:'right',UP:'up',DOWN:'down',
                        SPACE:'fire',Z:'fire',X:"action"};
    var DEFAULT_TOUCH_CONTROLS = [['left','<'],['right','>'],[],['action','b'],['fire','a']];
    var DEFAULT_JOYPAD_INPUTS = ['up','right','down',';left'];
    Q.inputs = {};
    Q.joypad = {};
    var hasTouch = !!('ontouchstart' in window);//!! 这种做法是将转化为布尔值
    Q.InputSystem = Q.Evented.extend({
        keys:{},
        keypad:{},
        keyboardEnabled:false,
        touchEnabled:false,
        joypadEnabled:false,
        bindKey:function(key,name){
            Q.input.keys[KEY_NAMES[key]||key]=name;
        },
        keyboardControls:function(keys){
            keys = keys||DEFAULT_KEYS;
            /*
            *    var _ = function(obj) {
                 if (obj instanceof _) return obj;
                 if (!(this instanceof _)) return new _(obj);
                 this._wrapped = obj;
                 };
            * */
            _(keys).each(function(name,key){
                this.bindKey(key,name);
            },Q.input);
            this.enableKeyboard();
        },
        enableKeyboard:function(){
            if(this.keyboardEnabled) return false;
            Q.el.attr('tabindex',0).css('outline',0);
            //按下键
            Q.el.keydown(function(e){
               if(Q.input.keys[e.keyCode]){
                   var actionName = Q.input.keys[e.keyCode];
                   Q.inputs[actionName] = true;
                   Q.input.trigger(actionName);
                   Q.input.trigger('keydown',e.keyCode);
               }
               e.preventDefault();
            });
            //键抬起
            Q.el.keyup(function(e){
                if(Q.input.keys[e.keyCode]){
                    var actionName = Q.input.keys[e.keyCode];
                    Q.inputs[actionName] = false;
                    Q.input.trigger(actionName+"Up");
                    Q.input.trigger('keyup',e.keyCode);
                }
                e.preventDefault();
            });
            this.keyboardEnabled = true;
        },
        touchLocation:function(touch){
            var el = Q.el,
                pageX = touch.pageX,
                pageY = touch.pageY,
                pos = el.offset(),
                //不明白这里是怎么确定touchX位置的，为什么是这种计算，表示什么含义？？？
                touchX = (el.attr('width')||Q.width)*(pageX-pos.left)/el.width(),
                touchY = (el.attr('height')||Q.height)*(pageY-pos.top)/el.height();
            return {x:touchX,y:touchY};
        },
        touchControls:function(opts){
            if(this.touchEnabled) return false;
            if(!hasTouch) return false;
            Q.input.keypad = opts = _({
                left:0,
                gutter:10,
                controls:DEFAULT_TOUCH_CONTROLS,
                width:Q.el.attr('width')||Q.width,
                bottom:Q.el.attr('height')||Q.height
            }).extend(opts||{});
            opts.unit = (opts.width/opts.controls.length);
            opts.size = opts.unit-2*opts.gutter;
            function getKey(touch){
                var pos = Q.input.touchLocation(touch);
                for(var i=0,len=opts.controls.length;i<len;i++){
                    if(pos.x<opts.unit*(i+1)){
                        return opts.controls[i][0];
                    }
                }
            }
            function touchDispatch(event){
                var elemPos = Q.el.position(),
                    wasOn = {},
                    i,len,tch,key,actionName;
                for(i=0,len=opts.controls.length;i<len;i++){
                    actionName = opts.controls[i][0];
                    if(Q.inputs[actionName]){wasOn[actionName] = true;} //在wasOn 中记下所有设置了标志的输入
                    Q.inputs[actionName] = false;//取消所有小键盘绑定的输入标志
                }
                for(i=0,len=event.touches.length;i<len;i++){
                    tch = event.touches[i];
                    key = getKey(tch);
                    if(key){
                        Q.inputs[key] = true;
                        if(!wasOn[key]){
                            Q.input.trigger(key);
                        }else{
                            delete wasOn[key];
                        }
                    }
                }
                for(actionName in wasOn){
                    Q.input.trigger(actionName+"Up");
                }
                return null;
            }
            Q.el.on('touchstart touchend touchmove touchcancel',function(e){
               touchDispatch(e.originalEvent);
                e.preventDefault();
            });
            this.touchEnabled = true;
        },
        //禁用屏幕的小键盘
        disableTouchControls:function(){
            Q.el.off('touchstart touchend touchmove touchcancel');
            this.touchEnabled = false;
        },
        joypadControls:function(opts){
            if(this.joypadEnabled) return false;
            if(!hasTouch) return false;
            var joypad = Q.joypad = _.defaults(opts||{},{
               size:50,
                trigger:20,
                center:25,
                color:"#CCC",
                background:"#000",
                alpha:0.5,
                zone:(Q.el.attr('width')||Q.width)/2,
                joypadTouch:null,
                inputs:DEFAULT_JOYPAD_INPUTS,
                triggers:[]
            });
            /*
            * 以下是支持游戏手柄的代码
            * */
            Q.el.on('touchstart',function(e){
               if(joypad.joypadTouch === null){//确定手柄尚未激活
                   var evt = e.originalEvent,
                       touch = evt.changedTouches[0],
                       loc = Q.input.touchLocation(touch);
                   if(loc.x<joypad.zone){
                       joypad.joypadTouch = touch.identifier;//此处设置touch的标识符
                       joypad.centerX = loc.x;
                       joypad.centerY = loc.y;
                       joypad.x = null;
                       joypad.y = null;
                   }
               }
            });
            Q.el.on('touchmove',function(e){
                if(joypad.joypadTouch!==null){//确定游戏手柄已经激活
                    var evt = e.originalEvent;
                    for(var i=0,len=evt.changedTouches.length;i<len;i++){
                        var touch = evt.changedTouches[i];
                        if(touch.identifier===joypad.joypadTouch){
                            var loc = Q.input.touchLocation(touch),
                                dx = loc.x-joypad.centerX,
                                dy = loc.y = joypad.centerY,
                                dist = Math.sqrt(dx*dx+dy*dy),
                                overage = Math.max(1,dist/joypad.size),
                                /*
                                 atan2() 方法可返回从 x 轴到点 (x,y) 之间的角度
                                 Math.atan2(y,x)
                                 x	必需。指定点的 X 坐标。
                                 y	必需。指定点的 Y 坐标。
                                * */
                                ang = Math.atan2(dx,dy);
                            if(overage>1){
                                dx/=overage;
                                dy/=overage;
                                dist/=overage;
                            }
                            var triggers = [
                                dy<-joypad.trigger,
                                dx>joypad.trigger,
                                dy>joypad.trigger,
                                dx<-joypad.trigger
                            ];
                            for(var k=0;k<triggers.length;k++){
                                var actionName = joypad.inputs[k];
                                if(triggers[k]){
                                    Q.inputs[actionName] = true;
                                    if(!joypad.triggers[k]){
                                        Q.input.trigger(actionName);
                                    }
                                }else{
                                    Q.inputs[actionName] = false;
                                    if(joypad.triggers[k]){
                                        Q.input.trigger(actionName+"Up");
                                    }
                                }
                            }
                            _.extend(joypad,{
                               dx:dx,dy:dy,
                                x:joypad.centerX+dx,
                                y:joypad.centerY+dy,
                                dist:dist,
                                ang:ang,
                                triggers:triggers
                            });
                            break;
                        }
                    }
                }
                e.preventDefault();
            });
            Q.el.on('touchend touchcancel',function(e){
               var evt = e.originalEvent;
                if(joypad.joypadTouch!=null){
                    for(var i=0,len=evt.changedTouches.length;i<len;i++){
                        var touch = evt.changedTouches[i];
                        if(touch.identifier===joypad.joypadTouch){
                            for(var k=0;k<joypad.triggers.length;k++){
                                var actionName = joypad.inputs[k];
                                Q.inputs[actionName] = false;
                            }
                            joypad.joypadTouch = null;
                            break;
                        }
                    }
                }
                e.preventDefault();
            });
            this.joypadEnabled = true;
        },
        //绘制屏幕输入
        drawButtons:function(){
            var keypad = Q.input.keypad,
                ctx = Q.ctx;
            ctx.save();
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            for(var i=0;i<keypad.controls.length;i++){
                var control = keypad.controls[i];
                if(control[0]){
                    ctx.font = "bold "+(keypad.size/2)+"px arial";
                    var x = i*keypad.unit+keypad.gutter,
                        y = keypad.bottom-keypad.unit,
                        key = Q.inputs[control[0]];
                    ctx.fillStyle = keypad.color || "#FFFFFF";
                    ctx.globalAlpha = key? 1.0:0.5;
                    ctx.fillRect(x,y,keypad.size,keypad.size);
                    ctx.fillStyle = keypad.text||"#000000";
                    ctx.fillText(control[1],x+keypad.size/2,y+keypad.size/2);
                }
            }
            ctx.restore();
        },
        drawCircle:function(x,y,color,size){
            var ctx = Q.ctx,
                joypad = Q.joypad;
            ctx.save();
            ctx.beginPath();
            ctx.globalAlpha = joypad.alpha;
            ctx.fillStyle = color;
            ctx.arc(x,y,size,0,Math.PI*2,true);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        },
        drawJoypad:function(){
            var joypad = Q.joypad;
            if(joypad.joypadTouch!==null){
                Q.input.drawCircle(joypad.centerX,joypad.centerY,joypad.background,joypad.size);
                if(joypad.x!==null){
                    Q.input.drawCircle(joypad.x,joypad.y,joypad.color,joypad.center);
                }
            }
        },
        drawCanvas:function(){
            if(this.touchEnabled){
                this.drawButtons();
            }
            if(this.joypadEnabled){
                this.drawJoypad();
            }
        }
    });
    Q.input = new Q.InputSystem();

    //测试方法
    Q.controls = function(joypad){
        Q.input.keyboardControls();
        if(joypad){
            Q.input.touchControls({
                controls:[[],[],[],['action','b'],['fire','a']]
            });
            Q.input.joypadControls();
        }else{
            Q.input.touchControls();
        }
        return Q;
    }
}