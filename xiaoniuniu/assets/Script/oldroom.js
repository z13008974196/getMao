var wukong = require('./pomelo-api.js');
var anim = require('./animJs.js');

cc.Class({

    extends: cc.Component,

    properties: {
        aCards: cc.Prefab,
        bankerAvatar: cc.Prefab,
        seatList: [],
        userList: [],
        selfCardData: [],
        otherCardData: [],
        playerGroup: [],
        animGroup: [],
        bankerPlayerIdList: [],
        cardAsset: [],
        doubleAsset: [],
        typeAsset: [],

        roomId: null,
        selfInfo: null,
        selfId: null,
        room: null,
        lastSeat: null,
        palyerCount: 0,
        bankerId: null
    },

    onLoad: function () {
        this.roomId = wukong.getRoomId();
        var gameRound = 1;

        wukong.getUserInfo((userInfo) => {
            this.selfInfo = userInfo;
            var userName = this.selfId = userInfo.nickName;
            wukong.enterRoom(userName, this.roomId, gameRound, (res) => {
                // console.log(res.userList);
                // 渲染房间里已落座的用户
                // 获取玩家列表,有seat属性的就说明该玩家坐下了
                this.seatList = cc.find('Canvas/user/user_seat').children;
                console.log(res);
                this.userList = res.userList;
                var userList = res.userList;
                for(let i in userList){
                    if(userList[i].seat){
                        // 表示玩家坐下
                        this.seatList[userList[i].seat].children[0].scale = 1;
                        this.seatList[userList[i].seat].children[1].scale = 0;
                        var name = userList[i].uid.split('*')[0];
                        this.seatList[userList[i].seat].children[0].children[1].getComponent(cc.Label).string = name;
                        // var name = i.split('*')[0];
                        // this.seatList[userList[i].seat].children[0].children[1].string = name;
                    }
                }
                // do something here ...
            });
        });
        // wukong.watcher(this.onTakeSeat, this.onLeaveSeat, this.onSeatBusy);
        wukong.watcher(
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

        // 获取牌组资源
        wukong.getCardAsset('card3', (cardAsset) => {
            anim.getCardAsset(cardAsset);
            this.cardAsset = cardAsset;
        });

        // 获取加倍庄家标注
        wukong.getCardAsset('tipDouble', (asset) => {
            anim.getTipDoubleAsset(asset);
            this.doubleAsset = asset;
        });

        // 获取牌型标注
        wukong.getCardAsset('tipType', (asset) => {
            anim.getTipTypeAsset(asset);
            this.typeAsset = asset;
        });

        // var remoteUrl = 'http://img3.imgtn.bdimg.com/it/u=2770691011,100164542&fm=27&gp=0.jpg';
        // cc.loader.load(remoteUrl, function (err, texture) {
        //     // Use texture to create sprite frame
        //     console.log(texture)
        // });

    },

    onTimerStart: function(data) {
        console.log(data);
        // if(data.time == 0) cc.find("Canvas/anim/anim_timer").active = false;
        cc.find("Canvas/anim/anim_timer/time").getComponent(cc.Label).string = data.time;
    },

//////////////////////////////////// 坐位 /////////////////////////////////////////////

    // 申请坐位
    postSeat: function(e){
        var currentSeat = e.target.getComponent(cc.Button).clickEvents[0].customEventData,
            lastSeat = this.lastSeat;
        wukong.postSeat(currentSeat, lastSeat, (res) => {;
            // console.log(res);
        });
    },

    onSeatTake: function(data){
        // 触发代表有人坐下了
        // console.log(data);
        this.ifSelf('onSeatTake', data);

        this.seatList[data.seat].children[0].scale = 1;
        this.seatList[data.seat].children[1].scale = 0;
        var name = data.userId.split('*')[0];
        this.seatList[data.seat].children[0].children[1].getComponent(cc.Label).string = name;
    },

    onSeatLeave: function(data){
        // 离开坐位(换座位)
        // console.log(data);
        this.ifSelf('onSeatLeave', data);

        this.seatList[data.seat].children[0].scale = 0;
        this.seatList[data.seat].children[1].scale = 1;
    },

    onSeatBusy: function(data){
        // console.log(data)

        // do something here ...
        // alert(data.content)
    },

    //////////////////////////////////// 准备 /////////////////////////////////////////////

    // 点击开始，发送准备请求（用户点击）
    postReady: function(e) {
        wukong.postReady((res) => {
            // console.log(res);
        });
    },

    // 接受准备信息
    onReadyPost: function(data){
        // console.log(data)
        this.ifSelf('onReadyPost', data);
    },

    //////////////////////////////////// 开始 /////////////////////////////////////////////

    onReadyOver: function(data){
        console.log(data);
        // 隐藏未开始时的中间部分
        cc.find('Canvas/button/game_start').active = false;
        cc.find('Canvas/button/game_start/button_gamestart').active = true;

        this.playerListSort = data.playerListSort;
        var animPlayerSeatList = []; // 动画用,用户游戏中位置列表
        for(let i in data.playerListSort){
            animPlayerSeatList.push(data.playerListSort[i].seat);
        }
        // var playerList = data.playerList;

        // 自己的牌对应资源
        this.selfCardData = data.cardData;
        anim.getMyCard(data.cardData);

        // 玩家个数 根据玩家个数创建需要的对象池
        this.palyerCount = data.playerCount;
        this.creatPool(data.playerCount);

        // 显示游戏中用户，开始前用户
        cc.find("Canvas/user/user_seat").active = false;
        for(let i  = 0; i < data.playerCount; i++){
            cc.find("Canvas/user/user_info").children[animPlayerSeatList[i]].active = true;
        }

        // 创建发牌动画跟节点
        anim.createPlayerAnim(animPlayerSeatList, this.aCardPool);
        // anim.sendACard(null,()=>{
        //     this.postAnim('readyOverAnim');
        // });
    },

    //////////////////////////////////// 抢庄 /////////////////////////////////////////////

    postBanker: function(e) {  // applyBanker 控制庄家池的显示&&庄家选择开始   onApplyBanker 往庄家池添加庄家
        var banker = e.target.getComponent(cc.Button).clickEvents[0].customEventData;
        wukong.postBanker(banker, (res) => {
            // console.log(res);
        });
    },

    onBankerPost: function(data){
        // 点击抢庄之后
        console.log(data)
        this.ifSelf('onBankerPost', data);

        if(data.banker == 1){
            // 抢庄
            var avatar = this.bankerAvatarPool.get();
            var anim_banker_list = cc.find("Canvas/anim/anim_banker");
            anim_banker_list.addChild(avatar);
            this.bankerPlayerIdList.push(data.userId);
            // console.log(data.userId);
        }
    },

    onBankerOver: function(data){
        console.log(data)

        cc.find('Canvas/button/button_banker').active = false;
        cc.find('Canvas/anim/anim_timer').active = false;

        this.bankerId = data.bankerId;
        anim.getBankerSeat(data.bankerId, this.playerListSort, this.bankerPlayerIdList);;

        var tip = cc.find("Canvas/anim/anim_banker_tip");
        var anim_banker = cc.find("Canvas/anim/anim_banker");
        var anim_banker_list = anim_banker.children;
        // var width = anim_banker.width;
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

    //////////////////////////////////// 加倍 /////////////////////////////////////////////

    postDouble: function(e) {
        var double = e.target.getComponent(cc.Button).clickEvents[0].customEventData;
        console.log(double);
        wukong.postDouble(double, (res) => {
            // console.log(res);
        });
    },

    onDoublePost: function(data) {
        console.log(data)
        this.ifSelf('onDoublePost', data);

        var playerListSort = this.playerListSort;
        var tipInd;
        for(let i in playerListSort){
            if(playerListSort[i].uid.split('*')[0] == data.userId.split('*')[0]){
                tipInd = playerListSort[i].seat;
                if(data.double >= 5){
                    var double = 5;
                }else{
                    var double = data.double;
                }
                cc.find("Canvas/tip/tip_double").children[tipInd].getComponent(cc.Sprite).spriteFrame = this.doubleAsset[double];
                return;
            }
        }
    },

    onDoubleOver: function(data) {
        console.log(data)
        cc.find("Canvas/button/button_clicklast").active = true;

        var timeout = data.timeout;
        var playerListSort = this.playerListSort;

        if(timeout){
            // 有没点的
            for(let j in timeout){
                for(let i in playerListSort){
                    if(playerListSort[i].uid.split('*')[0] == timeout[j].split('*')[0]){
                        var tipInd = playerListSort[i].seat;
                        cc.find("Canvas/tip/tip_double").children[tipInd].getComponent(cc.Sprite).spriteFrame = this.doubleAsset[1];
                        return;
                    }
                }
            }

        }

        this.postAnim('doubleOverAnim');
    },

    //////////////////////////////////// 点击最后一张牌 /////////////////////////////////////////////

    // clickLastCard: function(){
    //     anim.selfLastACardAnim();
    // },

    //////////////////////////////////// 亮牌 /////////////////////////////////////////////

    postOpen: function(e) {
        wukong.postOpen((res) => {
            console.log(res);
        });
    },

    onOpenPost: function(data) {
        console.log(data)
        this.ifSelf('onOpenPost', data);
    },

    onOpenOver: function(data) {
        console.log(data)

        anim.openCardAnim(data, this.playerListSort, this.selfId);

    },

    //////////////////////////////////// 下一局 /////////////////////////////////////////////

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

    /////////////////////////////////////////////////////////////////////////////////

    onRoomBusy: function(data){
        console.log(data);
    },

    onGameOver: function(data) {
        console.log(data)
        // cc.find('button_open').runAction(cc.hide());
    },

    /////////////////////////////////////////////////////////////////////////////////

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

    ifSelf: function(event, data){
        console.log(data);
        if(this.selfInfo.nickName == data.userId.split('*')[0]){
            if(event == 'onSeatTake' || event == 'onSeatLeave'){
                this.lastSeat = data.seat;
                cc.find('Canvas/button/game_start/button_gamestart').active = true;
            }

            if(event == 'onReadyPost'){
                // 隐藏开始按钮
                cc.find('Canvas/button/game_start/button_gamestart').active = false;
            }

            if(event == 'onBankerPost'){
                cc.find("Canvas/button/button_banker").active = false;
                cc.find("Canvas/anim/anim_banker").active = true;
                cc.find("Canvas/anim/anim_timer").active = false;
            }

            if(event == 'onDoublePost'){
                cc.find("Canvas/button/button_double").active = false;
                cc.find("Canvas/anim/anim_timer").active = false;
            }

            if(event == 'onOpenPost'){
                cc.find("Canvas/button/button_opencard").active = false;
                cc.find("Canvas/anim/anim_timer").active = false;
            }
        }
    },

    postAnim: function(anim) {
        wukong.postAnim(anim, (res) => {
            // console.log(res);
        });

        if(anim == 'readyOverAnim'){
            console.log('发牌动画结束');
            cc.find("Canvas/button/button_banker").active = true;
            cc.find("Canvas/anim/anim_timer").active = true;
        }

        if(anim == 'bankerOverAnim'){
            console.log('抢庄动画结束');
            cc.find("Canvas/anim/anim_banker_tip").active = false;
            cc.find("Canvas/tip/tip_double").active = true;

            if(this.bankerId.split('*')[0] != this.selfId){
                cc.find("Canvas/anim/anim_timer").active = true;
                cc.find("Canvas/button/button_double").active = true;
            }else{
                cc.find('Canvas/tip/tip_cannotDouble').active = true;
            }
        }

        if(anim == 'doubleOverAnim'){
            var fingle = cc.find("Canvas/button/button_clicklast_icon");
            fingle.active = true;
            var fingleAnim = cc.repeat(cc.sequence(cc.moveBy(0.5, 0, 10), cc.moveBy(0.5, 0, -10)), 6);
            fingle.runAction(fingleAnim);
            if(this.bankerId.split('*')[0] == this.selfId){
                cc.find("Canvas/tip/tip_cannotDouble").active = false;
            }
            cc.find("Canvas/anim/anim_timer").active = true;
        }

        if(anim == 'openOverAnim'){
            // 亮牌动画结束
            cc.find("Canvas/button/button_banker").active = true;
            cc.find("Canvas/anim/anim_timer").active = true;
        }

    }

});
