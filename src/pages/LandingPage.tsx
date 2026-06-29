import { Link } from 'react-router-dom';
import { Play, Laugh, Heart, MessageCircle, Users, Zap, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Play,
    title: 'Vídeos Curtos',
    desc: 'Compartilhe memes e reações em vídeo de forma rápida e fácil.',
    color: '#7c3aed',
  },
  {
    icon: Heart,
    title: 'Curtidas em Tempo Real',
    desc: 'Veja as curtidas atualizando instantaneamente enquanto o humor viraliza.',
    color: '#ec4899',
  },
  {
    icon: MessageCircle,
    title: 'Comentários e Chat',
    desc: 'Interaja com outros usuários através de comentários e mensagens privadas.',
    color: '#facc15',
  },
  {
    icon: Users,
    title: 'Conexões',
    desc: 'Conecte-se com pessoas que compartilham seu estilo de humor.',
    color: '#7c3aed',
  },
  {
    icon: Zap,
    title: 'Feed Personalizado',
    desc: 'Descubra o melhor conteúdo humorístico da comunidade.',
    color: '#ec4899',
  },
  {
    icon: Star,
    title: 'Perfil Completo',
    desc: 'Mostre seu estilo de humor, publique e gerencie seu conteúdo.',
    color: '#facc15',
  },
];

const categories = ['Meme', 'Reação', 'Paródia', 'Stand-up', 'Pegadinha', 'Fail', 'Compilação', 'Animação'];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32 bg-[#020617]">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="mb-6 inline-flex rounded-full bg-[#7c3aed] px-4 py-2 text-sm font-semibold">
            A nova rede social do humor
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span className="text-[#7c3aed]">MemeTube</span>
            <br />
            <span className="text-white text-4xl md:text-5xl">
              O Humor em Vídeo
            </span>
          </h1>

          <p className="text-xl text-[#d1d5db] max-w-2xl mx-auto mb-10">
            Compartilhe memes, reações e conteúdos de humor em vídeo.
            Conecte-se com quem faz você rir.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button variant="gradient" size="xl" className="gap-2 w-full sm:w-auto">
                <Laugh className="h-5 w-5" />
                Começar Agora
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="xl" className="w-full sm:w-auto gap-2">
                Já tenho conta
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-[#020617]">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-white">
              Tudo que você precisa para compartilhar o humor
            </h2>
            <p className="text-[#d1d5db] text-lg max-w-xl mx-auto">
              Uma plataforma completa pensada do zero para quem vive de humor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <Card key={title} className="border hover:shadow-lg transition-all hover:-translate-y-1 group">
                <CardContent className="p-6">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${color}22` }}
                  >
                    <Icon className="h-6 w-6" style={{ color }} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 bg-[#020617]">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-black mb-4 text-white">
            Explore as categorias
          </h2>
          <p className="text-[#d1d5db] mb-8">
            De memes clássicos a reações épicas — tem de tudo aqui.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map(cat => (
              <Badge
                key={cat}
                variant="outline"
                className="text-sm px-4 py-2 border-white/10 text-white"
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-[#020617]">
        <div className="container mx-auto">
          <div className="rounded-3xl border border-white/10 bg-[#111827] p-12 text-center text-white">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Pronto para começar?
            </h2>
            <p className="text-[#d1d5db] text-lg mb-8 max-w-xl mx-auto">
              Crie sua conta e publique seus vídeos de humor com uma interface limpa e sólida.
            </p>
            <Link to="/register">
              <Button
                size="xl"
                className="bg-[#7c3aed] text-white hover:bg-[#5b21b6] font-bold gap-2"
              >
                Criar minha conta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 bg-[#020617]">
        <div className="container mx-auto text-center">
          <p className="text-sm text-[#9ca3af]">
            © 2025 MemeTube. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
