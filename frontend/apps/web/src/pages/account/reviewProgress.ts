const getProductKey = (userId: number, orderId: number) => `thunderfood:reviewed-products:${userId}:${orderId}`;
const getOrderKey = (userId: number, orderId: number) => `thunderfood:reviewed-order:${userId}:${orderId}`;

export const getReviewedProductIds = (userId: number, orderId: number): number[] => {
  try {
    const value = localStorage.getItem(getProductKey(userId, orderId));
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is number => Number.isInteger(id)) : [];
  } catch {
    return [];
  }
};

export const saveReviewedProductIds = (userId: number, orderId: number, productIds: number[]) => {
  try {
    localStorage.setItem(getProductKey(userId, orderId), JSON.stringify([...new Set(productIds)]));
  } catch {
    // Successful reviews still stand even when this browser cannot persist local progress.
  }
};

export const isOrderMarkedReviewed = (userId: number, orderId: number) => {
  try {
    return localStorage.getItem(getOrderKey(userId, orderId)) === 'true';
  } catch {
    return false;
  }
};

export const markOrderReviewed = (userId: number, orderId: number) => {
  try {
    localStorage.setItem(getOrderKey(userId, orderId), 'true');
  } catch {
    // The order can still be reviewed in the current open modal.
  }
};
