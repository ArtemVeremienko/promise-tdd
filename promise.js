// possible states
const PromiseState = {
  Pending: 'PENDING',
  Fulfilled: 'FULFILLED',
  Rejected: 'REJECTED',
}

class APromise {
  constructor(executor) {
    // initial state
    this.state = PromiseState.Pending
    // the fulfillment value or rejection reason is mapped internally to `value`
    // initially the promise doesn't have a

    // .then handler queue
    this.queue = []

    // call the executor immediately
    doResolve(this, executor)
  }

  then(onFulfilled, onRejected) {
    const newPromise = new APromise(() => {})
    handle(this, { onFulfilled, onRejected, newPromise })
    return newPromise
  }
}

// fulfill with `value`
function fulfill(promise, value) {
  promise.state = PromiseState.Fulfilled
  promise.value = value
  finale(promise)
}

// reject with `reason`
function reject(promise, reason) {
  promise.state = PromiseState.Rejected
  promise.value = reason
  finale(promise)
}

// invoke all the handlers stored in the promise
function finale(promise) {
  for (const handler of promise.queue) {
    handle(promise, handler)
  }
}

// creates the fullfil/reject functions that are arguments of the executor
function doResolve(promise, executor) {
  let called = false

  function wrapFulfill(value) {
    if (called) return
    called = true
    fulfill(promise, value)
  }

  function wrapReject(reason) {
    if (called) return
    called = true
    reject(promise, reason)
  }

  try {
    executor(wrapFulfill, wrapReject)
  } catch (error) {
    wrapReject(error)
  }
}

// checks the state of the promise to either:
// - queue it for later use if the promise is PENDING
// - call the handler if the promise is not PENDING
function handle(promise, handler) {
  // take the state of the innermost promise
  while (promise.value instanceof APromise) {
    promise = promise.value
  }

  if (promise.state === PromiseState.Pending) {
    promise.queue.push(handler)
  } else {
    handleResolved(promise, handler)
  }
}

function handleResolved(promise, handler) {
  const { onFulfilled, onRejected, newPromise } = handler
  const cb = promise.state === PromiseState.Fulfilled ? onFulfilled : onRejected

  // execute the handler and transition according to the rules
  try {
    const value = cb(promise.value)
    fulfill(newPromise, value)
  } catch (error) {
    reject(newPromise, error)
  }
}

module.exports = { APromise }
