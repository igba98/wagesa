"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/store/app-store";
import { Role } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { getRoleDisplayName } from "@/lib/roles";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("OPERATION");
  const [isLoading, setIsLoading] = useState(false);
  const login = useApp((s) => s.login);
  const router = useRouter();

  const handleLogin = async () => {
    if (!name.trim() || !email.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      login({ name: name.trim(), email: email.trim(), role });
      router.replace("/dashboard");
    } catch (error) {
      alert("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogins = [
    { name: "Asha M.", email: "asha@wagesa.co", role: "SUPER_ADMIN" as Role },
    { name: "Jonas K.", email: "jonas@wagesa.co", role: "OPERATION" as Role },
    {
      name: "Neema D.",
      email: "neema@wagesa.co",
      role: "STORE_KEEPER" as Role,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4 md:p-6">
      <div className="w-full max-w-md space-y-4 md:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="shadow-xl border-0 bg-card/95 backdrop-blur-sm">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to access the Wegesa inventory system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Asha M."
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@wagesa.co"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as Role)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    <SelectItem value="OPERATION">Operation</SelectItem>
                    <SelectItem value="STORE_KEEPER">Store Keeper</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full mt-6"
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="shadow-lg border-0 bg-muted/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick Login</CardTitle>
              <CardDescription>
                Click any user below to login instantly (demo purposes)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickLogins.map((user) => (
                <Button
                  key={user.email}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => {
                    setName(user.name);
                    setEmail(user.email);
                    setRole(user.role);
                  }}
                  disabled={isLoading}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {user.email} • {getRoleDisplayName(user.role)}
                    </span>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
