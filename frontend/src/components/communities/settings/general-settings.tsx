"use client";

import { useUpdateCommunity } from "@/hooks/community-hooks/use-update-community";
import { SelectCommunityDTO } from "@/types/community/select-community-dto";
import { UpdateCommunityDTO } from "@/types/community/update-community-dto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface GeneralSettingsProps {
    community: SelectCommunityDTO;
}

export function GeneralSettings({ community }: GeneralSettingsProps) {
    const { mutate: updateCommunity, isPending } = useUpdateCommunity();

    const [name, setName] = useState(community.name);
    const [description, setDescription] = useState(community.description || "");
    const [isPrivate, setIsPrivate] = useState(community.isPrivate);
    const [requireContentApproval, setRequireContentApproval] = useState(community.requireContentApproval);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: UpdateCommunityDTO = {
            id: community.id,
            name,
            description,
            isPrivate,
            requireContentApproval,
            communityCoverPhotoUrl: community.communityCoverPhotoUrl
        };
        updateCommunity(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Community Name
                    </Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="rounded-xl border border-border/60 bg-muted/10 px-4 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:bg-background transition-all duration-200"
                        placeholder="Enter community name..."
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Description
                    </Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="rounded-xl border border-border/60 bg-muted/10 px-4 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:bg-background transition-all duration-200 resize-none"
                        placeholder="Describe your community, topics, and guidelines..."
                    />
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-muted/5 p-5 hover:bg-muted/10 transition-colors duration-200">
                    <div className="space-y-1 pr-4">
                        <Label className="text-sm font-semibold text-foreground">Private Community</Label>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            When enabled, users must request and be approved by a moderator or owner to join this community.
                        </p>
                    </div>
                    <Switch
                        checked={isPrivate}
                        onCheckedChange={setIsPrivate}
                        className="cursor-pointer"
                    />
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-muted/5 p-5 hover:bg-muted/10 transition-colors duration-200">
                    <div className="space-y-1 pr-4">
                        <Label className="text-sm font-semibold text-foreground">Require Content Approval</Label>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            New posts and questions must be approved before appearing in the community feed.
                        </p>
                    </div>
                    <Switch
                        checked={requireContentApproval}
                        onCheckedChange={setRequireContentApproval}
                        className="cursor-pointer"
                    />
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <Button 
                    type="submit" 
                    disabled={isPending} 
                    variant="custom" 
                    className="btn-primary text-white font-medium shadow-xs hover:shadow-md active:scale-[0.98] transition-all duration-150 ease-out cursor-pointer h-10 px-5 rounded-xl"
                >
                    {isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Save Changes
                </Button>
            </div>
        </form>
    );
}
