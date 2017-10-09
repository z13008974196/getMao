cc.Class({
    extends: cc.Component,

    properties: {
        girl: {
            default: null,
            type: cc.Node
        }
    },

    // use this for initialization
    onLoad: function () {

    },

    toScene: function(){
       cc.director.loadScene("game")
   }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
