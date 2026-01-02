import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Briefcase,
  MapPin,
  Building2,
  Eye,
  EyeOff,
  Users
} from "lucide-react";
import { toast } from "sonner";

type JobType = "full-time" | "part-time" | "contract" | "internship";

interface JobForm {
  title: string;
  slug: string;
  department: string;
  location: string;
  type: JobType;
  experience: string;
  salary: string;
  description: string;
  requirements: string;
  benefits: string;
}

const initialForm: JobForm = {
  title: "",
  slug: "",
  department: "",
  location: "",
  type: "full-time",
  experience: "",
  salary: "",
  description: "",
  requirements: "",
  benefits: "",
};

export default function AdminJobs() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<JobForm>(initialForm);

  const { data: jobs, refetch } = trpc.jobs.listAll.useQuery();
  const { data: applications } = trpc.jobApplications.list.useQuery({});
  const createJob = trpc.jobs.create.useMutation();
  const updateJob = trpc.jobs.update.useMutation();
  const deleteJob = trpc.jobs.delete.useMutation();

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: editingId ? formData.slug : generateSlug(title),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateJob.mutateAsync({ id: editingId, ...formData });
        toast.success("Đã cập nhật vị trí tuyển dụng");
      } else {
        await createJob.mutateAsync(formData);
        toast.success("Đã thêm vị trí tuyển dụng mới");
      }
      setIsDialogOpen(false);
      setFormData(initialForm);
      setEditingId(null);
      refetch();
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleEdit = (job: typeof jobs extends (infer T)[] | undefined ? T : never) => {
    if (!job) return;
    setEditingId(job.id);
    setFormData({
      title: job.title,
      slug: job.slug,
      department: job.department || "",
      location: job.location || "",
      type: (job.type as JobType) || "full-time",
      experience: job.experience || "",
      salary: job.salary || "",
      description: job.description || "",
      requirements: job.requirements || "",
      benefits: job.benefits || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa vị trí này?")) return;
    try {
      await deleteJob.mutateAsync({ id });
      toast.success("Đã xóa vị trí tuyển dụng");
      refetch();
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleToggleActive = async (id: number, currentStatus: string) => {
    try {
      await updateJob.mutateAsync({
        id,
        isActive: currentStatus === "true" ? "false" : "true",
      });
      toast.success(currentStatus === "true" ? "Đã ẩn vị trí" : "Đã hiển thị vị trí");
      refetch();
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  const getApplicationCount = (jobId: number) => {
    return applications?.filter(a => a.jobId === jobId).length || 0;
  };

  const getJobTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      "full-time": "Toàn thời gian",
      "part-time": "Bán thời gian",
      "contract": "Hợp đồng",
      "internship": "Thực tập",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Tuyển Dụng</h1>
          <p className="text-muted-foreground">
            Quản lý các vị trí tuyển dụng và đơn ứng tuyển
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setFormData(initialForm); }}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm vị trí
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Chỉnh sửa vị trí" : "Thêm vị trí mới"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Tiêu đề *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Phòng ban</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="VD: Kỹ thuật, Kinh doanh..."
                  />
                </div>
                <div>
                  <Label htmlFor="location">Địa điểm</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="VD: TP. Hồ Chí Minh"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="type">Loại hình</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v as JobType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Toàn thời gian</SelectItem>
                      <SelectItem value="part-time">Bán thời gian</SelectItem>
                      <SelectItem value="contract">Hợp đồng</SelectItem>
                      <SelectItem value="internship">Thực tập</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="experience">Kinh nghiệm</Label>
                  <Input
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="VD: 2-3 năm"
                  />
                </div>
                <div>
                  <Label htmlFor="salary">Mức lương</Label>
                  <Input
                    id="salary"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="VD: 15-25 triệu"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Mô tả công việc</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="requirements">Yêu cầu</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="benefits">Quyền lợi</Label>
                <Textarea
                  id="benefits"
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit">
                  {editingId ? "Cập nhật" : "Thêm mới"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{jobs?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Tổng vị trí</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {jobs?.filter(j => j.isActive === "true").length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Đang tuyển</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{applications?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Đơn ứng tuyển</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách vị trí tuyển dụng</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vị trí</TableHead>
                <TableHead>Phòng ban</TableHead>
                <TableHead>Địa điểm</TableHead>
                <TableHead>Loại hình</TableHead>
                <TableHead>Đơn ứng tuyển</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs?.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>
                    {job.department && (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {job.department}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {job.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {job.location}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getJobTypeLabel(job.type || "full-time")}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{getApplicationCount(job.id)} đơn</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={job.isActive === "true" ? "default" : "secondary"}>
                      {job.isActive === "true" ? "Đang tuyển" : "Đã đóng"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(job.id, job.isActive)}
                      >
                        {job.isActive === "true" ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(job)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(job.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!jobs || jobs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Chưa có vị trí tuyển dụng nào
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
