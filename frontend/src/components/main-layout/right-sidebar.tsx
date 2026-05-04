import Link from 'next/link'
import { Sparkles } from 'lucide-react'

// TODO: fetch trending tags from API instead of using hardcoded mock data
const trendingTags = [
    { tag: '#reactjs', posts: '12.5K posts' },
    { tag: '#system-design', posts: '8.2K posts' },
    { tag: '#ai-agents', posts: '5.1K posts' },
]

export function RightSidebar() {
    return (
        <aside className="hidden xl:block w-80 sticky top-0 h-screen py-6 px-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="card-ai p-5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-ai-gradient font-bold">AI Learning Assistant</h3>
                </div>
                <p className="text-sm text-body leading-relaxed">
                    I analyzed your recent JS posts. Want to try a quick quiz on Closures?
                </p>
                <button className="w-full mt-3 py-2 px-4 rounded-lg border border-default text-heading text-xs font-medium hover:bg-subtle transition-colors">
                    Start Quiz
                </button>
            </div>

            <div className="card p-5">
                <h3 className="text-heading font-bold mb-4">Trending Topics</h3>
                <div className="flex flex-col gap-4">
                    {trendingTags.map((item, idx) => (
                        <div key={idx} className="flex flex-col cursor-pointer group">
                            <span className="text-sm font-medium text-heading group-hover:text-primary transition-colors">
                                {item.tag}
                            </span>
                            <span className="text-xs text-muted-foreground mt-0.5">
                                {item.posts}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-3 gap-y-1 px-2 text-xs text-dimmed">
                <Link href="/about" className="hover:text-primary">About</Link>
                <Link href="/faq" className="hover:text-primary">Help</Link>
                <Link href="/privacy" className="hover:text-primary">Privacy</Link>
                <Link href="/terms" className="hover:text-primary">Terms</Link>
                <span className="w-full mt-2">© 2026 DevNexus.</span>
            </div>
        </aside>
    )
}
