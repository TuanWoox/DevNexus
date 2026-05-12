"use client";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, X, Settings2, Loader2 } from "lucide-react";
import { getEntityTypeName, getNotificationTypeName } from "@/features/notifications/utils/notification-helpers";
import { formatDistanceToNow } from "date-fns";
import { EntityTypeEnum, NotificationEventEnum } from "@/features/notifications/types/enums";
import { useGlobalSetting, useUpdateGlobalSetting } from "@/features/notifications/hooks/settings/use-global-setting";
import { useMuteSettings, useRemoveMute } from "@/features/notifications/hooks/settings/use-mute-settings";
import { cn } from "@/lib/utils";

export default function NotificationSettingsPage() {
  const { data: globalSetting, isLoading: isLoadingGlobal } = useGlobalSetting();
  const { data: mutesData, isLoading: isLoadingMutes, fetchNextPage, hasNextPage, isFetchingNextPage } = useMuteSettings();
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

  // Flatten all pages into a single array
  const mutes = mutesData?.pages.flatMap(page => page.data) ?? [];
  const totalMutes = mutesData?.pages[0]?.page?.totalElements ?? 0;

  return (
    <main className="w-full min-h-screen bg-muted/30 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Settings2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground">Notification Settings</h1>
                <p className="text-lg text-foreground/70 mt-1">
                  Manage your notification preferences and muted content
                </p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 space-y-6">
            {/* Global Setting */}
            <div className="bg-muted/50 rounded-lg p-6 border border-border/50">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <div className={cn(
                    "p-3 rounded-xl shrink-0 transition-colors",
                    globalSetting?.AllNotifications
                      ? "bg-primary/10"
                      : "bg-muted"
                  )}>
                    <Bell className={cn(
                      "h-6 w-6",
                      globalSetting?.AllNotifications
                        ? "text-primary"
                        : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      Global Notifications
                    </h2>
                    <p className="text-base text-foreground/70 mb-4">
                      Master switch to enable or disable all notifications across the platform
                    </p>
                    {isLoadingGlobal ? (
                      <div className="flex items-center gap-2 py-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                        <span className="text-sm text-muted-foreground">Loading settings...</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className={cn(
                          "flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                          globalSetting?.AllNotifications
                            ? "bg-card border-border"
                            : "bg-muted/30 border-orange-500/30"
                        )}>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-2 h-2 rounded-full transition-colors",
                              globalSetting?.AllNotifications ? "bg-green-500" : "bg-orange-500"
                            )} />
                            <div>
                              <p className="font-medium text-foreground">
                                {globalSetting?.AllNotifications ? "Notifications Enabled" : "Notifications Disabled"}
                              </p>
                              <p className="text-xs text-foreground/60 mt-0.5">
                                {globalSetting?.AllNotifications
                                  ? "You will receive all notifications"
                                  : "All notifications are currently disabled"}
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={globalSetting?.AllNotifications ?? true}
                            onCheckedChange={handleToggleGlobal}
                            disabled={updateGlobal.isPending}
                            className={cn(
                              "data-[state=checked]:bg-primary",
                              "data-[state=unchecked]:bg-muted-foreground/30 data-[state=unchecked]:border-2 data-[state=unchecked]:border-muted-foreground/50"
                            )}
                          />
                        </div>
                        {!globalSetting?.AllNotifications && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                            <BellOff className="h-4 w-4 text-orange-600 dark:text-orange-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-orange-600 dark:text-orange-500">
                              You won't receive any notifications while this setting is disabled. Enable it to start receiving notifications again.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Muted Notifications */}
            <div className="bg-muted/50 rounded-lg p-6 border border-border/50">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-xl bg-orange-500/10 shrink-0">
                  <BellOff className="h-6 w-6 text-orange-600 dark:text-orange-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-semibold text-foreground">
                      Muted Notifications
                    </h2>
                    {totalMutes > 0 && (
                      <Badge variant="secondary" className="font-semibold">
                        {totalMutes}
                      </Badge>
                    )}
                  </div>
                  <p className="text-base text-foreground/70">
                    Content you've chosen to mute. You won't receive notifications for these items.
                  </p>
                </div>
              </div>

              {isLoadingMutes ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <span className="animate-spin rounded-full h-10 w-10 border-3 border-primary border-t-transparent block mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Loading muted notifications...</p>
                  </div>
                </div>
              ) : mutes && mutes.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {mutes.map((mute, index) => (
                      <div
                        key={`${mute.EntityType}-${mute.EntityId}-${mute.Type}-${index}`}
                        className="group relative flex items-center gap-4 p-4 rounded-xl border-2 bg-card hover:border-primary/20 hover:bg-accent/5 transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-semibold">
                              {getEntityTypeName(mute.EntityType)}
                            </Badge>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-sm font-medium text-foreground">
                              {getNotificationTypeName(mute.Type)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono truncate mb-1">
                            {mute.EntityId}
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
                          className="h-9 w-9 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                          aria-label="Unmute notification"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {hasNextPage && (
                    <div className="flex justify-center mt-6">
                      <Button
                        variant="outline"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="gap-2"
                      >
                        {isFetchingNextPage ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading more...
                          </>
                        ) : (
                          'Load more'
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <figure className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="p-6 rounded-2xl bg-muted/50 mb-4">
                    <BellOff className="h-16 w-16 text-muted-foreground/50" />
                  </div>
                  <figcaption>
                    <p className="text-lg font-semibold text-foreground mb-2">
                      No muted notifications
                    </p>
                    <p className="text-sm text-foreground/70 max-w-md">
                      When you mute notifications from specific content, they'll appear here. You can unmute them anytime.
                    </p>
                  </figcaption>
                </figure>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
