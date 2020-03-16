require('console.table');
const fs = require('fs');
const util = require('util');
const forEach = require('lodash/forEach');
const config = require('config');
const moment = require('moment');
const commandLineArgs = require('command-line-args');

const readFile = util.promisify(fs.readFile);
const readdir = util.promisify(fs.readdir);

const optionDefinitions = [
    { name: 'package', type: String, multiple: true, alias: 'p' },
    { name: 'days', type: Number, alias: 'd' },
    { name: 'showlink', type: Boolean, alias: 'l' },
    { name: 'dataPath', type: String, default: config.dataPath }
];

const args = commandLineArgs(optionDefinitions);
const showPackages = args.package || ['lodash'];
const showLinks = args.showlink || false;
const DAY_TIME = 1000 * 60 * 60 * 24;

async function loadData() {
    const files = await readdir(args.dataPath);
    const result = {};
    for (let i = 0; i < files.length; i++) {
        const projectName = files[i].split('.')[0];

        result[projectName] = await readFile(`${args.dataPath}/${files[i]}`).then(JSON.parse);
    }

    return result;
}

async function run() {
    const projectPackages = await loadData();

    const table = [];

    forEach(projectPackages, (data, project) => {
        const { dependencies = {}, devDependencies = {}, repo, lastCommit } = data;

        const item = { project };
        showPackages.forEach((packageName) => {
            const varsion =  dependencies[packageName] || devDependencies[packageName] || '-.-.-';

            item[packageName] = varsion;
        });
        if (showLinks) {
            const href = repo[0] ? repo[0].href : '--';
            item.repo = href
        }
        item.lastCommit = lastCommit;

        table.push(item);
    });

    return table
        .filter((item) => {
            const { lastCommit } =  item;
            const { days } = args;
            const now = new Date().getTime();

            if (!days || !lastCommit) {
                return true;
            }

            const lastTime = DAY_TIME * days;

            return now - lastTime < lastCommit;
        })
        .map((item, index) => {
            item[0] = index + 1;

            if (item.lastCommit) {
                item.lastCommit = moment(item.lastCommit).format('YYYY.MM.DD');
            } else {
                item.lastCommit = '****.**.**';
            }

            return item;
        });
}


run()
    .then((res) => {
        console.table(res);
    })
    .catch((e) => {
        console.log(`ERROR`);
        console.log(e);
    });
