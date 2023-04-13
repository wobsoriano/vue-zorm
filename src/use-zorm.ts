import { type ComponentPublicInstance, computed, reactive, ref, unref } from 'vue'
import type { SafeParseReturnType, ZodIssue, ZodType } from 'zod'
import { errorChain, fieldChain } from './chains'
import { safeParseForm } from './parse-form'
import type { MaybeRef, Zorm } from './types'

export interface ValidSubmitEvent<Data> {
  /**
     * Prevent the default form submission
     */
  preventDefault(): void

  /**
     * The form HTML Element
     */
  target: HTMLFormElement

  /**
     * Zod validated and parsed data
     */
  data: Data
}

export interface UseZormOptions<Data extends SafeParseReturnType<any, any>> {
  /**
     * Called when the form is submitted with valid data
     */
  onValidSubmit?: (event: ValidSubmitEvent<Data>) => any

  setupListeners?: MaybeRef<boolean>

  customIssues?: MaybeRef<ZodIssue[]>

  onFormData?: (event: FormDataEvent) => any
}

export function useZorm<Schema extends ZodType<any>>(
  formName: MaybeRef<string>,
  schema: Schema,
  options?: UseZormOptions<ReturnType<Schema['parse']>>,
): Zorm<Schema> {
  type ValidationResult = SafeParseReturnType<
    any,
    ReturnType<Schema['parse']>
  >

  const formRef = ref<HTMLFormElement | null>(null)
  const submittedOnceRef = ref(false)
  const submitRef = ref<
    UseZormOptions<ReturnType<Schema['parse']>>['onValidSubmit'] | undefined
  >(options?.onValidSubmit)
  submitRef.value = options?.onValidSubmit

  const validation = ref<ValidationResult | null>(null)

  function getForm(el: Element | ComponentPublicInstance | null) {
    const form = el as HTMLFormElement
    if (form !== formRef.value) {
      if (formRef.value) {
        formRef.value.removeEventListener(
          'change',
          changeHandler,
        )
        formRef.value.removeEventListener(
          'submit',
          submitHandler,
        )
      }

      if (form && unref(options?.setupListeners) !== false) {
        form.addEventListener('change', changeHandler)
        form.addEventListener('submit', submitHandler)
      }
      formRef.value = form ?? null
    }
  }

  function validate() {
    const res = safeParseForm(schema, formRef.value!)
    validation.value = res as any
    return res
  }

  function changeHandler() {
    if (!submittedOnceRef.value)
      return

    validate()
  }

  function submitHandler(e: { preventDefault(): any }) {
    submittedOnceRef.value = true
    const validation = validate()

    if (!validation.success) {
      e.preventDefault()
    }
    else {
      submitRef.value?.({
        data: validation.data,
        target: formRef.value!,
        preventDefault: () => {
          e.preventDefault()
        },
      })
    }
  }

  const customIssues = computed(() => unref(options?.customIssues) ?? [])
  const error = computed(() => !validation.value?.success ? validation.value?.error : undefined)

  const allIssues = computed(() => [...(error.value?.issues ?? []), ...customIssues.value])

  const errors = computed(() => errorChain(schema, allIssues.value))

  const fields = computed(() => fieldChain(unref(formName), schema, allIssues.value))

  return reactive({
    getRef: getForm,
    validate,
    form: formRef,
    validation,
    fields,
    errors,
    customIssues,
  }) as Zorm<Schema>
}
