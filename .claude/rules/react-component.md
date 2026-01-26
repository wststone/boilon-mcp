---
description:
globs: *.tsx
alwaysApply: false
---

# React component code style guide

## Import Style Guide

- Always use named export instead of default export for react component. For example `export function Component` instead of `export default function Component`.

## Component Styling Guide

- Always use tailwindcss v4 unless there is something you need to do that tailwind doesn't support

- When doing conditional classnames always use `import { cn } from "@/ui/lib/utils";` instead of template string

- This project uses shadcn components with the exception of the `Tooltip` component

## Form Guide

- When implementing forms that mutates server resources, use `useAppForm` from `@/ui/form` for validation, state, and submission

There are built-in field components `TextField`, and form components `SubmitButton`

HighLevel Example:

```tsx
const formSchema = z.object({
	username: z.string().min(2, {
		message: "Username must be at least 2 characters.",
	}),
});

const defaultValues: z.infer<typeof formSchema> = {
	username: "",
};

export function InputForm() {
    const form = useAppForm({
	    validators: { onChange: formSchema },
	    defaultValues: defaultValues,
	    onSubmit: ({ value }) => console.log(value),
	});

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			e.stopPropagation();
			form.handleSubmit();
		},
		[form],
	);

	return (
		<form.AppForm>
			<form className="space-y-6" onSubmit={handleSubmit}>
				<form.AppField name="username">
					{(field) => (
						<field.TextField
							label="Username"
							placeholder="Username"
							required
						/>
					)}
				</form.AppField>
				<form.SubmitButton>Submit</form.SubmitButton>
			</form>
		</form.AppForm>
	);
}
```

Use the HighLevel pattern unless one of these is true:

custom UI not supported by built-in fields

complex layout inside a field

special input behavior (masked input, multi-select, etc.)

LowLevel Example:

```tsx
import { useCallback } from "react";
import { z } from "zod";

import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { useAppForm } from "@/ui/form";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
});

const defaultValues: z.infer<typeof formSchema> = {
	username: "",
};

export function InputForm() {
  const form = useAppForm({
    validators: { onChange: formSchema },
    defaultValues: defaultValues,
    onSubmit: ({ value }) => console.log(value),
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form],
  );
  return (
    <form.AppForm>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <form.AppField
          name="username"
          children={(field) => (
            <field.FormItem>
              <field.FormLabel>Username</field.FormLabel>
              <field.FormControl>
                <Input
                  placeholder="FatahChan"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              </field.FormControl>
              <field.FormDescription>
                This is your public display name.
              </field.FormDescription>
              <field.FormMessage />
            </field.FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </form.AppForm>
  );
}
```

## Dialog Guide

```tsx
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/ui/dialog";



  <Dialog>
   <DialogTrigger asChild>
    <Button>
     <PlusIcon className="w-4 h-4" />
     ...
    </Button>
   </DialogTrigger>
   <DialogContent>
    <DialogHeader>
     <DialogTitle>...</DialogTitle>
    </DialogHeader>
    <DialogDescription>...</DialogDescription>
     <DialogFooter>
      <Button type="submit">
       ...
      </Button>
     </DialogFooter>
    </form>
   </DialogContent>
  </Dialog>
```

Avoid putting 500+ lines of code in one component, break them up to several files

## Empty State Guide

Always use the `Empty` component from the ui library to show empty state

## State Management Guide

- Avoid excessive useState in a single component. Break state up deliberately and normalize when possible.

Prefer Derived State Over Duplicated State

If a piece of state can be computed from another state variable, it should not be stored separately.

Anti-pattern (redundant state):

``` tsx
const [someId, setSomeId] = useState<string | null>(null)
const [open, setOpen] = useState(false)
```

In this example, open does not represent independent information. It is entirely determined by whether someId exists.

Recommended (normalized state):

```tsx
const [someId, setSomeId] = useState<string | null>(null)
const open = !!someId
```