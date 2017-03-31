import * as childProcess from 'child_process';

export function register_key(user: string, key: string): Promise<{}> {
    return new Promise((resolve, reject) => {
        const proc = childProcess.spawn('sudo', ['-u', user, './register_key.py']);

        proc.stdin.write(key);
        proc.stdin.end();

        proc.on('exit', (code: number) => {
            if (code === 0) {
                resolve();
            } else {
                reject(`register_key failed: exit code == ${code}`);
            }
        });
    });
}

export function createUserDirectory(user: string): Promise<{}> {
    return new Promise((resolve, reject) => {
        const proc = childProcess.spawn('sudo', ['./create_userdirectory.sh', user]);

        proc.on('exit', (code: number) => {
            if (code === 0) {
                resolve();
            } else {
                reject(`create_userdirectory failed: exit code == ${code}`);
            }
        });
    });
}

