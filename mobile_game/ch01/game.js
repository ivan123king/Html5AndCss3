/**
 * Created by lenovo on 2017/9/3.
 */
var OBJECT_PLAYER = 1,
    OBJECT_PLAYER_PROJECTILE = 2,
    OBJECT_ENEMY = 4,
    OBJECT_ENEMY_PROJECTILE = 8,
    OBJECT_POWERUP = 16;

//关卡数据
var level1 = [
    //start   end   gap  type  override
    [0,4000,500,'step'],
    [6000,13000,800,'ltr'],
    [12000,16000,400,'circle'],
    [18200,20000,500,'straight',{x:150}],
    [18200,20000,500,'straight',{x:100}],
    [18400,20000,500,'straight',{x:200}],
    [22000,25000,400,'wiggle',{x:300}],
    [22000,25000,400,'wiggle',{x:200}]
];

//frames 表示绘制sprites.png中第几个图形，0表示第一个，1表示第二个，原因是draw中加上 s.w*frames，每一个图形的宽度是s.w那么frames就表示第几个了
var sprites = {
    ship:{sx:0,sy:0,w:37,h:42,frames:1},//飞船
    missile:{sx:0,sy:30,w:2,h:10,frames:1},//导弹
    //敌人飞船
    enemy_purple:{sx:37,sy:0,w:42,h:43,frames:0},
    enemy_bee:{sx:79,sy:0,w:37,h:43,frames:0},
    enemy_ship:{sx:116,sy:0,w:42,h:43,frames:0},
    enemy_circle:{sx:158,sy:0,w:32,h:33,frames:0},
    //爆炸
    explosion:{sx:0,sy:64,w:64,h:64,frames:12},
    //敌人炮弹
    enemy_missile:{sx:9,sy:42,w:3,h:20,frame:1}
};
var enemies = {
    straight: { x: 0,   y: -50, sprite: 'enemy_ship', health: 10,
        E: 100,firePercentage:0.001 },
    ltr:      { x: 0,   y: -100, sprite: 'enemy_purple', health: 10,
        B: 75, C: 1, E: 100 ,missiles:2 },
    circle:   { x: 250,   y: -50, sprite: 'enemy_circle', health: 10,
        A: 0,  B: -100, C: 1, E: 20, F: 100, G: 1, H: Math.PI/2 },
    wiggle:   { x: 100, y: -50, sprite: 'enemy_bee', health: 20,
        B: 50, C: 4, E: 100,firePercentage:0.001,missiles:2 },
    step:     { x: 0,   y: -50, sprite: 'enemy_circle', health: 10,
        B: 150, C: 1.2, E: 75 }
};


window.addEventListener("load",function(){
    Game.initialize("game",sprites,startGame);
});
var startGame = function(){
    // SpriteSheet.draw(Game.ctx,"ship",100,100,0);
    Game.setBoard(0,new Starfield(20,0.4,100,true));
    Game.setBoard(1,new Starfield(50,0.6,100));
    Game.setBoard(2,new Starfield(100,1.0,50));
    Game.setBoard(3,new TitleScreen("Alien Invasion","Please space to start playing",playGame));
};
var playGame = function(){
    var board = new GameBoard();
    board.add(new PlayerShip());
    board.add(new Level(level1,winGame));
    Game.setBoard(3,board);
    Game.setBoard(5,new GamePoints(0));
};

var winGame = function(){
    Game.setBoard(3,new TitleScreen("You Win!","Press fire to play again",playGame));
}
var loseGame = function(){
    Game.setBoard(3,new TitleScreen("You Lose!","Press fire to play again",playGame));
}

//星空绘制
var Starfield = function(speed,opacity,numStars,clear){
    var stars = document.createElement("canvas");
    stars.width = Game.width;
    stars.height = Game.height;

    var starCtx = stars.getContext("2d");
    var offset = 0;
    //if the clear option is set ,make the background black instead of transparent
    if(clear){
        starCtx.fillStyle = "#000";
        starCtx.fillRect(0,0,stars.width,stars.height);
    }
    //draw a bunch of random 2 pixel rectangles onto the offscreen canvas
    starCtx.fillStyle = "#fff";
    starCtx.globalAlpha = opacity;
    for(var i=0;i<numStars;i++){
        starCtx.fillRect(Math.floor(Math.random()*stars.width),
            Math.floor(Math.random()*stars.height),
            2,2);
    }

    //this method is called every frame to draw the starfield onto the canvas
    this.draw = function(ctx){
        var intOffset = Math.floor(offset);
        var remaining = stars.height-intOffset;
        //draw the top half of the starfield
        if(intOffset>0){
            //此处是不断的绘制这个stars  canvas
            ctx.drawImage(stars,
                0,remaining,
                stars.width,intOffset,
                0,0,
                stars.width,stars.height);
        }
        //draw the bottom half of the starfield
        if(remaining>0){
            ctx.drawImage(stars,
                0,0,
                stars.width,remaining,
                0,intOffset,
                stars.width,remaining);
        }
    };
    //this method is called to update the starfield
    this.step = function(dt){
        offset += dt*speed;
        offset = offset % stars.height;
    }
};

