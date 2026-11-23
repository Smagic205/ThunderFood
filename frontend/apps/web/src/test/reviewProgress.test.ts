import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getReviewedProductIds,
  isOrderMarkedReviewed,
  markOrderReviewed,
  saveReviewedProductIds,
} from '@/pages/account/reviewProgress';

describe('review progress persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stores unique reviewed products separately for each user and order', () => {
    saveReviewedProductIds(3, 20, [101, 102, 101]);

    expect(getReviewedProductIds(3, 20)).toEqual([101, 102]);
    expect(getReviewedProductIds(3, 21)).toEqual([]);
    expect(getReviewedProductIds(4, 20)).toEqual([]);
  });

  it('ignores invalid product IDs and malformed stored JSON', () => {
    localStorage.setItem('thunderfood:reviewed-products:3:20', JSON.stringify([101, '102', 0.5, null, 103]));
    expect(getReviewedProductIds(3, 20)).toEqual([101, 103]);

    localStorage.setItem('thunderfood:reviewed-products:3:21', '{invalid json');
    expect(getReviewedProductIds(3, 21)).toEqual([]);
  });

  it('marks completion only for the selected order', () => {
    markOrderReviewed(3, 20);

    expect(isOrderMarkedReviewed(3, 20)).toBe(true);
    expect(isOrderMarkedReviewed(3, 21)).toBe(false);
  });

  it('keeps review flow usable when browser storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    expect(getReviewedProductIds(3, 20)).toEqual([]);
    expect(isOrderMarkedReviewed(3, 20)).toBe(false);
    expect(() => saveReviewedProductIds(3, 20, [101])).not.toThrow();
    expect(() => markOrderReviewed(3, 20)).not.toThrow();
  });
});
