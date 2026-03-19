import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminFeedbackPanel } from "@/components/admin/AdminFeedbackPanel";
import { AdminAddSubscriptionModal } from "@/components/admin/AdminAddSubscriptionModal";
import { AdminSubscriptionManagement } from "@/components/admin/AdminSubscriptionManagement";
import {
  Shield, 
  Users, 
  Trash2, 
  AlertTriangle, 
  Loader2, 
  CreditCard, 
  MessageSquare,
  Plus,
  Settings2,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { errorMessageOrValue } from "@/lib/error";

interface UserData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  status: string | null;
  subscription_count: number;
}

const Admin = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddSubModalOpen, setIsAddSubModalOpen] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setIsLoading(true);
    
    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      toast.error("Failed to fetch users");
      console.error("Supabase Çekme Hatası:", errorMessageOrValue(profilesError));
      setIsLoading(false);
      return;
    }

    // Get subscription counts for each user
    const usersWithCounts: UserData[] = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { count } = await supabase
          .from("subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.id);

        return {
          ...profile,
          subscription_count: count || 0,
        };
      })
    );

    setUsers(usersWithCounts);
    setIsLoading(false);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsDeleting(true);
    
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", selectedUser.id);

    if (error) {
      toast.error("Failed to delete user");
      console.error("Supabase Çekme Hatası:", errorMessageOrValue(error));
    } else {
      toast.success("User deleted successfully");
      fetchUsers();
    }

    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if not admin
  if (!authLoading && !isAdmin) {
    toast.error("Access denied. Admin only.");
    return <Navigate to="/control" replace />;
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      
      <main className="pt-24 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl ruby-gradient flex items-center justify-center shadow-ruby">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Kullanıcıları ve abonelikleri yönetin</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsAddSubModalOpen(true)}
                className="ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Subscription for User
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="glass-card rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="font-display text-2xl font-bold">{users.length}</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Subscriptions</p>
                <p className="font-display text-2xl font-bold">
                  {users.reduce((sum, u) => sum + u.subscription_count, 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full max-w-xl grid-cols-3">
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="gap-2">
                <Settings2 className="w-4 h-4" />
                Subscription Management
              </TabsTrigger>
              <TabsTrigger value="feedback" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Feedback
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users">
              <div className="glass-card rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Subscriptions</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((userData) => {
                      return (
                        <TableRow key={userData.id} className="border-border">
                          <TableCell className="font-medium">
                            {userData.first_name} {userData.last_name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {userData.email || "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(userData.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                              {userData.status || "free"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1">
                              <CreditCard className="w-4 h-4 text-muted-foreground" />
                              {userData.subscription_count}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setSelectedUser(userData);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {users.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    No users found
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Subscription Management Tab */}
            <TabsContent value="subscriptions">
              <AdminSubscriptionManagement />
            </TabsContent>

            {/* Feedback Tab */}
            <TabsContent value="feedback">
              <AdminFeedbackPanel />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.first_name} {selectedUser?.last_name}? 
              This will remove all their data including subscriptions.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Subscription Modal */}
      <AdminAddSubscriptionModal
        open={isAddSubModalOpen}
        onOpenChange={setIsAddSubModalOpen}
        onSuccess={fetchUsers}
      />
    </div>
  );
};

export default Admin;
