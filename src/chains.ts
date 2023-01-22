import { defineComponent, h } from 'vue'
import type { ZodIssue } from 'zod'
import type {
  ErrorChainFromSchema,
  ErrorGetter,
  FieldChainFromSchema,
  GenericSchema,
  IssueCreatorFromSchema,
  IssueCreatorMethods,
  ZodCustomIssueWithMessage,
} from './types'
import { arrayEquals } from './utils'

function addArrayIndex(path: readonly string[], index: number) {
  const last = path[path.length - 1]
  return [...path.slice(0, -1), `${last}[${index}]`]
}

export function fieldChain<Schema extends GenericSchema>(
  ns: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  schema: Schema,
): FieldChainFromSchema<Schema> {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        return _fieldChain(ns, [])[prop]
      },
    },
  ) as any
}

function _fieldChain(ns: string, path: readonly string[]) {
  const proxy: any = new Proxy(() => {}, {
    apply(_target, _thisArg, args) {
      if (typeof args[0] === 'number')
        return _fieldChain(ns, addArrayIndex(path, args[0]))

      const name = path.join('.')
      const id = `${ns}:${path.join('.')}`

      if (args[0] === 'id')
        return id

      if (typeof args[0] === 'function')
        return args[0]({ id, name })

      return name
    },

    get(_target, prop) {
      if (typeof prop === 'string')
        return _fieldChain(ns, [...path, prop])

      return _fieldChain(ns, path)
    },
  })

  return proxy
}

export function errorChain<Schema extends GenericSchema>(
  schema: Schema,
  issues: ZodIssue[],
  _path?: readonly (string | number)[],
): ErrorChainFromSchema<Schema> & ErrorGetter {
  const path = _path || []
  const proxy: any = new Proxy(() => {}, {
    apply(_target, _thisArg, args) {
      if (typeof args[0] === 'number')
        return errorChain(schema, issues, [...path, args[0]])

      const issue = issues.find((issue) => {
        return arrayEquals(issue.path, path)
      })

      if (args[0] === Boolean)
        return Boolean(issue)

      if (typeof args[0] === 'function') {
        if (issue)
          return args[0](issue)

        return undefined
      }

      if (args[0]) {
        if (issue) {
          const isSetupComponent = typeof args[0] === 'object' && !Array.isArray(args[0]) && 'setup' in args[0]
          if (isSetupComponent) {
            return defineComponent({
              setup: (_props, { slots }) => () => h(args[0], issue, slots),
            })
          }

          return args[0]
        }

        else { return undefined }
      }

      return issue || undefined
    },

    get(_target, prop) {
      if (typeof prop === 'string')
        return errorChain(schema, issues, [...path, prop])

      return errorChain(schema, issues, path)
    },
  })

  return proxy
}

export function createCustomIssues<Schema extends GenericSchema>(
  schema: Schema,
  _state?: {
    path: (string | number)[]
    issues: ZodCustomIssueWithMessage[]
  },
): IssueCreatorFromSchema<Schema> {
  const state = _state || {
    path: [],
    issues: [],
  }

  /**
     * Methods that are available at the chain root
     */
  const methods: IssueCreatorMethods = {
    toJSON: () => state.issues.slice(0),
    toArray: () => state.issues.slice(0),
    hasIssues: () => state.issues.length > 0,
  }

  const proxy: any = new Proxy(() => {}, {
    apply(_target, _thisArg, args) {
      if (typeof args[0] === 'number') {
        return createCustomIssues(schema, {
          ...state,
          path: [...state.path, args[0]],
        })
      }

      const issue: ZodCustomIssueWithMessage = {
        code: 'custom',
        path: state.path,
        message: args[0],
        params: args[1] ?? {},
      }

      state.issues.push(issue)

      return issue
    },

    get(_target, prop) {
      if (state.path.length === 0 && prop in methods)
        return (methods as any)[prop]

      if (typeof prop === 'string') {
        return createCustomIssues(schema, {
          ...state,
          path: [...state.path, prop],
        })
      }

      return createCustomIssues(schema, state)
    },
  })

  return proxy
}
