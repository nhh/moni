const Table = require("cli-table3");
const axios = require('axios');
require('./process-signal-handler');
const colors = require('colors');
const fs = require('fs');
const homedir = require('os').homedir();

const HOSTS_PATH=homedir + '/.moni/hosts.json';
const INTERVAL = 60000;

const { registerInterceptors } = require("./request-interceptors");
registerInterceptors(axios);

let table = new Table({ head: [`Host (Interval: ${INTERVAL / 1000}s)`, 'Status', 'StatusText', 'Response Time (ms)'], chars: { 'top': '═' , 'top-mid': '╤' , 'top-left': '╔' , 'top-right': '╗'
        , 'bottom': '═' , 'bottom-mid': '╧' , 'bottom-left': '╚' , 'bottom-right': '╝'
        , 'left': '║' , 'left-mid': '╟' , 'mid': '─' , 'mid-mid': '┼'
        , 'right': '║' , 'right-mid': '╢' , 'middle': '│' }
});

const hosts = JSON.parse(fs.readFileSync(HOSTS_PATH));

checkWebsites();

const jobIntervall = setInterval(checkWebsites, INTERVAL);

async function checkWebsites() {
    const responses = await Promise.all(hosts.map((url) => axios.get(url, { validateStatus: () => true })));
    table.splice(0, table.length);
    const cells = responses.map(createCell);
    for (cell of cells) {
        table.push(cell)
    }
    process.stdout.write('\033c');
    console.log(table.toString());
}

function createCell(response) {
    if(response.status > 499) {
        return [colors.red(response.config.url) , colors.red(response.status), colors.red(response.statusText), colors.red(response.duration) ]
    }

    if(response.status === 200) {
        return [colors.green(response.config.url) , colors.green(response.status), colors.green(response.statusText), calculateResponseDurationColor(response.duration) ]
    }
}

function calculateResponseDurationColor(duration) {
    if(duration > 700) {
        return colors.red(duration)
    }

    if(duration > 500) {
        return colors.yellow(duration)
    }

    return colors.green(duration);
}
