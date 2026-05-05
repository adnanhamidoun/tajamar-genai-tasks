import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Camera, BarChart3, Brain } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="w-full border-b border-border/40 bg-background/80 dail-glass sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg dail-gradient flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Nutri<span className="text-red-500">Snap</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="dail-gradient text-white hover:opacity-90"
              >
                Pruébalo Gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="py-20 sm:py-32 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-50 dark:bg-red-900/20 px-4 py-1.5 text-sm text-red-700 dark:text-red-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Powered by GPT-4o Vision
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
              Tu comida.{" "}
              <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                Una foto.
              </span>
              <br />
              Análisis completo al instante.
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              dail AI analiza tu comida con inteligencia artificial y te da
              macros, consejos y recomendaciones de ejercicio en{" "}
              <strong>menos de 10 segundos</strong>.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="dail-gradient text-white text-lg px-8 hover:opacity-90 transition-opacity"
                >
                  📷 Empieza Gratis
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="text-lg px-8">
                  Tengo una cuenta
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-muted/30 border-y border-border/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">¿Cómo funciona?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Tres pasos. Sin fricción. Sin registros manuales.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Camera,
                  title: "1. Fotografía",
                  description:
                    "Toma una foto de tu plato. Nuestra IA reconoce ingredientes, porciones y métodos de cocción.",
                  emoji: "📸",
                },
                {
                  icon: BarChart3,
                  title: "2. Análisis IA",
                  description:
                    "En menos de 10 segundos: calorías, proteínas, carbos, grasas y un consejo personalizado.",
                  emoji: "📊",
                },
                {
                  icon: Brain,
                  title: "3. Coach Personal",
                  description:
                    "Recibe recomendaciones de ejercicio específicas para compensar las calorías ingeridas.",
                  emoji: "🧠",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="relative group rounded-lg border border-border bg-card p-8 hover:border-red-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/5"
                >
                  <div className="h-12 w-12 rounded-lg dail-gradient flex items-center justify-center mb-6">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold">
              ¿Listo para transformar tu nutrición?
            </h2>
            <p className="text-muted-foreground">
              Únete gratis y empieza a trackear tu comida con una simple foto.
            </p>
            <Link href="/register">
              <Button
                size="lg"
                className="dail-gradient text-white text-lg px-10 hover:opacity-90 transition-opacity"
              >
                Crear Cuenta Gratis
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg dail-gradient flex items-center justify-center">
              <Shield className="h-3 w-3 text-white" />
            </div>
            <span>
              dail AI © {new Date().getFullYear()}
            </span>
          </div>
          <p>Hecho con 💚 y GPT-4o Vision</p>
        </div>
      </footer>
    </div>
  );
}
