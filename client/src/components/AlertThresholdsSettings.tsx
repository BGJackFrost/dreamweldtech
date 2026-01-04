/**
 * Alert Thresholds Settings Component
 * 
 * Allows admin to customize warning and critical thresholds
 * for each monitoring metric directly in the UI.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  Cpu,
  MemoryStick,
  HardDrive,
  Clock,
  XCircle,
  Save,
  RotateCcw,
  Settings2,
  Info,
  CheckCircle
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Metric icons
const METRIC_ICONS: Record<string, any> = {
  cpu: Cpu,
  memory: MemoryStick,
  disk: HardDrive,
  responseTime: Clock,
  errorRate: XCircle,
};

// Metric labels in Vietnamese
const METRIC_LABELS: Record<string, string> = {
  cpu: "CPU",
  memory: "Bộ nhớ RAM",
  disk: "Ổ đĩa",
  responseTime: "Thời gian phản hồi",
  errorRate: "Tỷ lệ lỗi",
};

// Metric colors
const METRIC_COLORS: Record<string, string> = {
  cpu: "text-blue-500",
  memory: "text-purple-500",
  disk: "text-green-500",
  responseTime: "text-amber-500",
  errorRate: "text-red-500",
};

interface ThresholdConfig {
  metricName: string;
  warningThreshold: number;
  criticalThreshold: number;
  unit: string;
  description: string;
  isEnabled: boolean;
  cooldownMinutes: number;
  lastAlertAt: Date | null;
}

interface EditableThreshold extends ThresholdConfig {
  hasChanges: boolean;
}

// Single threshold card component
function ThresholdCard({ 
  threshold, 
  onUpdate, 
  onReset,
  isSaving 
}: { 
  threshold: EditableThreshold;
  onUpdate: (updates: Partial<ThresholdConfig>) => void;
  onReset: () => void;
  isSaving: boolean;
}) {
  const Icon = METRIC_ICONS[threshold.metricName] || AlertTriangle;
  const label = METRIC_LABELS[threshold.metricName] || threshold.metricName;
  const colorClass = METRIC_COLORS[threshold.metricName] || "text-gray-500";
  
  // Max values for different metrics
  const maxValue = threshold.metricName === "responseTime" ? 5000 : 100;
  const step = threshold.metricName === "responseTime" ? 50 : 1;
  
  return (
    <Card className={`relative ${!threshold.isEnabled ? "opacity-60" : ""}`}>
      {threshold.hasChanges && (
        <Badge className="absolute -top-2 -right-2 bg-amber-500">
          Chưa lưu
        </Badge>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon className={`h-5 w-5 ${colorClass}`} />
            {label}
          </CardTitle>
          <Switch
            checked={threshold.isEnabled}
            onCheckedChange={(checked) => onUpdate({ isEnabled: checked })}
          />
        </div>
        <CardDescription className="text-xs">
          {threshold.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Warning Threshold */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
              Ngưỡng cảnh báo
            </Label>
            <span className="text-sm font-medium text-yellow-600">
              {threshold.warningThreshold}{threshold.unit}
            </span>
          </div>
          <Slider
            value={[threshold.warningThreshold]}
            max={maxValue}
            step={step}
            onValueChange={([value]) => onUpdate({ warningThreshold: value })}
            disabled={!threshold.isEnabled}
            className="[&_[role=slider]]:bg-yellow-500"
          />
        </div>
        
        {/* Critical Threshold */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-500" />
              Ngưỡng nghiêm trọng
            </Label>
            <span className="text-sm font-medium text-red-600">
              {threshold.criticalThreshold}{threshold.unit}
            </span>
          </div>
          <Slider
            value={[threshold.criticalThreshold]}
            max={maxValue}
            step={step}
            onValueChange={([value]) => onUpdate({ criticalThreshold: value })}
            disabled={!threshold.isEnabled}
            className="[&_[role=slider]]:bg-red-500"
          />
        </div>
        
        {/* Cooldown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              Cooldown
            </Label>
            <span className="text-sm text-muted-foreground">
              {threshold.cooldownMinutes} phút
            </span>
          </div>
          <Input
            type="number"
            min={1}
            max={1440}
            value={threshold.cooldownMinutes}
            onChange={(e) => onUpdate({ cooldownMinutes: parseInt(e.target.value) || 15 })}
            disabled={!threshold.isEnabled}
            className="h-8"
          />
        </div>
        
        {/* Last Alert */}
        {threshold.lastAlertAt && (
          <div className="text-xs text-muted-foreground">
            Cảnh báo gần nhất: {new Date(threshold.lastAlertAt).toLocaleString("vi-VN")}
          </div>
        )}
        
        {/* Reset button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={isSaving}
          className="w-full"
        >
          <RotateCcw className="h-3 w-3 mr-2" />
          Đặt lại mặc định
        </Button>
      </CardContent>
    </Card>
  );
}

// Main component
export default function AlertThresholdsSettings() {
  const [thresholds, setThresholds] = useState<EditableThreshold[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Fetch thresholds
  const { data: fetchedThresholds, isLoading, refetch } = trpc.alertThresholds.getAll.useQuery();
  
  // Update mutation
  const batchUpdateMutation = trpc.alertThresholds.batchUpdate.useMutation({
    onSuccess: (data) => {
      if (data.allSuccess) {
        toast.success("Đã lưu tất cả thay đổi");
        refetch();
      } else {
        toast.warning("Một số thay đổi không được lưu");
      }
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
  
  // Reset single mutation
  const resetMutation = trpc.alertThresholds.resetToDefault.useMutation({
    onSuccess: () => {
      toast.success("Đã đặt lại về mặc định");
      refetch();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
  
  // Reset all mutation
  const resetAllMutation = trpc.alertThresholds.resetAllToDefaults.useMutation({
    onSuccess: () => {
      toast.success("Đã đặt lại tất cả về mặc định");
      refetch();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
  
  // Initialize mutation
  const initializeMutation = trpc.alertThresholds.initialize.useMutation({
    onSuccess: () => {
      toast.success("Đã khởi tạo ngưỡng mặc định");
      refetch();
    },
  });
  
  // Sync fetched data to local state
  useEffect(() => {
    if (fetchedThresholds) {
      setThresholds(fetchedThresholds.map(t => ({ ...t, hasChanges: false })));
      setHasUnsavedChanges(false);
    }
  }, [fetchedThresholds]);
  
  // Update local threshold
  const handleUpdateThreshold = (metricName: string, updates: Partial<ThresholdConfig>) => {
    setThresholds(prev => prev.map(t => {
      if (t.metricName === metricName) {
        return { ...t, ...updates, hasChanges: true };
      }
      return t;
    }));
    setHasUnsavedChanges(true);
  };
  
  // Reset single threshold
  const handleResetThreshold = (metricName: string) => {
    resetMutation.mutate({ metricName });
  };
  
  // Save all changes
  const handleSaveAll = () => {
    const changedThresholds = thresholds
      .filter(t => t.hasChanges)
      .map(t => ({
        metricName: t.metricName,
        warningThreshold: t.warningThreshold,
        criticalThreshold: t.criticalThreshold,
        isEnabled: t.isEnabled,
        cooldownMinutes: t.cooldownMinutes,
      }));
    
    if (changedThresholds.length > 0) {
      batchUpdateMutation.mutate(changedThresholds);
    }
  };
  
  // Discard changes
  const handleDiscardChanges = () => {
    if (fetchedThresholds) {
      setThresholds(fetchedThresholds.map(t => ({ ...t, hasChanges: false })));
      setHasUnsavedChanges(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Đang tải cấu hình...</div>
      </div>
    );
  }
  
  // If no thresholds, show initialize button
  if (!thresholds.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Cấu hình ngưỡng cảnh báo
          </CardTitle>
          <CardDescription>
            Chưa có cấu hình ngưỡng. Nhấn nút bên dưới để khởi tạo giá trị mặc định.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => initializeMutation.mutate()}>
            Khởi tạo ngưỡng mặc định
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Cấu hình ngưỡng cảnh báo
          </h3>
          <p className="text-sm text-muted-foreground">
            Điều chỉnh ngưỡng warning và critical cho từng metric
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <>
              <Button variant="outline" size="sm" onClick={handleDiscardChanges}>
                Hủy thay đổi
              </Button>
              <Button 
                size="sm" 
                onClick={handleSaveAll}
                disabled={batchUpdateMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Lưu tất cả
              </Button>
            </>
          )}
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Đặt lại tất cả
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Đặt lại tất cả ngưỡng?</DialogTitle>
                <DialogDescription>
                  Thao tác này sẽ đặt lại tất cả ngưỡng cảnh báo về giá trị mặc định.
                  Bạn có chắc chắn muốn tiếp tục?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">Hủy</Button>
                <Button 
                  variant="destructive"
                  onClick={() => resetAllMutation.mutate()}
                  disabled={resetAllMutation.isPending}
                >
                  Đặt lại tất cả
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
        <Info className="h-5 w-5 text-blue-500 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">Hướng dẫn cấu hình</p>
          <ul className="mt-1 text-muted-foreground space-y-1">
            <li>• <span className="text-yellow-600 font-medium">Ngưỡng cảnh báo</span>: Khi vượt qua, hệ thống sẽ hiển thị cảnh báo màu vàng</li>
            <li>• <span className="text-red-600 font-medium">Ngưỡng nghiêm trọng</span>: Khi vượt qua, hệ thống sẽ gửi thông báo qua email/Slack/Telegram</li>
            <li>• <span className="font-medium">Cooldown</span>: Thời gian chờ giữa các lần gửi thông báo để tránh spam</li>
          </ul>
        </div>
      </div>
      
      {/* Threshold cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {thresholds.map(threshold => (
          <ThresholdCard
            key={threshold.metricName}
            threshold={threshold}
            onUpdate={(updates) => handleUpdateThreshold(threshold.metricName, updates)}
            onReset={() => handleResetThreshold(threshold.metricName)}
            isSaving={batchUpdateMutation.isPending || resetMutation.isPending}
          />
        ))}
      </div>
      
      {/* Status indicator */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 right-4 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">Có thay đổi chưa được lưu</span>
        </div>
      )}
    </div>
  );
}
