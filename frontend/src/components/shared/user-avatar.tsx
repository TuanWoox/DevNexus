"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const DEFAULT_AVATAR_URL = "/images/default-avatar.webp"

interface UserAvatarProps {
  avatarUrl?: string | null
  fullName?: string | null
  className?: string
  size?: "default" | "sm" | "lg"
}

export function UserAvatar({
  avatarUrl,
  fullName,
  className,
  size = "default",
}: UserAvatarProps) {
  const alt = fullName?.trim() || "User"

  return (
    <Avatar className={className} size={size}>
      <AvatarImage src={avatarUrl || DEFAULT_AVATAR_URL} alt={alt} />
      <AvatarFallback className="p-0">
        <img
          src={DEFAULT_AVATAR_URL}
          alt={alt}
          className={cn("size-full rounded-full object-cover")}
        />
      </AvatarFallback>
    </Avatar>
  )
}

