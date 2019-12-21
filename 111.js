var net = require('net');
var mc = require('minecraft-protocol');
var autoVersionForge = require('minecraft-protocol-forge').autoVersionForge;
//获取本地时间字符串
function getDateStr() {
    return (new Date()).toLocaleString();
}
// 创建TCP代理
function proxyTCP(key, conf) {
    let [bind, server] = [conf.bind, conf.server];
    let tcpServer = net.createServer((c) => {
        console.info(`[${getDateStr()}] [${key}] [INFO] - TCP Client connect ${c.remoteAddress}:${c.remotePort}`);
        let client = net.connect({ port: server[1], host: server[0] }, () => {
            c.pipe(client);
        });
        client.pipe(c);
        client.on('error', (err) => {
            console.error(`[${getDateStr()}] [${key}] [ERROR] - ${err}`);
            c.destroy();
        });
        c.on('error', (err) => {
            console.error(`[${getDateStr()}] [${key}] [ERROR] -  ${err}`);
            client.destroy();
        });
        let ct = mc.createClient({username:'111',stream:client,version:'1.12.2'});
        autoVersionForge(ct)
        ct.on('raw', function(packet) {
            // Listen for chat messages and echo them back.
            console.log(packet)
        })

    });
    tcpServer.listen({ host: bind[0], port: bind[1], }, () => {
        console.info(`[${getDateStr()}] [${key}] [INFO] - TCP Server start ${bind[0]}:${bind[1]}`);
    });
    return tcpServer;
}

const proxyConfig = {
    "mc 1.12.2": {
        mode: "tcp",
        bind: ["0.0.0.0", 25565],
        server: ['103.85.86.104', 39702]
    }
};

const servers = {};

for (let k in proxyConfig) {
    let conf = proxyConfig[k];
    if (conf.mode == "tcp") {
        servers[k] = proxyTCP(k, conf);
    }
}
