import * as ldapjs from 'ldapjs';
import * as childProcess from 'child_process';

const ldap = ldapjs.createClient({url: 'ldaps://localhost', tlsOptions: {rejectUnauthorized: false}});

export function userDN(uid: string): string {
    return `uid=${uid},ou=People,dc=yakujo,dc=local`;
}

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

export function encodePassword(pw: string) {
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
