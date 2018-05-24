import Router from 'koa-router'
import api from '../app/api'
import fs from 'fs'
import moment from 'moment'

const PassThrough = require('stream').PassThrough;
const Readable = require('stream').Readable;
const router = new Router();
const log_path = __dirname + '/../log/'

function RR(){
    Readable.call(this,arguments);
}
RR.prototype = new Readable();
RR.prototype._read = function(data){}

router.get('/start/:args',async (ctx,next) => {
  let args = ctx.params.args;
  let argarr = args.split('_'),option;
  if(argarr.length == 1){
    option = {
      server: argarr[0] || '192.168.0.109',
    }
  }else{
    option = {
      hub: argarr[0] || '192.168.0.109',
      server:'ac',
      ac_addr:argarr[1] || '',
      developer:argarr[2] || '',
      key:argarr[3] || ''
    }
  }
  apiImpl = api.use(option);

  apiImpl.connecting = false;
  apiImpl.connections = new Set();
  apiImpl.conn_count = 0;

  ctx.body = await scan();

})

router.get('/notify',async (ctx,next) => {
    var stream = new RR()//PassThrough();
    ctx.set({
        'Content-Type':'text/event-stream',
        'Cache-Control':'no-cache',
        Connection: 'keep-alive'
    });
    ctx.body = stream;

    apiImpl.on('notify', async (hub, data) => {
        console.log(Date.now() + ' :' + data)
        await savelog(Date.now() + ' :' + data);
        sse(stream,'notify',{data:data,time:Date.now()})
        // let b = {id:"B4:99:4C:66:BF:3C"};
        // sse(stream,'notify',{data:JSON.stringify(b),time:Date.now()})
    })
})

router.get('/stop',async (ctx) => {
    if(apiImpl && apiImpl.scan){
        let api = apiImpl.scan.close();
        apiImpl.connections.forEach((item)=>{
            api.conn.close({node:item})
        });
    }
    let date = moment().format('YYYY-MM-DD');
    let filename = date + '.log';
    console.log(ctx.response)
    let filepath = log_path + filename;
    if(fs.existsSync(filepath)){
        ctx.attachment(filename)
        ctx.body = await getFile(filename);
        fs.unlinkSync(filepath);
    }else{
        ctx.body = 'NO connected device & log file';
    }
})

let scan = async() => {
    return new Promise(function(resolve, reject) {
        apiImpl.scan.close()
        apiImpl.scan()
        apiImpl.on('scan', async (hub, data) => {
            var dev = JSON.parse(data);
            if(dev && dev.name.match('hitoe')){
                console.log("find :",dev);
                let bdaddr = dev.bdaddrs[0],mac = bdaddr.bdaddr,type = bdaddr.bdaddrType;
                if(!apiImpl.connecting)resolve(conn(mac,type))
            }
        });
    })
}

// 1、 To get heart rate data: write "0100" to handle 18 ;
// 2、To get data of motion sensor&electrocardiogram ：
//         write "0100" to handle 23 ； write "0104bf8f00000000000000000000000000000000" to handle 25 。

let conn = async(mac,type) =>{
    return new Promise(async (resolve,reject) =>{
        apiImpl.connecting = true;
        await apiImpl.conn({node: mac, type:type,success:async (hub, node, data) => {
            apiImpl.connecting = false;
            apiImpl.connections.add(mac)
            apiImpl.write({
                node: mac,
                handle: '19',
                value: '0100',
                success: async () => {
                    apiImpl.write({
                        node: mac,
                        handle: '23',
                        value: '0100',
                        success: async () => {
                            apiImpl.write({
                            node: mac,
                            handle: '25',
                            value: '0104bf8f00000000000000000000000000000000',
                            success: async () => {
                                resolve({mac:mac,count:apiImpl.conn_count += 1})
                            }
                            })
                        }
                    })
                }
            });
        }});
    });
}

async function savelog(log){
    var date = moment().format('YYYY-MM-DD');
    fs.appendFile(log_path + date + '.log', log + '\n','utf8',()=>{});
}

const sse = (stream,event, data) => {
    return stream.push(`event:${ event }\ndata: ${ JSON.stringify(data) }\n\n`)
}


let getFile = async (filename) =>{
    let file = log_path + filename;
    console.log('need open file :',file)
    if(fs.existsSync(file)){
        return await fs.readFileSync(file,'utf-8');
    }else{
        console.log('file not found');
    }
}

export default router