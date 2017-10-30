
module.exports = {

    host: '139.224.134.57',
    port: 3014,

    watcher: function(
        onAnimPost,
        onAnimOver,
        onAnimTimeout,
        onTimerStart,
        onSeatTake,
        onSeatLeave,
        onSeatBusy,
        onReadyPost,
        onReadyOver,
        onBankerPost,
        onBankerOver,
        onDoublePost,
        onDoubleOver,
        onOpenPost,
        onOpenOver,
        onNextPost,
        onNextOver,
        onRoomBusy,
        onGameOver
    ) {
        pomelo.on('onAnimPost', (data) => {
            onAnimPost(data)
        });
        pomelo.on('onAnimOver', (data) => {
            onAnimOver(data)
        });
        pomelo.on('onAnimTimeout', (data) => {
            onAnimTimeout(data)
        });
        pomelo.on('onTimerStart', (data) => {
            onTimerStart(data)
        });
        pomelo.on('onSeatTake', (data) => {
            onSeatTake(data)
        });
        pomelo.on('onSeatLeave', (data) => {
            onSeatLeave(data)
        });
        pomelo.on('onSeatBusy', (data) => {
            onSeatBusy(data)
        });
        pomelo.on('onReadyPost', (data) => {
            onReadyPost(data)
        });
        pomelo.on('onReadyOver', (data) => {
            onReadyOver(data)
        });
        pomelo.on('onBankerPost', (data) => {
            onBankerPost(data)
        });
        pomelo.on('onBankerOver', (data) => {
            onBankerOver(data)
        });
        pomelo.on('onDoublePost', (data) => {
            onDoublePost(data)
        });
        pomelo.on('onDoubleOver', (data) => {
            onDoubleOver(data)
        });
        pomelo.on('onOpenPost', (data) => {
            onOpenPost(data)
        });
        pomelo.on('onOpenOver', (data) => {
            onOpenOver(data)
        });
        pomelo.on('onNextPost', (data) => {
            onNextPost(data)
        });
        pomelo.on('onNextOver', (data) => {
            onNextOver(data)
        });
        pomelo.on('onRoomBusy', (data) => {
            onRoomBusy(data)
        });
        pomelo.on('onGameOver', (data) => {
            onGameOver(data)
        });
    },
    // --------------------------------------- init --------------------------------------- //

    getRoomId: function() {
        return '10010';
        // 从url获取
    },

    getUserInfo: function(cb) {
        var min = 10000, max = 99999;
        var random = (min + Math.floor((max + 1 - min) * Math.random())).toString();
        cb && cb({
            nickName: random,
            avatar: 'http://img2.imgtn.bdimg.com/it/u=367924068,513092699&fm=214&gp=0.jpg'
        });
    },

    enterRoom: function(userName, roomId, gameRound, cb) {
        pomelo.init({host: this.host, port: this.port, log: true}, () => {             // 连接gate服务器
            pomelo.request('gate.gateHandler.enter', {userName: userName}, (res) => {
                pomelo.init({host: res.host, port: res.port, log: true}, () => {       // 连接connector服务器
                    pomelo.request('connector.connectorHandler.enter', {userName: userName, roomId: roomId, gameRound: gameRound}, (res) => {
                        cb && cb(res);
                    });
                });
            });
        });
    },

    // --------------------------------------- post --------------------------------------- //

    postSeat: function(currentSeat, lastSeat, cb) {
        pomelo.request('connector.connectorHandler.postSeat', {currentSeat: currentSeat, lastSeat: lastSeat}, (res) => {
            cb && cb(res);
        });
    },

    postReady: function(cb) {
        pomelo.request('connector.connectorHandler.postReady', {}, (res) => {
            cb && cb(res);
        });
    },

    postBanker: function(banker, cb) {
        pomelo.request('connector.connectorHandler.postBanker', {banker: banker}, (res) => {
            cb && cb(res);
        });
    },

    postDouble: function(double, cb) {
        pomelo.request('connector.connectorHandler.postDouble', {double: double}, (res) => {
            cb && cb(res);
        });
    },

    postOpen: function(cb) {
        pomelo.request('connector.connectorHandler.postOpen', {}, (res) => {
            cb && cb(res);
        });
    },

    postNext: function(cb) {
        pomelo.request('connector.connectorHandler.postNext', {}, (res) => {
            cb && cb(res);
        });
    },

    postAnim: function(anim, cb) {
        pomelo.request('connector.connectorHandler.postAnim', {anim: anim}, (res) => {
            cb && cb(res);
        });
    },

// --------------------------------------- card --------------------------------------- //

    getCardAsset: function(path, cb) {
        cc.loader.loadResDir(path, cc.SpriteFrame, (err, cardAsset) => {
            cb && cb(cardAsset);
        });
    }
}
