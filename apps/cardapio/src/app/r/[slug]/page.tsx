import { Metadata } from 'next';
import RestaurantMenu from './RestaurantMenu';

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

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getMenuData(params.slug);
  return {
    title: data?.restaurant?.name || 'Cardápio Digital',
    description: data?.restaurant?.description || 'Cardápio digital',
  };
}

export default async function RestaurantPage({ params }: { params: { slug: string } }) {
  const data = await getMenuData(params.slug);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-6xl mb-4">🍽️</p>
          <h1 className="text-2xl font-bold text-gray-800">Restaurante não encontrado</h1>
          <p className="text-gray-500 mt-2">Verifique se o link está correto</p>
        </div>
      </div>
    );
  }

  return <RestaurantMenu restaurant={data.restaurant} categories={data.categories} />;
}
