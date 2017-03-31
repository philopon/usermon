import * as express from 'express';
import * as bodyParser from 'body-parser';

import * as ldap from './ldap';
import template from './pug';
import register_key from './register_key';


const app = express();

app.use(bodyParser.urlencoded({extended: true}));

app
.get('/', (_req, res) => {
    res.send(template.index());
})
.get('/passwd', (_req, res) => {
    res.send(template.passwd());
})

.post('/passwd', async (req, res) => {
    const body = req.body;
    if(body.user_name === undefined || body.current_passwd === undefined || !body.new_passwd === undefined || body.new_passwd_re === undefined) {
        res.send(template.passwd({message: "パラメータが不足しています", error: true}));
        return;
    }

    if (body.new_passwd !== body.new_passwd_re) {
        res.send(template.passwd({message: "2回の新しいパスワードが一致しません", error: true}));
        return;
    }

    const userDN = ldap.userDN(body.user_name);

    try {
        await ldap.bind(userDN, body.current_passwd);

        const encoded = await ldap.encodePassword(body.new_passwd);

        await ldap.modify(userDN, {operation: 'replace', modification: {userPassword: encoded}});

        res.send(template.passwd({message: 'パスワードは変更されました'}));
        return;
    } catch (e) {
        res.send(template.passwd({message: e, error: true}))
    }
})

.get('/register_key', (_req, res) => {
    res.send(template.register());
})

.post('/register_key', async (req, res) => {
    const body = req.body;

    if(body.user_name === undefined || body.passwd === undefined || body.key === undefined) {
        res.send(template.register({message: 'パラメータが不足しています。', error: true}));
    }

    try {
        await ldap.bind(ldap.userDN(body.user_name), body.passwd);
        await register_key(body.user_name, body.key);
        res.send(template.register({message: '公開鍵は登録されました。'}));
    } catch (e) {
        res.send(template.register({message: e, error: true}))
    }
})
.listen(parseInt(process.argv[2]), () => console.log(`server start on ${process.argv[2]}`));
