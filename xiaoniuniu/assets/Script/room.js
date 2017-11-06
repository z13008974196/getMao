
var wukong = require('./pomelo-api.js');
var anim = require('./animJs.js');

var watcherBind = true;

cc.Class({
    extends: cc.Component,

    properties: {
        aCards: cc.Prefab,
        bankerAvatar: cc.Prefab,
        user_total: cc.Prefab,

        seatList: [], // 游戏开始前坐位列表
        selfCardData: [], // 自己牌的数据
        // otherCardData: [],
        bankerPlayerIdList: [], // 抢庄的人的id列表
        cardAsset: [], // 卡牌资源
        doubleAsset: [], // 庄家、加倍标注资源
        typeAsset: [], // 牌型资源

        selfInfo: null,
        selfId: null,
        lastSeat: null,
        bankerId: null, // 庄家ID，抢庄结束之后获取
        doubleOver: null, // 加倍完成，跟下面一个 一起用来判断是否自动翻最后一张牌
        clickLastOver: null, // 点击最后一张牌，同上

        consoleBoxVis: false
    },

    onLoad: function(){
        this.seatList = cc.find('Canvas/user/user_seat').children;
        var roomId, userName, gameRound;
        wukong.getUserInfo((userInfo) => {
            userName = wukong.getQuery('user');   // 获取URL中的USER
            roomId = wukong.getQuery('roomId');   // 获取URL中的room
            gameRound = wukong.getQuery('gameRound');   // 获取URL中的room

            var data = {
                userName: userName,
                roomId: roomId,
                gameRound: gameRound
            }
            // this.enterRoom(data);
        });

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

        // 测试生成总结算
    },

    enterRoom: function(data){
        wukong.enterRoom(data, (res) => {
            console.log(res);
            this.selfId = res.userId;
            console.log(`My Name Is ${data.userName}`);

            var playerList = res.playerList;
            for(let i in playerList){
                if(playerList[i].seat){
                    this.seatList[playerList[i].seat].children[0].scale = 1;
                    this.seatList[playerList[i].seat].children[1].scale = 0;

                    var name = i.split('*')[0];
                    this.seatList[playerList[i].seat].children[0].children[1].getComponent(cc.Label).string = name;

                    var spriteNode = this.seatList[playerList[i].seat].children[0].children[0];
                    this.getNetAsset(playerList[i].avatar, spriteNode);

                    if(playerList[i].ready){
                        this.seatList[playerList[i].seat].children[2].opacity = 255;
                    }
                }
            }

        });

        wukong.watcher([
            {route: 'readyScene', cb: this.readyScene.bind(this)},
            {route: 'playerBack', cb: this.playerBack.bind(this)}
        ]);
    },

    // ------------------------------------------------------ ready ------------------------------------------------------ //

    seatPost: function(e){
        var scene = 'ready', anim = null, button = 'seat', value = e.target.getComponent(cc.Button).clickEvents[0].customEventData;
        wukong.scenePost(scene, anim, button, value, (res) => {
            // console.log(res);
        });
    },

    readyPost: function(e){
        var scene = 'ready', anim = null, button = 'ready', value = true;
        wukong.scenePost(scene, anim, button, value, (res) => {
            // console.log(res);
        });
    },

    readyScene: function(data){
        console.log(data);
        var scene = 'ready', button = 'button_' + scene;

        if(data.name == 'start') {  // 进入场景
            // cc.find('Canvas/logo').active = false;
        }

        if(data.name == 'timer') {  // 1. 定时器显示
            var timer = cc.find('Canvas/anim/anim_timer');
            timer.children[0].getComponent(cc.Label).string = data.time;
            if(data.time == 0) timer.active = false;
        }

        if(data.name == 'seatPost') { // 有人坐下
            console.log('有人坐下');
            this.ifSelf('onSeatTake', data);

            this.seatList[data.seat].children[0].scale = 1;
            this.seatList[data.seat].children[1].scale = 0;
            var name = data.userId.split('*')[0];
            this.seatList[data.seat].children[0].children[1].getComponent(cc.Label).string = name;
            var spriteNode = this.seatList[data.seat].children[0].children[0];
            // this.getNetAsset(data.avatar, spriteNode);
        }

        if(data.name == 'seatLeave'){
            cc.find("Canvas/user/user_seat").children[data.seat].children[2].opacity = 0;
            this.seatList[data.seat].children[0].scale = 0;
            this.seatList[data.seat].children[1].scale = 1;
        }

        if(data.name == 'readyPost') { // 有人准备
            console.log('有人准备');
            this.ifSelf('onReadyPost', data);
            cc.find("Canvas/user/user_seat").children[data.seat].children[2].opacity = 255;
        }

        if(data.name == 'readyOver') { // 都准备了，开始游戏
            if(watcherBind) { // 注册事件
                wukong.watcher([
                    {route: 'bankerScene', cb: this.bankerScene.bind(this)},
                    {route: 'doubleScene', cb: this.doubleScene.bind(this)},
                    {route: 'openScene', cb: this.openScene.bind(this)},
                    {route: 'nextScene', cb: this.nextScene.bind(this)}
                ]);
                watcherBind = false;
            }

            // 玩家个数 根据玩家个数创建需要的对象池
            this.creatPool(Object.getOwnPropertyNames(data.sort).length);

            // 自己的牌对应资源
            this.selfCardData = data.cardData;
            anim.getMyCard(data.cardData);

            // 取消准备状态
            var user_seat = cc.find("Canvas/user/user_seat");
            for(let i in user_seat.children){
                user_seat.children[i].children[2].opacity = 0;
            }

            // 获取用户玩家，排列之后的
            this.playerListSort = data.sort;

            var animPlayerSeatList = []; // 动画用,用户游戏中位置列表

            // 显示游戏中用户，开始前用户
            var user_infos = cc.find("Canvas/user/user_info");
            cc.find("Canvas/user/user_seat").active = false;

            for(let i in data.sort){
                animPlayerSeatList.push(data.sort[i].seat);

                user_infos.children[data.sort[i].seat].active = true;

                var spriteNode = user_infos.children[data.sort[i].seat].children[0].children[0];
                this.getNetAsset(data.sort[i].avatar, spriteNode);
            }

            anim.createPlayerAnim(animPlayerSeatList, this.aCardPool); // 根据坐位创建发牌动画

            anim.gameStartAnim(()=>{
                wukong.scenePost(scene, 'sendCard', scene, null, (res) => {
                    // console.log(res);
                });
            });
        }

        if(data.name == 'readyAnimOver') {
            console.log('发牌动画结束');
        }
    },

    // ------------------------------------------------------ banker ------------------------------------------------------ //

    bankerPost: function(e){
        var scene = 'banker', value = e.target.getComponent(cc.Button).clickEvents[0].customEventData;
        wukong.scenePost(scene, null, scene, value, (res) => {
            // console.log(res);
        });
    },

    bankerScene: function(data){ // 抢庄场景
        console.log(data);
        var scene = 'banker', button = 'button_' + scene;

        if(data.name == 'start'){  // 开始抢庄
            console.log('开始抢庄');
            cc.find("Canvas/button/button_banker").active = true;
            cc.find('Canvas/anim/anim_timer').active = true;
            cc.find('Canvas/logo').active = false;
        }

        if(data.name == 'timer'){
            var timer = cc.find('Canvas/anim/anim_timer');
            timer.children[0].getComponent(cc.Label).string = data.time;
            if(data.time == 0) timer.active = false;
        }

        if(data.name == 'bankerPost'){
            this.ifSelf('onBankerPost', data);

            if(data.banker == 1){ // 抢庄
                var avatar = this.bankerAvatarPool.get();
                var anim_banker = cc.find("Canvas/anim/anim_banker");
                this.getNetAsset(this.playerListSort[data.userId].avatar, avatar.children[0]);
                anim_banker.addChild(avatar);
                this.bankerPlayerIdList.push(data.userId);
            }
        }

        if(data.name == 'bankerOver'){  // 抢庄结束
            cc.find('Canvas/button/button_banker').active = false;
            cc.find('Canvas/anim/anim_timer').active = false;

            this.bankerId = data.bankerId;
            var anim_banker = cc.find("Canvas/anim/anim_banker");
            if(anim_banker.children.length == 0){
                for(let i in this.playerListSort){
                    var avatar = this.bankerAvatarPool.get();
                    this.getNetAsset(this.playerListSort[i].avatar, avatar.children[0]);
                    anim_banker.addChild(avatar);
                    this.bankerPlayerIdList.push(i);
                }
                anim.getBankerSeat(data.bankerId, this.playerListSort, this.bankerPlayerIdList);
                this.bankerAnim();
                cc.find("Canvas/anim/anim_banker").active = true;
                return;
            }

            // 获取抢庄动画要用的东西
            anim.getBankerSeat(data.bankerId, this.playerListSort, this.bankerPlayerIdList);
            this.bankerAnim();
        }

        if(data.name == 'bankerAnimOver'){ // 抢庄动画结束
            // 抢庄牛标志的移动动画
            var playerTip = cc.find('Canvas/tip/tip_double').children[this.playerListSort[this.bankerId].seat];
            var position = playerTip.position;
            var tip = cc.find("Canvas/anim/anim_banker_tip");
            var bezier = [tip.position, cc.p(680, 380), position];
            var tipToGameSeatAnim = cc.bezierTo(0.5, bezier);
            // var tipToGameSeatAnim = cc.moveTo(0.5, position);
            var tipToGameSeatAnimFinish = cc.callFunc(function(){
                tip.active = false;
                playerTip.active = true;
            }, this)
            tip.runAction(cc.sequence(tipToGameSeatAnim, tipToGameSeatAnimFinish));
        }
    },

    bankerAnim: function(){
        var tip = cc.find("Canvas/anim/anim_banker_tip");
        var anim_banker_list = cc.find('Canvas/anim/anim_banker').children;
        var width = this.bankerPlayerIdList.length * 80 + ( this.bankerPlayerIdList.length - 1 ) + 16;

        // 抢庄标识的初始化位置
        var startX = width/2 - width;
        var endX = width/2;
        tip.setPositionX(startX);
        tip.active = true;
        anim.animBankerTip(this.bankerAvatarPool, tip, anim_banker_list, startX, endX, ()=>{
            wukong.scenePost('banker', 'getBanker', null, null, (res) => {
                // console.log(res);
            });
        });
    },

    // ------------------------------------------------------ double ------------------------------------------------------ //


    doublePost: function(e){
        var scene = 'double', value = e.target.getComponent(cc.Button).clickEvents[0].customEventData;
        wukong.scenePost(scene, null, scene, value, (res) => {
            // console.log(res);
        });
    },

    doubleScene: function(data){ // 加倍场景
        console.log(data);
        var scene = 'double', button = 'button_' + scene;

        if(data.name == 'timer'){ // 1. 定时器显示
            var timer = cc.find('Canvas/anim/anim_timer');
            timer.children[0].getComponent(cc.Label).string = data.time;
            if(data.time == 0) timer.active = false;
        }

        if(data.name == 'start'){ // 开始加倍
            cc.find('Canvas/anim/anim_timer').active = true;
            cc.find('Canvas/logo').active = false;

            var anim_banker = cc.find("Canvas/anim/anim_banker");
            anim_banker.active = false;
            for(let i in anim_banker.children){ // 删除对象池中的节点
                anim_banker.children[i].children[0].getComponent(cc.Sprite).spriteFrame = null;
                this.bankerAvatarPool.put(anim_banker.children[i]);
            }

            if(this.bankerId != this.selfId){ // 普通玩家
                cc.find("Canvas/button/button_double").active = true;
            }
        }

        if(data.name == 'doublePost'){
            this.ifSelf('onDoublePost', data);

            // 显示点击的人的加倍标注
            var playerListSort = this.playerListSort;
            console.log(playerListSort);
            for(let i in playerListSort){
                if(i == data.userId && i != this.bankerId){
                    var tipInd = playerListSort[i].seat;
                    var double;
                    if(data.value >= 5){
                        double = 5;
                    }else{
                        double = data.value;
                    }
                    var tip_double = cc.find('Canvas/tip/tip_double');
                    tip_double.children[tipInd].active = true;
                    tip_double.children[tipInd].getComponent(cc.Sprite).spriteFrame = this.doubleAsset[double];
                    return;
                }
            }
        }

        if(data.name == 'doubleOver'){ // 加倍结束
            this.doubleOver = true;
            // wukong.scenePost('double', null, null, null, (res) => {
            //     // console.log(res);
            // });

            cc.find("Canvas/button/button_double").active = false;
            cc.find('Canvas/anim/anim_timer').active = true;
            cc.find('Canvas/logo').active = false;
            this.showfingle();
        }
    },

    // --------------------------- 点击最后一张牌 --------------------------- //

    showfingle: function(){
        cc.find("Canvas/button/button_clicklast").active = true;
        var fingle = cc.find("Canvas/button/button_clicklast_icon");
        fingle.active = true;
        var fingleAnim = cc.repeat(cc.sequence(cc.spawn(cc.moveBy(0.5, 0, 10), cc.scaleTo(0.5, 1, 1)), cc.spawn(cc.moveBy(0.5, 0, -10), cc.scaleTo(0.5, 1.15, 1.15))), 6);
        fingle.runAction(fingleAnim);
    },

    clickLastCard: function(){
        cc.find("Canvas/button/button_opencard").active = true;
        anim.selfLastACardAnim();
        this.clickLastOver = true;
    },

    // --------------------------- open --------------------------- //

    openPost: function(e){
        var scene = 'open', value = true;
        wukong.scenePost(scene, null, scene, value, (res) => {
            // console.log(res);
        });
    },

    openScene: function(data){ // 亮牌场景
        console.log(data);
        var scene = 'open', button = 'button_' + scene;

        if(data.name == 'start') {  // 亮牌开始

        }

        if(data.name == 'timer') {  // 1. 定时器显示
            var timer = cc.find('Canvas/anim/anim_timer');
            timer.children[0].getComponent(cc.Label).string = data.time;
            if(data.time == 0) timer.active = false;
            if(this.doubleOver && data.time == 0 && !this.clickLastOver){
                this.clickLastCard();
            }
        }

        if(data.name == 'openPost'){
            this.ifSelf('onOpenPost', data);
        }

        if(data.name == 'openOver') {  // 亮牌结束
            anim.openCardAnim(data, this.playerListSort, this.selfId, ()=>{
                wukong.scenePost(scene, 'openCard', null, null, (res) => {
                    // console.log(res);
                });
            });
        }

        if(data.name == 'openAnimOver') { // 亮牌动画结束

        }
    },

    // --------------------------- next --------------------------- //

    nextPost: function(e){
        var button = 'next', value = true;
        wukong.scenePost(scene, null, button, value, (res) => {
            // console.log(res);
        });
    },

    nextScene: function(data){

        console.log(data);

        var scene = 'next', button = 'button_' + scene;

        if(data.name == 'start') {  // 1.开启按钮 2.开启定时器
            cc.find(button).runAction(cc.show());
            cc.find('timer').runAction(cc.show());
        }

        if(data.name == 'timer') {  // 1. 定时器显示
            var timer = cc.find('Canvas/anim/anim_timer');
            timer.children[0].getComponent(cc.Label).string = data.time;
            if(data.time == 0) timer.active = false;
        }

        if(data.name == 'nextOver') {  // 1.关闭按钮
            console.log(`@@@@@@@@@@@@@@@ ${scene}Over @@@@@@@@@@@@@@@`);
            cc.find(button).runAction(cc.hide());

            // cc.find('anim').active = true; cc.find('anim').runAction(cc.show());
            // setTimeout(() => {
            //     wukong.scenePost(scene, 'anim', null, null, (res) => {
            //         cc.find('anim').active = false; cc.find('anim').runAction(cc.hide());
            //     });
            // }, 2000);
        }

        if(data.name == 'gameOver') {
            console.log(`@@@@@@@@@@@@@@@ gameOver @@@@@@@@@@@@@@@`);
            cc.find('Canvas/total/total_big').active = true;
            this.gameCheck(data);
        }
    },

    gameCheck: function(data){
        var gameCheck = cc.find('Canvas/total/total_big/items');
        for(i in this.gameCheckItemPool){
            var enemy = this.gameCheckItemPool.get();
            // console.log(enemy);
            gameCheck.addChild(enemy);
        }
    },

    playerBack: function(data){
        console.log(data);
        if(watcherBind) {
            wukong.watcher([
                {route: 'bankerScene', cb: this.bankerScene.bind(this)},
                {route: 'doubleScene', cb: this.doubleScene.bind(this)},
                {route: 'openScene', cb: this.openScene.bind(this)},
                {route: 'nextScene', cb: this.nextScene.bind(this)}
            ]);
            watcherBind = false;
        }
    },

    ///////////////////////////////////////////////////////////

    ifSelf: function(event, data){
        // console.log(data);
        if(this.selfId == data.userId){
            if(event == 'onSeatTake'){
                cc.find('music/seat').getComponent(cc.AudioSource).play();
                this.lastSeat = data.seat;
                cc.find('Canvas/button/button_gamestart').active = true;
                cc.find('Canvas/logo').active = false;
            }

            if(event == 'onReadyPost'){
                cc.find('music/ready').getComponent(cc.AudioSource).play();

                // 隐藏开始按钮
                cc.find('Canvas/button/button_gamestart').active = false;
                cc.find('Canvas/logo').active = true;
            }

            if(event == 'onBankerPost'){
                if(data.banker == 1){
                    cc.find('music/getbanker').getComponent(cc.AudioSource).play();
                }
                cc.find("Canvas/button/button_banker").active = false;
                // cc.find("Canvas/anim/anim_timer").active = false;
                cc.find("Canvas/anim/anim_timer").active = true;
                cc.find("Canvas/anim/anim_banker").active = true;
            }

            if(event == 'onDoublePost'){
                cc.find('music/double').getComponent(cc.AudioSource).play();
                cc.find("Canvas/button/button_double").active = false;
                // cc.find("Canvas/anim/anim_timer").active = false;
                cc.find("Canvas/anim/anim_timer").active = true;
            }

            if(event == 'onOpenPost'){
                cc.find("Canvas/button/button_opencard").active = false;
                // cc.find("Canvas/anim/anim_timer").active = false;
                cc.find("Canvas/anim/anim_timer").active = true;
            }
        }
    },

    creatPool: function(userCount){
        // 根据玩家数量生成牌的对象池
        this.aCardPool = new cc.NodePool();
        let cardCount = userCount*5;
        for(let i = 0; i < cardCount; i++) {
            let card = cc.instantiate(this.aCards);
            this.aCardPool.put(card);
        }

        // 根据玩家数量生成抢庄动画头像的对象池
        this.bankerAvatarPool = new cc.NodePool();
        for(let i = 0; i < userCount; i++) {
            let avatar = cc.instantiate(this.bankerAvatar);
            this.bankerAvatarPool.put(avatar);
        }

        this.gameCheckItemPool = new cc.NodePool();
        for(let i = 0; i < userCount; i++){
            let user_total = cc.instantiate(this.user_total);
            this.gameCheckItemPool.put(user_total);
        }
    },

    // 获取网络资源
    getNetAsset: function(avatar, spriteNode){
        spriteNode.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(avatar);
    },

    ///////////////////////////////////////////////////////////

    showConsole: function(){
        var consoleBox = cc.find('Canvas/console');
        if(this.consoleBoxVis){
            var show = cc.moveBy(0.1, cc.p(102, 0));
            consoleBox.runAction(show);
            this.consoleBoxVis = false;
        }else{
            var show = cc.moveBy(0.1, cc.p(-102, 0));
            consoleBox.runAction(show);
            this.consoleBoxVis = true;
        }
    }
});
