import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#020617]">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="bg-[#7c3aed] rounded-xl p-2">
              <Play className="h-6 w-6 text-white fill-white" />
            </div>
            <span className="text-2xl font-black text-[#7c3aed]">MemeTube</span>
          </Link>
        </div>

        <Card className="border shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold">Recuperar senha</CardTitle>
            <CardDescription>
              Digite seu email e enviaremos um link para redefinir sua senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center py-6">
                <div className="bg-[#7c3aed] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Email enviado!</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Enviamos um link de recuperação para <strong>{email}</strong>.
                  Verifique sua caixa de entrada.
                </p>
                <Link to="/login">
                  <Button variant="outline" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email da conta</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="h-10"
                  />
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  className="w-full gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </Button>

                <div className="text-center">
                  <Link
                    to="/login"
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Voltar ao login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
