const curry = fn => function curryStack(...args) {
  return args.length >= fn.length ? fn(...args) : (i) => curryStack()
}
