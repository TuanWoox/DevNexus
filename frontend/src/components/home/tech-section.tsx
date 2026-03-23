import { techStacks, colorClasses } from '@/constants/static-data'
import type { ColorType } from '@/types/color-type'

export function TechSection() {
    return (
        <section className="bg-page py-16 lg:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <p className="text-sm text-muted-foreground">
                        Learn the technologies that power the modern web
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                    {techStacks.map((tech) => (
                        <span
                            key={tech.name}
                            className={`font-mono text-sm px-4 py-2 rounded-lg border ${colorClasses[tech.color as ColorType]
                                }`}
                        >
                            {tech.name}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    )
}
