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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: UpdateCommunityDTO = {
            id: community.id,
            name,
            description,
            isPrivate,
            slug: community.slug,
            communityCoverPhotoUrl: community.communityCoverPhotoUrl
        };
        updateCommunity(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Community Name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                    />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label>Private Community</Label>
                        <p className="text-sm text-muted-foreground">
                            If enabled, users must request to join the community.
                        </p>
                    </div>
                    <Switch
                        checked={isPrivate}
                        onCheckedChange={setIsPrivate}
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={isPending} variant="custom" className="btn-primary text-white">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </form>
    );
}
