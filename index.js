module.exports = function (babel, opts) {
    const {types} = babel;

    function getClassName(node) {
        return node.id.name;
    }

    function getSupperClassName(node) {
        try {
            return node.superClass.name;
        } catch (e) {
            throw new Error('regular component must have a parent Component');
        }
    }

    /**
     * 通过类生成Regular的方法和属性ast
     * @param rootNode
     * @return {Object} ast
     * @return {Array} ast.methodsAST
     * @return {Array} ast.propertiesAST
     */
    function getMethodsAndPropertiesASTInClass(rootNode) {

        /**
         * 生成静态AST函数方法
         * @param classNode
         * @param node
         * @return {ExpressionState}
         */
        function generateStaticMethodAST(classNode, node) {
            return types.expressionStatement(
                types.assignmentExpression('=', //operator
                    types.memberExpression(classNode, node.key), //left
                    types.FunctionExpression(null, node.params, node.body) // right
                )
            )
        }

        /**
         * 根据每个classMethod,生成regular中的方法
         * @param node
         * @return {ObjectProperty}
         */
        function generateMethodAST(node) {
            node.body.body = node.body.body.reduce((pre, crt) => {
                let statement = crt;
                // 如果是super.xxx()的语句
                if (types.isCallExpression(statement.expression) &&
                    types.isMemberExpression(statement.expression.callee) &&
                    statement.expression.callee.object.type === 'Super') {
                    let args = statement.expression.arguments;
                    // 构建语句
                    statement = types.expressionStatement(
                        // 构建this.supr(x,x);
                        types.callExpression(
                            types.memberExpression(
                                //this
                                types.thisExpression(),
                                //super()
                                types.identifier('supr')
                            ), args
                        )
                    )
                }
                pre.push(statement);
                return pre;
            }, []);
            return types.objectProperty(
                types.identifier(node.key.name),
                types.functionExpression(null, node.params, node.body),
            )
        }

        /**
         * 根据构造函数中this下的所有属性，生成regular class的属性列表
         * @param node
         * @return {Array}
         */
        function generatePropertiesAST(node) {
            let propertiesAST = [];
            node.body.body.forEach((itm) => {
                // 找到运算属性, 目前只处理this.xxx,不执行其他语句
                let expression = itm.expression;
                if (types.isAssignmentExpression(expression)
                    && expression.operator === '='
                    && types.isMemberExpression(expression.left)
                    && types.isThisExpression(expression.left.object)
                ) {
                    //获取左右两边的值 生成属性
                    propertiesAST.push(
                        types.objectProperty(
                            types.identifier(expression.left.property.name),
                            expression.right
                        )
                    )
                }
            });
            return propertiesAST;
        }

        function generateStaticPropertyAST(classNode, node) {
            return types.expressionStatement(
                types.assignmentExpression('=', //operator
                    types.memberExpression(classNode, node.key), //left
                    node.value // right
                )
            )
        }

        const ast = rootNode.body.body.reduce((pre, crt) => {
            if (types.isClassMethod(crt) && crt.static) {
                pre.staticMethodsAST = [...pre.staticMethodsAST, generateStaticMethodAST(rootNode.id, crt)]
            } else if (types.isClassMethod(crt) && !crt.static) {
                if (crt.key.name !== 'constructor') {
                    pre.methodsAST = [...pre.methodsAST, generateMethodAST(crt)]
                } else {
                    // 遍历constructor中的内容，找到属性
                    pre.propertiesAST = [...pre.propertiesAST, ...generatePropertiesAST(crt)]
                }
            } else if (types.isClassProperty(crt) && crt.static) {
                // TODO
                throw new Error('暂不支持静态属性');
                // pre.staticPropertiesAST = [...pre.staticPropertiesAST, generateStaticPropertyAST(crt)];
            } else {
                throw new Error('解析出现错误了哦，欢迎到 https://github.com/JackyTianer/babel-plugin-transform-es2015-regularjs/issues 提出问题')
            }
            return pre;
        }, {methodsAST: [], propertiesAST: [], staticMethodsAST: [], staticPropertiesAST: []});
        return ast;
    }


    function build(path, isComponentPool = false) {

        // 构建regular class AST
        function buildRegularClass(methodsAST, propertiesAST, extendWord) {
            return types.VariableDeclaration('var', [
                types.VariableDeclarator(
                    types.identifier(
                        getClassName(path.node),
                    ),
                    // = 后面的
                    types.callExpression(
                        //TODO 可以通过参数确定这里用extend 还是 $extends
                        types.memberExpression(
                            types.identifier(getSupperClassName(path.node)),
                            types.identifier(extendWord),
                        ),
                        // extend的参数
                        [
                            types.objectExpression([
                                ...propertiesAST,
                                ...methodsAST
                            ])
                        ]
                    )
                )
            ]);
        }


        // 由class extends 构建成 var a = b.extend
        const {methodsAST, propertiesAST, staticMethodsAST, staticPropertiesAST} = getMethodsAndPropertiesASTInClass(path.node);
        const extendWord = isComponentPool ? '$extends' : 'extend';
        return [
            buildRegularClass(methodsAST, propertiesAST, extendWord),
            ...staticPropertiesAST,
            ...staticMethodsAST
        ]
    }

    return {
        visitor: {
            ClassDeclaration(path, {opts}) {
                path.replaceWithMultiple(build(path, opts.isComponentsPool))
            }
        }
    }
};