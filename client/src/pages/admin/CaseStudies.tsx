import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, Pencil, Trash2, Star, Building2, Quote } from "lucide-react";
import { toast } from "sonner";
import { PermissionGate, usePermissions } from "@/hooks/usePermissions";

const INDUSTRIES = [
  { value: "automotive", label: "Ô tô" },
  { value: "aerospace", label: "Hàng không" },
  { value: "electronics", label: "Điện tử" },
  { value: "shipbuilding", label: "Đóng tàu" },
  { value: "construction", label: "Xây dựng" },
  { value: "manufacturing", label: "Sản xuất" },
  { value: "energy", label: "Năng lượng" },
  { value: "other", label: "Khác" },
];

interface CaseStudyForm {
  title: string;
  titleEn: string;
  slug: string;
  clientName: string;
  clientLogo: string;
  industry: string;
  challenge: string;
  challengeEn: string;
  solution: string;
  solutionEn: string;
  results: string;
  resultsEn: string;
  testimonial: string;
  testimonialEn: string;
  testimonialAuthor: string;
  testimonialPosition: string;
  image: string;
  metrics: string;
  isFeatured: "true" | "false";
}

const defaultForm: CaseStudyForm = {
  title: "",
  titleEn: "",
  slug: "",
  clientName: "",
  clientLogo: "",
  industry: "",
  challenge: "",
  challengeEn: "",
  solution: "",
  solutionEn: "",
  results: "",
  resultsEn: "",
  testimonial: "",
  testimonialEn: "",
  testimonialAuthor: "",
  testimonialPosition: "",
  image: "",
  metrics: "",
  isFeatured: "false",
};

