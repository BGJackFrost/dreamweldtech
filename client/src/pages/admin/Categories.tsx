import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminCategories() {
  const utils = trpc.useUtils();
  const { data: categories, isLoading } = trpc.categories.listAll.useQuery();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    sortOrder: 0,
    isActive: "true" as "true" | "false",
  });

  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success("Đã tạo danh mục thành công!");
      utils.categories.listAll.invalidate();
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const updateMutation = trpc.categories.update.useMutation({
    onSuccess: () => {
      toast.success("Đã cập nhật danh mục thành công!");
      utils.categories.listAll.invalidate();
      setEditingId(null);
      resetForm();
    },
    onError: (error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const deleteMutation = trpc.categories.delete.useMutation({
    onSuccess: () => {
      toast.success("Đã xóa danh mục thành công!");
      utils.categories.listAll.invalidate();
    },
    onError: (error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      image: "",
      sortOrder: 0,
      isActive: "true",
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleEdit = (category: NonNullable<typeof categories>[0]) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image: category.image || "",
      sortOrder: category.sortOrder || 0,
      isActive: category.isActive,
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.slug) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Đang tải...</div>;
  }

  const CategoryForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Tên Danh Mục *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="VD: Máy Hàn Laser"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug (URL) *</Label>
        <Input
          id="slug"
          value={formData.slug}
          onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
          placeholder="may-han-laser"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô Tả</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Mô tả ngắn về danh mục"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">URL Ảnh</Label>
        <Input
          id="image"
          value={formData.image}
          onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
          placeholder="/images/category.jpg"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sortOrder">Thứ Tự</Label>
          <Input
            id="sortOrder"
            type="number"
            value={formData.sortOrder}
            onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
          />
        </div>
        <div className="flex items-center justify-between pt-6">
          <Label htmlFor="isActive">Hiển Thị</Label>
          <Switch
            id="isActive"
            checked={formData.isActive === "true"}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked ? "true" : "false" }))}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary uppercase">Quản Lý Danh Mục</h1>
          <p className="text-muted-foreground mt-1">Thêm, sửa, xóa các danh mục sản phẩm</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-chart-1 hover:bg-chart-1/90" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Danh Mục
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading uppercase">Thêm Danh Mục Mới</DialogTitle>
            </DialogHeader>
            <CategoryForm />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={createMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Tạo Danh Mục
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading uppercase">Danh Sách Danh Mục ({categories?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {categories && categories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Ảnh</TableHead>
                  <TableHead>Tên Danh Mục</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Thứ Tự</TableHead>
                  <TableHead>Trạng Thái</TableHead>
                  <TableHead className="text-right">Thao Tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      {category.image ? (
                        <img 
                          src={category.image} 
                          alt={category.name} 
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center text-muted-foreground text-xs">
                          No img
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                    <TableCell>{category.sortOrder}</TableCell>
                    <TableCell>
                      <Badge variant={category.isActive === "true" ? "default" : "secondary"}>
                        {category.isActive === "true" ? "Hiển thị" : "Ẩn"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Sửa"
                              onClick={() => handleEdit(category)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="font-heading uppercase">Sửa Danh Mục</DialogTitle>
                            </DialogHeader>
                            <CategoryForm />
                            <div className="flex justify-end gap-2 mt-4">
                              <Button variant="outline" onClick={() => setEditingId(null)}>
                                Hủy
                              </Button>
                              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                                <Save className="h-4 w-4 mr-2" />
                                Cập Nhật
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive" title="Xóa">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc chắn muốn xóa danh mục "{category.name}"? Các sản phẩm thuộc danh mục này sẽ không còn được phân loại.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate({ id: category.id })}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Chưa có danh mục nào.</p>
              <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                Thêm danh mục đầu tiên
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
