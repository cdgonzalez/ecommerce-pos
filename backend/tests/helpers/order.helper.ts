export function createMockOrder(overrides: Partial<any> = {}) {
  return {
    id: 'mock-order-uuid-1',
    userId: 'mock-user-uuid-1',
    status: 'PROCESSING',
    subtotal: 100.0,
    taxes: 16.0,
    total: 116.0,
    shippingAddress: '123 Fake Street, City, Country',
    carrier: null,
    trackingNumber: null,
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      name: 'John Doe',
      email: 'john@example.com'
    },
    items: [
      {
        id: 'order-item-uuid-1',
        orderId: 'mock-order-uuid-1',
        productId: 'product-uuid-1',
        productName: 'Wireless Mouse',
        sku: 'MOU-001',
        unitPrice: 50.0,
        quantity: 2,
        totalPrice: 100.0
      }
    ],
    payments: [
      {
        id: 'payment-uuid-1',
        orderId: 'mock-order-uuid-1',
        amount: 116.0,
        method: 'CREDIT_CARD',
        status: 'COMPLETED',
        reference: 'WEB-123456789'
      }
    ],
    ...overrides
  };
}

