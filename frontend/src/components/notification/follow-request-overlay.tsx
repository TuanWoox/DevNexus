"use client";

import { useState } from "react";
import { Search, Check, XIcon, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useGetReceivedFollowRequests,
  useApproveRequest,
  useRejectRequest,
  useBulkApproveRequests,
  useBulkRejectRequests,
} from "@/hooks/follow-request-hooks";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function FollowRequestOverlay({ open, onClose }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useGetReceivedFollowRequests(debouncedSearch);

  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();
  const bulkApprove = useBulkApproveRequests();
  const bulkReject = useBulkRejectRequests();

  const requests = data?.pages.flatMap((page) => page.data) || [];
  const totalCount = data?.pages[0]?.page.totalElements || 0;

  const handleApprove = (requestId: string) => {
    approveRequest.mutate(requestId);
    setSelectedIds((prev) => prev.filter((id) => id !== requestId));
  };

  const handleReject = (requestId: string) => {
    rejectRequest.mutate(requestId);
    setSelectedIds((prev) => prev.filter((id) => id !== requestId));
  };

  const handleBulkApprove = () => {
    if (selectedIds.length > 0) {
      bulkApprove.mutate(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleBulkReject = () => {
    if (selectedIds.length > 0) {
      bulkReject.mutate(selectedIds);
      setSelectedIds([]);
    }
  };

  const toggleSelect = (requestId: string) => {
    setSelectedIds((prev) =>
      prev.includes(requestId)
        ? prev.filter((id) => id !== requestId)
        : [...prev, requestId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === requests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(requests.map((r) => r.id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] p-0" showCloseButton={false}>
        <DialogHeader className="p-3 sm:px-6 sm:pt-6 sm:pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Follow Requests
              {totalCount > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({totalCount})
                </span>
              )}
            </DialogTitle>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-primary/5 rounded-lg">
              <Checkbox
                checked={selectedIds.length === requests.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectedIds.length} selected
              </span>
              <div className="ml-auto flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleBulkApprove}
                  disabled={bulkApprove.isPending}
                  className="cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span className="hidden sm:block ml-1">Accept All</span>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkReject}
                  disabled={bulkReject.isPending}
                  className="cursor-pointer"
                >
                  <XIcon className="h-4 w-4" />
                  <span className="hidden sm:block ml-1">Reject All</span>
                </Button>
              </div>
            </div>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchTerm ? "No requests found" : "No follow requests"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    selectedIds.includes(request.id) && "bg-primary/5 border-primary"
                  )}
                >
                  <Checkbox
                    checked={selectedIds.includes(request.id)}
                    onCheckedChange={() => toggleSelect(request.id)}
                  />

                  <UserAvatar
                    avatarUrl={request.requesterProfile?.avatarUrl}
                    fullName={request.requesterProfile?.fullName ?? "User"}
                    className="h-12 w-12"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {request.requesterProfile?.fullName ?? "Unknown User"}
                    </p>
                    {/* {request.requesterProfile?.bio && (
                      <p className="text-sm text-muted-foreground truncate">
                        {request.requesterProfile.bio}
                      </p>
                    )} */}
                    <p className="text-xs text-muted-foreground mt-1">
                      {request.requesterProfile?.reputationPoints ?? 0} reputation
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(request.id)}
                      disabled={approveRequest.isPending}
                      className="cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(request.id)}
                      disabled={rejectRequest.isPending}
                      className="cursor-pointer"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Load More */}
              {hasNextPage && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Loading..." : "Load More"}
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
