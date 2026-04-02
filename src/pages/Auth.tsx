
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
export default function Auth() {
import { traducirError } from "@/lib/errorTranslator";
  const [loading, setLoading] = useState(false);
import { traducirError } from "@/lib/errorTranslator";
  const [email, setEmail] = useState("");
import { traducirError } from "@/lib/errorTranslator";
  const [password, setPassword] = useState("");
import { traducirError } from "@/lib/errorTranslator";
  const [nombre, setNombre] = useState("");
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const handleLogin = async (e: React.FormEvent) => {
import { traducirError } from "@/lib/errorTranslator";
    e.preventDefault();
import { traducirError } from "@/lib/errorTranslator";
    setLoading(true);
import { traducirError } from "@/lib/errorTranslator";
    const { error } = await supabase.auth.signInWithPassword({ email, password });
import { traducirError } from "@/lib/errorTranslator";
    if (error) toast.error(error.message);
import { traducirError } from "@/lib/errorTranslator";
    else toast.success("¡Bienvenido!");
import { traducirError } from "@/lib/errorTranslator";
    setLoading(false);
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const handleSignup = async (e: React.FormEvent) => {
import { traducirError } from "@/lib/errorTranslator";
    e.preventDefault();
import { traducirError } from "@/lib/errorTranslator";
    setLoading(true);
import { traducirError } from "@/lib/errorTranslator";
    const { error } = await supabase.auth.signUp({
import { traducirError } from "@/lib/errorTranslator";
      email,
import { traducirError } from "@/lib/errorTranslator";
      password,
import { traducirError } from "@/lib/errorTranslator";
      options: {
import { traducirError } from "@/lib/errorTranslator";
        data: { nombre },
import { traducirError } from "@/lib/errorTranslator";
        emailRedirectTo: window.location.origin,
import { traducirError } from "@/lib/errorTranslator";
      },
import { traducirError } from "@/lib/errorTranslator";
    });
import { traducirError } from "@/lib/errorTranslator";
    if (error) toast.error(error.message);
import { traducirError } from "@/lib/errorTranslator";
    else toast.success("Revisa tu email para confirmar tu cuenta");
import { traducirError } from "@/lib/errorTranslator";
    setLoading(false);
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  return (
import { traducirError } from "@/lib/errorTranslator";
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
import { traducirError } from "@/lib/errorTranslator";
      <div className="w-full max-w-md animate-fade-in">
import { traducirError } from "@/lib/errorTranslator";
        <div className="flex items-center justify-center gap-3 mb-8">
import { traducirError } from "@/lib/errorTranslator";
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
import { traducirError } from "@/lib/errorTranslator";
            <FileText className="h-5 w-5 text-primary-foreground" />
import { traducirError } from "@/lib/errorTranslator";
          </div>
import { traducirError } from "@/lib/errorTranslator";
          <h1 className="text-2xl font-bold text-foreground">FacturaPro</h1>
import { traducirError } from "@/lib/errorTranslator";
        </div>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
        <Card>
import { traducirError } from "@/lib/errorTranslator";
          <CardHeader className="text-center">
import { traducirError } from "@/lib/errorTranslator";
            <CardTitle>Accede a tu cuenta</CardTitle>
import { traducirError } from "@/lib/errorTranslator";
            <CardDescription>Sistema de facturación profesional</CardDescription>
import { traducirError } from "@/lib/errorTranslator";
          </CardHeader>
import { traducirError } from "@/lib/errorTranslator";
          <CardContent>
import { traducirError } from "@/lib/errorTranslator";
            <Tabs defaultValue="login">
import { traducirError } from "@/lib/errorTranslator";
              <TabsList className="grid w-full grid-cols-2">
import { traducirError } from "@/lib/errorTranslator";
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
import { traducirError } from "@/lib/errorTranslator";
                <TabsTrigger value="signup">Registrarse</TabsTrigger>
import { traducirError } from "@/lib/errorTranslator";
              </TabsList>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
              <TabsContent value="login">
import { traducirError } from "@/lib/errorTranslator";
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
import { traducirError } from "@/lib/errorTranslator";
                  <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                    <Label htmlFor="login-email">Email</Label>
import { traducirError } from "@/lib/errorTranslator";
                    <Input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@email.com" />
import { traducirError } from "@/lib/errorTranslator";
                  </div>
import { traducirError } from "@/lib/errorTranslator";
                  <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                    <Label htmlFor="login-password">Contraseña</Label>
import { traducirError } from "@/lib/errorTranslator";
                    <Input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
import { traducirError } from "@/lib/errorTranslator";
                  </div>
import { traducirError } from "@/lib/errorTranslator";
                  <Button type="submit" className="w-full" disabled={loading}>
import { traducirError } from "@/lib/errorTranslator";
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
import { traducirError } from "@/lib/errorTranslator";
                    Iniciar Sesión
import { traducirError } from "@/lib/errorTranslator";
                  </Button>
import { traducirError } from "@/lib/errorTranslator";
                </form>
import { traducirError } from "@/lib/errorTranslator";
              </TabsContent>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
              <TabsContent value="signup">
import { traducirError } from "@/lib/errorTranslator";
                <form onSubmit={handleSignup} className="space-y-4 mt-4">
import { traducirError } from "@/lib/errorTranslator";
                  <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                    <Label htmlFor="signup-nombre">Nombre</Label>
import { traducirError } from "@/lib/errorTranslator";
                    <Input id="signup-nombre" value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Tu nombre" />
import { traducirError } from "@/lib/errorTranslator";
                  </div>
import { traducirError } from "@/lib/errorTranslator";
                  <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                    <Label htmlFor="signup-email">Email</Label>
import { traducirError } from "@/lib/errorTranslator";
                    <Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@email.com" />
import { traducirError } from "@/lib/errorTranslator";
                  </div>
import { traducirError } from "@/lib/errorTranslator";
                  <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                    <Label htmlFor="signup-password">Contraseña</Label>
import { traducirError } from "@/lib/errorTranslator";
                    <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" />
import { traducirError } from "@/lib/errorTranslator";
                  </div>
import { traducirError } from "@/lib/errorTranslator";
                  <Button type="submit" className="w-full" disabled={loading}>
import { traducirError } from "@/lib/errorTranslator";
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
import { traducirError } from "@/lib/errorTranslator";
                    Crear Cuenta
import { traducirError } from "@/lib/errorTranslator";
                  </Button>
import { traducirError } from "@/lib/errorTranslator";
                </form>
import { traducirError } from "@/lib/errorTranslator";
              </TabsContent>
import { traducirError } from "@/lib/errorTranslator";
            </Tabs>
import { traducirError } from "@/lib/errorTranslator";
          </CardContent>
import { traducirError } from "@/lib/errorTranslator";
        </Card>
import { traducirError } from "@/lib/errorTranslator";
      </div>
import { traducirError } from "@/lib/errorTranslator";
    </div>
import { traducirError } from "@/lib/errorTranslator";
  );
import { traducirError } from "@/lib/errorTranslator";
