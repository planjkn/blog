import Joi from 'joi';
import User from '../../models/user';

export const register = async ctx => {                       // 회원가입
    const schema = Joi.object().keys({                       // validate할 schema 정의
        username: Joi.string()
        .alphanum()
        .min(3)
        .max(20)
        .required(),
        password: Joi.string().required(),
    });
    //const result = Joi.validate(ctx.request.body, schema);
    const result = schema.validate(ctx.request.body);

    if(result.error) {
        ctx.status = 400;
        ctx.body = result.error;
        return;
    }

    const { username, password } = ctx.request.body;
    try {
        const exist = await User.findByUsername(username);
        if(exist) {
            ctx.status = 409;
            return;
        }
        // const user = new User(`${username}`);
        const user = new User({username});
        await user.setPassword(password); //비번설정
        await user.save(); //디비저장

        //응답할 데이터에서 hashedPassword 필드 제거
        // const data = user.toJSON();
        // delete data.hashedPassword;
        ctx.body = user.serialize();

        const token = user.generateToken();
        ctx.cookies.set('access_token', token, {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            httpOnly: true,
          });
    }
    catch(e) {
        ctx.throw(500, e);
    }
};

export const login = async ctx => {                       //로그인
    const { username, password } = ctx.request.body;

    if(!username || !password) {
        ctx.status = 401;
        return;
    }
    
    try {
        const user = await User.findByUsername(username);
        if(!user) {
            ctx.status = 401;
            return;
        }
        const valid = await user.checkPassword(password);
        if(!valid) {
            ctx.status = 401;
            return;
        }
        ctx.body = user.serialize();

        const token = user.generateToken();
        ctx.cookies.set('access_token', token, {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            httpOnly: true,
        });
        
    } catch(e) {
        ctx.throw(500, e);
    }

};

export const check = async ctx => {                        //로그인 상태 확인
    const { user } = ctx.state;
    if(!user) {
        ctx.status = 401;
        return;
    }
    ctx.body = user;
};

export const logout = async ctx => {                     //로그아웃
    ctx.cookies.set('access_token');
    ctx.status = 204; // No Content
};