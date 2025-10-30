import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Users, Plus, Trash2, Mail, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const userSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type UserForm = z.infer<typeof userSchema>;

type User = {
  id: string;
  email: string;
  createdAt: string;
};

export default function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const form = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserForm) => {
      const response = await apiRequest("POST", "/api/users", {
        email: data.email,
        password: data.password,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário criado com sucesso!",
        description: "O novo administrador já pode fazer login",
      });
      form.reset();
      setShowNewUserForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário excluído",
        description: "O administrador foi removido do sistema",
      });
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserForm) => {
    createUserMutation.mutate(data);
  };

  const canDeleteUser = (user: User) => {
    return currentUser?.id !== user.id;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Gerenciar Usuários</h2>
          <p className="text-muted-foreground">
            Adicione ou remova administradores do sistema
          </p>
        </div>
        <Button
          onClick={() => setShowNewUserForm(true)}
          data-testid="button-add-user"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-lg bg-primary/10">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-sm text-muted-foreground">
              Administrador{users.length !== 1 ? "es" : ""} Cadastrado{users.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum usuário cadastrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {user.email}
                      {currentUser?.id === user.id && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          Você
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Ativo</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {canDeleteUser(user) ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUserToDelete(user)}
                        data-testid={`button-delete-user-${user.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Não é possível excluir
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Dialog: Novo Usuário */}
      <Dialog open={showNewUserForm} onOpenChange={setShowNewUserForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Administrador</DialogTitle>
            <DialogDescription>
              Adicione um novo usuário que poderá acessar o sistema
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@exemplo.com"
                {...form.register("email")}
                data-testid="input-new-user-email"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  {...form.register("password")}
                  data-testid="input-new-user-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <Lock className="w-4 h-4" />
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Digite a senha novamente"
                {...form.register("confirmPassword")}
                data-testid="input-confirm-password"
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewUserForm(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createUserMutation.isPending}
                data-testid="button-submit-new-user"
              >
                {createUserMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Criar Usuário
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar Exclusão */}
      <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o usuário{" "}
              <strong>{userToDelete?.email}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setUserToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
              disabled={deleteUserMutation.isPending}
              data-testid="button-confirm-delete-user"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
