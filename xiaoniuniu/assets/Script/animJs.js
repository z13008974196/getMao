module.exports = {

    myCard: [], // 我的牌组
    myUCard: [], // 我的牌组位置
    cardAsset: [],
    tipDoubleAsset: [],
    tipTypeAsset: [],
    playerGroup: [],
    animGroup: [],
    playerListSort: [],
    typeList: [
        {name: '没牛'},
        {name: '牛一'},
        {name: '牛二'},
        {name: '牛三'},
        {name: '牛四'},
        {name: '牛五'},
        {name: '牛六'},
        {name: '牛七'},
        {name: '牛八'},
        {name: '牛九'},
        {name: '牛牛'},
        {name: '五花'},
        {name: '五小'}
    ],
    sendACardI: 0, // 发牌循环用
    animBankerTipI: 0,
    bankerListInd: null,
    bankerSeat: null,
    gameResult: null,
    //////////////////// 获取资源 ////////////////////
    getCardAsset: function(cardAsset){
        this.cardAsset = cardAsset;
    },

    getTipDoubleAsset: function(asset){
        this.tipDoubleAsset = asset;
    },

    getTipTypeAsset: function(asset){
        this.tipTypeAsset = asset;
    },
    //////////////////// 获取资源 ////////////////////

    getMyCard: function(myCard){
        this.myCard = myCard;
        // console.log(myCard);
        this.myUCard = cc.find('Canvas/gaming/card/play_a').children;
        for(let i = 0; i < 5; i++){
            // 把对应的图片资源添加到自己的牌去
            this.myUCard[i].getComponent(cc.Sprite).spriteFrame = this.cardAsset[myCard.cardRaw[i]];
        }
    },

    ////////////////////// 开始动画 //////////////////////

    gameStartAnim: function(cb){
        console.log('开始动画');
        cc.find('music/seat').getComponent(cc.AudioSource).play();

        var startAnim_node = cc.find("Canvas/anim/anim_start_img");
        startAnim_node.active = true;
        var startAnim_down = cc.moveTo(0.1, cc.p(0,-141));
        var startAnim_huang = cc.sequence(cc.rotateTo(0.05, -20),cc.rotateTo(0.05, 15),cc.rotateTo(0.05, -10),cc.rotateTo(0.05, 5),cc.rotateTo(0.05, 0));
        var startAnim_fade = cc.fadeOut(0.25);

        var startAnim_cb = cc.callFunc(function(){
            cc.find('Canvas/anim/anim_card').active = true;
            this.sendACard(null, cb);
        }, this)
        var startAnim = cc.sequence(startAnim_down, startAnim_huang, cc.delayTime(0.5), startAnim_fade, startAnim_cb);
        startAnim_node.runAction(startAnim);
    },

    ////////////////////// 发牌动画 //////////////////////
    // 创建节点和动画
    createPlayerAnim: function (animPlayerSeatList){
        this.sendACardI = 0;
        this.playerGroup = [];
        this.animGroup = [];
        animPlayerSeatList.sort(); // 按顺序
        var cardindex = animPlayerSeatList.length * 5;
        var animCards = cc.find('Canvas/anim/anim_card');
        var cardGroup = cc.find('Canvas/gaming/card').children;
        for(let i = 0; i < animPlayerSeatList.length * 5; i++){
            var enemy = animCards.children[i];
            enemy.zIndex = cardindex--;
            if(i < 5){
                enemy.height = 130;
                enemy.width = 100;
            }
            animCards.children[i].active = true;
            this.playerGroup.push(enemy);
        }
        for(let i = 0; i < animPlayerSeatList.length; i++){
            var groupX = cardGroup[animPlayerSeatList[i]].position.x;
            var groupY = cardGroup[animPlayerSeatList[i]].position.y;
            for (let ind = 0; ind < 5; ind++) {
                var itemX = cardGroup[animPlayerSeatList[i]].children[ind].position.x;
                var goX = groupX + itemX;
                if(i == 0){
                    var bezier = [cc.p(0, 0), cc.p(groupX-50, -groupY), cc.p(goX, groupY)];
                    var anim = cc.bezierBy(0.08, bezier);
                }else{
                    var bezier = [cc.p(0, 0), cc.p(groupX-500, -groupY+500), cc.p(goX, groupY)];
                    var anim = cc.bezierBy(0.08, bezier);
                }
                this.animGroup.push(anim);
            }
        }
    },

    //发牌动画(重复)
    sendACard: function(target, cb){
        var i = this.sendACardI;
        this.sendACardI += 1;
        if(i == this.playerGroup.length){
            this.selfUCardShow(cb);
            return;
        }
        var player = this.playerGroup[i];
        var amin = this.animGroup[i];
        var finished = cc.callFunc(this.sendACard, this, cb);
        var aminSequence = cc.sequence(amin, finished);
        player.runAction(aminSequence);
    },

    selfUCardShow: function(cb){
        // 发牌动画完毕，开始翻转玩家的牌
        for(let i = 0; i < 4; i++){
            var finished = cc.callFunc(function(target, i){
                if(i == 3){
                    this.myUCard[i].runAction(cc.scaleTo(0.25, 1, 1));
                    cb && cb();
                    return;
                }else{
                    this.myUCard[i].runAction(cc.scaleTo(0.25, 1, 1));
                }
            }, this, i);

            var aminSequence = cc.sequence(cc.scaleTo(0.25, 0, 1), finished);
            this.playerGroup[i].runAction(aminSequence);
        }
    },


    backShowCard: function(animPlayerSeatList, playerListSort){
        this.playerListSort = playerListSort;
        var positionList = [];
        animPlayerSeatList.sort(); // 按顺序
        var cardindex = animPlayerSeatList.length * 5;
        var animCards = cc.find('Canvas/anim/anim_card');
        var cardGroup = cc.find('Canvas/gaming/card').children;
        for(let i = 0; i < animPlayerSeatList.length; i++){
            var groupX = cardGroup[animPlayerSeatList[i]].position.x;
            var groupY = cardGroup[animPlayerSeatList[i]].position.y;
            for (let ind = 0; ind < 5; ind++) {
                var itemX = cardGroup[animPlayerSeatList[i]].children[ind].position.x;
                var goX = groupX + itemX;
                positionList.push(cc.p(goX, groupY));
            }
        }
        for(let i = 0; i < animPlayerSeatList.length * 5; i++){
            var enemy = animCards.children[i];
            enemy.zIndex = cardindex--;
            if(i < 5){
                enemy.height = 130;
                enemy.width = 100;
            }
            if(i >= 4){
                animCards.children[i].active = true;
                enemy.setPosition(positionList[i]);
            }else{
                cardGroup[0].children[i].scale = 1;
            }
            this.playerGroup.push(enemy);
        }
    },

    ////////////////////// 抢庄动画 //////////////////////

    getBankerSeat: function(banker, playerListSort, bankerPlayerIDList){
        this.bankerId = banker;
        this.playerListSort = playerListSort;

        // 庄家在庄家池中的位置
        for(let i in bankerPlayerIDList){
            if(bankerPlayerIDList[i] == banker){
                this.bankerListInd = i;
            }
        }
        // 庄家游戏中位置
        for(let i in playerListSort){
            if(i == banker){
                this.bankerSeat = playerListSort[i].seat;
                // console.log(playerListSort[i].seat);
            }
        }
    },

    animBankerTip: function(bankerAvatarPool, tip, anim_banker_list, startX, endX, cb){
        var self = this;
        console.log('抢庄开始');
        if(anim_banker_list.length == 1){
            // 添加庄家标识
            cc.find('Canvas/tip/tip_double').children[self.bankerSeat].getComponent(cc.Sprite).spriteFrame = self.tipDoubleAsset[0];
            cb && cb();
            return
        }

        // 抢庄动画
        this.tip = tip;
        this.startX = startX;
        this.endX = endX;
        this.bankerI = 1;
        this.animSelectBanker(null, cb);
    },

    animSelectBanker: function(target, cb){
        var tip = this.tip;
        var startX = this.startX;
        var endX = this.endX;
        var i = this.bankerI;
        var tip_double = cc.find("Canvas/tip/tip_double")
        var self = this;
        tip.setPosition(cc.p(startX, 90));
        if(i == 3){
            var anim_banker_list = cc.find("Canvas/anim/anim_banker").children;
            var bankerX = startX + this.bankerListInd * 96 + 40;
            var banker_anim_finish = cc.callFunc(function(){
                console.log('抢庄动画停止');
                setTimeout(function(){
                    // 添加庄家标识
                    tip_double.children[self.bankerSeat].getComponent(cc.Sprite).spriteFrame = self.tipDoubleAsset[0];
                    cb && cb();
                }, 200)
                return;
            }, this);
            var tip_anim = cc.moveTo(0.3, cc.p(bankerX, 90));
            var aminSequence = cc.sequence(tip_anim, banker_anim_finish);
            tip.runAction(aminSequence);
            return
        }

        var tip_anim = cc.moveTo(0.1+i*0.15, cc.p(endX, 90));
        var tip_anim_finish = cc.callFunc(function(){
            this.bankerI += 1;
            this.animSelectBanker(target, cb);
        }, this);
        var aminSequence = cc.sequence(tip_anim, tip_anim_finish);
        tip.runAction(aminSequence);
    },


    removeBankerTip: function(playerListSort, bankerId){
        var playerTip = cc.find('Canvas/tip/tip_double').children[playerListSort[bankerId].seat];
        var position = playerTip.position;
        var tip = cc.find("Canvas/anim/anim_banker_tip");
        var bezier = [tip.position, cc.p(680, 380), position];
        var tipToGameSeatAnim = cc.bezierTo(0.5, bezier);
        var tipToGameSeatAnimFinish = cc.callFunc(function(){
            tip.active = false;
            playerTip.active = true;
        }, this)
        tip.runAction(cc.sequence(tipToGameSeatAnim, tipToGameSeatAnimFinish));
    },
    ////////////////////// 翻转自己最后一张牌 //////////////////////

    selfLastACardAnim: function(){
        var finished = cc.callFunc(function(){
            var finished = cc.callFunc(this.slefNiuCardShow, this);
            var aminSequence = cc.sequence(cc.scaleTo(0.25, 1, 1), finished);
            this.myUCard[4].runAction(aminSequence); // 应用牌出现
        }, this);
        var aminSequence = cc.sequence(cc.scaleTo(0.25, 0, 1), finished);
        this.playerGroup[4].runAction(aminSequence);
    },

    slefNiuCardShow: function(){
        cc.find("Canvas/button/button_clicklast").active = false;
        cc.find("Canvas/button/button_clicklast_icon").active = false;
        var myCard = this.myCard;
        if(myCard.type != 0){ // 有牛
            for(let i  in myCard.animation){
                if(myCard.animation[i] == 0 || myCard.animation[i] == 1 || myCard.animation[i] == 2){
                    this.myUCard[i].runAction(cc.moveBy(0.25, 0, 20));
                }
            }
        }
    },

    ////////////////////// 亮牌动画 //////////////////////

    openCardAnim: function(data, playerListSort, selfId ,cb){
        this.allCardOver = data.checkout;

        this.makeSmallTotal(data.checkout);

        var otherPlay = cc.find('Canvas/gaming/card').children;
        var checkout = data.checkout;
        var count = 0;

        for(let i in checkout){
            if(i != selfId){ // 不是自己
                var seat = playerListSort[i].seat;
                var cardData = checkout[i].cardData;
                for(let i = 0; i < 5; i++){
                    // 把对应的图片资源添加到他人的牌去
                    otherPlay[seat].children[i].getComponent(cc.Sprite).spriteFrame = this.cardAsset[cardData[i]];
                }

                this.otherUCardShow(otherPlay[seat].children, ++count, cb);
            }
        }
    },

    otherUCardShow: function(otherCards, count ,cb){
        for(let i = 0; i < 5; i++){
            var finished = cc.callFunc(function(target, i){
                if(i == 4){
                    otherCards[i].runAction(cc.scaleTo(0.25, 1, 1));
                    this.typeShow(otherCards);
                    cb && cb();
                }else{
                    otherCards[i].runAction(cc.scaleTo(0.25, 1, 1));
                }
            }, this, i);
            var aminSequence = cc.sequence(cc.scaleTo(0.25, 0, 1), finished);
            this.playerGroup[count*5+i].runAction(aminSequence);
        }
    },

    typeShow: function(otherCards){
        // 牌型资源对应
        var allCardOver = this.allCardOver;
        var playerListSort = this.playerListSort;
        var types = cc.find("Canvas/tip/tip_cardtype");
        types.active = true;
        for(let i in allCardOver){
            var typeind = allCardOver[i].type;
            if(playerListSort[i].seat == this.bankerSeat){
                typeind = typeind*2;
            }else{
                typeind = typeind*2+1;
            }
            types.children[playerListSort[i].seat].getComponent(cc.Sprite).spriteFrame = this.tipTypeAsset[typeind];
        }
    },

    ////////////////////// 结算动画 //////////////////////

    showSmallTotal: function(){
        if(this.gameResult){
            cc.find('music/win').getComponent(cc.AudioSource).play();
        }else{
            cc.find('music/lose').getComponent(cc.AudioSource).play();
        }
        cc.find('Canvas/mask').active = true;
        var total_small = cc.find('Canvas/total/total_small');
        total_small.active = true;
        var total_small_show = cc.sequence(cc.scaleTo(0.1, 1.1, 1.1),cc.scaleTo(0.1, 0.9, 0.9),cc.scaleTo(0.1, 1, 1));
        total_small.runAction(total_small_show);
        cc.find("Canvas/button/button_opencard").active = false;
    },

    makeSmallTotal: function(allCardOver){
        console.log(allCardOver);
        //把结果的数据放到小结算的view上
        var smallTotal = cc.find('Canvas/total/total_small/items');
        var userInfo = cc.find('Canvas/user/user_info');
        var typeList = this.typeList;
        var ind = 0;
        for(let i in allCardOver){
            console.log(i);
            console.log(allCardOver[i]);
            smallTotal.children[ind].active = true;
            var avatar = smallTotal.children[ind].children[0].children[0].children[0];
            var name = smallTotal.children[ind].children[1];
            var card = smallTotal.children[ind].children[2];
            var type = smallTotal.children[ind].children[3];
            var value = smallTotal.children[ind].children[4];

            // info
            avatar.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(this.playerListSort[i].avatar);
            name.getComponent(cc.Label).string = allCardOver[i].userId.split('*')[0];
            type.getComponent(cc.Label).string = typeList[allCardOver[i].type].name;
            value.getComponent(cc.Label).string = allCardOver[i].amount;
            for(let j = 0; j < 5; j++){
                card.children[j].getComponent(cc.Sprite).spriteFrame = this.cardAsset[allCardOver[i].cardData[j]];
            }

            // 颜色
            if(allCardOver[i].amount < 0){
                this.gameResult = false;
                name.color = new cc.Color(205, 66, 67);
                type.color  = new cc.Color(205, 66, 67);
                value.color = new cc.Color(205, 66, 67);
            }else{
                this.gameResult = true;
                name.color = new cc.Color(67, 144, 67);
                type.color  = new cc.Color(67, 144, 67);
                value.color = new cc.Color(67, 144, 67);
            }

            // 对应游戏坐位分数
            var userInfoValue = userInfo.children[this.playerListSort[i].seat].children[2].children[1].getComponent(cc.Label).string;
            userInfoValue = parseInt(userInfoValue) + allCardOver[i].amount
            userInfo.children[this.playerListSort[i].seat].children[2].children[1].getComponent(cc.Label).string = userInfoValue;

            ind++;
        }
    }

}
