require('dotenv').config();
// const Koa = require('koa');
// const Router = require('koa-router');
// const bodyParser = require('koa-bodyparser');
// const mongoose = require('mongoose');

import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import mongoose from 'mongoose';

require = require('esm')(module);
module.exports = require('./index.js');

// const api = require('./api');
// const createFakeData  = require('./createFakeData');
import api from './api';
import jwtMiddleware from './lib/jwtMiddleware';
import createFakeData from './createFakeData';

const { PORT, MONGO_URI } = process.env;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // createFakeData();
  })
  .catch(e=> {
    console.error(e);
  });

const app = new Koa();
const router = new Router();

router.use('/api', api.routes()); // api 라우트 적용

app.use(bodyParser()); // 라우터 적용 전에 bodyParser 적용
app.use(jwtMiddleware);

// app.use(async (ctx, next) => {
//   console.log(ctx.url);
//   console.log(1);
//   if(ctx.query.authorized !== '1') {
//     ctx.status = 401;
//     return;
//   }
//   // next().then(() => {
//   //   console.log('end');
//   // }
//   await next();
//     console.log('END');
//   });



// app.use((ctx, next) => {
//   console.log(2);
//   next();
// });



// app.use(ctx => {
//   ctx.body = 'hello world';
// });

/////////////////////////////////////////////////////////////////////////

// router.get('/', ctx => {
//   ctx.body = '홈';
// });

// router.get('/about', ctx => {
//   ctx.body = '소개';
// });

// app.use(router.routes()).use(router.allowedMethods());

/////////////////////////////////////////////////////////////////////////


// router.get('/', ctx => {
//   ctx.body = '홈';
// });

// router.get('/about/:name?', ctx => {
//   const { name } = ctx.params;
//   // ctx.body = name ?  <Fragment><span class="co49">${</span><span class="cd2 co33">name</span><span class="co33">}</span><span class="cd2 co31">의</span><span class="cd2 co31"> </span><span class="cd2 co31">소개</span></Fragment> : '소개';
//   //ctx.body = 'about';
//   ctx.body = name ? `${name}` + '의 소개': '걍 소개';
// });

// router.get('/posts', ctx => {
//   const { id } = ctx.query;
//   // ctx.body = id ? <Fragment><span class="cd2 co31">포스트</span><span class="cd2 co31"> #</span><span class="co49">${</span><span class="cd2 co33">id</span><span class="co49">}</span></Fragment> : '포스트 아이디가 없습니다.';
//   ctx.body = id ? `${id}` + '번 포스트': '포스트 없음';
// })

// app.use(router.routes()).use(router.allowedMethods());


// app.listen(4000, () => {
//   console.log('Listening to port 4000');
// });

/////////////////////////////////////////////////////////////////////////


app.use(router.routes()).use(router.allowedMethods()); // app 인스턴스에 라우터 적용

const port = PORT || 4000;
app.listen(port, () => {
  console.log('Listening to port %d', port);
});