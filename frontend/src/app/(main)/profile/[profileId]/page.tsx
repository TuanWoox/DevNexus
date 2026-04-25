import { Metadata, ResolvingMetadata } from 'next';
import { ProfileViewWrapper } from '@/components/profile/profile-view-wrapper';
import { cookies } from 'next/headers';

type Props = {
    params: Promise<{ profileId: string }>
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const resolvedParams = await params;
    const id = resolvedParams.profileId;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL_HTTPS || process.env.NEXT_PUBLIC_API_URL_HTTP || 'http://localhost:5000';

    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;

        // nếu api đang chạy ở https thì fetch trên server của nodejs 
        // sẽ tự động từ chối kết nối vì chứng chỉ SSL ở local 
        // là chứng chỉ tự ký (không đáng tin cậy). 
        // Node sẽ quăng lỗi DEPTH_ZERO_SELF_SIGNED_CERT hoặc fetch failed.  
        const response = await fetch(`${apiUrl}/Profiles/${id}`, {
            cache: 'no-store',
            headers: token ? {
                'Authorization': `Bearer ${token}`,
            } : {}
        });

        if (!response.ok) {
            return {
                title: 'Profile Not Found | DevNexus',
            };
        }
        const data = await response.json();
        const profile = data?.result;

        return {
            title: profile?.fullName || 'Profile',
            description: profile?.bio || 'Check out this profile on DevNexus',
            openGraph: {
                title: `${profile?.fullName} - DevNexus Profile`,
                description: profile?.bio,
                images: profile?.avatarUrl ? [profile?.avatarUrl] : [],
                type: 'profile'
            },
        };
    } catch (error) {
        // In ra log của server (terminal chạy Next.js)
        console.error("Lỗi gọi API trong generateMetadata:", error);
        return {
            title: 'Profile | DevNexus',
        };
    }
}

export default async function ProfilePage({ params }: Props) {
    const resolvedParams = await params;
    return <ProfileViewWrapper profileId={resolvedParams.profileId} />;
}
