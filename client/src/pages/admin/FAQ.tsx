import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { HelpCircle, Plus, Edit, Trash2, Save, GripVertical } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const FAQ_CATEGORIES = [
  { value: "general", label: "Chung" },
  { value: "products", label: "Sản phẩm" },
  { value: "shipping", label: "Vận chuyển" },
  { value: "warranty", label: "Bảo hành" },
  { value: "payment", label: "Thanh toán" },
  { value: "support", label: "Hỗ trợ" },
];

interface FAQFormData {
  id?: number;
  question: string;
  questionEn: string;
  answer: string;
  answerEn: string;
  category: string;
  sortOrder: number;
  isActive: "true" | "false";
}

const defaultFormData: FAQFormData = {
  question: "",
  questionEn: "",
  answer: "",
  answerEn: "",
  category: "general",
  sortOrder: 0,
  isActive: "true",
};

export default function AdminFAQ() {
  const { data: faqs, refetch } = trpc.faq.listAll.useQuery();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQFormData | null>(null);
  const [formData, setFormData] = useState<FAQFormData>(defaultFormData);

  const createMutation = trpc.faq.create.useMutation({
    onSuccess: () => {
      toast.success("Đã tạo câu hỏi mới!");
      refetch();
      setIsDialogOpen(false);
      setFormData(defaultFormData);
    },
    onError: (error) => {
      toast.error("Lỗi: " + (error as { message: string }).message);
    },
  });

  const updateMutation = trpc.faq.update.useMutation({
    onSuccess: () => {
      toast.success("Đã cập nhật câu hỏi!");
      refetch();
      setIsDialogOpen(false);
      setEditingFaq(null);
      setFormData(defaultFormData);
    },
    onError: (error) => {
      toast.error("Lỗi: " + (error as { message: string }).message);
    },
  });

  const deleteMutation = trpc.faq.delete.useMutation({
    onSuccess: () => {
      toast.success("Đã xóa câu hỏi!");
      refetch();
    },
    onError: (error) => {
      toast.error("Lỗi: " + (error as { message: string }).message);
    },
  });

  const handleSubmit = () => {
    if (!formData.question || !formData.answer) {
      toast.error("Vui lòng nhập câu hỏi và câu trả lời!");
      return;
    }

    if (editingFaq?.id) {
      updateMutation.mutate({
        id: editingFaq.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (faq: NonNullable<typeof faqs>[number]) => {
    setEditingFaq({
      id: faq.id,
      question: faq.question,
      questionEn: faq.questionEn || "",
      answer: faq.answer,
      answerEn: faq.answerEn || "",
      category: faq.category || "general",
      sortOrder: faq.sortOrder || 0,
      isActive: faq.isActive,
    });
    setFormData({
      id: faq.id,
      question: faq.question,
      questionEn: faq.questionEn || "",
      answer: faq.answer,
      answerEn: faq.answerEn || "",
      category: faq.category || "general",
      sortOrder: faq.sortOrder || 0,
      isActive: faq.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc muốn xóa câu hỏi này?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggleActive = (faq: NonNullable<typeof faqs>[number]) => {
    updateMutation.mutate({
      id: faq.id,
      isActive: faq.isActive === "true" ? "false" : "true",
    });
  };

  const openCreateDialog = () => {
    setEditingFaq(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const getCategoryLabel = (value: string) => {
    return FAQ_CATEGORIES.find((c) => c.value === value)?.label || value;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
            <HelpCircle className="h-8 w-8" />
            Quản Lý FAQ
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý các câu hỏi thường gặp
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Câu Hỏi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFaq ? "Chỉnh Sửa Câu Hỏi" : "Thêm Câu Hỏi Mới"}
              </DialogTitle>
              <DialogDescription>
                Nhập thông tin câu hỏi và câu trả lời bằng cả tiếng Việt và tiếng Anh
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Vietnamese */}
              <div className="space-y-4">
                <h3 className="font-semibold border-b pb-2">Tiếng Việt</h3>
                <div className="space-y-2">
                  <Label htmlFor="question">Câu hỏi *</Label>
                  <Input
                    id="question"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Nhập câu hỏi..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="answer">Câu trả lời *</Label>
                  <Textarea
                    id="answer"
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="Nhập câu trả lời..."
                    rows={4}
                  />
                </div>
              </div>

              {/* English */}
              <div className="space-y-4">
                <h3 className="font-semibold border-b pb-2">English</h3>
                <div className="space-y-2">
                  <Label htmlFor="questionEn">Question</Label>
                  <Input
                    id="questionEn"
                    value={formData.questionEn}
                    onChange={(e) => setFormData({ ...formData, questionEn: e.target.value })}
                    placeholder="Enter question..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="answerEn">Answer</Label>
                  <Textarea
                    id="answerEn"
                    value={formData.answerEn}
                    onChange={(e) => setFormData({ ...formData, answerEn: e.target.value })}
                    placeholder="Enter answer..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Danh mục</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FAQ_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Thứ tự</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingFaq ? "Cập Nhật" : "Tạo Mới"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {faqs?.map((faq) => (
          <Card key={faq.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-grab" />
                  <div>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                    {faq.questionEn && (
                      <CardDescription className="mt-1">{faq.questionEn}</CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{getCategoryLabel(faq.category || "general")}</Badge>
                  <Switch
                    checked={faq.isActive === "true"}
                    onCheckedChange={() => handleToggleActive(faq)}
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(faq)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(faq.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{faq.answer}</p>
              {faq.answerEn && (
                <p className="text-muted-foreground/70 mt-2 text-sm italic whitespace-pre-wrap">
                  {faq.answerEn}
                </p>
              )}
            </CardContent>
          </Card>
        ))}

        {(!faqs || faqs.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có câu hỏi nào. Bấm "Thêm Câu Hỏi" để tạo mới.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
