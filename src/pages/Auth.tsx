import { useState, useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, Loader2, Eye, EyeOff } from 'lucide-react';
import fiscalizLogo from '@/assets/logo-fiscaliz-oficial.png';
import { OnboardingWizard, EMPTY_ONBOARDING, OnboardingData, isOnboardingComplete } from '@/components/auth/OnboardingWizard';

const Auth = forwardRef<HTMLDivElement>(function Auth(_props, ref) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onboarding, setOnboarding] = useState<OnboardingData>(EMPTY_ONBOARDING);
  
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Erro ao entrar',
            description: error.message === 'Invalid login credentials' 
              ? 'Email ou senha incorretos' 
              : error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Bem-vindo!',
            description: 'Login realizado com sucesso.',
          });
        }
      } else {
        if (!fullName.trim()) {
          toast({ title: 'Nome obrigatório', description: 'Por favor, informe seu nome completo.', variant: 'destructive' });
          setIsSubmitting(false);
          return;
        }
        if (!isOnboardingComplete(onboarding)) {
          toast({ title: 'Onboarding incompleto', description: 'Conclua todas as etapas do onboarding antes de continuar.', variant: 'destructive' });
          setIsSubmitting(false);
          return;
        }

        const { error } = await signUp(email, password, fullName, {
          profession: onboarding.profession,
          activityTypes: onboarding.activityTypes,
          areas: onboarding.areas,
          reportTools: onboarding.reportTools,
          trainingFiles: onboarding.trainingFiles,
          initialTemplate: onboarding.initialTemplate,
        });
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Email já cadastrado',
              description: 'Este email já está em uso. Tente fazer login.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro ao cadastrar',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Conta criada!',
            description: 'Você já pode acessar o sistema.',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div ref={ref} className="flex min-h-screen flex-col bg-background safe-area-inset">
      {/* Header with gradient */}
      <div className="fiscaliz-gradient px-6 pb-16 pt-16 text-center relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        </div>
        
        <div className="relative z-10">
          <div className="mx-auto mb-6 flex h-40 w-40 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-md p-3 shadow-xl border border-white/30">
            <img 
              src={fiscalizLogo} 
              alt="Fiscaliz" 
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="text-display text-primary-foreground">FISCALIZ</h1>
          <p className="mt-3 text-caption font-semibold text-primary-foreground/90 tracking-widest uppercase">
            Plataforma Inteligente de Fiscalização
          </p>
        </div>
      </div>

      {/* Auth Card */}
      <div className="flex-1 -mt-8 rounded-t-[2rem] bg-background px-5 pt-8">
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-h1">
              {isLogin ? 'Acessar Sistema' : 'Criar Conta'}
            </CardTitle>
            <CardDescription className="text-body">
              {isLogin 
                ? 'Entre com suas credenciais' 
                : 'Cadastre-se para começar a fiscalizar'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-caption font-semibold uppercase tracking-wide">Nome Completo</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Seu nome completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={!isLogin}
                      autoComplete="name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-caption font-semibold uppercase tracking-wide">Tipo de Identificação (opcional)</Label>
                    <div className="flex gap-2">
                      {[
                        { value: 'cpf', label: 'CPF' },
                        { value: 'cnpj', label: 'CNPJ' },
                      ].map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setIdentificationType(type.value as typeof identificationType)}
                          className={`flex-1 py-3 px-3 text-caption font-semibold rounded-xl border-2 transition-all duration-200 ${
                            identificationType === type.value 
                              ? 'bg-primary text-primary-foreground border-primary shadow-premium-sm' 
                              : 'bg-background border-border/60 hover:bg-accent hover:border-accent'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber" className="text-caption font-semibold uppercase tracking-wide">
                      {identificationType === 'cpf' ? 'CPF' : 'CNPJ'} (opcional)
                    </Label>
                    <Input
                      id="registrationNumber"
                      type="text"
                      placeholder={
                        identificationType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'
                      }
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                    />
                  </div>

                  <SignupExtraFields data={extraData} onChange={setExtraData} />
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-caption font-semibold uppercase tracking-wide">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@goiania.go.gov.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-caption font-semibold uppercase tracking-wide">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-12"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                size="lg"
                variant="premium"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Shield className="mr-2 h-5 w-5" />
                )}
                {isLogin ? 'Entrar' : 'Criar Conta'}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setEmail('');
                  setPassword('');
                  setFullName('');
                  setRegistrationNumber('');
                  setExtraData({ userType: '', institutionalLink: '', institutionName: '', areasOfPractice: [], logoFile: null, city: '', state: '', organName: '', pdfHeaderText: '', customLegislations: [] });
                }}
                className="text-body text-primary font-semibold hover:underline transition-all"
              >
                {isLogin 
                  ? 'Não tem conta? Cadastre-se' 
                  : 'Já tem conta? Faça login'}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-10 pb-10 text-center">
          <p className="text-caption text-muted-foreground">
            Sistema de Fiscalização Sanitária
          </p>
          <p className="text-micro text-muted-foreground/70 uppercase tracking-wider mt-1">
            © 2026 Prefeitura de Goiânia
          </p>
        </div>
      </div>
    </div>
  );
});

export default Auth;
