import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, ShieldCheck, ShieldAlert, Users, UserPlus, UserMinus,
  Settings, Eye, Edit, Trash2, Plus, Save, X, Check,
  Loader2, AlertCircle, Info, Lock, Unlock
} from "lucide-react";
import { toast } from "sonner";

// Permission categories for grouping
const PERMISSION_CATEGORIES = {
  dashboard: {
    name: "Dashboard",
    icon: "📊",
    permissions: ["dashboard.view", "dashboard.analytics"]
  },
  products: {
    name: "Sản phẩm",
    icon: "📦",
    permissions: ["products.view", "products.create", "products.edit", "products.delete", "products.categories"]
  },
  news: {
    name: "Tin tức",
    icon: "📰",
    permissions: ["news.view", "news.create", "news.edit", "news.delete", "news.publish"]
  },
  contacts: {
    name: "Liên hệ",
    icon: "📧",
    permissions: ["contacts.view", "contacts.reply", "contacts.delete"]
  },
  quotes: {
    name: "Báo giá",
    icon: "💰",
    permissions: ["quotes.view", "quotes.reply", "quotes.delete"]
  },
  applications: {
    name: "Ứng tuyển",
    icon: "📋",
    permissions: ["applications.view", "applications.manage", "applications.delete"]
  },
  jobs: {
    name: "Tuyển dụng",
    icon: "💼",
    permissions: ["jobs.view", "jobs.create", "jobs.edit", "jobs.delete"]
  },
  casestudies: {
    name: "Case Studies",
    icon: "📁",
    permissions: ["casestudies.view", "casestudies.create", "casestudies.edit", "casestudies.delete"]
  },
  newsletter: {
    name: "Newsletter",
    icon: "📬",
    permissions: ["newsletter.view", "newsletter.export", "newsletter.delete"]
  },
  users: {
    name: "Người dùng",
    icon: "👥",
    permissions: ["users.view", "users.create", "users.edit", "users.delete", "users.roles", "roles.view", "roles.create", "roles.edit", "roles.delete"]
  },
  settings: {
    name: "Cài đặt",
    icon: "⚙️",
    permissions: ["settings.view", "settings.edit", "settings.seo", "settings.security"]
  },
  media: {
    name: "Media",
    icon: "🖼️",
    permissions: ["media.view", "media.upload", "media.delete"]
  },
  reports: {
    name: "Báo cáo",
    icon: "📈",
    permissions: ["reports.view", "reports.export", "reports.schedule"]
  },
  system: {
    name: "Hệ thống",
    icon: "🔧",
    permissions: ["system.logs", "system.backup", "system.maintenance"]
  },
};

// Permission descriptions
const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  "dashboard.view": "Xem dashboard",
  "dashboard.analytics": "Xem thống kê chi tiết",
  "products.view": "Xem sản phẩm",
  "products.create": "Tạo sản phẩm mới",
  "products.edit": "Sửa sản phẩm",
  "products.delete": "Xóa sản phẩm",
  "products.categories": "Quản lý danh mục",
  "news.view": "Xem tin tức",
  "news.create": "Tạo tin tức",
  "news.edit": "Sửa tin tức",
  "news.delete": "Xóa tin tức",
  "news.publish": "Xuất bản tin tức",
  "contacts.view": "Xem liên hệ",
  "contacts.reply": "Trả lời liên hệ",
  "contacts.delete": "Xóa liên hệ",
  "quotes.view": "Xem báo giá",
  "quotes.reply": "Trả lời báo giá",
  "quotes.delete": "Xóa báo giá",
  "applications.view": "Xem đơn ứng tuyển",
  "applications.manage": "Quản lý đơn ứng tuyển",
  "applications.delete": "Xóa đơn ứng tuyển",
  "jobs.view": "Xem việc làm",
  "jobs.create": "Tạo việc làm",
  "jobs.edit": "Sửa việc làm",
  "jobs.delete": "Xóa việc làm",
  "casestudies.view": "Xem case studies",
  "casestudies.create": "Tạo case study",
  "casestudies.edit": "Sửa case study",
  "casestudies.delete": "Xóa case study",
  "newsletter.view": "Xem subscribers",
  "newsletter.export": "Xuất danh sách",
  "newsletter.delete": "Xóa subscriber",
  "users.view": "Xem người dùng",
  "users.create": "Tạo người dùng",
  "users.edit": "Sửa người dùng",
  "users.delete": "Xóa người dùng",
  "users.roles": "Gán vai trò",
  "roles.view": "Xem vai trò",
  "roles.create": "Tạo vai trò",
  "roles.edit": "Sửa vai trò",
  "roles.delete": "Xóa vai trò",
  "settings.view": "Xem cài đặt",
  "settings.edit": "Sửa cài đặt",
  "settings.seo": "Cài đặt SEO",
  "settings.security": "Cài đặt bảo mật",
  "media.view": "Xem media",
  "media.upload": "Upload media",
  "media.delete": "Xóa media",
  "reports.view": "Xem báo cáo",
  "reports.export": "Xuất báo cáo",
  "reports.schedule": "Lập lịch báo cáo",
  "system.logs": "Xem logs hệ thống",
  "system.backup": "Backup dữ liệu",
  "system.maintenance": "Bảo trì hệ thống",
};

interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: string | null;
  isSystem: "true" | "false";
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id: number;
  email: string;
  username: string | null;
  role: string | null;
  isActive: string | null;
}

export default function RoleManagement() {
  // Using sonner toast
  const [activeTab, setActiveTab] = useState("roles");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Form state for new/edit role
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });

  // Queries
  const { data: roles, isLoading: rolesLoading, refetch: refetchRoles } = trpc.permissions.listRoles.useQuery();
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = trpc.permissions.listUsersWithRoles.useQuery();
  const { data: auditLog } = trpc.permissions.getRoleAuditLog.useQuery({ limit: 20 });

  // Mutations
  const createRole = trpc.permissions.createRole.useMutation({
    onSuccess: () => {
      toast.success("Đã tạo vai trò mới");
      setIsCreateDialogOpen(false);
      resetForm();
      refetchRoles();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateRole = trpc.permissions.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Đã cập nhật vai trò");
      setSelectedRole(null);
      resetForm();
      refetchRoles();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteRole = trpc.permissions.deleteRole.useMutation({
    onSuccess: () => {
      toast.success("Đã xóa vai trò");
      refetchRoles();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const assignRole = trpc.permissions.assignRoleToUser.useMutation({
    onSuccess: () => {
      toast.success("Đã gán vai trò cho người dùng");
      setIsAssignDialogOpen(false);
      setSelectedUserId(null);
      refetchUsers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeRole = trpc.permissions.removeRoleFromUser.useMutation({
    onSuccess: () => {
      toast.success("Đã gỡ vai trò khỏi người dùng");
      refetchUsers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", permissions: [] });
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      permissions: JSON.parse(role.permissions || "[]"),
    });
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleCategoryToggle = (categoryKey: string) => {
    const category = PERMISSION_CATEGORIES[categoryKey as keyof typeof PERMISSION_CATEGORIES];
    const allSelected = category.permissions.every((p) => formData.permissions.includes(p));
    
    setFormData((prev) => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter((p) => !category.permissions.includes(p))
        : Array.from(new Set([...prev.permissions, ...category.permissions])),
    }));
  };

  const handleSaveRole = () => {
    if (selectedRole) {
      updateRole.mutate({
        roleId: selectedRole.id,
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
      });
    } else {
      createRole.mutate({
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
      });
    }
  };

  const getRolePermissions = (role: Role): string[] => {
    try {
      return JSON.parse(role.permissions || "[]");
    } catch {
      return [];
    }
  };

  const getUserRoles = (user: any): Role[] => {
    return user.adminRoles || [];
  };

  if (rolesLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Vai trò & Quyền</h1>
          <p className="text-muted-foreground">Quản lý vai trò và phân quyền cho người dùng</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setSelectedRole(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo vai trò mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{selectedRole ? "Sửa vai trò" : "Tạo vai trò mới"}</DialogTitle>
              <DialogDescription>
                Thiết lập tên, mô tả và quyền cho vai trò
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 p-1">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tên vai trò *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="VD: Content Manager"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Mô tả</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Mô tả ngắn về vai trò"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Quyền hạn</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => {
                      const allSelected = category.permissions.every((p) => formData.permissions.includes(p));
                      const someSelected = category.permissions.some((p) => formData.permissions.includes(p));
                      
                      return (
                        <Card key={key} className="overflow-hidden">
                          <CardHeader className="p-3 bg-muted/50">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={allSelected}
                                onCheckedChange={() => handleCategoryToggle(key)}
                                className="data-[state=checked]:bg-primary"
                              />
                              <span className="text-lg">{category.icon}</span>
                              <CardTitle className="text-sm">{category.name}</CardTitle>
                              {someSelected && !allSelected && (
                                <Badge variant="secondary" className="text-xs">
                                  {category.permissions.filter((p) => formData.permissions.includes(p)).length}/{category.permissions.length}
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 space-y-2">
                            {category.permissions.map((permission) => (
                              <div key={permission} className="flex items-center gap-2">
                                <Checkbox
                                  checked={formData.permissions.includes(permission)}
                                  onCheckedChange={() => handlePermissionToggle(permission)}
                                />
                                <span className="text-sm">{PERMISSION_DESCRIPTIONS[permission] || permission}</span>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); setSelectedRole(null); resetForm(); }}>
                Hủy
              </Button>
              <Button onClick={handleSaveRole} disabled={!formData.name || createRole.isPending || updateRole.isPending}>
                {(createRole.isPending || updateRole.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {selectedRole ? "Cập nhật" : "Tạo vai trò"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            Vai trò ({roles?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Người dùng ({users?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="matrix">
            <Settings className="h-4 w-4 mr-2" />
            Ma trận quyền
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Eye className="h-4 w-4 mr-2" />
            Lịch sử thay đổi
          </TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles?.map((role) => {
              const permissions = getRolePermissions(role);
              const isSystem = role.isSystem === "true";
              
              return (
                <Card key={role.id} className={isSystem ? "border-primary/50" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isSystem ? (
                          <ShieldCheck className="h-5 w-5 text-primary" />
                        ) : (
                          <Shield className="h-5 w-5 text-muted-foreground" />
                        )}
                        <CardTitle className="text-lg">{role.name}</CardTitle>
                      </div>
                      {isSystem && <Badge variant="secondary">Hệ thống</Badge>}
                    </div>
                    <CardDescription>{role.description || "Không có mô tả"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Lock className="h-4 w-4" />
                      <span>{permissions.length} quyền</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {permissions.slice(0, 5).map((perm) => (
                        <Badge key={perm} variant="outline" className="text-xs">
                          {perm.split(".")[0]}
                        </Badge>
                      ))}
                      {permissions.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{permissions.length - 5}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { handleEditRole(role); setIsCreateDialogOpen(true); }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Sửa
                      </Button>
                      {!isSystem && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm("Bạn có chắc muốn xóa vai trò này?")) {
                              deleteRole.mutate({ roleId: role.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Xóa
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách người dùng</CardTitle>
              <CardDescription>Quản lý vai trò cho từng người dùng</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Vai trò hệ thống</TableHead>
                    <TableHead>Vai trò Admin</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user: any) => {
                    const userRoles = getUserRoles(user);
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.username || "N/A"}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role || "user"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {userRoles.length > 0 ? (
                              userRoles.map((role: Role) => (
                                <Badge key={role.id} variant="outline" className="flex items-center gap-1">
                                  {role.name}
                                  <button
                                    onClick={() => removeRole.mutate({ userId: user.id, roleId: role.id })}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">Chưa gán</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.isActive === "true" ? (
                            <Badge variant="default" className="bg-green-500">Hoạt động</Badge>
                          ) : (
                            <Badge variant="secondary">Vô hiệu</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedUserId(user.id)}>
                                <UserPlus className="h-4 w-4 mr-1" />
                                Gán vai trò
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Gán vai trò cho {user.username || user.email}</DialogTitle>
                                <DialogDescription>Chọn vai trò để gán cho người dùng</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                {roles?.map((role) => {
                                  const hasRole = userRoles.some((r: Role) => r.id === role.id);
                                  
                                  return (
                                    <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                                      <div className="flex items-center gap-3">
                                        <Shield className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                          <p className="font-medium">{role.name}</p>
                                          <p className="text-sm text-muted-foreground">{role.description}</p>
                                        </div>
                                      </div>
                                      {hasRole ? (
                                        <Badge variant="default" className="bg-green-500">
                                          <Check className="h-3 w-3 mr-1" />
                                          Đã gán
                                        </Badge>
                                      ) : (
                                        <Button
                                          size="sm"
                                          onClick={() => assignRole.mutate({ userId: user.id, roleId: role.id })}
                                          disabled={assignRole.isPending}
                                        >
                                          {assignRole.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                                          Gán
                                        </Button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permission Matrix Tab */}
        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ma trận quyền</CardTitle>
              <CardDescription>So sánh quyền giữa các vai trò</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background z-10 min-w-[200px]">Quyền</TableHead>
                      {roles?.map((role) => (
                        <TableHead key={role.id} className="text-center min-w-[120px]">
                          {role.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, category]) => (
                      <>
                        <TableRow key={categoryKey} className="bg-muted/50">
                          <TableCell colSpan={(roles?.length || 0) + 1} className="font-semibold">
                            {category.icon} {category.name}
                          </TableCell>
                        </TableRow>
                        {category.permissions.map((permission) => (
                          <TableRow key={permission}>
                            <TableCell className="sticky left-0 bg-background">
                              {PERMISSION_DESCRIPTIONS[permission] || permission}
                            </TableCell>
                            {roles?.map((role) => {
                              const hasPermission = getRolePermissions(role).includes(permission);
                              return (
                                <TableCell key={role.id} className="text-center">
                                  {hasPermission ? (
                                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                                  ) : (
                                    <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử thay đổi quyền</CardTitle>
              <CardDescription>Theo dõi các thay đổi về vai trò và phân quyền</CardDescription>
            </CardHeader>
            <CardContent>
              {auditLog && auditLog.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Hành động</TableHead>
                      <TableHead>Đối tượng</TableHead>
                      <TableHead>Người thực hiện</TableHead>
                      <TableHead>Chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLog.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            log.action === "create" ? "default" :
                            log.action === "delete" ? "destructive" : "secondary"
                          }>
                            {log.action === "create" ? "Tạo" :
                             log.action === "update" ? "Cập nhật" :
                             log.action === "delete" ? "Xóa" :
                             log.action === "assign" ? "Gán" :
                             log.action === "remove" ? "Gỡ" : log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.resourceType}: {log.resourceId}</TableCell>
                        <TableCell>{log.userName || "System"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {log.details || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2" />
                  <p>Chưa có lịch sử thay đổi</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
