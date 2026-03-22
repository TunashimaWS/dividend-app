import { useState } from 'react'
import { FirebaseError } from 'firebase/app'
import { login } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

function firebaseErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'メールアドレスまたはパスワードが正しくありません'
      case 'auth/too-many-requests':
        return 'ログイン試行が多すぎます。しばらく時間をおいてから再試行してください'
      case 'auth/invalid-api-key':
      case 'auth/app-not-authorized':
        return `アプリの設定に問題があります（${err.code}）`
      case 'auth/network-request-failed':
        return 'ネットワークエラーが発生しました。接続を確認してください'
      default:
        return `ログインに失敗しました（${err.code}）`
    }
  }
  return 'ログインに失敗しました'
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(firebaseErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      {/* Logo area */}
      <div className="mb-8 text-center">
        <img
          src="/dividend-app/logo.jpg"
          alt="ロゴ"
          className="h-20 mx-auto mb-4 dark:invert"
        />
        <h1 className="text-2xl font-bold tracking-tight">資産管理アプリ</h1>
        <p className="text-sm text-muted-foreground mt-1">Tsunashima Works</p>
      </div>

      {/* Login form */}
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-12"
                placeholder="example@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-12"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={loading}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
