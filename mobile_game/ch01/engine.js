/**
 * Created by lenovo on 2017/9/3.
 */
var Game =  (function(){
    this.initialize = function(canvasElementId,sprite_data,callback){
        this.canvas = document.getElementById(canvasElementId);

        this.playerOffset = 10;
        this.canvasMultiplier = 1;
        this.setupMobile();

        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.ctx = this.canvas.getContext && this.canvas.getContext("2d");
        if(!this.ctx){
            return alert("Please upgrade your browser");
        }
        this.setupInput();//按键监控
        if(this.mobile){
            this.setBoard(4,new TouchControls());//添加控件
        }
        this.loop();
        SpriteSheet.load(sprite_data,callback);
    };

    //Handle input
    var KEY_CODES = {37:"left",39:"right",32:"fire",38:'top',40:'down'};
    this.keys = {};
    this.setupInput = function(){
        window.addEventListener("keydown",function(e){
            if(KEY_CODES[event.keyCode]){
                Game.keys[KEY_CODES[event.keyCode]] = true;
                e.preventDefault();
            }
        },false);
        window.addEventListener("keyup",function(e){
            if(KEY_CODES[event.keyCode]){
                Game.keys[KEY_CODES[event.keyCode]] = false;
                e.preventDefault();
            }
        },false);
    };

    //Game loop
    var boards = [];
    this.loop = function(){
        var dt = 30/1000;
        for(var i=0,len = boards.length;i<len;i++){
            if(boards[i]){
                boards[i].step(dt);
                boards[i] && boards[i].draw(Game.ctx);
            }
        }
        setTimeout(Game.loop,30);
    };
    //change an active game board
    this.setBoard = function(num,board){
        boards[num] = board;
    };

    //根据设备调整画布尺寸
    this.setupMobile = function(){
        var container = document.getElementById("container"),
            hasTouch = !!('ontouchstart' in window),
            w = window.innerWidth,h = window.innerHeight;
        if(hasTouch) { mobile = true;}
        if(screen.width >= 1280 || !hasTouch) { return false;}
        if(w>h){
            alert("please rotate the device and then click OK ");
            w = window.innerWidth;
            h = window.innerHeight;
        }

        container.style.height = h*2+"px";
        window.scrollTo(0,1);
        h = window.innerHeight+2;

        container.style.height = h + "px";
        container.style.width = w + "px";
        container.style.padding = 0;
        if(h>=this.canvas.height*1.75|| w>=this.canvas.height*1.75){
            this.canvasMultiplier = 2;
            this.canvas.width = w/2;
            this.canvas.height = h/2;
            this.canvas.style.width = w+"px";
            this.canvas.style.height = h +"px";
        }else{
            this.canvas.width = w;
            this.canvas.height = h;
        }
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = "0px";
        this.canvas.style.top = "0px";
    };
    return this;
})();
//图像精灵类
var SpriteSheet = (function(){
    this.map = {};
    this.load = function(spriteData,callback){
        this.map = spriteData;
        this.image = new Image();
        this.image.onload = callback;
        this.image.src = "images/sprites.png";
    };
    this.draw = function(ctx,sprite,x,y,frame){
        var s = this.map[sprite];
        if(!frame) frame = 0;
        ctx.drawImage(this.image,
            s.sx+frame*s.w,
            s.sy,
            s.w,s.h,
            Math.floor(x),Math.floor(y),
            s.w,s.h);
    };
    return this;
})();
// function TitleScreen  效果同 function() 主要是game中new 了对象，所以不是当做函数
var TitleScreen =  function TitleScreen(title,subtitle,callback){
    this.step = function(dt){
        if(Game.keys['fire']&&callback) callback();
    };
    this.draw = function(ctx){
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = "bold 40px bangers";
        ctx.fillText(title,Game.width/2,Game.height/2);
        ctx.font = "bold 20px bangers";
        ctx.fillText(subtitle,Game.width/2,Game.height/2+40);
    };
};

