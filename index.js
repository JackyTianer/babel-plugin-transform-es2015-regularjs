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

    function getMethodsAndPropertiesASTInClass(node) {
        const ast = node.body.body.reduce((pre, crt) => {
            if (crt.key.name !== 'constructor') {
                // 对函数body处理，将super.xxx(1,2) 转换成this.supr(1,2);
                crt.body.body = crt.body.body.reduce((pre, crt) => {
                    var statement = crt;
                    // 如果是super.xxx()的语句
                    if (types.isCallExpression(statement.expression) && statement.expression.callee.object.type === 'Super') {
                        let args = statement.expression.arguments;
                        // 构建语句
                        statement = types.expressionStatement(
                            // 构建this.supr(x,x);
                            types.callExpression(
                                types.memberExpression(
                                    //this
                                    types.thisExpression(),
                                    //super()
                                    types.identifier('super')
                                ), args
                            )
                        )
                    }
                    pre.push(statement);
                    return pre;
                }, []);

                pre.methodsAST = [...pre.methodsAST, types.objectProperty(
                    types.identifier(crt.key.name),
                    types.functionExpression(null, crt.params, crt.body),
                )]
            } else {
                // 遍历constructor中的内容，找到属性
                crt.body.body.forEach((itm) => {
                    // 找到运算属性, 目前只处理this.xxx,不执行其他语句
                    let expression = itm.expression;
                    if (types.isAssignmentExpression(expression)
                        && expression.operator === '='
                        && types.isMemberExpression(expression.left)
                        && types.isThisExpression(expression.left.object)
                    ) {
                        //获取左右两边的值 生成属性
                        pre.propertiesAST = [...pre.propertiesAST, types.objectProperty(
                            types.identifier(expression.left.property.name),
                            expression.right
                        )]
                    }
                });
            }
            return pre;
        }, {methodsAST: [], propertiesAST: []});
        return ast;
    }

    function buildAST(path, isComponentPool = false) {
        // 由class extends 构建成 var a = b.extend
        const {methodsAST, propertiesAST} = getMethodsAndPropertiesASTInClass(path.node);
        const extendWord = isComponentPool ? '$extends' : 'extend';
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
        ])
    }

    return {
        visitor: {
            ClassDeclaration(path, {opts}) {
                path.replaceWith(buildAST(path, opts.isComponentsPool))
            }
        }
    }
};