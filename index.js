const Bitbucket = require('./src/resource/bitbucket');


const bitbucket = new Bitbucket();

function loadPackage(repo) {
    const { slug, project} = repo;

    return bitbucket
        .getFile(project.key, slug, 'package.json')
        .catch((e)=>{});
}

function loadProjectPage(start) {
    return bitbucket
        .getAllRepositories(100, start)
        .then((res) => {
            const { nextPageStart, isLastPage, values } = res;

            return {
                nextPageStart,
                isLastPage,
                values: values.map((item) => {
                    const { project, slug, links } = item;
                    return { project, slug, links };
                })
            };
        })
}

loadProjectPage(0)
    .then((repos) => {
        const result = [];
        const promises = repos.values.map((repo) => {
            const { links } = repo;
            return loadPackage(repo)
                .then(data => {
                    if (data) {
                        result.push({
                            data,
                            repo: links.self
                        });
                    }
                })
        });

        return Promise
            .all(promises)
            .then(() => {
                return result;
            })
    })
    .then(res => {
        console.log(`OK`);
        res.forEach((file) => {
            console.log(file);
        })
    })
    .catch((err) => {
    console.log(err);
        // console.log(`ERROR`, err.response.status);
        // console.log(err.config);
        // console.log(err.response.headers);
        // console.log(err);
    });
