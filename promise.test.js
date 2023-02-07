const { APromise } = require('./promise.js')

const value = ':)'
const reason = 'I failed :('

describe('promise state', () => {
  it('receives a executor function when constructed which is called immediately', () => {
    // mock function with spies
    const executor = jest.fn()
    const promise = new APromise(executor)
    // mock function should be called immediately
    expect(executor.mock.calls.length).toBe(1)
    // arguments should be functions
    expect(typeof executor.mock.calls[0][0]).toBe('function')
    expect(typeof executor.mock.calls[0][1]).toBe('function')
  })

  it('is in a PENDING state', () => {
    const promise = new APromise(() => {})
    expect(promise.state).toBe('PENDING')
  })

  it('transition to the FULFILLED state with a `value`', () => {
    const promise = new APromise((fulfill, reject) => {
      fulfill(value)
    })
    expect(promise.state).toBe('FULFILLED')
  })

  it('transitions to the REJECTED state with a `reason`', () => {
    const promise = new APromise((fulfill, reject) => {
      reject(reason)
    })
    expect(promise.state).toBe('REJECTED')
  })
})

describe('observing state changes', () => {
  it('should have a .then method', () => {
    const promise = new APromise(() => {})
    expect(typeof promise.then).toBe('function')
  })

  it('should call the onFulfilled method when a promise is in a FULFILLED state', () => {
    const onFulfilled = jest.fn()
    const promise = new APromise((fulfill, reject) => {
      fulfill(value)
    }).then(onFulfilled)
    expect(onFulfilled.mock.calls.length).toBe(1)
    expect(onFulfilled.mock.calls[0][0]).toBe(value)
  })

  it('transitions to the REJECTED state with a `reason`', () => {
    const onRejected = jest.fn()
    const promise = new APromise((fulfill, reject) => {
      reject(reason)
    }).then(null, onRejected)
    expect(onRejected.mock.calls.length).toBe(1)
    expect(onRejected.mock.calls[0][0]).toBe(reason)
  })
})

describe('one-way transition', () => {
  it('when a promise is fulfilled it should not be reejcted with another value', () => {
    const onFulfilled = jest.fn()
    const onRejected = jest.fn()

    const promise = new APromise((resolve, reject) => {
      resolve(value)
      reject(reason)
    })
    promise.then(onFulfilled, onRejected)

    expect(onFulfilled.mock.calls.length).toBe(1)
    expect(onFulfilled.mock.calls[0][0]).toBe(value)
    expect(onRejected.mock.calls.length).toBe(0)
    expect(promise.state === 'FULFILLED')
  })

  it('when a promise is rejectedd it should not be fulfilled with another value', () => {
    const onFulfilled = jest.fn()
    const onRejected = jest.fn()

    const promise = new APromise((resolve, reject) => {
      reject(reason)
      resolve(value)
    })
    promise.then(onFulfilled, onRejected)

    expect(onRejected.mock.calls.length).toBe(1)
    expect(onRejected.mock.calls[0][0]).toBe(reason)
    expect(onFulfilled.mock.calls.length).toBe(0)
    expect(promise.state === 'REJECTED')
  })
})

describe('handling executor errors', () => {
  it('when the executor fails the promise should transition to the REJECTED state', () => {
    const reason = new Error('I failed :(')
    const onRejected = jest.fn()
    const promise = new APromise((resolve, reject) => {
      throw reason
    })
    promise.then(null, onRejected)

    expect(onRejected.mock.calls.length).toBe(1)
    expect(onRejected.mock.calls[0][0]).toBe(reason)
    expect(promise.state === 'REJECTED')
  })
})

describe('async executor', () => {
  it('should queue callbacks when the promise is not fulfilled immediately', (done) => {
    const onFulfilled = jest.fn()
    const promise = new APromise((fulfill, reject) => {
      setTimeout(fulfill, 1, value)
    })
    promise.then(onFulfilled)

    // shoudl not be called immediately
    expect(onFulfilled.mock.calls.length).toBe(0)

    setTimeout(() => {
      // should have been called once
      expect(onFulfilled.mock.calls.length).toBe(1)
      expect(onFulfilled.mock.calls[0][0]).toBe(value)
      promise.then(onFulfilled)
    }, 5)

    setTimeout(() => {
      expect(onFulfilled.mock.calls.length).toBe(2)
      expect(onFulfilled.mock.calls[1][0]).toBe(value)
      done()
    }, 10)
  })

  it('should queue callbacks when the promise is not rejected immediately', (done) => {
    const onRejected = jest.fn()
    const promise = new APromise((fulfill, reject) => {
      setTimeout(reject, 1, reason)
    })
    promise.then(null, onRejected)

    // should not be called immediately
    expect(onRejected.mock.calls.length).toBe(0)

    setTimeout(() => {
      // should have been called once
      expect(onRejected.mock.calls.length).toBe(1)
      expect(onRejected.mock.calls[0][0]).toBe(reason)
      promise.then(null, onRejected)
    }, 5)

    setTimeout(() => {
      // should have been called twice
      expect(onRejected.mock.calls.length).toBe(2)
      expect(onRejected.mock.calls[1][0]).toBe(reason)
      done()
    }, 10)
  })
})

describe('chaining promises', () => {
  it('.then should return a new promise', () => {
    const qOnFulfilled = jest.fn()
    const rOnFulfilled = jest.fn()

    expect(() => {
      const p = new APromise((resolve) => resolve())
      const q = p.then(qOnFulfilled)
      const r = q.then(rOnFulfilled)
    }).not.toThrow()
  })

  it(`if .then's onFulfilled is called without errors it should transition to FULFILLED`, () => {
    const f1 = jest.fn()
    new APromise((resolve) => resolve()).then(() => value).then(f1)
    expect(f1.mock.calls.length).toBe(1)
    expect(f1.mock.calls[0][0]).toBe(value)
  })
})