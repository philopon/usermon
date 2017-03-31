import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as path from 'path';

import * as ldap from './ldap';
import template from './pug';
import * as exe from './exe';
import isAscii from './is-ascii';

declare function require(path: string): any;

const config = require(path.resolve(process.argv[2]));

function makeUserDN(uid: string): string {
    return `uid=${uid},ou=People,${config.base}`
}

function makeGroupDN(gid: string): string {
    return `cn=${gid},ou=Group,${config.base}`
}

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
    const {user_name, current_passwd, new_passwd, new_passwd_re} = req.body;
    if(user_name === undefined || current_passwd === undefined || new_passwd === undefined || new_passwd_re === undefined) {
        res.send(template.passwd({message: "パラメータが不足しています", error: true}));
        return;
    }

    if (new_passwd !== new_passwd_re) {
        res.send(template.passwd({message: "2回の新しいパスワードが一致しません", error: true}));
        return;
    }

    const userDN = makeUserDN(user_name);

    try {
        await ldap.bind(userDN, current_passwd);

        const encoded = await ldap.encodePassword(new_passwd);

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
    const {user_name, passwd, key} = req.body;

    if(user_name === undefined || passwd === undefined || key === undefined) {
        res.send(template.register({message: 'パラメータが不足しています。', error: true}));
    }

    try {
        await ldap.bind(makeUserDN(user_name), passwd);
        await exe.register_key(user_name, key);
        res.send(template.register({message: '公開鍵は登録されました。'}));
    } catch (e) {
        res.send(template.register({message: e, error: true}))
    }
})

.get('/new_user', (_req, res) => {
    res.send(template.new_user());
})

.post('/new_user', async (req, res) => {
    const {user_name, surname, givenname, passwd, passwd_re} = req.body;

    if(user_name === undefined || surname === undefined || givenname === undefined || passwd === undefined || passwd_re === undefined) {
        res.send(template.new_user({message: 'パラメータが不足しています。', error: true}));
    }

    if (passwd !== passwd_re) {
        res.send(template.new_user({message: "2回の新しいパスワードが一致しません", error: true}));
        return;
    }

    if (!isAscii(user_name)) {
        res.send(template.new_user({message: 'ユーザー名は英語で入力してください', error: true}));
    }

    try {
        const uidNumber = await ldap.issueUid(config.base);
        const encoded = await ldap.encodePassword(passwd);

        await ldap.bind(config.manager, config.manager_password);
        await ldap.addUser(makeUserDN(user_name), {uid: user_name, givenname: givenname, surname: surname, uidNumber: uidNumber, passwd: encoded});
        await ldap.addGroup(makeGroupDN(user_name), {gid: user_name, gidNumber: uidNumber});
        await exe.createUserDirectory(user_name);

        res.send(template.new_user({message: 'ユーザーが作成されました'}));
    } catch (e) {
        res.send(template.new_user({message: e, error: true}));
    }
})

.listen(config.port, () => console.log(`server start on ${config.port}`));
