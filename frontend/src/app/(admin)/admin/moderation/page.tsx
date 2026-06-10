import { redirect } from 'next/navigation'

export default function ModerationRedirect() {
  redirect('/admin/review-queue')
}
