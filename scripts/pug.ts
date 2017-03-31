import * as pug from 'pug';

export default {
    index: pug.compileFile('pug/index.pug'),
    passwd: pug.compileFile('pug/passwd.pug'),
    register: pug.compileFile('pug/register_key.pug'),
}
