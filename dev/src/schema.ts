import { z } from 'zod'

export const FormSchema = z.object({
  meta: z.object({
    listName: z.string().min(1),
  }),
  todos: z.array(
    z.object({
      task: z.string().min(1),
      priority: z
        .string()
        .refine(
          (val) => {
            return /^[0-9]+$/.test(val.trim())
          },
          { message: 'must use  positive numbers' },
        )
        .transform((s) => {
          return Number(s)
        }),
    }),
  ),
})
