// const Post = require('../../models/post');
import Post from '../../models/post';
const mongoose = require('mongoose');
const Joi = require('joi');
import sanitizeHtml from 'sanitize-html';

const { ObjectId } = mongoose.Types;

const sanitizeOptions = {
  allowedTags: [
    'h1',
    'h2',
    'b',
    'i',
    'u',
    's',
    'p',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
    'img',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target'],
    img: ['src'],
    li: ['class'],
  },
  allowedSchemes: ['data', 'http'],
};

export const getPostById = async (ctx, next) => {
  const { id } = ctx.params;
  if (!ObjectId.isValid(id)) {
    ctx.status = 404;
    return;
  }
  try {
    const post = await Post.findById(id);
    if(!post) {
      ctx.status = 404;
      return;
    }
    ctx.state.post = post;
    return next();
  } catch(e) {
    ctx.throw(500, e);
  }
};


export const write = async ctx => {
  const schema = Joi.object().keys({
    title: Joi.string().required(), // required()가 있으면 필수 항목
    body: Joi.string().required(),
    tags: Joi.array()
             .items(Joi.string()) // 문자열로 이루어진 배열
             .required(),
  });

  // const result = Joi.validate(ctx.request.body, schema);
  const validation = schema.validate(ctx.request.body);
  if (validation.error) {
    ctx.status = 400; // Bad Request
    ctx.body = validation.error;
    return;
  }

  const { title, body, tags } = ctx.request.body;
  const post = new Post({
    title,
    body: sanitizeHtml(body, sanitizeOptions),
    tags,
    user: ctx.state.user,
  });
  try {
    await post.save();
    ctx.body = post;
  } catch (e) {
    ctx.throw(500, e);
  }
};

const removeHtmlAndShorten = body => {
  const filtered = sanitizeHtml(body, {
    allowedTags: [],
  });
  return filtered.length < 200 ? filtered : `${filtered.slice(0, 200)}...`;
};

export const list = async ctx => {
  const page = parseInt(ctx.query.page || '1', 10);
  if (page < 1) {
    ctx.status = 400;
    return;
  }

  const { tag, username } = ctx.query;
  const query = {
    ...(username ? {'username': username}:{}),
    ...(tag ? {tag: tag}:{}),
  };
  try {
    const posts = await Post.find(query).sort({ _id: -1 }).limit(10).skip((page-1)*10).lean().exec();
    const postCount = await Post.countDocuments(query).exec();
    ctx.set('Last-Page', Math.ceil(postCount/10));

    ctx.body = posts.map(post => ({
      ...post,
      body: removeHtmlAndShorten(post.body),
      // body:
      //     post.body.length < 100 ? post.body : `${post.body.slice(0,100)}...`,
      }));

    // ctx.body = posts
    //   .map(post => post.toJSON())
    //   .map(post => ({
    //     ...post,
    //     body:
    //       post.body.length < 50 ? post.body : `${post.body.slice(0,50)}...`,
    //   }));
  } catch (e) {
      ctx.throw(500, e);
    }
};

// export const read = async ctx => {
//   const { id } = ctx.params;
//   try {
//     const post = await Post.findById(id).exec();
//     if (!post) {
//       ctx.status = 404; // Not Found
//       return;
//     }
//     ctx.body = post;
//   } catch (e) {
//     ctx.throw(500, e);
//   }
// };

export const read = ctx => {
  ctx.body = ctx.state.post;
};

export const remove = async ctx => {
    const { id } = ctx.params;
    try {
      await Post.findByIdAndRemove(id).exec();
      ctx.status = 204; // No Content (성공하기는 했지만 응답할 데이터는 없음)
    } catch (e) {
      ctx.throw(500, e);
    }
};


export const update = async ctx => {
  const { id } = ctx.params;

  const schema = Joi.object().keys({
    title: Joi.string(),
    body: Joi.string(),
    tags: Joi.array().items(Joi.string()),
  });

  // 검증하고 나서 검증 실패인 경우 에러 처리
  // const result = Joi.validate(ctx.request.body, schema);
  const validation = schema.validate(ctx.request.body);
  if (validation.error) {
    ctx.status = 400; // Bad Request
    ctx.body = validation.error;
    return;
  }

  const nextData = { ...ctx.request.body }; // 객체를 복사하고
  // body 값이 주어졌으면 HTML 필터링
  if (nextData.body) {
    nextData.body = sanitizeHtml(nextData.body, sanitizeOptions);
  }
  
  try {
    const post = await Post.findByIdAndUpdate(id, nextData, {
      new: true, // 이 값을 설정하면 업데이트된 데이터를 반환합니다.
                 // false일 때는 업데이트되기 전의 데이터를 반환합니다.
    }).exec();
    if (!post) {
      ctx.status = 404;
      return;
    }
    ctx.body = post;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const checkOwnPost = (ctx, next) => {
  const { user, post } = ctx.state;
  if (post.user._id.toString() !== user._id) {
    ctx.status = 403;
    return;
  }
  return next();
};

// let postId = 1;

// const posts = [
//     {
//         id: 1,
//         title: '제목',
//         body: '내용',
//     },
// ];

// export const write = ctx => {
//     const { title, body } = ctx.request.body;
//     postId += 1;
//     const post = { id: postId, title, body };
//     posts.push(post);
//     ctx.body = post;
// };

// export const list = ctx => {
//     ctx.body = posts;
// };

// export const read = ctx => {
//     const { id } = ctx.params;
//         // 주어진 id 값으로 포스트를 찾습니다.
//         // 파라미터로 받아 온 값은 문자열 형식이므로 파라미터를 숫자로 변환하거나
//         // 비교할 p.id 값을 문자열로 변경해야 합니다.
//     const post = posts.find( p=> p.id.toString() === id);

//     if(!post) {
//         ctx.status = 404;
//         ctx.body = {
//             message: '포스트가 존재하지 않습니다',
//         };
//         return;
//     }
//     ctx.body = post;
// };

// export const remove = ctx => {
//     const { id } = ctx.params;
//     const index = posts.findIndex(p => p.id.toString() === id );
//     if(index === -1) {
//         ctx.status = 404;
//         ctx.body = {
//             message: '포스트가 존재하지 않습니다',
//         };
//         return;
//     }
//     posts.splice(index, 1);
//     ctx.status = 204;
// };

// export const replace = ctx => {
//     const { id } = ctx.params;
    
//     const index = posts.findIndex( p => p.id.toString() === id );
//     if( index === -1) {
//         ctx.status = 404;
//         ctx.body = {
//             message: '포스트가 존재하지 않습니다',
//         };
//         return;
//     }
//     posts[index] ={
//         id,
//         ...ctx.request.body,
//     };
//     ctx.body = posts[index];
// };

// export const update = ctx => {
//     const { id } =ctx.params;
//     const index = posts.findIndex(p => p.id.toString() === id);
//     if (index === -1) {
//         ctx.status = 404;
//         ctx.body = {
//             message: '포스트가 존재하지 않습니다',
//         };
//         return;
//     }
//     posts[index] = {
//         ...posts[index],
//         ...ctx.request.body,
//     };
//     ctx.body = posts[index];
// };