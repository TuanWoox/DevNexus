import { SelectCommunityDTO } from "@/types/community/select-community-dto";
import Image from "next/image";
import Link from "next/link";
import { Lock, Users } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

interface CommunityCardProps {
    community: SelectCommunityDTO;
}

export function CommunityCard({ community }: CommunityCardProps) {
    const formattedDate = community.dateCreated
        ? new Date(community.dateCreated).toLocaleDateString()
        : "N/A";

    return (
        <Link href={`/communities/${community.id}`} className="block h-full group">
            <Card className="h-full flex flex-col hover:border-primary/50 transition-colors overflow-hidden bg-card/50 backdrop-blur-sm">
                {/* Cover Photo Area */}
                <div className="relative h-32 w-full bg-gradient-to-r from-primary/20 to-primary/5 overflow-hidden">
                    {community.communityCoverPhotoUrl ? (
                        <Image
                            src={community.communityCoverPhotoUrl}
                            alt={community.name}
                            fill
                            unoptimized
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                            <Users className="w-16 h-16 text-primary" />
                        </div>
                    )}
                    {/* Private Lock Icon */}
                    {community.isPrivate && (
                        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm p-1.5 rounded-full text-muted-foreground shadow-sm">
                            <Lock className="w-4 h-4" />
                        </div>
                    )}
                </div>

                <CardHeader className="p-4 pb-2 space-y-1">
                    <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                        {community.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Est. {formattedDate}
                    </p>
                </CardHeader>

                <CardContent className="p-4 pt-0 flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                        {community.description || "No description provided."}
                    </p>
                </CardContent>
            </Card>
        </Link>
    );
}
