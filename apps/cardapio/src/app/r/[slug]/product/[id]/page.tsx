import { redirect } from 'next/navigation';

// Redirect to menu - product details are shown in a modal on the menu page
export default function ProductPage({ params }: { params: { slug: string; id: string } }) {
  redirect(`/r/${params.slug}`);
}
