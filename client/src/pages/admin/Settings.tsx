import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Globe, Phone, Mail, MapPin, Facebook, Linkedin, Youtube } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { PermissionGate, usePermissions } from "@/hooks/usePermissions";

export default function AdminSettings() {
  const { hasPermission } = usePermissions();
  const { data: settings, isLoading } = trpc.settings.listAll.useQuery();
  
  const [formData, setFormData] = useState<Record<string, string>>({
    site_name: "",
    site_tagline: "",
    contact_phone: "",
    contact_email: "",
    contact_address: "",
    social_facebook: "",
    social_linkedin: "",
    social_youtube: "",
  });

  useEffect(() => {
    if (settings) {
      const newFormData: Record<string, string> = {};
      settings.forEach(s => {
        newFormData[s.settingKey] = s.settingValue || "";
      });
      setFormData(prev => ({ ...prev, ...newFormData }));
    }
  }, [settings]);

  const setMutation = trpc.settings.set.useMutation({
    onSuccess: () => {
      toast.success("Đã lưu cài đặt thành công!");
    },
    onError: (error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const handleSave = async (key: string) => {
    await setMutation.mutateAsync({
      key,
      value: formData[key],
    });
  };

  const handleSaveAll = async () => {
    const keys = Object.keys(formData);
    for (const key of keys) {
      await setMutation.mutateAsync({
        key,
        value: formData[key],
      });
    }
    toast.success("Đã lưu tất cả cài đặt!");
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary uppercase">Cài Đặt Website</h1>
          <p className="text-muted-foreground mt-1">Quản lý thông tin chung của website</p>
        </div>
        {hasPermission("settings.edit") && (
          <Button onClick={handleSaveAll} disabled={setMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Lưu Tất Cả
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading uppercase">
              <Globe className="h-5 w-5 text-chart-1" />
              Thông Tin Chung
            </CardTitle>
            <CardDescription>Cài đặt tên và slogan của website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site_name">Tên Website</Label>
              <Input
                id="site_name"
                value={formData.site_name}
                onChange={(e) => setFormData(prev => ({ ...prev, site_name: e.target.value }))}
                placeholder="Dreamweldtech"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site_tagline">Slogan</Label>
              <Input
                id="site_tagline"
                value={formData.site_tagline}
                onChange={(e) => setFormData(prev => ({ ...prev, site_tagline: e.target.value }))}
                placeholder="Giải Pháp Công Nghệ Laser Hàng Đầu"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading uppercase">
              <Phone className="h-5 w-5 text-chart-1" />
              Thông Tin Liên Hệ
            </CardTitle>
            <CardDescription>Số điện thoại, email và địa chỉ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact_phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Số Điện Thoại
              </Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                placeholder="+84 123 456 789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="contact@dreamweldtech.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Địa Chỉ
              </Label>
              <Textarea
                id="contact_address"
                value={formData.contact_address}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_address: e.target.value }))}
                placeholder="Khu Công Nghệ Cao, Quận 9, TP. Hồ Chí Minh"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading uppercase">
              <Globe className="h-5 w-5 text-chart-1" />
              Mạng Xã Hội
            </CardTitle>
            <CardDescription>Liên kết đến các trang mạng xã hội</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="social_facebook" className="flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </Label>
                <Input
                  id="social_facebook"
                  value={formData.social_facebook}
                  onChange={(e) => setFormData(prev => ({ ...prev, social_facebook: e.target.value }))}
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social_linkedin" className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </Label>
                <Input
                  id="social_linkedin"
                  value={formData.social_linkedin}
                  onChange={(e) => setFormData(prev => ({ ...prev, social_linkedin: e.target.value }))}
                  placeholder="https://linkedin.com/company/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social_youtube" className="flex items-center gap-2">
                  <Youtube className="h-4 w-4" />
                  YouTube
                </Label>
                <Input
                  id="social_youtube"
                  value={formData.social_youtube}
                  onChange={(e) => setFormData(prev => ({ ...prev, social_youtube: e.target.value }))}
                  placeholder="https://youtube.com/@..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
