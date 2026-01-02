import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Shield } from "lucide-react";

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  userCount: number;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export default function PermissionMatrix() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mock data - Replace with API call
  const roles: Role[] = [
    {
      id: 1,
      name: "Super Admin",
      description: "Quyền truy cập toàn bộ hệ thống",
      permissions: ["all"],
      isSystem: true,
      userCount: 1,
    },
    {
      id: 2,
      name: "Editor",
      description: "Có thể tạo, chỉnh sửa nội dung",
      permissions: [
        "products.view",
        "products.create",
        "products.edit",
        "news.view",
        "news.create",
        "news.edit",
        "banners.view",
        "banners.create",
        "banners.edit",
      ],
      isSystem: false,
      userCount: 3,
    },
    {
      id: 3,
      name: "Viewer",
      description: "Chỉ có thể xem nội dung",
      permissions: ["products.view", "news.view", "banners.view", "analytics.view"],
      isSystem: false,
      userCount: 2,
    },
  ];

  const permissions: Permission[] = [
    // Products
    { id: "products.view", name: "Xem Sản phẩm", category: "Sản phẩm", description: "Xem danh sách sản phẩm" },
    { id: "products.create", name: "Tạo Sản phẩm", category: "Sản phẩm", description: "Tạo sản phẩm mới" },
    { id: "products.edit", name: "Chỉnh sửa Sản phẩm", category: "Sản phẩm", description: "Chỉnh sửa sản phẩm" },
    { id: "products.delete", name: "Xóa Sản phẩm", category: "Sản phẩm", description: "Xóa sản phẩm" },

    // News
    { id: "news.view", name: "Xem Tin tức", category: "Tin tức", description: "Xem danh sách tin tức" },
    { id: "news.create", name: "Tạo Tin tức", category: "Tin tức", description: "Tạo tin tức mới" },
    { id: "news.edit", name: "Chỉnh sửa Tin tức", category: "Tin tức", description: "Chỉnh sửa tin tức" },
    { id: "news.delete", name: "Xóa Tin tức", category: "Tin tức", description: "Xóa tin tức" },

    // Banners
    { id: "banners.view", name: "Xem Banner", category: "Banner", description: "Xem danh sách banner" },
    { id: "banners.create", name: "Tạo Banner", category: "Banner", description: "Tạo banner mới" },
    { id: "banners.edit", name: "Chỉnh sửa Banner", category: "Banner", description: "Chỉnh sửa banner" },
    { id: "banners.delete", name: "Xóa Banner", category: "Banner", description: "Xóa banner" },

    // Analytics
    { id: "analytics.view", name: "Xem Analytics", category: "Báo cáo", description: "Xem báo cáo analytics" },
    { id: "analytics.export", name: "Xuất Analytics", category: "Báo cáo", description: "Xuất dữ liệu analytics" },

    // Users
    { id: "users.view", name: "Xem Người dùng", category: "Người dùng", description: "Xem danh sách người dùng" },
    { id: "users.manage", name: "Quản lý Người dùng", category: "Người dùng", description: "Quản lý người dùng" },

    // Settings
    { id: "settings.view", name: "Xem Cài đặt", category: "Cài đặt", description: "Xem cài đặt hệ thống" },
    { id: "settings.edit", name: "Chỉnh sửa Cài đặt", category: "Cài đặt", description: "Chỉnh sửa cài đặt hệ thống" },
  ];

  const categories = Array.from(new Set(permissions.map((p) => p.category)));

  const handlePermissionToggle = (permissionId: string) => {
    if (selectedRole) {
      const newPermissions = selectedRole.permissions.includes(permissionId)
        ? selectedRole.permissions.filter((p) => p !== permissionId)
        : [...selectedRole.permissions, permissionId];
      setSelectedRole({ ...selectedRole, permissions: newPermissions });
    }
  };

  const handleSaveRole = () => {
    console.log("Saving role:", selectedRole);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Quản lý Quyền hạn
        </h1>
        <p className="text-gray-600 mt-2">Quản lý role và phân quyền cho người dùng admin</p>
      </div>

      {/* Roles List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Danh sách Role</CardTitle>
            <CardDescription>Quản lý các role trong hệ thống</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Tạo Role mới
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tạo Role mới</DialogTitle>
                <DialogDescription>Định nghĩa quyền hạn cho role mới</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Tên role" />
                <Input placeholder="Mô tả" />
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên Role</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Số người dùng</TableHead>
                  <TableHead>Quyền hạn</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-semibold">{role.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{role.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{role.userCount} người dùng</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {role.permissions.length > 3 ? (
                          <>
                            {role.permissions.slice(0, 3).map((p) => (
                              <Badge key={p} variant="secondary" className="text-xs">
                                {p}
                              </Badge>
                            ))}
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 3}
                            </Badge>
                          </>
                        ) : (
                          role.permissions.map((p) => (
                            <Badge key={p} variant="secondary" className="text-xs">
                              {p}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRole(role);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!role.isSystem && (
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Permission Matrix */}
      {selectedRole && (
        <Card>
          <CardHeader>
            <CardTitle>Ma trận Quyền hạn - {selectedRole.name}</CardTitle>
            <CardDescription>Chọn các quyền hạn cho role này</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="font-semibold mb-3 text-lg">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permissions
                    .filter((p) => p.category === category)
                    .map((permission) => (
                      <div key={permission.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50">
                        <Checkbox
                          id={permission.id}
                          checked={selectedRole.permissions.includes(permission.id)}
                          onCheckedChange={() => handlePermissionToggle(permission.id)}
                        />
                        <div className="flex-1">
                          <label htmlFor={permission.id} className="font-medium cursor-pointer">
                            {permission.name}
                          </label>
                          <p className="text-sm text-gray-600">{permission.description}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-6 border-t">
              <Button variant="outline" onClick={() => setSelectedRole(null)}>
                Hủy
              </Button>
              <Button onClick={handleSaveRole}>Lưu Quyền hạn</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