//游戏面板类
var GameBoard = function(){
    var board = this;
    this.objects = [];
    this.cnt = {};
    //add new object to the object list
    this.add = function(obj){
        obj.board = this;
        this.objects.push(obj);
        this.cnt[obj.type] = (this.cnt[obj.type]||0)+1;
        return obj;
    };

    //mark an object for removal
    this.remove = function(obj){
        var idx = this.removed.indexOf(obj);
        if(idx == -1) {
            this.removed.push(obj);
            return true;
        } else {
            return false;
        }
    };
    //reset the list of removed objects
    this.resetRemoved = function(){this.removed = [];};
    //remove objects marked for removal from the list
    this.finalizeRemoved = function(){
        for(var i=0,len=this.removed.length;i<len;i++){
            var idx = this.objects.indexOf(this.removed[i]);
            if(idx!=-1){
                this.cnt[this.removed[i].type]--;
                this.objects.splice(idx,1);
            }
        }
    };

    //call the same method on all current objects
    this.iterate = function(funcName){
        var args = Array.prototype.slice.call(arguments,1);
        for(var i=0,len=this.objects.length;i<len;i++){
            var obj = this.objects[i];
            obj[funcName].apply(obj,args);
        }
    };

    //find the first object for which func is true
    this.detect = function(func){
        for(var i=0,val=null,len=this.objects.length;i<len;i++){
            if(func.call(this.objects[i])) return this.objects[i];
        }
        return false;
    };

    //call step on all objects and then delete any objects that have been marked for removal
    this.step = function(dt){
        this.resetRemoved();
        this.iterate('step',dt);
        this.finalizeRemoved();
    };
    //draw all the objects
    this.draw = function(ctx){
        this.iterate('draw',ctx);
    };

    //物体碰撞：把物体弄成一个小矩形，如果两个矩形有交界，下面就会返回true
    this.overlap = function(o1,o2){
        //运算符优先级（从高到低)： + - < > == !=
        return !((o1.y+o1.h-1<o2.y)||(o1.y>o2.y+o2.h-1)
        ||(o1.x+o1.w-1<o2.x)||(o1.x>o2.x+o2.w-1));
    };
    this.collide = function(obj,type){
        return this.detect(function(){
            if(obj!=this){
                // 运算符优先级（从高到低)： & ||
                //此处的type指敌方飞船和自己的飞船，如果是敌方飞船就不会碰撞
                var col = (!type||this.type&type)&&board.overlap(obj,this);
                return col ? this:false;
            }
        });
    };
};

//图像基类精灵
var Sprite = function(){};
Sprite.prototype.setup = function(sprite,props){
    this.sprite = sprite;
    this.merge(props);
    this.frame = this.frame || 0;
    this.w = SpriteSheet.map[sprite].w;
    this.h = SpriteSheet.map[sprite].h;
}
Sprite.prototype.merge = function(props){
    if(props){
        for(var prop in props){
            this[prop] = props[prop];
        }
    }
}
Sprite.prototype.draw = function(ctx){
    SpriteSheet.draw(ctx,this.sprite,this.x,this.y,this.frame);
}
Sprite.prototype.hit = function(damage){
    this.board.remove(this);
}

//关卡
var Level = function(levelData,callBack){
    this.levelData = [];
    for(var i=0;i<levelData.length;i++){
        this.levelData.push(Object.create(levelData[i]));
    }
    this.t = 0;
    this.callback = callBack;
}
Level.prototype.step = function(dt){
    var idx = 0,remove = [],curShip = null;
    //update the current time offset
    this.t += dt*1000;

    //example data
    while((curShip = this.levelData[idx])&&
    (curShip[0]<this.t+2000)){
        //check if past the end time
        if(this.t> curShip[1]){
            remove.push(curShip);
        }else if(curShip[0]<this.t){
            //get the enemy definition blueprint
            var enemy = enemies[curShip[3]],
                override = curShip[4];
            //add a new enemy with the blueprint and override
            this.board.add(new Enemy(enemy,override));
            //increment the start time by the gap
            curShip[0] += curShip[2];
        }
        idx++;
    }
    //remove any object from the levelData that the passed
    for(var i=0,len=remove.length;i<len;i++){
        var ridx = this.levelData.indexOf(remove[i]);
        if(ridx!=-1) this.levelData.splice(ridx,1);
    }
    //if there ar no more enemies on the board or in levelData,this level is done
    // console.log(this.levelData.length+":"+this.board.cnt[OBJECT_ENEMY]);
    if(this.levelData.length===0&&this.board.cnt[OBJECT_ENEMY]===0){
        if(this.callback) this.callback();
    }
}
Level.prototype.draw = function(ctx){}

