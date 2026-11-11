import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/store/authStore';
import { wishlistApi } from '@/shared/api/wishlistApi';

export const myWishlistQueryKey = (userId?: number) => ['my-wishlist', userId] as const;

export function useMyWishlist() {
  const { user, isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: myWishlistQueryKey(user?.id),
    queryFn: wishlistApi.getAll,
    enabled: isAuthenticated && Boolean(user?.id),
    staleTime: 30_000,
  });
}
