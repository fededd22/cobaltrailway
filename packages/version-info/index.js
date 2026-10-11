import { existsSync }  from 'node:fs';
import { join, parse } from 'node:path';
import { cwd }         from 'node:process';
import { readFile }    from 'node:fs/promises';

const findFile = (file) => {
    let dir = cwd();

    while (dir !== parse(dir).root) {
        if (existsSync(join(dir, file))) {
            return dir;
        }

        dir = join(dir, '../');
    }
}

const root = findFile('.git');
const pack = findFile('package.json');

const readGit = (filename) => {
    if (!root) {
        throw 'no git repository root found';
    }

    return readFile(join(root, filename), 'utf8');
}

// on platforms like railway the docker build context has no .git directory,
// so every git lookup falls back to platform env variables (or "unknown")
const safe = async (fn, fallback) => {
    try {
        return (await fn()) || fallback;
    } catch {
        return fallback;
    }
}

export const getCommit = async () => {
    if (process.env.RAILWAY_GIT_COMMIT_SHA) {
        return process.env.RAILWAY_GIT_COMMIT_SHA;
    }

    return safe(async () => (await readGit('.git/logs/HEAD'))
            ?.split('\n')
            ?.filter(String)
            ?.pop()
            ?.split(' ')[1], 'unknown');
}

export const getBranch = async () => {
    if (process.env.CF_PAGES_BRANCH) {
        return process.env.CF_PAGES_BRANCH;
    }

    if (process.env.WORKERS_CI_BRANCH) {
        return process.env.WORKERS_CI_BRANCH;
    }

    if (process.env.RAILWAY_GIT_BRANCH) {
        return process.env.RAILWAY_GIT_BRANCH;
    }

    return safe(async () => (await readGit('.git/HEAD'))
            ?.replace(/^ref: refs\/heads\//, '')
            ?.trim(), 'unknown');
}

export const getRemote = async () => {
    if (process.env.RAILWAY_GIT_REPO_OWNER && process.env.RAILWAY_GIT_REPO_NAME) {
        return `${process.env.RAILWAY_GIT_REPO_OWNER}/${process.env.RAILWAY_GIT_REPO_NAME}`;
    }

    return safe(readRemoteFromGit, 'unknown');
}

const readRemoteFromGit = async () => {
    let remote = (await readGit('.git/config'))
                    ?.split('\n')
                    ?.find(line => line.includes('url = '))
                    ?.split('url = ')[1];

    if (remote?.startsWith('git@')) {
        remote = remote.split(':')[1];
    } else if (remote?.startsWith('http')) {
        remote = new URL(remote).pathname.substring(1);
    }

    remote = remote?.replace(/\.git$/, '');

    if (!remote) {
        throw 'could not parse remote';
    }

    return remote;
}

export const getVersion = async () => {
    if (!pack) {
        throw 'no package root found';
    }

    const { version } = JSON.parse(
        await readFile(join(pack, 'package.json'), 'utf8')
    );

    return version;
}
