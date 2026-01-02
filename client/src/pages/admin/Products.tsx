import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
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

export default function AdminProducts() {
  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.products.listAll.useQuery();
  const { data: categories } = trpc.categories.listAll.useQuery();
  
  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success("Đã xóa sản phẩm thành công!");
      utils.products.listAll.invalidate();
    },
    onError: (error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const getCategoryName = (categoryId: number) => {
    const category = categories?.find(c => c.id === categoryId);
    return category?.name || "Không xác định";
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary uppercase">Quản Lý Sản Phẩm</h1>
          <p className="text-muted-foreground mt-1">Thêm, sửa, xóa các sản phẩm của bạn</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="bg-chart-1 hover:bg-chart-1/90">
            <Plus className="h-4 w-4 mr-2" />
            Thêm Sản Phẩm
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading uppercase">Danh Sách Sản Phẩm ({products?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {products && products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Ảnh</TableHead>
                  <TableHead>Tên Sản Phẩm</TableHead>
                  <TableHead>Danh Mục</TableHead>
                  <TableHead>Trạng Thái</TableHead>
                  <TableHead>Nổi Bật</TableHead>
                  <TableHead className="text-right">Thao Tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center text-muted-foreground text-xs">
                          No img
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                    <TableCell>
                      <Badge variant={product.isActive === "true" ? "default" : "secondary"}>
                        {product.isActive === "true" ? "Hiển thị" : "Ẩn"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.isFeatured === "true" && (
                        <Badge className="bg-chart-1">Nổi bật</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/products/${product.slug}`}>
                          <Button variant="ghost" size="icon" title="Xem">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/products/${product.id}`}>
                          <Button variant="ghost" size="icon" title="Sửa">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
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
                                Bạn có chắc chắn muốn xóa sản phẩm "{product.name}"? Hành động này không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate({ id: product.id })}
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
              <p>Chưa có sản phẩm nào.</p>
              <Link href="/admin/products/new">
                <Button className="mt-4">Thêm sản phẩm đầu tiên</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
