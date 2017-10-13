cc.Class({
    extends: cc.Component,

    properties: {
        niu: {
            default: null,
            type: cc.Node
        },
        Name: {
            default: null,
            type: cc.Node
        },
        canvas: {
            default: null,
            type: cc.Node
        }
    },

    // use this for initialization
    onLoad: function () {
        cc.director.preloadScene('sceneIndex');

        this.Name.active = false;

        var niu = this.niu;
        var rotate = cc.rotateBy(1.5, 1800);
        var anim = niu.getComponent(cc.Animation);

        setTimeout(function(){
            anim.play('logo_move');
            niu.runAction(rotate.easing(cc.easeOut(2.0)));
        }, 600)

    },

    logoCheck: function() {
        this.Name.active = true;
        var act1 = cc.moveBy(0.2, 0, -200);
        var act2 = cc.moveBy(0.2, 0, 100);
        var act3 = cc.moveBy(0.2, 0, -100);
        var act4 = cc.moveBy(0.2, 0, 40);
        var act5 = cc.moveBy(0.2, 0, -40);
        var act6 = cc.moveBy(0.2, 0, 10);
        var act7 = cc.moveBy(0.2, 0, -10);
        var finshed = cc.callFunc(this.loadFinsh, this); // 动作回调
        var action = cc.sequence(act1, act2, act3, act4, act5, act6, act7, finshed);

        this.Name.runAction(action);
    },

    loadFinsh: function() {
        // 动画完成，切换场景
        var canvas = this.canvas;
        var fadeOut = cc.fadeOut(1.0);
        var finshed = cc.callFunc(this.showIndex, this); // 动作回调
        var action = cc.sequence(fadeOut, finshed)
        setTimeout(function(){
            canvas.runAction(action);
        }, 1000)
    },

    showIndex: function() {
        cc.director.loadScene('sceneIndex');
    }
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
