const fs = require('fs');
const util = require('util');
const commandLineArgs = require('command-line-args');
const config = require('config');
const rimraf = util.promisify(require('rimraf'));

const loadReposPage = require('./src/util/load-repo-part');
const bitbacket = require('./src/resource/bitbucket');

const optionDefinitions = [
    { name: 'user', type: String, alias: 'u' },
    { name: 'password', type: String, alias: 'p' },
    { name: 'basic', type: String, alias: 'b' },
    { name: 'host', type: String, alias: 'h' },
    { name: 'protocol', type: String },
    { name: 'pathname', type: String },
    { name: 'dataPath', type: String, default: config.dataPath }
];

const args = commandLineArgs(optionDefinitions);

if (!args.host) {
    console.log('--host is required');
    return;
}

if (args.basic) {
    bitbacket.userBasic(args.basic);
} else {
    bitbacket.useAuth(args.user, args.password);
}
bitbacket
    .useHost(args.host)
    .useProtocol(args.protocol)
    .usePathname(args.pathname);

async function run(page = 0) {
    const list = await loadReposPage(page, args.dataPath);
    console.log(`Next page: ${list.nextPageStart}. Is last page: ${!!list.isLastPage}`);
    if (!list.isLastPage) {
        await run(list.nextPageStart);
    }
}

const TIME_LABEL = 'Loading time';
rimraf(args.dataPath)
    .then(() => {
        console.log('Old data have been removed');

        fs.mkdirSync(args.dataPath);
        console.log('Folder for data have been created');
        console.time(TIME_LABEL);
        return run();
    })
    .then(() => {
        console.log(`---=== SUCCESS ===---`);
        console.timeEnd(TIME_LABEL);
    })
    .catch(e => {
        console.log(`ERROR`);
        console.log(e);
    });
