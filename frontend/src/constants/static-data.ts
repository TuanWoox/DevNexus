import {
    Target,
    Heart,
    Rocket,
    Sparkles,
    Users,
    BookOpen,
    Code2,
    Zap,
    Shield,
} from 'lucide-react'
import type { ColorType } from '@/types/color-type'

// FAQ Categories for FAQ page
export const faqCategories = [
    // ... Giữ nguyên mảng data faqCategories của bạn ...
    {
        name: 'Getting Started',
        questions: [
            {
                question: 'What is DevNexus?',
                answer: 'DevNexus is an AI-enhanced social learning network designed specifically for software engineers. We combine community-driven learning with AI-powered personalization to help you grow your skills faster and more effectively.',
            },
            {
                question: 'How do I create an account?',
                answer: 'Creating an account is simple and free. Click the "Get Started" button on our homepage, enter your email address, and follow the verification steps. You can also sign up using your GitHub or Google account for faster onboarding.',
            },
            {
                question: 'Is DevNexus free to use?',
                answer: 'Yes! DevNexus offers a generous free tier that includes access to community discussions, basic learning paths, and limited AI features. Premium plans unlock advanced AI recommendations, exclusive content, and priority support.',
            },
            {
                question: 'What technologies can I learn on DevNexus?',
                answer: 'DevNexus covers a wide range of technologies including React, TypeScript, Next.js, Node.js, Python, Go, Rust, PostgreSQL, GraphQL, Docker, Kubernetes, and cloud platforms like AWS, GCP, and Azure. New topics are added regularly based on community demand.',
            },
        ],
    },
    {
        name: 'AI Features',
        questions: [
            {
                question: 'How does AI-powered learning work?',
                answer: 'Our AI analyzes your learning patterns, skill level, and goals to create personalized learning paths. It recommends content, identifies knowledge gaps, and adapts to your progress in real-time. The AI also provides instant explanations and code examples tailored to your current understanding.',
            },
            {
                question: 'What makes the AI recommendations special?',
                answer: 'Unlike generic recommendations, our AI considers your coding style, preferred learning format, available time, and career goals. It learns from thousands of successful learning journeys to suggest the most effective path for you specifically.',
            },
            {
                question: 'Can I turn off AI features?',
                answer: 'Absolutely. While AI enhances the learning experience, you can disable AI recommendations at any time from your account settings. You will still have full access to all community content and manual learning paths.',
            },
        ],
    },
    {
        name: 'Community & Learning',
        questions: [
            {
                question: 'How can I connect with other engineers?',
                answer: 'DevNexus offers multiple ways to connect: join topic-specific discussion groups, participate in code reviews, collaborate on projects, attend virtual study sessions, and engage in our active Discord community. You can also follow engineers whose work inspires you.',
            },
            {
                question: 'Are there mentorship opportunities?',
                answer: 'Yes! Our mentorship program pairs learners with experienced engineers. Mentors provide guidance, code reviews, and career advice. You can apply to become a mentee or, as you grow, give back by becoming a mentor yourself.',
            },
            {
                question: 'How do verified skill badges work?',
                answer: 'Skill badges are earned by completing assessments that test practical knowledge. Unlike participation certificates, our badges verify actual competency through coding challenges and peer reviews. They are recognized by employers in our partner network.',
            },
        ],
    },
    {
        name: 'Account & Billing',
        questions: [
            {
                question: 'How do I upgrade to a premium plan?',
                answer: 'Visit your account settings and select "Upgrade Plan" to view available options. We offer monthly and annual billing, with significant savings on annual plans. All premium plans include a 14-day free trial.',
            },
            {
                question: 'Can I cancel my subscription anytime?',
                answer: 'Yes, you can cancel your subscription at any time from your account settings. You will retain access to premium features until the end of your current billing period. No refunds are provided for partial months.',
            },
            {
                question: 'Do you offer team or enterprise plans?',
                answer: 'We offer special pricing for teams of 5 or more, and custom enterprise solutions for larger organizations. Enterprise plans include advanced analytics, SSO integration, and dedicated support. Contact our sales team for details.',
            },
        ],
    },
]

