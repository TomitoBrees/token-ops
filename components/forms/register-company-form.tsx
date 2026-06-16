'use client'

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useTRPC } from "@/trpc/client"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'] as const

type CompanySize = (typeof COMPANY_SIZES)[number]

type RegisterCompanyFormProps = React.ComponentProps<"div">

export function RegisterCompanyForm({
  className,
  ...props
}: RegisterCompanyFormProps) {
  const router = useRouter()
  const trpc = useTRPC()
  const [name, setName] = useState('')
  const [size, setSize] = useState<CompanySize | ''>('')
  const [error, setError] = useState<string | null>(null)

  const createCompany = useMutation(
    trpc.company.createCompany.mutationOptions({
      onSuccess: () => {
        router.push('/')
        router.refresh()
      },
      onError: (err) => {
        setError(err.message)
      },
    }),
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!size) return

    setError(null)
    createCompany.mutate({ name, size })
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Register your company</CardTitle>
          <CardDescription>
            Enter your company details below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Company name</FieldLabel>
                <Input id="name" type="text" placeholder="Feel Good Inc." value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="size">Company size</FieldLabel>
                <Select value={size} onValueChange={(value) => setSize(value as CompanySize)}>
                <SelectTrigger id="size">
                  <SelectValue placeholder="Select team size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="500+">500+ employees</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              </Field>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Field>
                <Button type="submit" disabled={createCompany.isPending}>
                  {createCompany.isPending ? 'Registering...' : 'Register company'}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
