#!/usr/bin/env node
/* eslint-disable */
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

const createTypes = ['component', 'page', 'module'];
const cli = require(path.join(process.cwd(), '.cli'));
const args = process.argv;
if (!args || args.length <= 2) {
    throw new Error('missing the required param');
}

const funcMap = {
    page: (name) => {
        createPage(name, cli.page);
    },
    component: (name) => {
        createComponent(name, cli.component);
    },
    module: createModule,
};

const name = args[3];

const type = args[2];

const params = {
    name,
    upperCaseName: name ? name.slice(0, 1).toUpperCase() + name.slice(1) : undefined,
    lowerCaseName: name ? name.slice(0, 1).toLowerCase() + name.slice(1) : undefined,
    module: createTypes.includes(type) ? (type === 'module' ? name : getModuleName()) : undefined,
};

if (typeof cli[type] === 'function') {
    cli[type]({
        handlebars,
        params,
        name,
        type,
    });
} else if (createTypes.includes(type)) {
    funcMap[type](name);
} else {
    throw new Error(`the ${type} options is not found in .cli.js`);
}

function mkdirsSync(filePath) {
    if (fs.existsSync(filePath)) {
        return true;
    }
    if (mkdirsSync(path.dirname(filePath))) {
        fs.mkdirSync(filePath);
        return true;
    }
    return false;
}

function getModuleName() {
    let module;
    try {
        if(/modules/.test(process.env.PWD)) {
            [, module] = process.env.PWD.match(/modules\/(.*?)\//);
        }
    } catch (e) {
        throw new Error('the page or component must be wrapped by modules directory');
    }
    return module;
}

function createModule(name) {
    if (!name) {
        throw new Error('the module name is required');
    }
    const currentDir = process.env.PWD;
    if (!/modules$/.test(currentDir)) {
        throw new Error('only the modules directory is allowed to create module');
    }
    if (fs.existsSync(path.resolve(currentDir, name))) {
        throw new Error(`the ${name} module has already exists in the project`);
    }
    Object.keys(cli.modules.parts).forEach((type) => {
        const modulePart = cli.modules.parts;
        if (typeof modulePart[type] === 'function') {
            modulePart[type]({
                handlebars,
                name,
                params,
                type,
            });
            return;
        }
        if (type === 'page') {
            let obj = modulePart.page;
            if (obj && (obj.ref || (obj.template && obj.filename))) {
                if (obj.ref) {
                    obj = cli[obj.ref];
                }
            }
            const dir = path.resolve(currentDir, name, 'pages');
            mkdirsSync(dir);
            process.env.PWD = dir;
            createPage('demo', obj);
            process.env.PWD = currentDir;
            return;
        }
        if (type === 'component') {
            let obj = modulePart.component;
            if (obj && (obj.ref || (obj.template && obj.filename))) {
                if (obj.ref) {
                    obj = cli[obj.ref];
                }
            }
            const dir = path.resolve(currentDir, name, 'components');
            mkdirsSync(dir);
            process.env.PWD = dir;
            createComponent('demo', obj);
            process.env.PWD = path.resolve(currentDir, name, 'pages', 'components');
            createComponent('demo', obj);
            process.env.PWD = currentDir;
            return;
        }
        createModulePart(type, name, { routers: ['demo'] });
    });
}

function createModulePart(type, name, extraParams) {
    const currentDir = process.env.PWD;
    let { filename, template } = cli.modules.parts[type];
    filename = getRealFileName(filename, name);
    const dir = path.resolve(currentDir, path.dirname(filename));
    mkdirsSync(dir);
    const content = fs.readFileSync(path.resolve(process.cwd(), template)).toString('utf-8');
    fs.writeFileSync(path.join(dir, path.basename(filename)), handlebars.compile(content)({...params, ...extraParams}));
}

function createPage(name, options) {
    if (!name) {
        throw new Error('the page name is required');
    }
    const currentDir = process.env.PWD;
    if (!/(pages|views)$/.test(currentDir)) {
        throw new Error('only the pages or views directory is allowed to create page');
    }
    const gen = option => {
        let { filename, template } = option;
        filename = getRealFileName(filename, name);
        const pageDir = path.join(currentDir, filename);
        if (fs.existsSync(pageDir)) {
            throw new Error(`the ${name} page is already exists in the project`);
        }
        mkdirsSync(path.dirname(pageDir));
        const content = fs.readFileSync(path.resolve(process.cwd(), template)).toString('utf-8');
        fs.writeFileSync(pageDir, handlebars.compile(content)(params));
    }
    if(Array.isArray(options)) {
        options.forEach(gen);
    } else {
        gen(options);
    }
    if(type === 'page') {
        createRouter();
    }
}

function createRouter() {
    const module = getModuleName();
    const pages = fs.readdirSync(process.env.PWD);
    const extraParams = {
        module,
        routers: pages.filter(v => v !== 'components')
    };
    const temp = process.env.PWD;
    process.env.PWD = path.dirname(path.dirname(temp));
    createModulePart('router', module, extraParams);
    process.env.PWD = temp;
}

function createComponent(name, options) {
    if (!name) {
        throw new Error('the component name is required');
    }
    const currentDir = process.env.PWD;
    if (!/components$/.test(currentDir)) {
        throw new Error('only the components directory is allowed to create component');
    }
    const gen = option => {
        let { filename, template } = option;
        filename = getRealFileName(filename, name);
        const componentDir = path.resolve(currentDir, filename);
        if (fs.existsSync(componentDir)) {
            throw new Error(`the ${name} component is already exists in the current directory`);
        }
        mkdirsSync(path.dirname(componentDir));
        const content = fs.readFileSync(path.resolve(process.cwd(), template)).toString('utf-8');
        fs.writeFileSync(componentDir, handlebars.compile(content)(params));
    }
    if(Array.isArray(options)) {
        options.forEach(gen);
    } else {
        gen(options);
    }
}

function getRealFileName(filename, name) {
    const field = filename.match(/\[(.*?)\]/)[1];
    if (field === 'name') {
        filename = filename.replace('[name]', name);
    }
    return filename;
}
