import React, { useState } from "react";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AuthPageProps = {
  initialMode?: "login" | "register" | "forgot-password";
};

const AuthPage: React.FC<AuthPageProps> = ({ initialMode = "login" }) => {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot-password">(initialMode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-2xl bg-background/60 p-6 rounded-lg shadow-lg z-10 flex gap-6">
        <div className="hidden md:flex flex-col items-center justify-center w-1/3 p-4">
          <img src="/logo.png" alt="Paroisse" className="w-24 h-24 object-contain" />
          <h2 className="mt-4 text-xl font-semibold">Paroisse</h2>
          <p className="text-sm text-muted-foreground mt-2">Bienvenue — connectez-vous ou inscrivez-vous</p>
        </div>

        <div className="w-full md:w-2/3">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login" className="text-xs">Connexion</TabsTrigger>
              <TabsTrigger value="register" className="text-xs">Inscription</TabsTrigger>
              <TabsTrigger value="forgot-password" className="text-xs">Mot de passe</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4">
              <LoginForm 
                onSuccess={() => setActiveTab("login")} 
                onForgotPassword={() => setActiveTab("forgot-password")}
              />
            </TabsContent>

            <TabsContent value="register" className="mt-4">
              <RegisterForm 
                onSuccess={() => setActiveTab("register")} 
                onSwitchToLogin={() => setActiveTab("login")}
              />
            </TabsContent>

            <TabsContent value="forgot-password" className="mt-4">
              <ForgotPasswordForm 
                onSuccess={() => setActiveTab("login")} 
                onSwitchToLogin={() => setActiveTab("login")}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
