/**
 * Created by jackytianer on 2018/1/3.
 */

let tpl = ``;
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
        setTimeout(function () {
            
        })
    }
}
export default A;