# @hello/cli

## 用途
在项目中快速创建我们的页面，组件，模块或者自定义的模板。

## usage
* 安装@hello/cli包
``` bash
    npm install @hello/cli -D
```
* 配置package.json中的scripts字段
``` javascript
    scripts: {
        "create": "kcli"
    }
```
* 在指定目录下运行对应的命令
``` bash
    npm run create module test //创建一个名字为test的module
    npm run create page test //创建一个名字为test的page
    npm run create component test //创建一个名字为test的component
```

## API
该脚手架依赖于在项目根目录中的一个.cli.js文件，内容形如：
``` javascript
    // template目录相对于根目录
    // filename目录相对于当前工作目录
    // 脚手架中已经内置了page, component,module的创建方式，但是仍然需要提供对应的模板实体。
    {
        page: {
            template: "template/page.tpl",
            filename: "[name]/index.vue"
        },
        // page 也可以是一个数组形式，用于一次性生成多个文件
        // page: [
        //     {
        //         template: "template/page.tpl",
        //         filename: "[name]/index.jsx"
        //     },
        //     {
        //         template: "template/page-style.tpl",
        //         filename: "[name]/index.scss"
        //     }
        // ],
        component: {
            template: "template/component.tpl",
            filename: "[name]/index.vue"
        },
        // component 也可以是一个数组形式，用于一次性生成多个文件
        // component: [
        //     {
        //         template: "template/component.tpl",
        //         filename: "[name]/index.jsx"
        //     },
        //     {
        //         template: "template/component-style.tpl",
        //         filename: "[name]/index.scss"
        //     }
        // ],
        // 模板实体也可以使用函数，用于扩展自定义模板内容
        demo: ({ handlebars, name, type, params}) => { 
            console.log(handlebars, name, type, params);
        },
        modules: {
            parts: {
                page: {
                    ref: "page" // ref指的是引用外部对应的模板实体
                },
                component: {
                    ref: "component"
                },
                router: {
                    template: "template/router.tpl",
                    filename: "[name]/router/index.js"
                },
                store: {
                    template: "template/store.tpl",
                    filename: "[name]/store/index.js"
                },
                entry: {
                    template: "template/entry.tpl",
                    filename: "[name]/index.js"
                },
                app: {
                    template: "template/app.tpl",
                    filename: "[name]/index.vue"
                },
                html: {
                    template: "template/html.tpl",
                    filename: "[name]/index.html"
                },
                // 模板实体也可以使用函数，用于扩展自定义模板内容
                demo: ({ handlebars, name, type, params}) => {
                    console.log(handlebars, name, type, params);
                },
            }
        }
    }
```