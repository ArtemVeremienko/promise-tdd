const { APromise } = require('./promise')

module.exports = {
  Promise: APromise,
  deferred: function () {
    let resolve, reject
    return {
      promise: new APromise(function (_resolve, _reject) {
        resolve = _resolve
        reject = _reject
      }),
      resolve: resolve,
      reject: reject,
    }
  },
}
