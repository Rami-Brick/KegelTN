import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { loginWithAccessKey } from '@/services/auth'

interface Props {
  className?: string
  onLogin: () => void
}

export function LoginForm({ className, onLogin, ...props }: Props) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!key.trim()) return
    setLoading(true)
    setError('')
    try {
      await loginWithAccessKey(key.trim())
      onLogin()
    } catch (e) {
      setError('Invalid access key. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">💪</div>
          <CardTitle className="text-xl">Welcome to Kegel Pro</CardTitle>
          <CardDescription>
            Enter your access key to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="access-key">Access Key</FieldLabel>
                <Input
                  id="access-key"
                  type="text"
                  placeholder="Enter your access key"
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  required
                />
                {error && <FieldError>{error}</FieldError>}
              </Field>
              <Field>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Verifying...' : 'Access My Program'}
                </Button>
              </Field>
              <Field>
                <p className="text-center text-sm text-muted-foreground">
                  Don't have a key? Contact your coach.
                </p>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}