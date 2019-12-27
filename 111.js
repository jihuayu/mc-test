var net = require('net');
const zlib = require('zlib');
var mc = require('minecraft-protocol');
var PacketReader= require ('./packet').PacketReader
var autoVersionForge = require('minecraft-protocol-forge').autoVersionForge;
var mc_c ;
let pos;
var cl
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
        cl = client;  
        client.pipe(c);
        client.on('error', (err) => {
            console.error(`[${getDateStr()}] [${key}] [ERROR] - ${err}`);
            c.destroy();
        });
        c.on('error', (err) => {
            console.error(`[${getDateStr()}] [${key}] [ERROR] -  ${err}`);
            client.destroy();
        });
        let ct = mc.createClient({username:'111',stream:client,version:'1.7.10'});
        autoVersionForge(ct)
        ct.state = 'play'
        ct.on('position', function(packet) {
            
            // console.log(packet);
            // Listen for chat messages and echo them back.
            // var p = new PacketReader(packet.chunkData)
        })
        let m;
        let flag = false;
        ct.on('map_chunk_bulk',function(p) {
            // console.log(p.meta);
            if(flag)return;
            flag = true;
            zlib.unzip(p.compressedChunkData, (err, buffer) => {
                if (!err) {
                    for(let i1 =0 ;i1<p.chunkColumnCount;i1++){
                        let im =0;
                        let m1 = p.meta[i1] 
                        let xb = m1.x*16;
                        let zb = m1.z*16;
                        let yb = []
                        for(let i = 0;i<16;i++){
                            if(m1.bitMap>>i&1){
                                yb.push(i*16);
                                im++;
                            }
                        }
                        let r = new PacketReader(buffer);
                        let m = {}
                        console.log("aa"+m1.addBitMap)
                        for(let ybb = 0;ybb<im;ybb++){
                            for(let y = 0;y<16;y++){
                                for(let z=0;z<16;z++){
                                    for(let x =0 ;x<16;x++){
                                        let y1 = r.readUInt8();
                                        // r.readBool();
                                        // let str = ""+(y>>4)+" "+(y&15)
                                        if(y1!=0&&y1!=1){
                                            console.log(""+(x+xb)+","+(y+yb[ybb]+1)+","+(z+zb)+" "+y1)
                                        }
                                    }
                                }
                            }
                        }
                        
                        for(let i = 0;i<256*16*im;i++){
                          
                        }
                        // for(let i = 0;i<256;i++){z
                        //     let y = r.readInt8();
                        //     r.readBool();
                        //     let str = ""+(y>>4)+" "+(y&15)
                        //     if(!m[y])m[str]=0;
                        //     m[str]++;
                        // }
                        console.log(m1.bitMap)
                        // console.log(m)
                        let n={};
                        for(let i = 0;i<256*8*im;i++){
                            let y = r.readUInt8();
                            // r.readBool();
                            let str = y>>4;
                            if(!n[str])n[str]=0;
                            n[str]++;
                            str = y&15;
                            if(!n[str])n[str]=0;
                            n[str]++; 
                        }
                        // console.log(n)
                        if(p.skyLightSent){
                            for(let i = 0;i<256*8*im;i++){
                                let y = r.readUInt8();
                            }
                        }
                    }
                }
            })

            // let r = new PacketReader(p.compressedChunkData);
            // console.log(p.compressedChunkData.length)
        })

        ct.on('map_chunk',function(e){
            let im =0;
            for(let i = 0;i<16;i++){
                if(e.bitMap>>i&1){
                    im++;
                }
            }
            zlib.unzip(e.compressedChunkData, (err, buffer) => {
                if (!err) {
                    let m ={}
                    let r = new PacketReader(buffer);
                    if(buffer.length==256)return;
                    console.log(buffer.length)
                    for(let i = 0;i<256*16*im;i++){
                        let y = r.readUInt8();
                        // r.readBool();
                        // let str = ""+(y>>4)+" "+(y&15)
                        if(!m[y])m[y]=0;
                        m[y]++;
                    }
                    // for(let i = 0;i<256;i++){z
                    //     let y = r.readInt8();
                    //     r.readBool();
                    //     let str = ""+(y>>4)+" "+(y&15)
                    //     if(!m[y])m[str]=0;
                    //     m[str]++;
                    // }
                    // console.log(e.bitMap)
                    // console.log(m)
                    let n={};
                    for(let i = 0;i<256*8*im;i++){
                        let y = r.readUInt8();
                        // r.readBool();
                        let str = y>>4;
                        if(!n[str])n[str]=0;
                        n[str]++;
                        str = y&15;
                        if(!n[str])n[str]=0;
                        n[str]++; 
                    }
                    // console.log(n)

                } else {
                    // handle error
                }
            });
        })
        ct.on('error',(e)=>{
            // console.log(e)
        })
        mc_c = ct;
    });
    tcpServer.listen({ host: bind[0], port: bind[1], }, () => {
        console.info(`[${getDateStr()}] [${key}] [INFO] - TCP Server start ${bind[0]}:${bind[1]}`);
    });
    return tcpServer;
}

const proxyConfig = {
    "mc 1.12.2": {
        mode: "tcp",
        bind: ["127.0.0.1", 25567],
        server: ['127.0.0.1', 20000]
    }
};

const servers = {};

for (let k in proxyConfig) {
    let conf = proxyConfig[k];
    if (conf.mode == "tcp") {
        servers[k] = proxyTCP(k, conf);
    }
}
// var a = "";
// var readline = require('readline');
// var rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });
// rl.on('line', function(line){
//     switch(line.trim()) {
//         case 'w':
//             mc_c.write('position',{
//                 x:pos.x-10,
//                 stance:pos.y
//                 ,y:pos.y+1,
//                 z:pos.z,
//                 onGround:true
//             })
//             pos.x-=10;
//             break;
//         case 'h':
            
//             break;
//         case 'close':
//             rl.close();
//             break;
//         default:
//             console.log('没有找到命令！');
//             break;
//     }
// });