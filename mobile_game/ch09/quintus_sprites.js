/**
 * Created by lenovo on 2017/10/27.
 */
Quintus.Sprites = function(Q){
    Q.SpriteSheet = Class.extend({
        init: function(name, asset,options) {
            _.extend(this,{
                name: name,
                asset: asset,
                w: Q.asset(asset).width,
                h: Q.asset(asset).height,
                tilew: 64,
                tileh: 64,
                sx: 0,
                sy: 0
            },options);
            this.cols = this.cols ||
                Math.floor(this.w / this.tilew);
        },

        fx: function(frame) {
            return (frame % this.cols) * this.tilew + this.sx;
        },

        fy: function(frame) {
            return Math.floor(frame / this.cols) * this.tileh + this.sy;
        },

        draw: function(ctx, x, y, frame) {
            if(!ctx) { ctx = Q.ctx; }
            ctx.drawImage(Q.asset(this.asset),
                this.fx(frame),this.fy(frame),
                this.tilew, this.tileh,
                Math.floor(x),Math.floor(y),
                this.tilew, this.tileh);

        }

    });


    Q.sheets = {};
    Q.sheet = function(name,asset,options) {
        if(asset) {
            Q.sheets[name] = new Q.SpriteSheet(name,asset,options);
        } else {
            return Q.sheets[name];
        }
    };

    Q.compileSheets = function(imageAsset,spriteDataAsset) {
        var data = Q.asset(spriteDataAsset);
        _(data).each(function(spriteData,name) {
            Q.sheet(name,imageAsset,spriteData);
        });
    };

    //精灵类
    Q.sprite = Q.GameObject.extend({
        init:function(props){
            this.p = _({
                x:0,
                y:0,
                z:0,
                frame:0,
                type:0
            }).extend(props||{});
            if((!this.p.w||!this.p.h)){
                if(this.asset()){
                    this.p.w = this.p.w || this.asset().width;
                    this.p.h = this.p.h || this.asset().height;
                }else if(this.sheet()){
                    this.p.w = this.p.w || this.sheet().tilew;
                    this.p.h = this.p.h || this.sheet().tileh;
                }
            }
            this.p.id = this.p.id || _.uniqueId();
        },
        asset:function(){
            return Q.asset(this.p.asset);
        },
        sheet:function(){
            return Q.sheet(this.p.sheet);
        },
        draw:function(ctx){
            if(!ctx) { ctx = Q.ctx;}
            var p = this.p;
            if(p.sheet){
                this.sheet().draw(ctx,p.x,p.y,p.frame);
            }else if(p.asset){
                ctx.drawImage(Q.asset(p.asset),Math.floor(p.x),Math.floor(p.y));
            }
            this.trigger('draw',ctx);
        },
        step:function(dt){
            this.trigger('step',dt);
        }
    });

    return Q;
}