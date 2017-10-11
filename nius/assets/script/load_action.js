cc.Class({
    extends: cc.Component,

    properties: {
        niu: {
            default: null,
            type: cc.Node
        },
        IndexMain: {
            default: null,
            type: cc.Node
        },
        LoadMain: {
            default: null,
            type: cc.Node
        },
        Name: {
            default: null,
            type: cc.Node
        }
    },

    // use this for initialization
    onLoad: function () {
        this.Name.active = false;
        this.IndexMain.active = false;
        var niu = this.niu;
        var anim = this.niu.getComponent(cc.Animation);
        var repeat = cc.rotateBy(1.5, 2160);
        setTimeout(function(){
            anim.play('load_anim');
            niu.runAction(repeat.easing(cc.easeOut(3.0)));
        }, 1000)
    },


    logoCheck: function() {
        this.Name.active = true;
        var act1 = cc.moveBy(0.2, 0, -240);
        var act2 = cc.moveBy(0.2, 0, 100);
        var act3 = cc.moveBy(0.2, 0, -100);
        var act4 = cc.moveBy(0.2, 0, 40);
        var act5 = cc.moveBy(0.2, 0, -40);
        var act6 = cc.moveBy(0.2, 0, 10);
        var act7 = cc.moveBy(0.2, 0, -10);
        var finshed = cc.callFunc(this.showGameIndex, this); // 动作回调
        var action = cc.sequence(act1, act2, act3, act4, act5, act6, act7, finshed);

        this.Name.runAction(action);
    },

    showGameIndex: function() {
        var LoadMain = this.LoadMain;
        var IndexMain = this.IndexMain;
        setTimeout(function(){
            LoadMain.active = false;
            IndexMain.active = true;
        }, 1000)
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