// Values for About page
export const values = [
    {
        icon: Target,
        title: 'Mission-Driven',
        description:
            'We believe every engineer deserves access to world-class learning resources and mentorship.',
    },
    {
        icon: Heart,
        title: 'Community First',
        description:
            'Our platform thrives because of our passionate community of learners and mentors.',
    },
    {
        icon: Rocket,
        title: 'Innovation',
        description:
            'We continuously push boundaries with AI to create better learning experiences.',
    },
]

// Team members for About page
export const team = [
    {
        name: 'Sarah Chen',
        role: 'CEO & Co-Founder',
        bio: 'Former Google engineer with a passion for education.',
        avatar: 'SC',
    },
    {
        name: 'Marcus Johnson',
        role: 'CTO & Co-Founder',
        bio: 'Ex-Meta AI researcher, building the future of learning.',
        avatar: 'MJ',
    },
    {
        name: 'Emily Rodriguez',
        role: 'Head of Product',
        bio: '10+ years in edtech, obsessed with user experience.',
        avatar: 'ER',
    },
    {
        name: 'David Kim',
        role: 'Head of Engineering',
        bio: 'Open source contributor and systems architect.',
        avatar: 'DK',
    },
]

// Milestones for About page
export const milestones = [
    { year: '2022', event: 'DevNexus founded in San Francisco' },
    { year: '2023', event: 'Launched AI-powered learning paths' },
    { year: '2024', event: 'Reached 50,000 active engineers' },
    { year: '2025', event: 'Expanded to 100+ countries worldwide' },
]

// Features for Home page
export const features = [
    {
        icon: Sparkles,
        title: 'AI-Powered Learning',
        description:
            'Get personalized recommendations and AI-generated explanations tailored to your learning style.',
        isAI: true,
    },
    {
        icon: Users,
        title: 'Community Driven',
        description:
            'Connect with engineers worldwide. Share knowledge, ask questions, and grow together.',
        isAI: false,
    },
    {
        icon: BookOpen,
        title: 'Curated Content',
        description:
            'Access thousands of tutorials, articles, and code examples vetted by industry experts.',
        isAI: false,
    },
    {
        icon: Code2,
        title: 'Hands-on Practice',
        description:
            'Build real projects with interactive coding environments and instant feedback.',
        isAI: false,
    },
    {
        icon: Zap,
        title: 'Fast Track Progress',
        description:
            'AI analyzes your skills and creates the optimal learning path to reach your goals faster.',
        isAI: true,
    },
    {
        icon: Shield,
        title: 'Verified Skills',
        description:
            'Earn credentials that employers trust. Showcase your expertise with verified badges.',
        isAI: false,
    },
]

// Tech stacks for Home page
export const techStacks = [
    { name: 'React', color: 'indigo' },
    { name: 'TypeScript', color: 'indigo' },
    { name: 'Next.js', color: 'indigo' },
    { name: 'Node.js', color: 'emerald' },
    { name: 'Python', color: 'amber' },
    { name: 'Go', color: 'indigo' },
    { name: 'Rust', color: 'amber' },
    { name: 'PostgreSQL', color: 'indigo' },
    { name: 'GraphQL', color: 'emerald' },
    { name: 'Docker', color: 'indigo' },
    { name: 'Kubernetes', color: 'indigo' },
    { name: 'AWS', color: 'amber' },
]

// Color classes for tech, skill tag
export const colorClasses: Record<ColorType, string> = {
    indigo:
        'dark:bg-indigo-500/10 bg-indigo-50 dark:text-indigo-300 text-indigo-700 dark:border-indigo-500/30 border-indigo-200',
    emerald:
        'dark:bg-emerald-500/10 bg-emerald-50 dark:text-emerald-300 text-emerald-700 dark:border-emerald-500/30 border-emerald-200',
    amber:
        'dark:bg-amber-500/10 bg-amber-50 dark:text-amber-300 text-amber-700 dark:border-amber-500/30 border-amber-200',
}