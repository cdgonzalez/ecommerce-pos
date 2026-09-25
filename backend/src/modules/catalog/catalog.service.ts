import slugify from 'slugify';
import prisma from '../../core/database/prisma.client';
import redisClient from '../../core/cache/redis.client';
import { AppError } from '../../core/utils/AppError';
import { CreateCategoryDTO, CreateProductDTO } from './catalog.schema';

export class CatalogService {
  
  async getCategories() {
    const cacheKey = 'catalog:categories';
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(categories)); // 1 hora de caché
    
    return categories;
  }

  async createCategory(data: CreateCategoryDTO) {
    const slug = slugify(data.name, { lower: true, strict: true });
    const exists = await prisma.category.findUnique({ where: { slug } });
    if (exists) throw new AppError('Category already exists', 409);

    const category = await prisma.category.create({ data: { ...data, slug } });
    await redisClient.del('catalog:categories'); // Invalidar caché
    return category;
  }

  async getProducts(queryParams: { search?: string; category?: string; status?: string }) {
    // Definir llave de caché combinando los parámetros de búsqueda
    const cacheKey = `catalog:products:${JSON.stringify(queryParams)}`;
    
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const { search, category, status = 'ACTIVE' } = queryParams;
    const whereClause: any = { status };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (category) whereClause.category = { slug: category };

    const products = await prisma.product.findMany({
      where: whereClause,
      include: { category: { select: { name: true, slug: true } }, brand: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    await redisClient.setEx(cacheKey, 300, JSON.stringify(products)); // 5 minutos de caché
    return products;
  }

  async createProduct(data: CreateProductDTO) {
    const slug = slugify(data.name, { lower: true, strict: true });
    const existingProduct = await prisma.product.findFirst({ where: { OR: [{ slug }, { sku: data.sku }] } });
    
    if (existingProduct) throw new AppError('Product with this name or SKU already exists', 409);

    const product = await prisma.product.create({
      data: { ...data, slug },
      include: { category: true, brand: true }
    });

    // Limpiar toda la caché de productos iterando sobre llaves (Patrón SCAN recomendado en prod, Keys para dev)
    const keys = await redisClient.keys('catalog:products:*');
    if (keys.length > 0) await redisClient.del(keys);

    return product;
  }

  async getProductBySlug(slug: string) {
    const cacheKey = `catalog:product:${slug}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const product = await prisma.product.findUnique({
      where: { slug },
      include: { category: true, brand: true }
    });

    if (!product) throw new AppError('Product not found', 404);
    await redisClient.setEx(cacheKey, 300, JSON.stringify(product));
    return product;
  }
}