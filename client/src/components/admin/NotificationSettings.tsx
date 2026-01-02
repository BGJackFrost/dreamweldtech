import { useState, useEffect } from "react";
import { Bell, BellOff, Moon, Clock, Settings, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";

export function NotificationSettings() {
  const {
    isEnabled,
    setIsEnabled,
    isDndActive,
    dndEndTime,
    setDndMode,
    clearDndMode,
    soundEnabled,
    setSoundEnabled,
    notificationTypes,
    toggleNotificationType,
    getRemainingDndTime,
  } = useNotificationSettings();

  const [dndDuration, setDndDuration] = useState<string>("30");

  const handleDndActivate = () => {
    const minutes = parseInt(dndDuration);
    setDndMode(minutes);
  };

  const remainingTime = getRemainingDndTime();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {isEnabled && !isDndActive ? (
            <Bell className="h-5 w-5" />
          ) : isDndActive ? (
            <Moon className="h-5 w-5 text-yellow-500" />
          ) : (
            <BellOff className="h-5 w-5 text-gray-400" />
          )}
          {isDndActive && (
            <Badge 
              variant="secondary" 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-yellow-500 text-white"
            >
              Z
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <h4 className="font-semibold">Cài đặt Thông báo</h4>
          </div>

          <Separator />

          {/* Main Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isEnabled ? (
                <Bell className="h-4 w-4 text-cyan-500" />
              ) : (
                <BellOff className="h-4 w-4 text-gray-400" />
              )}
              <Label htmlFor="notifications-enabled" className="font-medium">
                Thông báo Real-time
              </Label>
            </div>
            <Switch
              id="notifications-enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>

          {isEnabled && (
            <>
              <Separator />

              {/* Do Not Disturb Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium text-sm">Chế độ Không làm phiền</span>
                </div>

                {isDndActive ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span>Còn lại: <strong>{remainingTime}</strong></span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={clearDndMode}
                        className="text-xs"
                      >
                        Tắt DND
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Thông báo sẽ tự động bật lại sau khi hết thời gian.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Select value={dndDuration} onValueChange={setDndDuration}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Chọn thời gian" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 phút</SelectItem>
                        <SelectItem value="30">30 phút</SelectItem>
                        <SelectItem value="60">1 giờ</SelectItem>
                        <SelectItem value="120">2 giờ</SelectItem>
                        <SelectItem value="240">4 giờ</SelectItem>
                        <SelectItem value="480">8 giờ</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={handleDndActivate}
                    >
                      Bật DND
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Sound Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {soundEnabled ? (
                    <Volume2 className="h-4 w-4 text-cyan-500" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-gray-400" />
                  )}
                  <Label htmlFor="sound-enabled" className="text-sm">
                    Âm thanh thông báo
                  </Label>
                </div>
                <Switch
                  id="sound-enabled"
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
              </div>

              <Separator />

              {/* Notification Types */}
              <div className="space-y-3">
                <span className="font-medium text-sm">Loại thông báo</span>
                <div className="space-y-2">
                  {Object.entries(notificationTypes).map(([type, enabled]) => (
                    <div key={type} className="flex items-center justify-between">
                      <Label htmlFor={`type-${type}`} className="text-sm capitalize">
                        {getNotificationTypeLabel(type)}
                      </Label>
                      <Switch
                        id={`type-${type}`}
                        checked={enabled}
                        onCheckedChange={() => toggleNotificationType(type)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!isEnabled && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Bật thông báo để nhận cập nhật real-time từ hệ thống.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function getNotificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    contact: "Liên hệ mới",
    quote: "Yêu cầu báo giá",
    application: "Đơn ứng tuyển",
    newsletter: "Đăng ký newsletter",
    system: "Hệ thống",
  };
  return labels[type] || type;
}

export default NotificationSettings;
