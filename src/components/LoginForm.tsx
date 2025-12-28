import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const LoginForm: React.FC = () => {
  const { login, signInWithProvider } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 w-full max-w-md">
      <div>
        <label className="block text-sm">Email</label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
      </div>
      <div>
        <label className="block text-sm">Mot de passe</label>
        <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? "Connexion..." : "Se connecter"}</Button>
        <Button variant="outline" type="button" onClick={() => signInWithProvider("google")}>Google</Button>
      </div>
    </form>
  );
};

export default LoginForm;
