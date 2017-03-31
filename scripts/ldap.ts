import * as ldapjs from 'ldapjs';
import * as childProcess from 'child_process';

const ldap = ldapjs.createClient({url: 'ldaps://localhost', tlsOptions: {rejectUnauthorized: false}});

export function bind(u: string, p: string): Promise<{}> {
    return new Promise((resolve, reject) => {
        ldap.bind(u, p, err => {
            err ? reject(err) : resolve();
        })
    });
}

export function modify(n: string, c: ldapjs.Change | Array<ldapjs.Change>) {
    return new Promise((resolve, reject) => {
        ldap.modify(n, c, err => {
            err ? reject(err) : resolve();
        })
    })
}

export function add(dn: string, entry: Object) {
    return new Promise((resolve, reject) => {
        ldap.add(dn, entry, err => {
            err ? reject(err) : resolve();
        })
    });
}

export function encodePassword(pw: string): Promise<string> {
    return new Promise((resolve, reject) => {
        let encoded: string = '';
        const proc = childProcess.spawn('/usr/bin/slappasswd', ['-s', pw]);
        proc.stdout.on('data', data => {
            encoded += data.toString();
        });

        proc.on('exit', (code: number) => {
            if (code === 0) {
                resolve(encoded);
            } else {
                reject(code);
            }
        });
    });
}

export function issueUid(baseDN: string): Promise<number> {
    return new Promise((resolve, reject) => {
        ldap.search(baseDN, {filter: '(uid=*)', scope: 'sub'}, (err, res) => {
            if (err) {reject(err); return}

            const uids = new Set();

            res.on('searchEntry', (entry: any) => {
                entry.attributes.forEach((v: any) => {
                    if (v.type === 'uidNumber') {
                        v._vals.forEach((v: Buffer) => {
                            uids.add(parseInt(v.toString()));
                        });
                    }
                });
            });

            res.on('error', (err: any) => { reject(err); })
            res.on('end', () => {
                for (let uid = 10000; uid < 65535; uid++) {
                    if (!uids.has(uid)) {
                        resolve(uid);
                    }
                }
                reject('no uids')
            })
        });
    });
}

export function addUser(dn: string, {uid, surname, givenname, uidNumber, passwd}: {uid: string, surname: string, givenname: string, passwd: string, uidNumber: number}) {
    return add(dn, {
        objectClass: ['top', 'person', 'posixAccount', 'shadowAccount'],
        cn: `${givenname} ${surname}`,
        homeDirectory: `/home/${uid}`,
        sn: surname,
        uidNumber: uidNumber,
        gidNumber: uidNumber,
        userPassword: passwd,
    })
}

export function addGroup(dn: string, {gid, gidNumber}: {gid: string, gidNumber: number}) {
    return add(dn, {
        objectClass: ['top', 'posixGroup'],
        cn: gid,
        gidNumber: gidNumber,
    })
}
