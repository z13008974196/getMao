
var wukong = require('./pomelo-api.js');
var anim = require('./animJs.js');

var watcherBind = true;

cc.Class({
    extends: cc.Component,

    properties: {
        bankerAvatar: cc.Prefab,
        user_total: cc.Prefab,

        seatList: [], // 游戏开始前坐位列表
        // otherCardData: [],
        bankerPlayerIdList: [], // 抢庄的人的id列表
        cardAsset: [], // 卡牌资源
        doubleAsset: [], // 庄家、加倍标注资源
        typeAsset: [], // 牌型资源

        selfInfo: null,
        selfId: null,
        lastSeat: null,
        bankerId: null, // 庄家ID，抢庄结束之后获取
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
            this.enterRoom(data);
        });

        // 获取资源
        this.getAssets();

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

        if(data.name == 'start') {
        }

        if(data.name == 'seatPost') {
            this.ifSelf('onSeatTake', data);

            this.seatList[data.seat].children[0].scale = 1;
            this.seatList[data.seat].children[1].scale = 0;

            var name = data.userId.split('*')[0];
            this.seatList[data.seat].children[0].children[1].getComponent(cc.Label).string = name;
            // var spriteNode = this.seatList[data.seat].children[0].children[0];
            // this.getNetAsset(data.avatar, spriteNode);
        }

        if(data.name == 'seatLeave'){
            cc.find("Canvas/user/user_seat").children[data.seat].children[2].opacity = 0;
            this.seatList[data.seat].children[0].scale = 0;
            this.seatList[data.seat].children[1].scale = 1;
        }

        if(data.name == 'readyPost') {
            this.ifSelf('onReadyPost', data);
            cc.find("Canvas/user/user_seat").children[data.seat].children[2].opacity = 255;
        }

        if(data.name == 'readyOver') {
            // 都准备了，开始游戏
            if(watcherBind) { // 注册事件
                wukong.watcher([
                    {route: 'bankerScene', cb: this.bankerScene.bind(this)},
                    {route: 'doubleScene', cb: this.doubleScene.bind(this)},
                    {route: 'openScene', cb: this.openScene.bind(this)},
                    {route: 'nextScene', cb: this.nextScene.bind(this)}
                ]);
                watcherBind = false;
            }
            // console.log(cc.find("Canvas/anim/anim_card").children);
            if(!this.bankerAvatarPool){
                this.creatPool(Object.getOwnPropertyNames(data.sort).length);
            }

            // 取消准备状态 显示
            var user_seat = cc.find("Canvas/user/user_seat");
            for(let i in user_seat.children){
                user_seat.children[i].children[2].opacity = 0;
            }

            // 自己的牌对应资源
            anim.getMyCard(data.cardData);

            // 获取用户玩家，排列之后的
            this.playerListSort = data.sort;
            var animPlayerSeatList = []; // 动画用,用户游戏中位置列表

            // 显示游戏中用户，开始前用户
            cc.find("Canvas/user/user_seat").active = false;
            var user_infos = cc.find("Canvas/user/user_info");
            for(let i in data.sort){
                animPlayerSeatList.push(data.sort[i].seat);
                user_infos.children[data.sort[i].seat].active = true;
                var spriteNode = user_infos.children[data.sort[i].seat].children[0].children[0];
                this.getNetAsset(data.sort[i].avatar, spriteNode);
            }

            anim.createPlayerAnim(animPlayerSeatList); // 根据坐位创建发牌动画
            anim.gameStartAnim(()=>{
                wukong.scenePost(scene, 'sendCard', null, null, (res) => {
                    // console.log(res);
                });
            });
        }

        if(data.name == 'readyAnimOver') {
        }
    },

    // ------------------------------------------------------ banker ------------------------------------------------------ //

    bankerPost: function(e){
        var scene = 'banker', value = e.target.getComponent(cc.Button).clickEvents[0].customEventData;
        wukong.scenePost(scene, null, scene, value, (res) => {

        });
    },

    bankerScene: function(data){
        // 抢庄场景
        console.log(data);
        var scene = 'banker', button = 'button_' + scene;
        var anim_banker = cc.find("Canvas/anim/anim_banker");

        if(data.name == 'timer'){
            var timer = cc.find('Canvas/anim/anim_timer');
            timer.children[0].getComponent(cc.Label).string = data.time;
            if(data.time == 0) timer.active = false;
        }

        if(data.name == 'start'){
            cc.find("Canvas/button/button_banker").active = true;
            cc.find('Canvas/anim/anim_timer').active = true;
        }

        if(data.name == 'bankerPost'){
            this.ifSelf('onBankerPost', data);
            if(data.value == 1){ // 抢庄
                var avatar = this.bankerAvatarPool.get();
                // this.getNetAsset(this.playerListSort[data.userId].avatar, avatar.children[0]);
                anim_banker.addChild(avatar);
                this.bankerPlayerIdList.push(data.userId);
            }
        }

        if(data.name == 'bankerOver'){
            cc.find('Canvas/button/button_banker').active = false;
            cc.find('Canvas/anim/anim_timer').active = false;

            this.bankerId = data.bankerId;

            anim_banker.active = true;
            if(anim_banker.children.length == 0){ // 抢庄用户为0是默认操作
                for(let i in this.playerListSort){
                    var avatar = this.bankerAvatarPool.get();
                    // this.getNetAsset(this.playerListSort[i].avatar, avatar.children[0]);
                    anim_banker.addChild(avatar);
                    this.bankerPlayerIdList.push(i);
                }
                anim.getBankerSeat(data.bankerId, this.playerListSort, this.bankerPlayerIdList);
                this.bankerAnim();
                return;
            }

            // 获取抢庄动画要用的东西
            anim.getBankerSeat(data.bankerId, this.playerListSort, this.bankerPlayerIdList);
            this.bankerAnim();
        }

        if(data.name == 'bankerAnimOver'){
            // 抢庄牛标志的移动动画
            anim.removeBankerTip(this.playerListSort, this.bankerId);

            var anim_banker = cc.find("Canvas/anim/anim_banker");
            anim_banker.active = false;
            var anim_banker = cc.find("Canvas/anim/anim_banker");
            var destroyTime = anim_banker.children.length;
            for(let i = 0; i < destroyTime; i++){
                this.bankerAvatarPool.put(anim_banker.children[0]);
            }
            this.bankerPlayerIdList = [];
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

            });
        });
    },

    // ------------------------------------------------------ double ------------------------------------------------------ //

    doublePost: function(e){
        var scene = 'double', value = e.target.getComponent(cc.Button).clickEvents[0].customEventData;
        wukong.scenePost(scene, null, scene, value, (res) => {

        });
    },

    doubleScene: function(data){ // 加倍场景
        console.log(data);
        var scene = 'double', button = 'button_' + scene;

        if(data.name == 'timer'){
            var timer = cc.find('Canvas/anim/anim_timer');
            timer.children[0].getComponent(cc.Label).string = data.time;
            if(data.time == 0) timer.active = false;
        }

        if(data.name == 'start'){
            // 开始加倍
            var anim_banker = cc.find("Canvas/anim/anim_banker");
            anim_banker.active = false;
            cc.find("Canvas/button/button_banker").active = false;

            cc.find('Canvas/anim/anim_timer').active = true;
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
                    console.log(this.bankerId);
                    var tipInd = playerListSort[i].seat;
                    var double;
                    (data.value >= 5) ? double = 5 : double = data.value;
                    var tip_double = cc.find('Canvas/tip/tip_double');
                    tip_double.children[tipInd].active = true;
                    tip_double.children[tipInd].getComponent(cc.Sprite).spriteFrame = this.doubleAsset[double];
                    return;
                }
            }
        }

        if(data.name == 'doubleOver'){
            cc.find("Canvas/button/button_double").active = false;
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

        });
    },

    openScene: function(data){
        console.log(data);
        var scene = 'open', button = 'button_' + scene;

        if(data.name == 'timer') {
            var timer = cc.find('Canvas/anim/anim_timer');
            timer.children[0].getComponent(cc.Label).string = data.time;
            if(data.time == 0) timer.active = false;
            if(data.time == 0 && !this.clickLastOver){
                this.clickLastCard();
            }
        }

        if(data.name == 'start') {
            this.showfingle();
            cc.find('Canvas/anim/anim_timer').active = true;
        }

        if(data.name == 'openPost'){
            this.ifSelf('onOpenPost', data);
        }

        if(data.name == 'openOver') {
            anim.openCardAnim(data, this.playerListSort, this.selfId, ()=>{
                wukong.scenePost(scene, 'openCard', null, null, (res) => {
                    // console.log(res);
                });
            });
        }

        if(data.name == 'openAnimOver') {
            anim.showSmallTotal();
            var aCards = cc.find("Canvas/anim/anim_card");
            var destroyTime = aCards.children.length;
            for(let i = 0; i < destroyTime; i++){
                aCards.children[i].setPosition(cc.p(0, 0));
                aCards.children[i].active = false;
            }
        }
    },

    // --------------------------- next --------------------------- //

    nextPost: function(e){
        var scene = 'next', value = true;
        wukong.scenePost(scene, null, scene, value, (res) => {

        });
        cc.find('Canvas/mask').active = false;
        cc.find('Canvas/total/total_small').active = false;
    },

    nextScene: function(data){
        console.log(data);
        var scene = 'next';

        if(data.name == 'timer') {
            var timer = cc.find('Canvas/anim/anim_timer');
            timer.children[0].getComponent(cc.Label).string = data.time;
            if(data.time == 0) timer.active = false;
        }

        if(data.name == 'start') {
            cc.find('Canvas/anim/anim_timer').active = true;
        }

        if(data.name == 'nextOver') {
            // 下一局开始前的重置
            cc.find('Canvas/anim/anim_timer').active = false;
            cc.find("Canvas/button/button_clicklast_icon").active = false;
            cc.find("Canvas/button/button_clicklast").active = false;
            cc.find('Canvas/anim/anim_card').active = false;
            cc.find('Canvas/mask').active = false;
            cc.find('Canvas/total/total_small').active = false;
            cc.find("Canvas/tip/tip_cardtype").active = false;
            var tip_double_item = cc.find("Canvas/tip/tip_double").children;
            for(let i in tip_double_item){
                tip_double_item[i].active = false;
            }
            var uCard = cc.find('Canvas/gaming/card').children;
            for(let i in uCard){
                for(let j in uCard[i].children){
                    uCard[i].children[j].scale = cc.p(0,1);
                    uCard[i].children[j].setPositionY(0);
                }
            }
            var startAnim_node = cc.find("Canvas/anim/anim_start_img");
            startAnim_node.opacity = 255;
            startAnim_node.setPositionY(380);
        }

        if(data.name == 'gameOver') {
            console.log(`@@@@@@@@@@@@@@@ gameOver @@@@@@@@@@@@@@@`);
            this.gameCheck(data);
            cc.find('Canvas/total/total_small/next').active = false;
            setTimeout(function(){
                cc.find('Canvas/total/total_small').active = false;
                cc.find('Canvas/total/total_big').active = true;
            }, 2000)
        }
    },

    gameCheck: function(data){
        var gameCheck = cc.find('Canvas/total/total_big/items');
        for(i in data.gameResult){
            var enemy = this.gameCheckItemPool.get();
            enemy.children[1].getComponent(cc.Label).string = i.split('*')[0];

            enemy.children[2].children[0].getComponent(cc.Label).string = data.gameResult[i].win;
            enemy.children[2].children[1].getComponent(cc.Label).string = data.gameResult[i].lose;
            enemy.children[2].children[2].getComponent(cc.Label).string = data.gameResult[i].tie;

            enemy.children[3].getComponent(cc.Label).string = data.gameResult[i].amount;
            // console.log(enemy);
            gameCheck.addChild(enemy);
        }
    },

    playerBack: function(data){
        console.log(data);
        var selfData = data.playerMain;
        if(watcherBind) {
            wukong.watcher([
                {route: 'bankerScene', cb: this.bankerScene.bind(this)},
                {route: 'doubleScene', cb: this.doubleScene.bind(this)},
                {route: 'openScene', cb: this.openScene.bind(this)},
                {route: 'nextScene', cb: this.nextScene.bind(this)}
            ]);
            watcherBind = false;
        }

        // 基本显示
        if(!this.bankerAvatarPool){
            this.creatPool(Object.getOwnPropertyNames(selfData.sort).length);
        }
        cc.find("Canvas/logo").active = false;
        // 取消准备状态 显示
        var user_seat = cc.find("Canvas/user/user_seat");
        for(let i in user_seat.children){
            user_seat.children[i].children[2].opacity = 0;
        }
        // 自己的牌对应资源
        anim.getMyCard(selfData.cardData);
        // 获取用户玩家，排列之后的
        this.playerListSort = selfData.sort;
        var animPlayerSeatList = []; // 动画用,用户游戏中位置列表
        // 显示游戏中用户，开始前用户
        cc.find("Canvas/user/user_seat").active = false;
        var user_infos = cc.find("Canvas/user/user_info");
        for(let i in selfData.sort){
            animPlayerSeatList.push(selfData.sort[i].seat);
            user_infos.children[selfData.sort[i].seat].active = true;
            var spriteNode = user_infos.children[selfData.sort[i].seat].children[0].children[0];
            this.getNetAsset(selfData.sort[i].avatar, spriteNode);
        }

        cc.find('Canvas/anim/anim_timer').active = true;
        cc.find('Canvas/anim/anim_card').active = true;
        anim.backShowCard(animPlayerSeatList, selfData.sort);

        if(selfData.selectBanker){
            this.bankerId = data.userId;
        }else{
            for(i in data.palyerListBack){
                if(data.palyerListBack[i].bankerSelect){
                    this.bankerId = i;
                    console.log(i)
                }
            }
        }

        // 庄家环节
        if(data.scene == 'banker'){
            cc.find("Canvas/button/button_banker").active = true;

            if(!selfData.bankerSelect){ // 普通玩家
                for(i in data.palyerListBack){
                    if(data.palyerListBack[i].bankerSelect){
                        this.bankerId = i;
                        cc.find('Canvas/tip/tip_double').children[selfData.sort[i].seat].active = true;
                        cc.find('Canvas/tip/tip_double').children[selfData.sort[i].seat].getComponent(cc.Sprite).spriteFrame = this.doubleAsset[0];
                        cc.find("Canvas/button/button_banker").active = false;
                    }
                }
            }else{ // 庄家
                this.bankerId = this.selfId;
                cc.find('Canvas/tip/tip_double').children[0].active = true;
                cc.find('Canvas/tip/tip_double').children[0].getComponent(cc.Sprite).spriteFrame = this.doubleAsset[0];
                cc.find("Canvas/button/button_banker").active = false;
            }
        }
        // 加倍环节
        if(data.scene == 'double'){
            // 开始加倍
            var anim_banker = cc.find("Canvas/anim/anim_banker");
            anim_banker.active = false;
            if(!selfData.bankerSelect){ // 普通玩家
                cc.find("Canvas/button/button_double").active = true;
                for(i in data.palyerListBack){
                    if(data.palyerListBack[i].bankerSelect){
                        this.bankerId = i;
                        cc.find('Canvas/tip/tip_double').children[selfData.sort[i].seat].active = true;
                        cc.find('Canvas/tip/tip_double').children[selfData.sort[i].seat].getComponent(cc.Sprite).spriteFrame = this.doubleAsset[0];
                    }
                }
            }else{ // 庄家
                this.bankerId = this.selfId;
                cc.find('Canvas/tip/tip_double').children[0].active = true;
                cc.find('Canvas/tip/tip_double').children[0].getComponent(cc.Sprite).spriteFrame = this.doubleAsset[0];
            }
        }
        // 亮牌环节
        if(data.scene == 'open'){
            this.showfingle();
            cc.find('Canvas/anim/anim_timer').active = true;
            if(data.checkout != null){
                this.clickLastCard();
                anim.openCardAnim(data, this.playerListSort, this.selfId, ()=>{
                    wukong.scenePost('open', 'openCard', null, null, (res) => {
                        // console.log(res);
                    });
                });
            }
        }
        // 下一局环节
        if(data.scene == 'next'){
            cc.find('Canvas/anim/anim_timer').active = true;
            this.clickLastCard();
            anim.openCardAnim(data, this.playerListSort, this.selfId, ()=>{

            });
            anim.showSmallTotal();
            // this.nextScene({name: 'nextOver'})
        }
    },


    ///////////////////////////////////////////////////////////


    ifSelf: function(event, data){
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
            }

            if(event == 'onBankerPost'){
                if(data.value == 1){
                    cc.find("Canvas/anim/anim_timer").active = false;
                    cc.find('music/getbanker').getComponent(cc.AudioSource).play();
                }
                cc.find("Canvas/button/button_banker").active = false;
                cc.find("Canvas/anim/anim_banker").active = true;
            }

            if(event == 'onDoublePost'){
                cc.find('music/double').getComponent(cc.AudioSource).play();
                cc.find("Canvas/button/button_double").active = false;
                cc.find("Canvas/anim/anim_timer").active = true;
            }

            if(event == 'onOpenPost'){
                cc.find("Canvas/button/button_opencard").active = false;
                cc.find("Canvas/anim/anim_timer").active = true;
            }
        }
    },


    ///////////////////////////////////////////////////////////


    creatPool: function(userCount){
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

    getAssets: function(){
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
