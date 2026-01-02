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

export default function AdminNews() {
  const utils = trpc.useUtils();
  const { data: news, isLoading } = trpc.news.listAll.useQuery();
  
  const deleteMutation = trpc.news.delete.useMutation({
    onSuccess: () => {
      toast.success("Đã xóa bài viết thành công!");
      utils.news.listAll.invalidate();
    },
    onError: (error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("vi-VN");
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary uppercase">Quản Lý Tin Tức</h1>
          <p className="text-muted-foreground mt-1">Thêm, sửa, xóa các bài viết tin tức</p>
        </div>
        <Link href="/admin/news/new">
          <Button className="bg-chart-1 hover:bg-chart-1/90">
            <Plus className="h-4 w-4 mr-2" />
            Thêm Bài Viết
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading uppercase">Danh Sách Bài Viết ({news?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {news && news.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Ảnh</TableHead>
                  <TableHead>Tiêu Đề</TableHead>
                  <TableHead>Danh Mục</TableHead>
                  <TableHead>Trạng Thái</TableHead>
                  <TableHead>Ngày Đăng</TableHead>
                  <TableHead>Lượt Xem</TableHead>
                  <TableHead className="text-right">Thao Tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {news.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>
                      {article.image ? (
                        <img 
                          src={article.image} 
                          alt={article.title} 
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center text-muted-foreground text-xs">
                          No img
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{article.title}</TableCell>
                    <TableCell>{article.category || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={article.isPublished === "true" ? "default" : "secondary"}>
                        {article.isPublished === "true" ? "Đã đăng" : "Nháp"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(article.publishedAt)}</TableCell>
                    <TableCell>{article.viewCount || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/news/${article.slug}`}>
                          <Button variant="ghost" size="icon" title="Xem">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/news/${article.id}`}>
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
                                Bạn có chắc chắn muốn xóa bài viết "{article.title}"? Hành động này không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate({ id: article.id })}
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
              <p>Chưa có bài viết nào.</p>
              <Link href="/admin/news/new">
                <Button className="mt-4">Thêm bài viết đầu tiên</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
