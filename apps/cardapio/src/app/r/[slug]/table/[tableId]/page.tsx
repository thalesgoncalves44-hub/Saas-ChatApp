import { Metadata } from 'next';
import RestaurantMenu from '../../RestaurantMenu';
import { redirect } from 'next/navigation';

async function getMenuData(slug: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  try {
    const res = await fetch(`${API_URL}/public/menu/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string; tableId: string };
}): Promise<Metadata> {
  const data = await getMenuData(params.slug);
  return {
    title: data?.restaurant?.name ? `${data.restaurant.name} - Mesa` : 'Cardápio Digital',
    description: data?.restaurant?.description || 'Cardápio digital',
  };
}

export default async function TableMenuPage({
  params,
}: {
  params: { slug: string; tableId: string };
}) {
  const data = await getMenuData(params.slug);

  if (!data) {
    redirect(`/r/${params.slug}`);
  }

  // Pass tableId so cart knows this is a dine-in order
  return (
    <RestaurantMenu
      restaurant={{ ...data.restaurant, defaultOrderType: 'DINE_IN', tableId: params.tableId }}
      categories={data.categories}
    />
  );
}
