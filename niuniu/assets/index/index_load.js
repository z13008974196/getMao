cc.Class({
    extends: cc.Component,

    properties: {
        canvas: {
            default: null,
            type: cc.Node
        }
    },

    // use this for initialization
    onLoad: function () {
        var fadeOut = cc.fadeIn(1.0);
        this.canvas.runAction(fadeOut);
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
