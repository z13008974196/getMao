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


    ////////////////////// 发牌动画 //////////////////////
    // 创建节点和动画
    createPlayerAnim: function (animPlayerSeatList, aCardPool){
        animPlayerSeatList.sort(); // 按顺序
        var cardindex = animPlayerSeatList.length * 5;
        var animCards = cc.find('Canvas/anim/anim_card');
        var cardGroup = cc.find('Canvas/gaming/card').children;
        for(let i = 0; i < animPlayerSeatList.length; i++){
            var poX = cardGroup[animPlayerSeatList[i]].position.x;
            var poY = cardGroup[animPlayerSeatList[i]].position.y;
            for (let ind = 1; ind <= 5; ind++) {
                var enemy = aCardPool.get();
                enemy.setPosition(cc.p(-51,0));
                if(i == 0){
                    enemy.height = 130;
                    enemy.width = 100;
                    var bezier = [cc.p(0, 0), cc.p(poX-50, -poY), cc.p(poX + ind*100 - 249, poY)];
                    // var bezierForward = cc.bezierBy(0.05, bezier);
                    var anim = cc.bezierBy(0.08, bezier);
                }else{
                    enemy.height = 104;
                    enemy.width = 80;
                    var bezier = [cc.p(0, 0), cc.p(poX-500, -poY+500), cc.p(poX + ind*44 - 80, poY)];
                    var anim = cc.bezierBy(0.08, bezier);
                }

                animCards.addChild(enemy, cardindex--);

                this.playerGroup.push(enemy);
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
                    // var finished = cc.callFunc(this.showBankerStep, this)
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
            if(playerListSort[i].uid == banker){
                this.bankerSeat = playerListSort[i].seat;
                // console.log(playerListSort[i].seat);
            }
        }
    },

    animBankerTip: function(tip, anim_banker_list, startX, endX, cb){
        var self = this;
        console.log('抢庄开始');
        // if(anim_banker_list.length == 0){
        //
        // }
        if(anim_banker_list.length == 1){
            cc.find('Canvas/anim/anim_banker_tip').active = false;
            if(anim_banker_list.length == 1)anim_banker_list[0].runAction(cc.removeSelf());
            // 添加庄家标识
            cc.find('Canvas/tip/tip_double').children[self.bankerSeat].getComponent(cc.Sprite).spriteFrame = self.tipDoubleAsset[0];
            cb && cb();
            return;
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

        var tip_anim = cc.moveTo(0.2+i*0.15, cc.p(endX, 90));
        var tip_anim_finish = cc.callFunc(function(){
            this.bankerI += 1;
            this.animSelectBanker(target, cb);
        }, this);
        var aminSequence = cc.sequence(tip_anim, tip_anim_finish);
        tip.runAction(aminSequence);
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
        if(myCard.type !=0){ // 有牛
            for(let i  in myCard.animation){
                if(myCard.animation[i] == 0 || myCard.animation[i] == 1 || myCard.animation[i] == 2){
                    this.myUCard[i].runAction(cc.moveBy(0.25, 0, 20));
                }
            }
        }
    },

    ////////////////////// 亮牌动画 //////////////////////

    openCardAnim: function(data, playerListSort, selfName ,cb){
        this.allCardOver = data.checkout;

        this.makeSmallTotal(data.checkout);

        var otherPlay = cc.find('Canvas/gaming/card').children;
        var checkout = data.checkout;
        var count = 0;

        for(let i in checkout){
            if(i.split('*')[0] != selfName){ // 不是自己
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

        var self = this;
        setTimeout(function(){
            self.showSmallTotal();
        }, 500)
    },

    ////////////////////// 结算动画 //////////////////////

    showSmallTotal: function(){
        if(this.gameResult){
            cc.find('Canvas/music/win').getComponent(cc.AudioSource).play();
        }else{
            cc.find('Canvas/music/lose').getComponent(cc.AudioSource).play();
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
            var avatar = smallTotal.children[ind].children[0];
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
            userInfo.children[this.playerListSort[i].seat].children[2].children[1].getComponent(cc.Label).string = allCardOver[i].amount;

            ind++;
        }
    }

}
