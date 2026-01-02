import { useState } from "react";
import { 
  Bell, BellOff, Moon, Clock, Settings, Volume2, VolumeX, 
  Calendar, Mail, Plus, Trash2, ChevronDown, ChevronUp,
  Smartphone
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useNotificationSettings, type DndScheduleItem } from "@/hooks/useNotificationSettings";
import { toast } from "sonner";

const DAYS_OF_WEEK = [
  { value: 1, label: "T2" },
  { value: 2, label: "T3" },
  { value: 3, label: "T4" },
  { value: 4, label: "T5" },
  { value: 5, label: "T6" },
  { value: 6, label: "T7" },
  { value: 7, label: "CN" },
];

export function NotificationSettings() {
  const {
    isEnabled,
    setIsEnabled,
    isDndActive,
    isScheduledDndActive,
    dndEndTime,
    setDndMode,
    clearDndMode,
    soundEnabled,
    setSoundEnabled,
    notificationTypes,
    toggleNotificationType,
    getRemainingDndTime,
    // DND Schedule
    dndSchedules,
    addDndSchedule,
    updateDndSchedule,
    removeDndSchedule,
    toggleDndSchedule,
    // Email Digest
    emailDigest,
    updateEmailDigest,
    // Push
    pushEnabled,
    setPushEnabled,
  } = useNotificationSettings();

  const [dndDuration, setDndDuration] = useState<string>("30");
  const [showScheduleSection, setShowScheduleSection] = useState(false);
  const [showEmailDigestSection, setShowEmailDigestSection] = useState(false);
  const [showPushSection, setShowPushSection] = useState(false);
  
  // New schedule form
  const [newScheduleStart, setNewScheduleStart] = useState("22:00");
  const [newScheduleEnd, setNewScheduleEnd] = useState("08:00");
  const [newScheduleDays, setNewScheduleDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);

  const handleDndActivate = () => {
    const minutes = parseInt(dndDuration);
    setDndMode(minutes);
    toast.success(`Chế độ DND đã bật trong ${minutes} phút`);
  };

  const handleAddSchedule = () => {
    if (!newScheduleStart || !newScheduleEnd || newScheduleDays.length === 0) {
      toast.error("Vui lòng điền đầy đủ thông tin lịch DND");
      return;
    }

    addDndSchedule({
      startTime: newScheduleStart,
      endTime: newScheduleEnd,
      daysOfWeek: newScheduleDays,
      isEnabled: true,
    });

    toast.success("Đã thêm lịch DND mới");
    // Reset form
    setNewScheduleStart("22:00");
    setNewScheduleEnd("08:00");
    setNewScheduleDays([1, 2, 3, 4, 5, 6, 7]);
  };

  const toggleDay = (day: number) => {
    setNewScheduleDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      // Request push notification permission
      if (!("Notification" in window)) {
        toast.error("Trình duyệt không hỗ trợ thông báo đẩy");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setPushEnabled(true);
        toast.success("Đã bật thông báo đẩy");
      } else {
        toast.error("Bạn cần cấp quyền để nhận thông báo đẩy");
      }
    } else {
      setPushEnabled(false);
      toast.info("Đã tắt thông báo đẩy");
    }
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
      <PopoverContent className="w-96 max-h-[80vh] overflow-y-auto" align="end">
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

              {/* Manual DND Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium text-sm">Không làm phiền (Thủ công)</span>
                </div>

                {isDndActive && dndEndTime ? (
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
                  </div>
                ) : isScheduledDndActive ? (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span>DND theo lịch đang hoạt động</span>
                    </div>
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

              {/* DND Schedule Section */}
              <Collapsible open={showScheduleSection} onOpenChange={setShowScheduleSection}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      <span className="font-medium text-sm">Lịch DND tự động</span>
                      {dndSchedules.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {dndSchedules.length}
                        </Badge>
                      )}
                    </div>
                    {showScheduleSection ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  {/* Existing schedules */}
                  {dndSchedules.map((schedule) => (
                    <ScheduleItem
                      key={schedule.id}
                      schedule={schedule}
                      onToggle={() => toggleDndSchedule(schedule.id)}
                      onRemove={() => {
                        removeDndSchedule(schedule.id);
                        toast.success("Đã xóa lịch DND");
                      }}
                    />
                  ))}

                  {/* Add new schedule */}
                  <div className="bg-muted/50 p-3 rounded-lg space-y-3">
                    <div className="text-sm font-medium">Thêm lịch mới</div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs">Bắt đầu</Label>
                        <Input
                          type="time"
                          value={newScheduleStart}
                          onChange={(e) => setNewScheduleStart(e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Kết thúc</Label>
                        <Input
                          type="time"
                          value={newScheduleEnd}
                          onChange={(e) => setNewScheduleEnd(e.target.value)}
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Ngày trong tuần</Label>
                      <div className="flex gap-1 mt-1">
                        {DAYS_OF_WEEK.map((day) => (
                          <Button
                            key={day.value}
                            variant={newScheduleDays.includes(day.value) ? "default" : "outline"}
                            size="sm"
                            className="h-7 w-8 p-0 text-xs"
                            onClick={() => toggleDay(day.value)}
                          >
                            {day.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Button size="sm" className="w-full" onClick={handleAddSchedule}>
                      <Plus className="h-4 w-4 mr-1" />
                      Thêm lịch
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Email Digest Section */}
              <Collapsible open={showEmailDigestSection} onOpenChange={setShowEmailDigestSection}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-sm">Email Digest</span>
                      {emailDigest.isEnabled && (
                        <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                          Bật
                        </Badge>
                      )}
                    </div>
                    {showEmailDigestSection ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-digest-enabled" className="text-sm">
                      Nhận email tổng hợp
                    </Label>
                    <Switch
                      id="email-digest-enabled"
                      checked={emailDigest.isEnabled}
                      onCheckedChange={(checked) => updateEmailDigest({ isEnabled: checked })}
                    />
                  </div>

                  {emailDigest.isEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs">Tần suất</Label>
                        <Select
                          value={emailDigest.frequency}
                          onValueChange={(value: "daily" | "weekly" | "monthly") =>
                            updateEmailDigest({ frequency: value })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Hàng ngày</SelectItem>
                            <SelectItem value="weekly">Hàng tuần</SelectItem>
                            <SelectItem value="monthly">Hàng tháng</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Giờ gửi</Label>
                        <Input
                          type="time"
                          value={emailDigest.sendTime}
                          onChange={(e) => updateEmailDigest({ sendTime: e.target.value })}
                          className="h-8"
                        />
                      </div>

                      {emailDigest.frequency === "weekly" && (
                        <div className="space-y-2">
                          <Label className="text-xs">Ngày gửi</Label>
                          <Select
                            value={emailDigest.sendDay.toString()}
                            onValueChange={(value) => updateEmailDigest({ sendDay: parseInt(value) })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS_OF_WEEK.map((day) => (
                                <SelectItem key={day.value} value={day.value.toString()}>
                                  {day.label === "CN" ? "Chủ nhật" : `Thứ ${day.value + 1}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Email tổng hợp sẽ được gửi khi có thông báo mới trong khoảng thời gian đã chọn.
                      </p>
                    </>
                  )}
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Push Notifications Section */}
              <Collapsible open={showPushSection} onOpenChange={setShowPushSection}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-sm">Thông báo đẩy</span>
                      {pushEnabled && (
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                          Bật
                        </Badge>
                      )}
                    </div>
                    {showPushSection ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-enabled" className="text-sm">
                      Nhận thông báo đẩy
                    </Label>
                    <Switch
                      id="push-enabled"
                      checked={pushEnabled}
                      onCheckedChange={handlePushToggle}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Nhận thông báo ngay cả khi không mở trang admin. Yêu cầu cấp quyền từ trình duyệt.
                  </p>
                </CollapsibleContent>
              </Collapsible>

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

function ScheduleItem({
  schedule,
  onToggle,
  onRemove,
}: {
  schedule: DndScheduleItem;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const daysText = schedule.daysOfWeek
    .map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.label)
    .join(", ");

  return (
    <div className={`p-3 rounded-lg border ${schedule.isEnabled ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200" : "bg-muted/30 border-muted"}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium text-sm">
            {schedule.startTime} - {schedule.endTime}
          </div>
          <div className="text-xs text-muted-foreground">{daysText}</div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={schedule.isEnabled}
            onCheckedChange={onToggle}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
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
