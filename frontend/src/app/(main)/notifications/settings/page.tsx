"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, BellOff, Trash2 } from "lucide-react";
import { getEntityTypeName, getNotificationTypeName } from "@/features/notifications/utils/notification-helpers";
import { formatDistanceToNow } from "date-fns";
import { EntityTypeEnum, NotificationEventEnum } from "@/features/notifications/types/enums";
import { useGlobalSetting, useUpdateGlobalSetting } from "@/features/notifications/hooks/settings/use-global-setting";
import { useMuteSettings, useRemoveMute } from "@/features/notifications/hooks/settings/use-mute-settings";

export default function NotificationSettingsPage() {
  const { data: globalSetting, isLoading: isLoadingGlobal } = useGlobalSetting();
  const { data: mutes, isLoading: isLoadingMutes } = useMuteSettings();
  const updateGlobal = useUpdateGlobalSetting();
  const removeMute = useRemoveMute();

  const handleToggleGlobal = () => {
    if (globalSetting) {
      updateGlobal.mutate(!globalSetting.AllNotifications);
    }
  };

  const handleUnmute = (entityType: EntityTypeEnum, entityId: string, type: NotificationEventEnum) => {
    removeMute.mutate({ EntityType: entityType, EntityId: entityId, Type: type });
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Notification Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your notification preferences
        </p>
      </div>

      {/* Global Setting */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Global Notifications
          </CardTitle>
          <CardDescription>
            Master switch to enable or disable all notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingGlobal ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable all notifications</p>
                <p className="text-sm text-muted-foreground">
                  {globalSetting?.AllNotifications
                    ? "You will receive all notifications"
                    : "All notifications are disabled"}
                </p>
              </div>
              <Switch
                checked={globalSetting?.AllNotifications ?? true}
                onCheckedChange={handleToggleGlobal}
                disabled={updateGlobal.isPending}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Muted Entities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Muted Notifications
          </CardTitle>
          <CardDescription>
            Notifications you've muted for specific content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMutes ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : mutes && mutes.length > 0 ? (
            <div className="space-y-3">
              {mutes.map((mute, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-subtle transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {getEntityTypeName(mute.EntityType)}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {getNotificationTypeName(mute.Type)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Entity ID: {mute.EntityId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Muted {mute.DateCreated ? formatDistanceToNow(new Date(mute.DateCreated), { addSuffix: true }) : 'recently'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleUnmute(mute.EntityType, mute.EntityId, mute.Type)}
                    disabled={removeMute.isPending}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BellOff className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No muted notifications</p>
              <p className="text-sm mt-1">
                You can mute notifications from the notification dropdown
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
