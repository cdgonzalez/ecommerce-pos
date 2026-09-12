import slugify from 'slugify';
import prisma from '../../core/database/prisma.client';
import { AppError } from '../../core/utils/AppError';
import { CreateCategoryDTO, CreateProductDTO } from './catalog.schema';

export class CatalogService {
  // --- Categories ---
  async createCategory(data: CreateCategoryDTO) {
    const slug = slugify(data.name, { lower: true, strict: true });
    const exists = await prisma.category.findUnique({ where: { slug } });
    
    if (exists) throw new AppError('Category already exists', 409);

    return prisma.category.create({
      data: { ...data, slug }
    });
  }

  async getCategories() {
    return prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  // --- Products ---
  async createProduct(data: CreateProductDTO) {
    const slug = slugify(data.name, { lower: true, strict: true });
    
    // Verificar unicidad
    const existingProduct = await prisma.product.findFirst({
      where: { OR: [{ slug }, { sku: data.sku }] }
    });
    
    if (existingProduct) {
      throw new AppError('Product with this name or SKU already exists', 409);
    }

    return prisma.product.create({
      data: { ...data, slug },
      include: { category: true, brand: true }
    });
  }

  async getProducts(queryParams: { search?: string; category?: string; status?: string }) {
    const { search, category, status = 'ACTIVE' } = queryParams;

    const whereClause: any = { status };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      whereClause.category = { slug: category };
    }

    return prisma.product.findMany({
      where: whereClause,
      include: {
        category: { select: { name: true, slug: true } },
        brand: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getProductBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { category: true, brand: true }
    });

    if (!product) throw new AppError('Product not found', 404);
    
    return product;
  }
}