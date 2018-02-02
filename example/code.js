/**
 * Created by jackytianer on 2018/1/3.
 */

let tpl = `<div>hello world</div>`;
class A extends Regular {
    constructor() {
        super();
        this.template = tpl;
        this.rules = {};
    }
    static staticFunc(param) {
        return param + 1;
    }

    config() {
        super.config();
    }

    setParam(a) {
        let b = a;
        super.setParam(a);
        setTimeout(function () {
            
        })
    }
}
export default A;