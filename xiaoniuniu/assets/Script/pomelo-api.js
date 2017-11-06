
module.exports = {

    host: '139.224.134.57',
    port: 3014,

    // watcher: function(readyWatcher, bankerWatcher, doubleWatcher, openWatcher, nextWatcher) {
    //     pomelo.on('readyScene', (data) => {readyWatcher(data)});
    //     pomelo.on('bankerScene', (data) => {bankerWatcher(data)});
    //     pomelo.on('doubleScene', (data) => {doubleWatcher(data)});
    //     pomelo.on('openScene', (data) => {openWatcher(data)});
    //     pomelo.on('nextScene', (data) => {nextWatcher(data)});
    // },

    watcher: function(watchArr) {      // [{route: 'readyScene', cb: cb}, {route: 'bankerScene', cb: cb}]
        watchArr.forEach((item) => {
            pomelo.on(item.route, (data) => {
                item.cb(data);
            });
        });
    },

    getRoomId: function() {  // 从url获取
        return '100015';
    },

    getUserInfo: function(cb) {
        var min = 10000, max = 99999;
        var random = (min + Math.floor((max + 1 - min) * Math.random())).toString();
        cb && cb({
            nickName: random,
            avatar: 'http://img2.imgtn.bdimg.com/it/u=367924068,513092699&fm=214&gp=0.jpg'
        });
    },

    enterRoom: function(data, cb) {
        var userName = data.userName, roomId = data.roomId, gameRound = data.gameRound;
        console.log(data);
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



    scenePost: function(scene, anim, button, value, cb) {   //////////////////////////////////////////////////////////////////////////////////////////////////////
        pomelo.request('connector.connectorHandler.scene', {
            scene: scene,
            anim: anim,
            button: button,
            value: value
        }, (res) => {cb && cb(res);});
    },

    getCardAsset: function(path, cb) {
        cc.loader.loadResDir(path, cc.SpriteFrame, (err, cardAsset) => {
            cb && cb(cardAsset);
        });
    },

    getQuery: function(parameter) {
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == parameter){return pair[1];}
       }
       return(false);
    }
}
