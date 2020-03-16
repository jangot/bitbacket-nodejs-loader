const fs = require('fs');
const util = require('util');
const Bitbucket = require('../resource/bitbucket');

const writeFile = util.promisify(fs.writeFile);

const PAGE_COUNT = 100;

function loadProjPage(start) {
    console.log(`Will load ${PAGE_COUNT} repos from ${start}`);

    const bitbucket = new Bitbucket();
    return bitbucket
        .getAllRepositories(PAGE_COUNT, start)
        .then((res) => {
            const { nextPageStart, isLastPage, values } = res;

            return {
                nextPageStart,
                isLastPage,
                values: values.map((item) => {
                    const { project, slug, links, name } = item;
                    return { project, slug, links, name };
                })
            };
        })
}

function loadPackage(repo) {
    const { slug, project } = repo;

    const bitbucket = new Bitbucket();
    return bitbucket
        .getFile(project.key, slug, 'package.json')
        .catch((e) => {
        });
}

function loadLastCommit(repo) {
    const { slug, project } = repo;

    const bitbucket = new Bitbucket();
    return bitbucket
        .getCommints(project.key, slug)
        .then((commits) => {
            return commits.values
                .map((item) => {
                    return item.committerTimestamp;
                })
        })
        .then((commits) => {
            return commits[0] || null;
        })
        .catch((e) => {
        });
}

function loadPackages(repos = []) {
    const result = [];
    const promises = repos.map((repo) => {
        const { links, name } = repo;

        return loadPackage(repo)
            .then((data) => {
                return loadLastCommit(repo)
                    .then((lastCommit) => {
                        return {
                            data,
                            lastCommit
                        }
                    })
            })
            .then(output => {
                if (output.data) {
                    result.push({
                        name,
                        lastCommit: output.lastCommit,
                        data: output.data,
                        repo: links.self
                    });
                }
            })
    });

    return Promise
        .all(promises)
        .then(() => result);
}


module.exports = async function (start = 0, dataPath) {
    const repos = await loadProjPage(start);
    const result = await loadPackages(repos.values);

    for (let i = 0; i < result.length; i++) {
        const { data, name, repo, lastCommit } = result[ i ];
        data.repo = repo;
        data.lastCommit = lastCommit;

        await writeFile(`${dataPath}/${name}.json`, JSON.stringify(data))
    }

    return repos;
};