//飞船
var PlayerShip = function(){
    this.setup('ship',{vx:0,vy:0,frame:0,reloadTime:0.25,maxVel:200});

    this.reload = this.reloadTime;
    this.x = Game.width/2-this.w/2;
    this.y = Game.height-Game.playerOffset-this.h;

    //飞船移动控制
    this.step = function(dt){
        this.maxVel = 200;
        this.step = function(dt){
            if(Game.keys['left']){ this.vx = -this.maxVel;}
            else if(Game.keys['right']){ this.vx = this.maxVel}
            else { this.vx = 0;}
            this.x += this.vx*dt;
            if(this.x<0){ this.x = 0;}
            else if(this.x > Game.width - this.w){
                this.x = Game.width-this.w;
            }
            if(Game.keys['top']){ this.vy = -this.maxVel;}
            else if(Game.keys['down']){ this.vy = this.maxVel}
            else { this.vy = 0;}
            this.y += this.vy*dt;
            if(this.y<0){ this.y = 0;}
            else if(this.y > Game.height - this.h){
                this.y = Game.height-this.h;
            }

            //导弹发射
            this.reload -= dt;
            if(Game.keys['fire']&&this.reload<0){
                Game.keys['fire'] = false;
                this.reload = this.reloadTime;
                this.board.add(new PlayerMissile(this.x,this.y+this.h/2));
                this.board.add(new PlayerMissile(this.x+this.w,this.y+this.h/2));
            }
        };
    };
    // this.draw = function(ctx){
    //     SpriteSheet.draw(ctx,'ship',this.x,this.y,0);
    // };
};
PlayerShip.prototype = new Sprite();//继承基类
PlayerShip.prototype.type = OBJECT_PLAYER;
PlayerShip.prototype.hit = function(damage){
    if(this.board.remove(this)){
        loseGame();
    }
}
//导弹类
var PlayerMissile = function (x,y) {
    this.setup('missile',{vx:-700,damage:10});
    //center the missile on x
    this.x = x-this.w/2;
    //use the passed in y as the bottom of the missile
    this.y = y-this.h;
};
PlayerMissile.prototype = new Sprite();//继承基类
PlayerMissile.prototype.type = OBJECT_PLAYER_PROJECTILE;
PlayerMissile.prototype.step = function(dt){
    this.y += this.vy*dt;
    //导弹只会从下往上，所以y只能是<0
    if(this.y<-this.h){ this.board.remove(this);}
    //碰撞检测
    var collision = this.board.collide(this,OBJECT_ENEMY);//此处方法是  !4||4&4 == true 第二个参数表示和哪类对象碰撞检测
    if(collision){
        collision.hit(this.damage);
        this.board.remove(this);
    }else if(this.y<-this.h){
        this.board.remove(this);
    }
};
// PlayerMissile.prototype.draw = function(ctx){
//     SpriteSheet.draw(ctx,'missile',this.x,this.y);
// };

//敌人的飞船
var Enemy = function(blueprint,override){
    this.merge(this.baseParameters);
    this.setup(blueprint.sprite,blueprint);
    this.merge(override);
};
Enemy.prototype = new Sprite();//继承基类
Enemy.prototype.type = OBJECT_ENEMY;
Enemy.prototype.baseParameters = {A:0,B:0,C:0,D:0,E:0,F:0,G:0,H:0,t:0,firePercentage:0.01,reloadTime:0.75,reload:0};
Enemy.prototype.step = function(dt){
    this.t += dt;
    this.vx = this.A+this.B*Math.sin(this.C*this.t+this.D);
    this.vy = this.E+this.F*Math.sin(this.G*this.t+this.H);
    this.x += this.vx*dt;
    this.y += this.vy*dt;
    if(this.y > Game.height || this.x < -this.w || this.x > Game.width) this.board.remove(this);
    //碰撞检测
    var collision = this.board.collide(this,OBJECT_PLAYER);
    if(collision){
        collision.hit(this.damage);
        this.board.remove(this);
    }
    if(this.reload<=0&&Math.random()<this.firePercentage){
        this.reload = this.reloadTime;
        if(this.missiles==2){
            this.board.add(new EnemyMissile(this.x+this.w-2,this.y+this.h/2));
            this.board.add(new EnemyMissile(this.x+2,this.y+this.h/2));
        }else{
            this.board.add(new EnemyMissile(this.x+this.w/2,this.y+this.h));
        }
    }
    this.reload -=dt;

    if(this.y>Game.height
        ||this.x< -this.w
        || this.x > Game.width){
            this.board.remove(this);
    }

};
Enemy.prototype.hit = function(damage){
    this.health -= damage;
    if(this.health<=0){
        if(this.board.remove(this)){
            Game.points += this.points || 100;
        }
        this.board.add(new Explosion(this.x+this.w/2,this.y+this.h/2));
    }
}
// Enemy.prototype.draw = function(ctx){
//     SpriteSheet.draw(ctx,this.sprite,this.x,this.y);
//     //使用如下最后一个参数通过帧来控制飞船，而不是定义许多飞船类，不过截取的图片不全
//     // SpriteSheet.draw(ctx,this.sprite,this.x,this.y,SpriteSheet.map[this.sprite].frames);
// };

//爆炸类
var Explosion = function(centerX,centerY){
    this.setup('explosion',{frame:0});
    this.x = centerX-this.w/2;
    this.y = centerY-this.h/2;
    this.subFrame = 0;
}
Explosion.prototype = new Sprite();
Explosion.prototype.step = function(dt){
    this.frame = Math.floor(this.subFrame++/3);
    if(this.subFrame>=36){
        this.board.remove(this);
    }
}

//敌方炮弹
var EnemyMissile = function(x,y){
    this.setup('enemy_missile',{vy:200,damage:10});
    this.x = x-this.w/2;
    this.y = y;
}
EnemyMissile.prototype = new Sprite();
EnemyMissile.prototype.type = OBJECT_ENEMY_PROJECTILE;
EnemyMissile.prototype.step = function(dt){
    this.y += this.vy*dt;
    var collision = this.board.collide(this,OBJECT_PLAYER);
    if(collision){
        collision.hit(this.damage);
        this.board.remove(this);
    }else if(this.y>Game.height){
        this.board.remove(this);
    }
};

