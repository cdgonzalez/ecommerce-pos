import { Request, Response, NextFunction } from 'express';
import prisma from '../database/prisma.client';
import { AppError } from '../utils/AppError';

export const requirePermission = (requiredPermission: string) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError('User not authenticated', 401));
      }

      // Buscar roles del usuario y popular sus permisos correspondientes
      const userRoles = await prisma.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      });

      // Aplanar los permisos en un único array de strings
      const userPermissions = userRoles.flatMap(ur => 
        ur.role.permissions.map(rp => rp.permission.name)
      );

      if (!userPermissions.includes(requiredPermission)) {
        return next(new AppError('Forbidden: Insufficient privileges', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};