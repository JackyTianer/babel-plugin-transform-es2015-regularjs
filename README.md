# babel-plugin-transform-es2015-modules-nejm

将ES6 class语法转换成Regular语法的babel插件


## 安装

```
npm i babel-plugin-transform-es2015-regularjs --save-dev
也可配合NEJ模块插件 babel-plugin-transform-nej-module使用
 
// 还需要根据需要安装对应的ES版本
npm i babel-preset-env --save-dev
```



## 使用

1. 编写`.babelrc`文件

   ```json
   {
      "plugins": ["babel-plugin-transform-es2015-regularjs"],
      "presets": ["env"]
   }
   ```

2. 可选配置项
暂无


## 转换规则

1. class 转换

   ```javascript
   // ES6 code
   class A extends Regular{
   }

   // regular code
   var A = Regular.extend()
   ```

2. 函数与继承
   ```javascript
   // ES6 code
   class A extends Regular{
       config(){
           super.config();
           this.data.text = 1;
           // your code
       }
   }
   // regular code
   var a = Regular.extend({
      config:function(){
          this.super();
          this.data.text = 1;
      }
   })
   ```

3. 普通属性

   ```javascript
   // ES6 code
   class A extends Regular {
       constructor() {
           super();
           this.template = tpl;
           this.rules = {};
       }
   
       config() {
           super.config();
       }
   
       setParam(a) {
           let b = a;
           super.setParam(a);
       }
   }

   //regular code
   var A = Regular.extend({
       template:tpl,
       rules:{},
       config: function () {
           this.supr();
       },
       setParam: function (a) {
          let b = a;
          this.supr(a);
      }
   })  
 
  ```


   ​

## 示例代码

1. clone项目到本地

   ```
   git clone git@github.com:JackyTianer/babel-plugin-transform-es2015-regularjs.git
   ```

2. 安装依赖并编译

   ```
   npm i 
   ```

3. 进入`example`文件夹运行`run.js`

   ```Shell
   cd example

   node run.js	code.js		// 转换目录下的code.js文件
   ```


## 参与开发

1. 发现🐞或者有需求可以在issue中提出
2. 贡献代码的话请fork后以`pull request`的方式提交



觉得这个插件不错的话请给个 ⭐