export default function AdminCaseStudies() {
  const { hasPermission } = usePermissions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CaseStudyForm>(defaultForm);

  const { data: caseStudies, refetch } = trpc.caseStudies.listAll.useQuery();
  const createMutation = trpc.caseStudies.create.useMutation({
    onSuccess: () => {
      toast.success("Đã tạo case study mới");
      refetch();
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });
  const updateMutation = trpc.caseStudies.update.useMutation({
    onSuccess: () => {
      toast.success("Đã cập nhật case study");
      refetch();
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });
  const deleteMutation = trpc.caseStudies.delete.useMutation({
    onSuccess: () => {
      toast.success("Đã xóa case study");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (caseStudy: NonNullable<typeof caseStudies>[0]) => {
    setForm({
      title: caseStudy.title,
      titleEn: caseStudy.titleEn || "",
      slug: caseStudy.slug,
      clientName: caseStudy.clientName,
      clientLogo: caseStudy.clientLogo || "",
      industry: caseStudy.industry || "",
      challenge: caseStudy.challenge || "",
      challengeEn: caseStudy.challengeEn || "",
      solution: caseStudy.solution || "",
      solutionEn: caseStudy.solutionEn || "",
      results: caseStudy.results || "",
      resultsEn: caseStudy.resultsEn || "",
      testimonial: caseStudy.testimonial || "",
      testimonialEn: caseStudy.testimonialEn || "",
      testimonialAuthor: caseStudy.testimonialAuthor || "",
      testimonialPosition: caseStudy.testimonialPosition || "",
      image: caseStudy.image || "",
      metrics: caseStudy.metrics || "",
      isFeatured: caseStudy.isFeatured,
    });
    setEditingId(caseStudy.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.slug || !form.clientName) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa case study này?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggleFeatured = (id: number, currentValue: "true" | "false") => {
    updateMutation.mutate({
      id,
      isFeatured: currentValue === "true" ? "false" : "true",
    });
  };

  const handleToggleActive = (id: number, currentValue: "true" | "false") => {
    updateMutation.mutate({
      id,
      isActive: currentValue === "true" ? "false" : "true",
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Case Studies</h1>
          <p className="text-muted-foreground">
            Quản lý các dự án tiêu biểu và testimonial từ khách hàng
          </p>
        </div>
        <PermissionGate permission="casestudies.create">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm Case Study
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Chỉnh sửa Case Study" : "Thêm Case Study mới"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tiêu đề (Tiếng Việt) *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => {
                      setForm({ ...form, title: e.target.value });
                      if (!editingId) {
                        setForm((prev) => ({
                          ...prev,
                          slug: generateSlug(e.target.value),
                        }));
                      }
                    }}
                    placeholder="Dự án hàn laser cho nhà máy ô tô ABC"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tiêu đề (Tiếng Anh)</Label>
                  <Input
                    value={form.titleEn}
                    onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                    placeholder="Laser Welding Project for ABC Automotive"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Slug *</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="du-an-han-laser-abc"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tên khách hàng *</Label>
                  <Input
                    value={form.clientName}
                    onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    placeholder="Công ty ABC"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ngành công nghiệp</Label>
                  <Select
                    value={form.industry}
                    onValueChange={(value) => setForm({ ...form, industry: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn ngành" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind.value} value={ind.value}>
                          {ind.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Hình ảnh đại diện</Label>
                  <Input
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Thách thức (Tiếng Việt)</Label>
                <Textarea
                  value={form.challenge}
                  onChange={(e) => setForm({ ...form, challenge: e.target.value })}
                  placeholder="Mô tả vấn đề khách hàng gặp phải..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Giải pháp (Tiếng Việt)</Label>
                <Textarea
                  value={form.solution}
                  onChange={(e) => setForm({ ...form, solution: e.target.value })}
                  placeholder="Mô tả giải pháp Dreamweldtech cung cấp..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Kết quả (Tiếng Việt)</Label>
                <Textarea
                  value={form.results}
                  onChange={(e) => setForm({ ...form, results: e.target.value })}
                  placeholder="Mô tả kết quả đạt được..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Testimonial (Tiếng Việt)</Label>
                <Textarea
                  value={form.testimonial}
                  onChange={(e) => setForm({ ...form, testimonial: e.target.value })}
                  placeholder="Lời nhận xét từ khách hàng..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tên người nhận xét</Label>
                  <Input
                    value={form.testimonialAuthor}
                    onChange={(e) =>
                      setForm({ ...form, testimonialAuthor: e.target.value })
                    }
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Chức vụ</Label>
                  <Input
                    value={form.testimonialPosition}
                    onChange={(e) =>
                      setForm({ ...form, testimonialPosition: e.target.value })
                    }
                    placeholder="Giám đốc sản xuất"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Metrics (JSON)</Label>
                <Textarea
                  value={form.metrics}
                  onChange={(e) => setForm({ ...form, metrics: e.target.value })}
                  placeholder='{"efficiency": "+30%", "cost_savings": "25%", "time_reduction": "40%"}'
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isFeatured === "true"}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, isFeatured: checked ? "true" : "false" })
                  }
                />
                <Label>Đánh dấu nổi bật</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  Hủy
                </Button>
                <Button onClick={handleSubmit}>
                  {editingId ? "Cập nhật" : "Tạo mới"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Case Studies</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Ngành</TableHead>
                <TableHead>Nổi bật</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {caseStudies?.map((cs) => (
                <TableRow key={cs.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {cs.image && (
                        <img
                          src={cs.image}
                          alt={cs.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium">{cs.title}</p>
                        <p className="text-sm text-muted-foreground">/{cs.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {cs.clientName}
                    </div>
                  </TableCell>
                  <TableCell>
                    {cs.industry && (
                      <Badge variant="outline">
                        {INDUSTRIES.find((i) => i.value === cs.industry)?.label ||
                          cs.industry}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFeatured(cs.id, cs.isFeatured)}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          cs.isFeatured === "true"
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={cs.isActive === "true"}
                      onCheckedChange={() =>
                        handleToggleActive(cs.id, cs.isActive)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {hasPermission("casestudies.edit") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(cs)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {hasPermission("casestudies.delete") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(cs.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!caseStudies || caseStudies.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Quote className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      Chưa có case study nào. Hãy thêm case study đầu tiên!
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
