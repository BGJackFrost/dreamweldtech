import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAdminTranslation } from "@/hooks/useAdminTranslation";
import { PermissionGate, usePermissions } from "@/hooks/usePermissions";
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
  const { adminT, language } = useAdminTranslation();
  const utils = trpc.useUtils();
  const { data: news, isLoading } = trpc.news.listAll.useQuery();
  const { hasPermission } = usePermissions();
  
  // Get translations with fallbacks
  const t = {
    title: (adminT as any).news?.title || "Quản Lý Tin Tức",
    subtitle: (adminT as any).news?.subtitle || "Thêm, sửa, xóa các bài viết tin tức",
    addNews: (adminT as any).news?.addNews || "Thêm Bài Viết",
    articleList: (adminT as any).news?.articleList || "Danh Sách Bài Viết",
    thumbnail: (adminT as any).news?.thumbnail || "Ảnh",
    newsTitle: (adminT as any).news?.newsTitle || "Tiêu Đề",
    category: (adminT as any).news?.category || "Danh Mục",
    status: (adminT as any).news?.status || "Trạng Thái",
    publishDate: (adminT as any).news?.publishDate || "Ngày Đăng",
    views: (adminT as any).news?.views || "Lượt Xem",
    actions: (adminT as any).common?.actions || "Thao Tác",
    published: (adminT as any).news?.published || "Đã đăng",
    draft: (adminT as any).news?.draft || "Nháp",
    noNews: (adminT as any).news?.noNews || "Chưa có bài viết nào.",
    addFirstArticle: (adminT as any).news?.addFirstArticle || "Thêm bài viết đầu tiên",
    confirmDelete: (adminT as any).news?.confirmDelete || "Xác nhận xóa?",
    deleteDescription: (adminT as any).news?.deleteDescription || "Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.",
    cancel: (adminT as any).common?.cancel || "Hủy",
    delete: (adminT as any).common?.delete || "Xóa",
    deleteSuccess: (adminT as any).news?.deleteSuccess || "Đã xóa bài viết thành công!",
    loading: (adminT as any).common?.loading || "Đang tải...",
    view: (adminT as any).common?.view || "Xem",
    edit: (adminT as any).common?.edit || "Sửa",
    noImage: (adminT as any).common?.noImage || "No img",
  };
  
  const deleteMutation = trpc.news.delete.useMutation({
    onSuccess: () => {
      toast.success(t.deleteSuccess);
      utils.news.listAll.invalidate();
    },
    onError: (error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    const locale = language === "vi" ? "vi-VN" : language === "ja" ? "ja-JP" : language === "zh" ? "zh-CN" : "en-US";
    return new Date(date).toLocaleDateString(locale);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">{t.loading}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary uppercase">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <PermissionGate permission="news.create">
          <Link href="/admin/news/new">
            <Button className="bg-chart-1 hover:bg-chart-1/90">
              <Plus className="h-4 w-4 mr-2" />
              {t.addNews}
            </Button>
          </Link>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading uppercase">{t.articleList} ({news?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {news && news.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">{t.thumbnail}</TableHead>
                  <TableHead>{t.newsTitle}</TableHead>
                  <TableHead>{t.category}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{t.publishDate}</TableHead>
                  <TableHead>{t.views}</TableHead>
                  <TableHead className="text-right">{t.actions}</TableHead>
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
                          {t.noImage}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{article.title}</TableCell>
                    <TableCell>{article.category || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={article.isPublished === "true" ? "default" : "secondary"}>
                        {article.isPublished === "true" ? t.published : t.draft}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(article.publishedAt)}</TableCell>
                    <TableCell>{article.viewCount || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/news/${article.slug}`}>
                          <Button variant="ghost" size="icon" title={t.view}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {hasPermission("news.edit") && (
                          <Link href={`/admin/news/${article.id}`}>
                            <Button variant="ghost" size="icon" title={t.edit}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        {hasPermission("news.delete") && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive" title={t.delete}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t.deleteDescription}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate({ id: article.id })}
                                className="bg-destructive text-destructive-foreground"
                              >
                                {t.delete}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t.noNews}</p>
              <Link href="/admin/news/new">
                <Button className="mt-4">{t.addFirstArticle}</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
