cc.Class({
    extends: cc.Component,

    properties: {

    },

    // use this for initialization
    onLoad: function () {
        // 设置节点初始状态
        cc.find("Canvas/mask").active = false; // 遮罩
        cc.find("Canvas/anim/anim_timer").active = false; // 倒计时
        cc.find("Canvas/button/button_gamestart").active = false; // 开始按钮

        var user_info_item = cc.find("Canvas/user/user_info").children;
        for(let i in user_info_item){
            user_info_item[i].active = false;
        } // 游戏中用户信息区

        cc.find('Canvas/anim/anim_card').active = false; // 动画牌

        cc.find("Canvas/anim/anim_start_img").active = false; // 开始动画节点
        cc.find("Canvas/anim/anim_banker").active = false; // 抢庄动画节点
        cc.find("Canvas/anim/anim_banker_tip").active = false; // 抢庄标志
        cc.find("Canvas/button/button_banker").active = false; // 用户抢庄按钮

        cc.find("Canvas/button/button_double").active = false; // 用户加倍按钮
        // cc.find("Canvas/tip/tip_double").active = false; // 游戏中用户加倍标志

        cc.find("Canvas/button/button_clicklast").active = false; // 用户点击最后一张牌按钮
        cc.find("Canvas/button/button_clicklast_icon").active = false; // 用户点击最后一张牌按钮图标

        cc.find("Canvas/button/button_opencard").active = false; // 用户亮牌按钮
        cc.find("Canvas/tip/tip_cardtype").active = false; // 游戏中用户牌型

        var uCard = cc.find('Canvas/gaming/card').children;
        for(let i in uCard){
            for(let j in uCard[i].children){
                uCard[i].children[j].scale = cc.p(0,1);
            }
        }

        var sTotalItem = cc.find('Canvas/total/total_small/items').children;
        for(let i in sTotalItem){
            sTotalItem[i].active = false;
        }

        cc.find("Canvas/total/total_small").active = false; // 小结算
        cc.find("Canvas/total/total_big").active = false; // 大结算
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
