"use client";

import { useGetCommunityMutes } from "@/hooks/community-mute-hooks/use-get-community-mutes";
import { useUnmuteCommunityMember } from "@/hooks/community-mute-hooks/use-unmute-community-member";
import { useMuteCommunityMember } from "@/hooks/community-mute-hooks/use-mute-community-member";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectCommunityDTO } from "@/types/community/select-community-dto";
import { Loader2, Search, VolumeX, Volume2, Calendar, Clock } from "lucide-react";
import { useState } from "react";
import { Page } from "@/types/common/page";
import { FilterType } from "@/constants/filterType";
import { FilterOperator } from "@/constants/filterOperator";
import { SortOrderType } from "@/constants/sortOrderType";
import { CreateCommunityMuteDTO } from "@/types/community-mutes/create-community-mute-dto";
import { MemberSearchModal } from "./member-search-modal";
import { ManagementProfileCell } from "./management-profile-cell";
import { useDebounce } from "@/hooks/use-debounce";

interface MutesManagementProps {
    community: SelectCommunityDTO;
}

const PRESETS = [
    { label: "1 Hour", value: "1h" },
    { label: "12 Hours", value: "12h" },
    { label: "24 Hours", value: "24h" },
    { label: "3 Days", value: "3d" },
    { label: "7 Days", value: "7d" },
    { label: "30 Days", value: "30d" },
    { label: "Permanent", value: "permanent" },
    { label: "Custom", value: "custom" },
];

