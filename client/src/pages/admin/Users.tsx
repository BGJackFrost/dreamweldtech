import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Users, 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Search,
  UserCog,
  Mail,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

const ROLES = [
  { value: "user", label: "Người dùng", icon: Users, color: "bg-gray-100 text-gray-800", description: "Chỉ xem nội dung công khai" },
  { value: "editor", label: "Biên tập viên", icon: Shield, color: "bg-blue-100 text-blue-800", description: "Thêm/sửa sản phẩm, tin tức, FAQ" },
  { value: "admin", label: "Quản trị viên", icon: ShieldCheck, color: "bg-green-100 text-green-800", description: "Toàn quyền quản lý hệ thống" },
];

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  
  // Role change dialog
  const [selectedUser, setSelectedUser] = useState<{
    id: number;
    name: string | null;
    email: string | null;
    role: string;
  } | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  
  // Create user dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<string>("user");
  
  // Delete confirmation
  const [userToDelete, setUserToDelete] = useState<{
    id: number;
    name: string | null;
  } | null>(null);

  const { data: users, refetch } = trpc.users.list.useQuery();
  
  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Đã cập nhật quyền người dùng");
      refetch();
      setSelectedUser(null);
    },
    onError: (error) => toast.error(error.message),
  });
  
  const createUserMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("Đã tạo người dùng mới");
      refetch();
      setIsCreateDialogOpen(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserRole("user");
    },
    onError: (error) => toast.error(error.message),
  });
  
  const deleteUserMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("Đã xóa người dùng");
      refetch();
      setUserToDelete(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = () => {
    if (!selectedUser || !newRole) return;
    
    if (selectedUser.id === currentUser?.id) {
      toast.error("Bạn không thể thay đổi quyền của chính mình");
      return;
    }

    updateRoleMutation.mutate({
      userId: selectedUser.id,
      role: newRole as "user" | "editor" | "admin",
    });
  };
  
  const handleCreateUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    
    createUserMutation.mutate({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole as "user" | "editor" | "admin",
    });
  };
  
  const handleDeleteUser = () => {
    if (!userToDelete) return;
    deleteUserMutation.mutate({ id: userToDelete.id });
  };

  const getRoleBadge = (role: string) => {
    const roleInfo = ROLES.find((r) => r.value === role);
    if (!roleInfo) return null;
    return (
      <Badge className={roleInfo.color}>
        <roleInfo.icon className="h-3 w-3 mr-1" />
        {roleInfo.label}
      </Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  type UserType = NonNullable<typeof users>[0];
  const userCounts = {
    total: users?.length || 0,
    admin: users?.filter((u: UserType) => u.role === "admin").length || 0,
    editor: users?.filter((u: UserType) => u.role === "editor").length || 0,
    user: users?.filter((u: UserType) => u.role === "user").length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Người Dùng</h1>
          <p className="text-muted-foreground">
            Quản lý tài khoản và phân quyền cho người dùng hệ thống
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm người dùng
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{userCounts.total}</p>
              <p className="text-sm text-muted-foreground">Tổng người dùng</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{userCounts.admin}</p>
              <p className="text-sm text-muted-foreground">Quản trị viên</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{userCounts.editor}</p>
              <p className="text-sm text-muted-foreground">Biên tập viên</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{userCounts.user}</p>
              <p className="text-sm text-muted-foreground">Người dùng</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Permissions Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Phân Quyền Hệ Thống
          </CardTitle>
          <CardDescription>
            Mô tả chi tiết quyền hạn của từng vai trò trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ROLES.map((role) => (
              <div
                key={role.value}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${role.color}`}>
                    <role.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{role.label}</p>
                    <p className="text-xs text-muted-foreground">{role.value}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{role.description}</p>
                <div className="mt-3 text-xs space-y-1">
                  {role.value === "admin" && (
                    <>
                      <p className="text-green-600">✓ Quản lý người dùng</p>
                      <p className="text-green-600">✓ Cài đặt hệ thống</p>
                      <p className="text-green-600">✓ Xem thống kê</p>
                      <p className="text-green-600">✓ Quản lý nội dung</p>
                    </>
                  )}
                  {role.value === "editor" && (
                    <>
                      <p className="text-red-500">✗ Quản lý người dùng</p>
                      <p className="text-red-500">✗ Cài đặt hệ thống</p>
                      <p className="text-green-600">✓ Xem thống kê</p>
                      <p className="text-green-600">✓ Quản lý nội dung</p>
                    </>
                  )}
                  {role.value === "user" && (
                    <>
                      <p className="text-red-500">✗ Quản lý người dùng</p>
                      <p className="text-red-500">✗ Cài đặt hệ thống</p>
                      <p className="text-red-500">✗ Xem thống kê</p>
                      <p className="text-red-500">✗ Quản lý nội dung</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Danh Sách Người Dùng</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Lọc theo quyền" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người dùng</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Quyền</TableHead>
                <TableHead>Đăng nhập gần nhất</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.map((user: UserType) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-semibold text-primary">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="font-medium">
                          {user.name || "Chưa đặt tên"}
                          {user.id === currentUser?.id && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Bạn
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {user.id}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {user.email || "Chưa có email"}
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatDate(user.lastSignedIn)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(user.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setNewRole(user.role);
                        }}
                        disabled={user.id === currentUser?.id}
                      >
                        <UserCog className="h-4 w-4 mr-1" />
                        Phân quyền
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setUserToDelete({ id: user.id, name: user.name })}
                        disabled={user.id === currentUser?.id || user.role === "admin"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!filteredUsers || filteredUsers.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      Không tìm thấy người dùng nào
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Người Dùng Mới</DialogTitle>
            <DialogDescription>
              Tạo tài khoản mới cho người dùng trong hệ thống
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Họ và tên</Label>
              <Input
                id="name"
                placeholder="Nhập họ và tên"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Nhập địa chỉ email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Quyền hạn</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn quyền hạn" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center gap-2">
                        <role.icon className="h-4 w-4" />
                        {role.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newUserRole && (
                <p className="text-xs text-muted-foreground">
                  {ROLES.find((r) => r.value === newUserRole)?.description}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleCreateUser}
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? "Đang tạo..." : "Tạo người dùng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thay Đổi Quyền Người Dùng</DialogTitle>
            <DialogDescription>
              Thay đổi quyền hạn cho người dùng "{selectedUser?.name || selectedUser?.email}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Quyền hiện tại</p>
                {selectedUser && getRoleBadge(selectedUser.role)}
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Quyền mới</p>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn quyền mới" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          <role.icon className="h-4 w-4" />
                          {role.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {newRole && (
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-sm">
                    {ROLES.find((r) => r.value === newRole)?.description}
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              Hủy
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={!newRole || newRole === selectedUser?.role || updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? "Đang cập nhật..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa người dùng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa người dùng "{userToDelete?.name || "Chưa đặt tên"}"? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
