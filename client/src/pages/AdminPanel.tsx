import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Shield, 
  Activity, 
  Settings,
  MoreHorizontal,
  UserCheck,
  UserX,
  Crown
} from "lucide-react";

export default function AdminPanel() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: isAuthenticated && user?.role === 'admin',
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return await apiRequest('PATCH', `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User updated",
        description: "User role has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUserRoleMutation.mutate({ userId, role: newRole });
  };

  if (isLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const adminStats = {
    totalUsers: users?.length || 0,
    adminUsers: users?.filter((u: any) => u.role === 'admin').length || 0,
    activeUsers: users?.filter((u: any) => u.role !== 'admin').length || 0,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Shield className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Admin Panel</h2>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Manage users, system settings, and monitor platform activity
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Admin Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border border-neutral-200 dark:border-neutral-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {adminStats.totalUsers}
                </div>
                <p className="text-xs text-muted-foreground">
                  Registered platform users
                </p>
              </CardContent>
            </Card>

            <Card className="border border-neutral-200 dark:border-neutral-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {adminStats.adminUsers}
                </div>
                <p className="text-xs text-muted-foreground">
                  Users with admin privileges
                </p>
              </CardContent>
            </Card>

            <Card className="border border-neutral-200 dark:border-neutral-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {adminStats.activeUsers}
                </div>
                <p className="text-xs text-muted-foreground">
                  Standard platform users
                </p>
              </CardContent>
            </Card>
          </div>

          {/* User Management */}
          <Card className="border border-neutral-200 dark:border-neutral-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>User Management</span>
              </CardTitle>
              <CardDescription>
                Manage user accounts, roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 animate-pulse">
                      <div className="h-10 w-10 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4"></div>
                        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3"></div>
                      </div>
                      <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              ) : users?.length === 0 ? (
                <div className="text-center py-8">
                  <UserX className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-500 dark:text-neutral-400">No users found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>MFA</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((userItem: any) => (
                      <TableRow key={userItem.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-3">
                            <img
                              src={userItem.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${userItem.firstName}${userItem.lastName}`}
                              alt="Profile"
                              className="h-8 w-8 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                {userItem.firstName} {userItem.lastName}
                              </div>
                              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                ID: {userItem.id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-neutral-600 dark:text-neutral-300">
                          {userItem.email || 'No email'}
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={userItem.role} 
                            onValueChange={(value) => handleRoleChange(userItem.id, value)}
                            disabled={userItem.id === user?.id || updateUserRoleMutation.isPending}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-neutral-600 dark:text-neutral-300">
                          {new Date(userItem.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={userItem.mfaEnabled ? "default" : "secondary"}>
                            {userItem.mfaEnabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
