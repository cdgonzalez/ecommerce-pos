import { describe, it, expect } from 'vitest';
import { buildPaginationMeta, paginationQuerySchema } from '../../src/core/utils/pagination';

describe('Pagination Helper Unit Tests', () => {
  it('should calculate correct pagination metadata on first page', () => {
    const meta = buildPaginationMeta(45, 1, 20);

    expect(meta.total).toBe(45);
    expect(meta.page).toBe(1);
    expect(meta.limit).toBe(20);
    expect(meta.totalPages).toBe(3);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPrevPage).toBe(false);
  });

  it('should calculate correct metadata on middle page', () => {
    const meta = buildPaginationMeta(100, 2, 20);

    expect(meta.page).toBe(2);
    expect(meta.totalPages).toBe(5);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPrevPage).toBe(true);
  });

  it('should calculate correct metadata on last page', () => {
    const meta = buildPaginationMeta(60, 3, 20);

    expect(meta.page).toBe(3);
    expect(meta.totalPages).toBe(3);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(true);
  });

  it('should handle zero records gracefully', () => {
    const meta = buildPaginationMeta(0, 1, 20);

    expect(meta.total).toBe(0);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(false);
  });

  it('should coerce query string numbers safely in paginationQuerySchema', () => {
    const parsed = paginationQuerySchema.parse({ page: '3', limit: '15' });

    expect(parsed.page).toBe(3);
    expect(parsed.limit).toBe(15);
  });

  it('should use default values when parameters are omitted', () => {
    const parsed = paginationQuerySchema.parse({});

    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
  });
});

