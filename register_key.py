#!/usr/bin/env python3

def main():
    import sys
    import os
    import pwd
    import pamela

    pw = pwd.getpwuid(os.getuid())

    ssh_dir = os.path.join(pw.pw_dir, '.ssh')
    auth_keys = os.path.join(ssh_dir, 'authorized_keys')

    os.makedirs(ssh_dir, mode=0o700, exist_ok=True)

    with open(auth_keys, 'a') as f:
        for key in sys.stdin:
            print(key.strip(), file=f)

    os.chmod(auth_keys, 0o600)


if __name__ == '__main__':
    main()
