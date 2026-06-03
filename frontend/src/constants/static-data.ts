import {
    Bell,
    Bookmark,
    Bot,
    Code2,
    Flag,
    GitBranch,
    HeartHandshake,
    HelpCircle,
    MessageSquare,
    MessagesSquare,
    Network,
    Shield,
    Sparkles,
    Tags,
    Users,
} from 'lucide-react'
import type { ColorType } from '@/types/color-type'

export const faqCategories = [
    {
        name: 'Getting Started',
        questions: [
            {
                question: 'What is DevNexus?',
                answer: 'DevNexus is a social network for developers. It brings posts, technical questions, communities, profiles, messaging, notifications, and AI-assisted coding support into one focused platform.',
            },
            {
                question: 'Who is DevNexus built for?',
                answer: 'DevNexus is built for programmers who want a dedicated place to discuss code, ask technical questions, follow other developers, join communities, and save useful knowledge for later.',
            },
            {
                question: 'How do I create an account?',
                answer: 'Create an account from the register page with your email, Google account, or GitHub account. After signing in, you can update your profile and start joining developer conversations.',
            },
        ],
    },
    {
        name: 'Posts and Q&A',
        questions: [
            {
                question: 'What can I post on DevNexus?',
                answer: 'You can share development updates, code snippets, technical notes, project ideas, and discussions that are useful to other developers.',
            },
            {
                question: 'How are questions different from regular posts?',
                answer: 'Questions are designed for technical problem solving. They support answers, comments, voting, and accepted answers so useful solutions are easier to find.',
            },
            {
                question: 'Can I save useful content?',
                answer: 'Yes. DevNexus includes saved content and bookmark workflows so you can come back to helpful posts, questions, and answers later.',
            },
        ],
    },
    {
        name: 'Communities',
        questions: [
            {
                question: 'What are communities used for?',
                answer: 'Communities group conversations around a topic, stack, project area, or interest. Members can share posts, ask questions, and follow discussions in a more focused space.',
            },
            {
                question: 'Can communities moderate content?',
                answer: 'Yes. Communities can use moderator workflows for pending content, reports, bans, mutes, and member management so each space can stay useful and focused.',
            },
            {
                question: 'Can I report harmful or off-topic content?',
                answer: 'Yes. Reporting workflows help moderators and administrators review posts, questions, answers, comments, and community content.',
            },
        ],
    },
    {
        name: 'AI Assistance',
        questions: [
            {
                question: 'What does AI help with?',
                answer: 'AI features support developer workflows such as explaining code, generating code diagrams, assisting with content metadata, drafting first responses for approved questions, and supporting moderation decisions.',
            },
            {
                question: 'Does AI replace community answers?',
                answer: 'No. DevNexus is social-first. AI can help unblock a discussion or explain technical context, but community posts, answers, comments, and moderation remain central.',
            },
            {
                question: 'What should I use AI answers for?',
                answer: 'Use AI-generated context as a starting point, then rely on developer answers, comments, votes, and accepted solutions to validate what works for your case.',
            },
        ],
    },
    {
        name: 'Messaging and Notifications',
        questions: [
            {
                question: 'Can I message other developers?',
                answer: 'Yes. DevNexus includes direct and group chat workflows with media, read receipts, typing indicators, edit history, and chat settings.',
            },
            {
                question: 'How do notifications work?',
                answer: 'Realtime notifications keep you updated when people interact with your posts, questions, answers, comments, follows, messages, or community workflows.',
            },
        ],
    },
    {
        name: 'Privacy and Safety',
        questions: [
            {
                question: 'Can I control who interacts with me?',
                answer: 'DevNexus includes follow, block, and privacy-oriented settings so users can shape their social experience.',
            },
            {
                question: 'How does DevNexus keep communities healthy?',
                answer: 'The platform combines reporting, moderator tools, admin review, community bans and mutes, notification controls, and AI-supported moderation to reduce low-quality or harmful content.',
            },
        ],
    },
]

export const values = [
    {
        icon: Users,
        title: 'Community First',
        description:
            'DevNexus is built around developer conversations: posts, questions, answers, comments, and communities.',
    },
    {
        icon: Code2,
        title: 'Practical Knowledge',
        description:
            'The platform is designed for real programming problems, code snippets, implementation details, and technical discussion.',
    },
    {
        icon: Shield,
        title: 'Trust and Safety',
        description:
            'Reports, moderation queues, bans, mutes, blocks, and admin workflows help keep developer spaces focused.',
    },
    {
        icon: Sparkles,
        title: 'AI as Assistance',
        description:
            'AI supports code understanding and moderation without replacing the developer community.',
    },
]

