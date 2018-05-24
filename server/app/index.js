  // 引入模块
import Koa from 'koa'
import KoaStatic from 'koa-static'
import bodyParser from 'koa-bodyparser'
import router from '../route/router'

const app = new Koa()
const port = 8088;
const static_path = __dirname + '/../static'
// 使用 bodyParser 和 KoaStatic 中间件
app.use(bodyParser());
console.log('path :',static_path)
app.use(KoaStatic(static_path));


global.apiImpl = {};
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});
// logger

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}`);
});


app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(port);
console.log('server listen on port:' + port)