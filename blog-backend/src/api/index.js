// const Router = require('koa-router');
// const posts = require('./posts');
import Router from 'koa-router';
import posts from './posts';
import auth from './auth';

const api = new Router();

api.use('/posts', posts.routes());
api.use('/auth', auth.routes());

// api.get('/test', ctx => {
//     ctx.body = 'text 성공';
// });

// module.exports = api;
export default api;