export const platformAreas = [
    {
        icon: Network,
        title: 'Developer Feed',
        description:
            'Share updates, ideas, code notes, and technical discussions in a feed built for programmers.',
    },
    {
        icon: HelpCircle,
        title: 'Q&A Threads',
        description:
            'Ask focused questions, collect answers, vote on helpful responses, and keep solutions discoverable.',
    },
    {
        icon: MessagesSquare,
        title: 'Communities',
        description:
            'Join topic-based spaces with member workflows, pending content, and moderator controls.',
    },
    {
        icon: Bell,
        title: 'Realtime Connection',
        description:
            'Stay in sync with notifications, direct chats, group messages, typing indicators, and read receipts.',
    },
    {
        icon: Bookmark,
        title: 'Saved Knowledge',
        description:
            'Bookmark useful posts, questions, and answers so important developer knowledge is easy to revisit.',
    },
    {
        icon: Flag,
        title: 'Moderation Tools',
        description:
            'Review reports, resolve community issues, and support healthier technical discussion spaces.',
    },
]

export const features = [
    {
        icon: Network,
        title: 'Developer Feed',
        description:
            'Post technical updates, share code snippets, discuss implementation choices, and follow developers whose work you care about.',
        isAI: false,
    },
    {
        icon: HelpCircle,
        title: 'Q&A for Code Problems',
        description:
            'Ask focused technical questions, collect answers, vote on useful responses, and mark accepted solutions.',
        isAI: false,
    },
    {
        icon: MessagesSquare,
        title: 'Focused Communities',
        description:
            'Create and join communities around stacks, project topics, and developer interests with built-in moderation workflows.',
        isAI: false,
    },
    {
        icon: MessageSquare,
        title: 'Realtime Messaging',
        description:
            'Move from public discussion to direct or group chats with message history, media, read state, and typing indicators.',
        isAI: false,
    },
    {
        icon: Bot,
        title: 'AI Code Assistance',
        description:
            'Use AI support for code explanations, code diagrams, content assistance, and first responses on approved questions.',
        isAI: true,
    },
    {
        icon: Shield,
        title: 'Safety and Moderation',
        description:
            'Reports, blocks, community bans, mutes, admin review, and AI-supported moderation help keep conversations useful.',
        isAI: true,
    },
]

export const techStacks = [
    { name: 'React', color: 'indigo' },
    { name: 'TypeScript', color: 'indigo' },
    { name: 'Next.js', color: 'indigo' },
    { name: '.NET', color: 'emerald' },
    { name: 'Node.js', color: 'emerald' },
    { name: 'Python', color: 'amber' },
    { name: 'PostgreSQL', color: 'indigo' },
    { name: 'Docker', color: 'indigo' },
    { name: 'RabbitMQ', color: 'amber' },
    { name: 'AI Tools', color: 'emerald' },
]

export const productStats = [
    {
        label: 'Posts',
        description: 'Share developer updates',
    },
    {
        label: 'Q&A',
        description: 'Solve technical problems',
    },
    {
        label: 'Communities',
        description: 'Build focused spaces',
    },
]

export const developerWorkflows = [
    {
        icon: Tags,
        title: 'Organize technical context',
        description:
            'Tags, communities, and saved content make useful discussions easier to find again.',
    },
    {
        icon: GitBranch,
        title: 'Move from question to solution',
        description:
            'Questions, answers, comments, votes, and accepted answers keep problem solving structured.',
    },
    {
        icon: HeartHandshake,
        title: 'Stay connected to people',
        description:
            'Profiles, follows, messaging, and notifications keep collaboration close to the work.',
    },
]

export const colorClasses: Record<ColorType, string> = {
    indigo:
        'dark:bg-indigo-500/10 bg-indigo-50 dark:text-indigo-300 text-indigo-700 dark:border-indigo-500/30 border-indigo-200',
    emerald:
        'dark:bg-emerald-500/10 bg-emerald-50 dark:text-emerald-300 text-emerald-700 dark:border-emerald-500/30 border-emerald-200',
    amber:
        'dark:bg-amber-500/10 bg-amber-50 dark:text-amber-300 text-amber-700 dark:border-amber-500/30 border-amber-200',
}
