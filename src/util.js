
/*
 测试用例(拷贝到浏览器控制台运行)
 function testShallowEqual(){
 var t={a:1};
 [
  shallowEqual({a:1,b:2,c:t},{a:1,b:2,c:t})===true,
  shallowEqual({a:1,b:2,c:t},{a:1,b:2,c:{a:1}})===false,
  shallowEqual(1,2)===false,
  shallowEqual(2,2)===true,
  shallowEqual('aa','aaa')===false,
  shallowEqual('aaa','aaa')===true,
  shallowEqual({a:1,b:2},{a:1,b:2})===true,
  shallowEqual({a:1,b:2},{a:1,b:3})===false,
  shallowEqual({a:1,b:2},{a:1,b:2,c:3})===false,
 ].forEach((v,i)=>console.assert(v,i))
 }
 */
/**
 * 浅比较两个对象是否相等
 * @param {*} objA
 * @param {*} objB
 */
export function shallowEqual(objA, objB) {
    if (
        typeof objA !== 'object'
        || typeof objB !== 'object' // 其中有一个不是object
        || !objA || !objB // 其中有一个为null
    ) return objA === objB;
    if (objA === objB) return true;

    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) {
        return false;
    }

    // Test for A's keys different from B.
    const hasOwn = Object.prototype.hasOwnProperty;
    for (let i = 0; i < keysA.length; i++) {
        if (!hasOwn.call(objB, keysA[i]) ||
            objA[keysA[i]] !== objB[keysA[i]]) {
            return false;
        }
    }

    return true;
}

/**
 * 从给定的obj中，获取指定路径的值，如果路径中有null或者其他原因导致中断，无法继续获取，则返回undefined
 * @param {Object} obj 获取的对象，例如 { aa: { b: 1, c: ['str'] } }
 * @param {string} path 要获取的数据的路径，例如 'aa.b'或者'aa.c[0]'
 */
export function objGet(obj, path) {
    const paths = path.split(/[.\[\]]/g).filter(p => p);
    let temp = obj;
    for (let i = 0; i < paths.length; i++) {
        const key = paths[i];
        if (temp === null || temp === undefined) return undefined;
        temp = temp[key];
    }
    return temp;
}