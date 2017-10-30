var wukong = require('./pomelo-api.js');
var anim = require('./animJs.js');

cc.Class({

    extends: cc.Component,

    properties: {
        aCards: cc.Prefab,
        bankerAvatar: cc.Prefab,

        seatList: [], // 游戏开始前坐位列表
        selfCardData: [], // 自己牌的数据
        // otherCardData: [],
        bankerPlayerIdList: [], // 抢庄的人的id列表
        cardAsset: [], // 卡牌资源
        doubleAsset: [], // 庄家、加倍标注资源
        typeAsset: [], // 牌型资源

        selfInfo: null,
        selfName: null,
        lastSeat: null,
        bankerId: null, // 庄家ID，抢庄结束之后获取
        doubleOver: null, // 加倍完成，跟下面一个 一起用来判断是否自动翻最后一张牌
        clickLastOver: null // 点击最后一张牌，同上
    },

    onLoad: function () {
        var roomId = wukong.getRoomId();
        var gameRound = 1;

        this.seatList = cc.find('Canvas/user/user_seat').children;
        wukong.getUserInfo((userInfo) => {
            // console.log(userInfo);
            this.selfInfo = userInfo;
            var userName = this.selfName = userInfo.nickName;
            wukong.enterRoom(userName, roomId, gameRound, (res) => { // 渲染房间里已落座的用户
                // console.log(res);
                console.log(`my name is ${userName}`);
                var userList = res.userList;
                for(let i in userList){
                    if(userList[i].seat){
                        this.seatList[userList[i].seat].children[0].scale = 1;
                        this.seatList[userList[i].seat].children[1].scale = 0;

                        var name = userList[i].uid.split('*')[0];
                        this.seatList[userList[i].seat].children[0].children[1].getComponent(cc.Label).string = name;

                        var spriteNode = this.seatList[userList[i].seat].children[0].children[0];
                        this.getNetAsset(userList[i].avatar, spriteNode);

                        if(userList[i].ready){
                            this.seatList[userList[i].seat].children[2].opacity = 255;
                        }
                    }
                }
            });
        });

        wukong.watcher(
            this.onAnimPost.bind(this),
            this.onAnimOver.bind(this),
            this.onAnimTimeout.bind(this),
            this.onTimerStart.bind(this),
            this.onSeatTake.bind(this),
            this.onSeatLeave.bind(this),
            this.onSeatBusy.bind(this),
            this.onReadyPost.bind(this),
            this.onReadyOver.bind(this),
            this.onBankerPost.bind(this),
            this.onBankerOver.bind(this),
            this.onDoublePost.bind(this),
            this.onDoubleOver.bind(this),
            this.onOpenPost.bind(this),
            this.onOpenOver.bind(this),
            this.onNextPost.bind(this),
            this.onNextOver.bind(this),
            this.onRoomBusy.bind(this),
            this.onGameOver.bind(this)
        );

        // 获取资源
        wukong.getCardAsset('card3', (cardAsset) => {
            // 牌组
            anim.getCardAsset(cardAsset);
            this.cardAsset = cardAsset;
        });

        wukong.getCardAsset('tipDouble', (asset) => {
            // 加倍庄家标注
            anim.getTipDoubleAsset(asset);
            this.doubleAsset = asset;
        });

        wukong.getCardAsset('tipType', (asset) => {
            // 牌型标注
            anim.getTipTypeAsset(asset);
            this.typeAsset = asset;
        });

        // var self = this;
        // setTimeout(function(){
        //     self.gameStartAnim();
        // },1000)
        // this.gameStartAnim();
    },

    // // --------------------------- seat OK --------------------------- //

    postSeat: function(e) {
        var currentSeat = e.target.getComponent(cc.Button).clickEvents[0].customEventData;
        wukong.postSeat(currentSeat, this.lastSeat, (res) => {
            // console.log(res);
        });
    },

    onSeatTake: function(data) { // 触发代表有人坐下了
        console.log(data);
        this.ifSelf('onSeatTake', data);

        this.seatList[data.seat].children[0].scale = 1;
        this.seatList[data.seat].children[1].scale = 0;

        var name = data.userId.split('*')[0];
        this.seatList[data.seat].children[0].children[1].getComponent(cc.Label).string = name;

        var spriteNode = this.seatList[data.seat].children[0].children[0];
        this.getNetAsset(data.avatar, spriteNode);
    },

    onSeatLeave: function(data) { // 离开坐位(换座位)
        console.log(data);
        this.ifSelf('onSeatLeave', data);

        cc.find("Canvas/user/user_seat").children[data.seat].children[2].opacity = 0;

        this.seatList[data.seat].children[0].scale = 0;
        this.seatList[data.seat].children[1].scale = 1;
    },

    onSeatBusy: function(data) {
        console.log(data);
    },

    // // --------------------------- ready --------------------------- //

    postReady: function() {
        wukong.postReady((res) => {
            // console.log(res);
        });
    },

    onReadyPost: function(data) {
        console.log(data);
        this.ifSelf('onReadyPost', data);

        cc.find("Canvas/user/user_seat").children[data.seat].children[2].opacity = 255;
    },

    onReadyOver: function(data) {
        console.log('onReadyOver', data);

        // 玩家个数 根据玩家个数创建需要的对象池
        this.creatPool(data.playerCount);

        // 自己的牌对应资源
        this.selfCardData = data.cardData;
        anim.getMyCard(data.cardData);

        // 取消准备状态
        cc.find('Canvas/tip/tip_text').active = false;
        var user_seat = cc.find("Canvas/user/user_seat");
        for(let i in user_seat.children){
            user_seat.children[i].children[2].opacity = 0;
        }

        // 获取用户玩家，排列之后的
        this.playerListSort = data.playerListSort;

        var animPlayerSeatList = []; // 动画用,用户游戏中位置列表

        // 显示游戏中用户，开始前用户
        var user_infos = cc.find("Canvas/user/user_info");
        cc.find("Canvas/user/user_seat").active = false;

        for(let i in data.playerListSort){
            animPlayerSeatList.push(data.playerListSort[i].seat);

            user_infos.children[data.playerListSort[i].seat].active = true;

            var spriteNode = user_infos.children[data.playerListSort[i].seat].children[0];
            this.getNetAsset(data.playerListSort[i].avatar, spriteNode);
        }

        anim.createPlayerAnim(animPlayerSeatList, this.aCardPool); // 根据坐位创建发牌动画

        this.gameStartAnim(animPlayerSeatList);
    },

    gameStartAnim: function(animPlayerSeatList){
        cc.find('Canvas/music/seat').getComponent(cc.AudioSource).play();

        var startAnim_node = cc.find("Canvas/anim/anim_start_img");
        startAnim_node.active = true;
        var startAnim_down = cc.moveTo(0.1, cc.p(-51,-141));
        var startAnim_huang = cc.sequence(cc.rotateTo(0.05, -20),cc.rotateTo(0.05, 15),cc.rotateTo(0.05, -10),cc.rotateTo(0.05, 5),cc.rotateTo(0.05, 0));
        var startAnim_fade = cc.fadeOut(0.25);

        var startAnim_cb = cc.callFunc(function(){
            cc.find('Canvas/anim/anim_card').active = true;
            anim.sendACard(null,()=>{
                this.postAnim('readyOverAnim');
            });
        }, this)
        var startAnim = cc.sequence(startAnim_down, startAnim_huang, cc.delayTime(0.5), startAnim_fade, startAnim_cb);
        startAnim_node.runAction(startAnim);
    },

    // --------------------------- banker --------------------------- //

    postBanker: function(e) {
        var banker = e.target.getComponent(cc.Button).clickEvents[0].customEventData;
        wukong.postBanker(banker, (res) => {
            // console.log(res);
        });
    },

    onBankerPost: function(data) {
        console.log(data);
        this.ifSelf('onBankerPost', data);

        if(data.banker == 1){ // 抢庄
            cc.find('Canvas/tip/tip_text').active = false;
            var avatar = this.bankerAvatarPool.get();
            var anim_banker = cc.find("Canvas/anim/anim_banker");
            this.getNetAsset(this.playerListSort[data.userId].avatar, avatar);
            anim_banker.addChild(avatar);
            this.bankerPlayerIdList.push(data.userId);
        }
    },

    onBankerOver: function(data) {
        console.log(data);

        cc.find('Canvas/button/button_banker').active = false;
        cc.find('Canvas/anim/anim_timer').active = false;

        this.bankerId = data.bankerId;
        var anim_banker = cc.find("Canvas/anim/anim_banker");
        if(anim_banker.children.length == 0){
            console.log(this.bankerAvatarPool);
            for(let i in this.playerListSort){
                var avatar = this.bankerAvatarPool.get();
                this.getNetAsset(this.playerListSort[i].avatar, avatar);
                anim_banker.addChild(avatar);
                this.bankerPlayerIdList.push(i);
            }
            anim.getBankerSeat(data.bankerId, this.playerListSort, this.bankerPlayerIdList);
            this.bankerAnim();
            cc.find("Canvas/anim/anim_banker").active = true;
            return;
        }

        anim.getBankerSeat(data.bankerId, this.playerListSort, this.bankerPlayerIdList);

        this.bankerAnim();
    },

    bankerAnim: function(){ // 抢庄动画
        var tip = cc.find("Canvas/anim/anim_banker_tip");
        var anim_banker = cc.find("Canvas/anim/anim_banker");
        var anim_banker_list = anim_banker.children;
        var width = this.bankerPlayerIdList.length * 80 + ( this.bankerPlayerIdList.length - 1 ) + 16;

        // 抢庄标识的初始化位置
        var startX = width/2 - 51 - width;
        var endX = width/2 - 51;
        tip.setPositionX(startX);
        tip.active = true;

        anim.animBankerTip(tip, anim_banker_list, startX, endX, ()=>{
            this.postAnim('bankerOverAnim');
        })
    },

    // --------------------------- double --------------------------- //

    postDouble: function(e) {
        var double = e.target.getComponent(cc.Button).clickEvents[0].customEventData;
        wukong.postDouble(double, (res) => {
            // console.log(res);
        });
    },

    onDoublePost: function(data) {
        console.log(data);
        this.ifSelf('onDoublePost', data);

        // 显示点击的人的加倍标注
        var playerListSort = this.playerListSort;
        for(let i in playerListSort){
            if(playerListSort[i].uid.split('*')[0] == data.userId.split('*')[0]){
                var tipInd = playerListSort[i].seat;
                var double;
                if(data.double >= 5){
                    double = 5;
                }else{
                    double = data.double;
                }
                cc.find("Canvas/tip/tip_double").children[tipInd].getComponent(cc.Sprite).spriteFrame = this.doubleAsset[double];
                return;
            }
        }
    },

    onDoubleOver: function(data) {
        console.log(data);
        cc.find("Canvas/button/button_double").active = false;
        cc.find('Canvas/tip/tip_text').active = false;
        cc.find('Canvas/anim/anim_timer').active = true;

        this.doubleOver = true;
        this.showfingle();

        var playerListSort = this.playerListSort;

        var timeout = data.timeout;
        if(timeout){ // 有没点的
            for(let j in timeout){
                for(let i in playerListSort){
                    if(playerListSort[i].uid.split('*')[0] == timeout[j].split('*')[0]){
                        var tipInd = playerListSort[i].seat;
                        cc.find("Canvas/tip/tip_double").children[tipInd].getComponent(cc.Sprite).spriteFrame = this.doubleAsset[1];
                    }
                }
            }
        }
        this.postAnim('doubleOverAnim');
    },

    // --------------------------- 点击最后一张牌 --------------------------- //

    showfingle: function(){
        cc.find("Canvas/button/button_clicklast").active = true;
        var fingle = cc.find("Canvas/button/button_clicklast_icon");
        fingle.active = true;
        var fingleAnim = cc.repeat(cc.sequence(cc.moveBy(0.5, 0, 10), cc.moveBy(0.5, 0, -10)), 6);
        fingle.runAction(fingleAnim);
    },

    clickLastCard: function(){
        cc.find("Canvas/button/button_opencard").active = true;
        anim.selfLastACardAnim();
        this.clickLastOver = true;
    },

    // --------------------------- open --------------------------- //

    postOpen: function(e) {
        wukong.postOpen((res) => {
            // console.log(res);
        });
    },

    onOpenPost: function(data) {
        console.log(data);
        this.ifSelf('onOpenPost', data);
    },

    onOpenOver: function(data) {
        console.log(data);
        cc.find("Canvas/tip/tip_text").active = false;
        cc.find("Canvas/tip/tip_text").getComponent(cc.Label).string = '请选择坐位';
        anim.openCardAnim(data, this.playerListSort, this.selfName, ()=>{
            this.postAnim('openOverAnim');
        });
    },

    // --------------------------- next --------------------------- //

    postNext: function(e) {
        wukong.postNext((res) => {
            // console.log(res);
        });
    },

    onNextPost: function(data) {
        console.log(data)
    },

    onNextOver: function(data) {
        console.log(data)
        // cc.find('button_open').runAction(cc.hide());
    },

    // --------------------------- timer --------------------------- //

    onTimerStart: function(data) {
        console.log(data);
        var timeBox = cc.find('Canvas/anim/anim_timer');
        timeBox.children[0].getComponent(cc.Label).string = data.time;
        if(this.doubleOver && data.time == 0 && !this.clickLastOver){
            this.clickLastCard();
        }
    },

    // --------------------------- timer --------------------------- //
    //
    onRoomBusy: function(data) {
        console.log(data)
        // cc.find('button_open').runAction(cc.hide());
    },

    onGameOver: function(data) {
        console.log(data)
        // cc.find('button_open').runAction(cc.hide());
    },

    // --------------------------- animCB --------------------------- //

    postAnim: function(anim) {
        console.log('postAnim', anim);
        wukong.postAnim(anim, (res) => {
            // console.log(res);
        });
    },

    onAnimPost: function(anim){
        console.log('onAnimPost',anim);
    },

    onAnimOver: function(data){
        console.log('onAnimOver' ,data);
        if(data.anim == 'readyOverAnim'){
            console.log('发牌动画结束');

            // 开始抢庄步骤
            cc.find("Canvas/button/button_banker").active = true;
            cc.find("Canvas/anim/anim_timer").active = true;
        }

        if(data.anim == 'bankerOverAnim'){
            console.log('抢庄动画结束');

            // 开始加倍步骤
            cc.find("Canvas/anim/anim_banker_tip").active = false;
            var anim_banker = cc.find("Canvas/anim/anim_banker");
            anim_banker.active = false;
            for(let i in anim_banker.children){ // 删除对象池中的节点
                anim_banker.children[i].runAction(cc.removeSelf());
            }
            if(this.bankerId.split('*')[0] != this.selfName){ // 普通玩家
                cc.find("Canvas/anim/anim_timer").active = true;
                cc.find("Canvas/button/button_double").active = true;
            }else{ // 庄家
                cc.find('Canvas/tip/tip_text').getComponent(cc.Label).string = '你是庄家，请等待他人加倍';
                cc.find('Canvas/tip/tip_text').active = true;
            }
        }

        if(data.anim == 'doubleOverAnim'){
            // 加倍结束
            console.log('加倍结束');
        }

        if(data.anim == 'openOverAnim'){
            // 亮牌动画结束
            console.log('亮牌动画结束');
        }
    },

    onAnimTimeout: function(data){
        console.log(data);
    },



    ifSelf: function(event, data){
        // console.log(data);
        if(this.selfName == data.userId.split('*')[0]){
            if(event == 'onSeatTake'){
                cc.find('Canvas/music/seat').getComponent(cc.AudioSource).play();
                this.lastSeat = data.seat;
                cc.find("Canvas/tip/tip_text").active = false;
                cc.find('Canvas/button/button_gamestart').active = true;
            }

            if(event == 'onReadyPost'){
                cc.find('Canvas/music/ready').getComponent(cc.AudioSource).play();

                // 隐藏开始按钮
                cc.find('Canvas/button/button_gamestart').active = false;
                cc.find("Canvas/tip/tip_text").getComponent(cc.Label).string = '请等待其他玩家准备';
                cc.find("Canvas/tip/tip_text").active = true;
            }

            if(event == 'onBankerPost'){
                if(data.banker == 1){
                    cc.find('Canvas/music/getbanker').getComponent(cc.AudioSource).play();
                }else{
                    cc.find('Canvas/tip/tip_text').getComponent(cc.Label).string = '请等待他人抢庄';
                    cc.find('Canvas/tip/tip_text').active = true;
                }
                cc.find("Canvas/button/button_banker").active = false;
                cc.find("Canvas/anim/anim_timer").active = false;
                cc.find("Canvas/anim/anim_banker").active = true;
            }

            if(event == 'onDoublePost'){
                cc.find('Canvas/music/double').getComponent(cc.AudioSource).play();
                cc.find("Canvas/button/button_double").active = false;
                cc.find("Canvas/anim/anim_timer").active = false;
            }

            if(event == 'onOpenPost'){
                cc.find("Canvas/button/button_opencard").active = false;
                cc.find("Canvas/anim/anim_timer").active = false;
                cc.find("Canvas/tip/tip_text").getComponent(cc.Label).string = '请等待其他玩家亮牌';
                cc.find("Canvas/tip/tip_text").active = true;
            }
        }
    },

    creatPool: function(userCount){
        // 根据玩家数量生成牌的对象池
        this.aCardPool = new cc.NodePool();
        let cardCount = userCount*5;
        for (let i = 0; i < cardCount; ++i) {
            let card = cc.instantiate(this.aCards);
            this.aCardPool.put(card);
        }

        // 根据玩家数量生成抢庄动画头像的对象池
        this.bankerAvatarPool = new cc.NodePool();
        for (let i = 0; i < userCount; ++i) {
            let avatar = cc.instantiate(this.bankerAvatar);
            this.bankerAvatarPool.put(avatar);
        }
    },

    // 获取网络资源
    getNetAsset: function(avatar, spriteNode){
        spriteNode.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(avatar);
    },
});
