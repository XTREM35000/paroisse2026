import React, { useState } from "react";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";

type AuthPageProps = {
  initialMode?: "login" | "register";
};

const AuthPage: React.FC<AuthPageProps> = ({ initialMode = "login" }) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);

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
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">{mode === "login" ? "Connexion" : "Inscription"}</h1>
            <div className="space-x-2">
              <button onClick={() => setMode("login")} className={`px-3 py-1 rounded ${mode === "login" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Connexion</button>
              <button onClick={() => setMode("register")} className={`px-3 py-1 rounded ${mode === "register" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Inscription</button>
            </div>
          </div>

          {mode === "login" ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
