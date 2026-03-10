import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-2xl bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Shadcn UI & Tailwind Test
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Nếu bạn nhìn thấy các nút bám theo style bên dưới, nghĩa là Shadcn UI đã được cài đặt và hoạt động thành công!
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <Button variant="default">Default Button</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>
    </div>
  );
}