//控件
var TouchControls = function(){
    var gutterWidth = 10;
    var gutterHeight = 10;
    var unitWidth = Game.width/5;
    var unitHeight = Game.height/5;
    var blockWidth = unitWidth-gutterWidth;
    var yLoc = Game.height-unitWidth;

    this.drawSquare = function(ctx,x,y,txt,on,type){
        ctx.globalAlpha = on ? 0.9:0.6;
        ctx.fillStyle = "#CCC";
        ctx.fillRect(x,y,blockWidth,blockWidth);

        ctx.fillStyle = "#FFF";
        ctx.textAlign = "center";
        ctx.globalAlpha = 1.0;
        ctx.font = "bold "+(3*unitWidth/4)+"px arial";

        ctx.fillText(txt,x+blockWidth/2,y+3*blockWidth/4+5);
    };

    this.draw = function(ctx){
        ctx.save();
        // var yLoc = Game.height-unitWidth-blockWidth;
        this.drawSquare(ctx,gutterWidth,yLoc,'\u25C4',Game.keys['left']);
        this.drawSquare(ctx,unitWidth+gutterWidth,yLoc,'\u25BA',Game.keys['right']);
        // this.drawSquare(ctx,unitWidth,yLoc-blockWidth,'\u25B2',Game.keys['top'],'small');
        // this.drawSquare(ctx,unitWidth,yLoc+blockWidth,'\u25BC',Game.keys['down'],'small');
        this.drawSquare(ctx,4*unitWidth,yLoc,'A',Game.keys['fire']);
        ctx.restore();
    };
    this.step = function(dt){};
    //触摸事件
    this.trackTouch = function(e){
        var touch,x,y;
        e.preventDefault();
        Game.keys['left'] = false;
        Game.keys['right'] = false;
        Game.keys['top'] = false;
        Game.keys['down'] = false;

        for(var i=0;i<e.targetTouches.length;i++){
            touch = e.targetTouches[i];
            x = touch.pageX/Game.canvasMultiplier-Game.canvas.offsetLeft;
            y = touch.pageY/Game.canvasMultiplier-Game.canvas.offsetTop;
            if(x<unitWidth&&y>yLoc&&y<yLoc+blockWidth) Game.keys['left'] = true;
            if(x>unitWidth+gutterWidth&&x<unitWidth*2) Game.keys['right'] = true;
            // if(x>unitWidth+blockWidth&&x<unitWidth+2*blockWidth&&y>yLoc&&dy<yLoc+blockWidth) Game.keys['right'] = true;
            // if(x>unitWidth&&x<unitWidth+blockWidth&&y<yLoc&&y>yLoc-blockWidth) Game.keys['top'] = true;
            // if(x>unitWidth&&x<unitWidth+blockWidth&&y>yLoc+blockWidth) Game.keys['down'] = true;
        }
        if(e.type =='touchstart'|| e.type=='touchend'){
            for(i=0;i<e.changedTouches.length;i++){
                touch = e.changedTouches[i];
                x = touch.pageX/Game.canvasMultiplier - Game.canvas.offsetLeft;
                if(x>4*unitWidth){
                    Game.keys['fire'] = (e.type=='touchstart');
                }
            }
        }
    }
    Game.canvas.addEventListener('touchstart',this.trackTouch,true);
    Game.canvas.addEventListener('touchmove',this.trackTouch,true);
    Game.canvas.addEventListener('touchend',this.trackTouch,true);
    Game.playerOffset = unitWidth+20;
};

//计分面板
var GamePoints = function(){
    Game.points = 0;
    var pointsLength = 8;
    this.draw = function(ctx){
        ctx.save();
        ctx.font = "bold 18px arial";
        ctx.fillStyle = "#FFFFFF";
        var txt = ""+Game.points;
        var i = pointsLength-txt.length,zeros = "";
        while(i-->0){ zeros += "0";}
        ctx.fillText(zeros+txt,10,20);
        ctx.restore();
    }
    this.step = function(dt){}
}