export function MutesManagement({ community }: MutesManagementProps) {
    const [pageNumber, setPageNumber] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery.trim(), 400);

    // Mute modal state
    const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<{ profileId: string; fullName: string } | null>(null);
    const [muteReason, setMuteReason] = useState("");
    const [selectedPreset, setSelectedPreset] = useState("24h");
    const [customDateTime, setCustomDateTime] = useState("");
    const [minDateTime, setMinDateTime] = useState("");

    const pagePayload: Page<string> = {
        size: 10,
        pageNumber,
        totalElements: 0,
        orders: [{ sort: "DateCreated", sortDir: SortOrderType.DESC, dynamicProperty: "", delimiter: "", dataType: "datetime" }],
        filter: debouncedSearch ? [
            {
                prop: "MutedProfile.FullName",
                value: debouncedSearch,
                filterType: FilterType.Text,
                filterOperator: FilterOperator.Contains,
                dynamicProperty: "",
                delimiter: "",
            }
        ] : [],
        selected: [],
    };

    const { data: pagedData, isLoading } = useGetCommunityMutes(community.id, pagePayload);
    const { mutate: unmuteMember, isPending: isUnmuting } = useUnmuteCommunityMember();
    const { mutate: muteMember, isPending: isMuting } = useMuteCommunityMember();

    const mutes = pagedData?.data ?? [];
    const totalPages = Math.ceil((pagedData?.page?.totalElements ?? 0) / pagePayload.size);

    const alreadyMutedProfileIds = mutes
        .map(m => m.mutedProfileId)
        .filter(Boolean) as string[];

    // Selected from modal — show mute details form
    const handleMemberSelected = (profileId: string, fullName: string) => {
        setSelectedMember({ profileId, fullName });
        setMuteReason("");
        setSelectedPreset("24h");
        setCustomDateTime("");
        setMinDateTime("");
    };

    // Calculate MutedUntil date string
    const calculateMutedUntil = (): string | undefined => {
        if (selectedPreset === "permanent") return undefined;
        if (selectedPreset === "custom") {
            if (!customDateTime) return undefined;
            return new Date(customDateTime).toISOString();
        }

        const now = Date.now();
        let durationMs = 0;
        switch (selectedPreset) {
            case "1h":
                durationMs = 60 * 60 * 1000;
                break;
            case "12h":
                durationMs = 12 * 60 * 60 * 1000;
                break;
            case "24h":
                durationMs = 24 * 60 * 60 * 1000;
                break;
            case "3d":
                durationMs = 3 * 24 * 60 * 60 * 1000;
                break;
            case "7d":
                durationMs = 7 * 24 * 60 * 60 * 1000;
                break;
            case "30d":
                durationMs = 30 * 24 * 60 * 60 * 1000;
                break;
            default:
                durationMs = 24 * 60 * 60 * 1000;
        }
        return new Date(now + durationMs).toISOString();
    };

    // Confirm mute with reason and duration
    const handleConfirmMute = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) return;

        const payload: CreateCommunityMuteDTO = {
            communityId: community.id,
            mutedProfileId: selectedMember.profileId,
            muteReason: muteReason.trim() || undefined,
            mutedUntil: calculateMutedUntil(),
        };

        muteMember(payload, {
            onSuccess: () => {
                setSelectedMember(null);
                setMuteReason("");
                setSelectedPreset("24h");
                setCustomDateTime("");
            }
        });
    };

    const getMuteStatusText = (mutedUntil: string | undefined | null) => {
        if (!mutedUntil) return "Indefinite";
        const untilDate = new Date(mutedUntil);
        const now = new Date();
        const diffMs = untilDate.getTime() - now.getTime();
        if (diffMs <= 0) return "Expired";

        const diffMins = Math.floor(diffMs / (60 * 1000));
        if (diffMins < 60) return `${diffMins}m remaining`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h remaining`;

        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d remaining`;
    };

    return (
        <div className="space-y-6">
            {/* Mute User Container */}
            <div className="flex flex-col bg-amber-500/5 border border-amber-500/10 p-5 rounded-2xl gap-4 transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                            <VolumeX className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                            Mute Community Member
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                            Temporary or indefinite restriction preventing a member from posting content or writing comments in this community.
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsMuteModalOpen(true)}
                        disabled={isMuting}
                        variant="custom"
                        className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 active:scale-95 transition-transform cursor-pointer h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 border-0"
                    >
                        <VolumeX className="h-4 w-4" />
                        Mute Member
                    </Button>
                </div>

                {/* Step 2: Mute reason and duration presets form — shown after selecting a member */}
                {selectedMember && (
                    <form onSubmit={handleConfirmMute} className="space-y-5 pt-4 mt-2 border-t border-amber-500/15 animate-fade-in-up">
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                                Muting member: <span className="font-semibold text-foreground ml-1">{selectedMember.fullName}</span>
                            </div>
                            <button
                                type="button"
                                className="text-[11px] text-muted-foreground hover:text-amber-600 underline transition-colors cursor-pointer"
                                onClick={() => setSelectedMember(null)}
                            >
                                Cancel selection
                            </button>
                        </div>

                        {/* Duration Presets */}
                        <div className="space-y-2.5">
                            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                                Mute Duration
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {PRESETS.map((preset) => (
                                    <button
                                        key={preset.value}
                                        type="button"
                                        onClick={() => {
                                            setSelectedPreset(preset.value);
                                            if (preset.value === "custom") {
                                                setMinDateTime(new Date(Date.now() + 60 * 1000).toISOString().slice(0, 16));
                                            }
                                        }}
                                        className={`px-3 py-2 text-xs font-medium rounded-xl border text-center transition-all duration-200 cursor-pointer ${selectedPreset === preset.value
                                                ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 font-semibold"
                                                : "border-border/60 bg-background/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                            }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Date Time Picker */}
                        {selectedPreset === "custom" && (
                            <div className="space-y-2 max-w-sm animate-fade-in-up">
                                <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-amber-500" />
                                    Choose Expiration Time
                                </label>
                                <Input
                                    type="datetime-local"
                                    required
                                    value={customDateTime}
                                    onChange={(e) => setCustomDateTime(e.target.value)}
                                    min={minDateTime}
                                    className="rounded-xl border border-border/60 bg-background text-sm focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:border-amber-500 transition-all"
                                />
                            </div>
                        )}

                        {/* Reason TextArea */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground">
                                Reason
                            </label>
                            <Textarea
                                placeholder="Provide a reason for the mute (optional)..."
                                value={muteReason}
                                onChange={(e) => setMuteReason(e.target.value)}
                                className="bg-background min-h-[80px] rounded-xl border border-border/60 text-sm focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:border-amber-500 transition-all duration-200"
                            />
                        </div>

                        {/* Confirm / Cancel Buttons */}
                        <div className="flex justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="custom"
                                className="btn-secondary h-9 px-4 rounded-lg text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
                                onClick={() => setSelectedMember(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="custom"
                                disabled={isMuting}
                                className="bg-amber-600 hover:bg-amber-700 text-white h-9 px-4 rounded-lg text-xs font-semibold cursor-pointer active:scale-95 transition-transform flex items-center gap-1.5 border-0"
                            >
                                {isMuting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <VolumeX className="h-3.5 w-3.5" />}
                                Confirm Mute
                            </Button>
                        </div>
                    </form>
                )}
            </div>

            {/* Search Mute list */}
            <div className="flex items-center gap-2 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search muted users by name..."
                        className="pl-10 rounded-xl border border-border/60 bg-muted/10 text-sm focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:bg-background transition-all duration-200"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPageNumber(0);
                        }}
                    />
                </div>
            </div>

            {/* Muted Members Table */}
            <div className="rounded-md border bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="font-semibold">User</TableHead>
                            <TableHead className="font-semibold">Reason</TableHead>
                            <TableHead className="font-semibold">Status / Remaining</TableHead>
                            <TableHead className="font-semibold">Date Muted</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Loading mutes...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : mutes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                    {debouncedSearch ? "No mutes match your search." : "No muted users."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            mutes.map((mute) => (
                                <TableRow key={mute.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell>
                                        <ManagementProfileCell
                                            profileId={mute.mutedProfileId}
                                            fullName={mute.mutedProfile?.fullName}
                                            avatarUrl={mute.mutedProfile?.avatarUrl}
                                            profilePreview={mute.mutedProfile}
                                            isRestricted={mute.isMutedProfileRestricted || mute.hasBlockedRelation}
                                            restrictedMessage={mute.restrictedMessage}
                                            labelFallback="Unknown User"
                                        />
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm max-w-[180px] truncate">
                                        {mute?.muteReason || "No reason provided"}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full ${!mute.mutedUntil
                                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                                : "bg-orange-500/10 text-orange-700 dark:text-orange-400"
                                            }`}>
                                            <Clock className="h-3 w-3" />
                                            {getMuteStatusText(mute.mutedUntil)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {mute.dateCreated ? new Date(mute.dateCreated).toLocaleDateString() : "N/A"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 border-green-200 text-green-600 hover:text-green-700 hover:bg-green-50 hover:border-green-300 cursor-pointer"
                                            onClick={() => unmuteMember(mute.id)}
                                            disabled={mute.canUnmute === false || isUnmuting}
                                        >
                                            <Volume2 className="h-3.5 w-3.5 mr-1" /> Unmute
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 pt-6 border-t border-border/20">
                    <Button
                        variant="outline"
                        className="h-9 px-3 text-xs rounded-lg hover:bg-muted active:scale-95 transition-transform cursor-pointer"
                        disabled={pageNumber === 0}
                        onClick={() => setPageNumber(p => p - 1)}
                    >
                        Previous
                    </Button>
                    <span className="text-xs text-muted-foreground font-medium">Page {pageNumber + 1} of {totalPages}</span>
                    <Button
                        variant="outline"
                        className="h-9 px-3 text-xs rounded-lg hover:bg-muted active:scale-95 transition-transform cursor-pointer"
                        disabled={pageNumber >= totalPages - 1}
                        onClick={() => setPageNumber(p => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Member Search Modal */}
            <MemberSearchModal
                isOpen={isMuteModalOpen}
                onClose={() => setIsMuteModalOpen(false)}
                onSelect={handleMemberSelected}
                communityId={community.id}
                title="Select Member to Mute"
                description="Search community members by name. Only current members can be muted."
                highlightedIds={alreadyMutedProfileIds}
                mode="mute"
            />
        </div>
    );
}
