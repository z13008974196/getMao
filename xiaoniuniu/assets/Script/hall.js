var wukong = require('./pomelo-api.js');

cc.Class({
    extends: cc.Component,

    properties: {
        createRoomInfo: null,

        gamePage: null
    },

    // use this for initialization
    onLoad: function () {
        // 游戏区初始化
        this.gamePage = 2;
        cc.find('Canvas/gameEnter_prev').active = false;

        // 弹窗相关初始化
        cc.find('Canvas/mask').active = false;
        cc.find('Canvas/intoRoom').active = false;
        cc.find('Canvas/createRoom').active = false;
        cc.find('Canvas/vipPopup').active = false;
        cc.find('Canvas/shopPopup').active = false;
        cc.find('Canvas/recordPopup').active = false;
        cc.find('Canvas/activityPopup').active = false;

        // 预加载
        // cc.director.preloadScene('room');

        // test
        // window.visibilitychange();
    },

    gameEnterPage: function(e){
        var pageBox = cc.find('Canvas/gameEnter').getComponent(cc.PageView);
        var nowPage = pageBox.getCurrentPageIndex();
        if(e.target.getComponent(cc.Button).clickEvents[0].customEventData == 0){ // 上一个
            pageBox.scrollToPage(nowPage - 1, 0.5); // 移动
        }else{ // 下一个
            pageBox.scrollToPage(nowPage + 1, 0.5); // 移动
        }

    },

    gameScroll: function(event){ // 滚动事件
        var nowPage = cc.find('Canvas/gameEnter').getComponent(cc.PageView).getCurrentPageIndex();
        if(nowPage == this.gamePage - 1){ // 没有下一个了
            cc.find('Canvas/gameEnter_next').active = false;
        }
        if(nowPage == 0){ // 没有上一个了
            cc.find('Canvas/gameEnter_prev').active = false;
        }
        if(nowPage < this.gamePage - 1){
            cc.find('Canvas/gameEnter_next').active = true;
        }
        if(nowPage > 0){
            cc.find('Canvas/gameEnter_prev').active = true;
        }
    },

    //////////////////// 创建房间 ////////////////////

    showCreateRoom: function(e){
        this.showPopup(cc.find('Canvas/createRoom'));
        if(this.createRoomInfo === null){
            var createRoomInfo = [0,0,0];
            this.createRoomInfo = createRoomInfo;
        }
    },

    createOption: function(e){
        var type = parseInt(e.checkEvents[0].customEventData.split(',')[0]);
        var value = parseInt(e.checkEvents[0].customEventData.split(',')[1]);
        this.createRoomInfo[type] = value;
    },

    createRoom: function(){
        // console.log(this.createRoomInfo);
        cc.director.loadScene("room");
    },

    // 还要干点什么

    //////////////////// 加入房间 ////////////////////

    intoRoom: function(){
        this.showPopup(cc.find('Canvas/intoRoom'));
    },

    clickNum: function(e){
        var input_num = e.target.getComponent(cc.Button).clickEvents[0].customEventData;
        cc.find('Canvas/intoRoom/input/roomNum').getComponent('cc.Label').string += input_num;
    },

    deletes: function(){
        cc.find('Canvas/intoRoom/input/roomNum').getComponent('cc.Label').string = '';
    },

    //////////////////// 会员 ////////////////////

    showVip: function(){
        this.showPopup(cc.find('Canvas/vipPopup'));
    },

    //////////////////// 商城 ////////////////////

    showShop: function(){
        this.showPopup(cc.find('Canvas/shopPopup'));
    },

    //////////////////// 战绩 ////////////////////

    showRecord: function(){
        this.showPopup(cc.find('Canvas/recordPopup'));
    },

    //////////////////// 活动 ////////////////////

    showActivity: function(){
        this.showPopup(cc.find('Canvas/activityPopup'));
    },


    ///////////////////////////////////////////////////////////////////////

    showPopup: function(node){
        cc.find('Canvas/mask').active = true;
        node.active = true;
    },

    hidePopup: function(e){
        cc.find('Canvas/mask').active = false;
        e.target.parent.active = false;
    },

});
