cc.Class({
    extends: cc.Component,

    properties: {
        input_text:{
            default: null,
            type: cc.Node
        }
    },

    // use this for initialization
    onLoad: function () {
        this.input_text = cc.find('Canvas/intoRoom/input/roomNum');
    },

    // 点击数字
    clickNum: function(data){
        var input_num = data.target.getComponent(cc.Button).clickEvents[0].customEventData;
        this.input_text.getComponent('cc.Label').string += input_num;
    },

    deletes: function(){
        this.input_text.getComponent('cc.Label').string = '';
    },

    closeIntoRoom: function(){
        // var intoRoom = cc.find('Canvas/intoRoom');
        // intoRoom.active = false;
        console.log(this.input_text.getComponent('cc.Label').string);
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
