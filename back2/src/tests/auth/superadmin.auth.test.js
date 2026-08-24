import { jest } from '@jest/globals';
import { superAdminAuth } from '../../middlewares/superadmin.middleware.js';

import { ROLES } from '../../constants/roles.constant.js';

describe('SuperAdmin Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      originalUrl: '/api/superadmin/dashboard',
      method: 'GET',
      ip: '127.0.0.1',
      headers: { 'user-agent': 'jest-test' }
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  test('Debe permitir el paso si el rol es SUPERADMIN', () => {
    mockReq.user = { email: 'octavio.velo2022@gmail.com', rol: ROLES.SUPERADMIN };
    superAdminAuth(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });

  test('Debe bloquear y lanzar 403 si el rol es EMPLEADO', () => {
    mockReq.user = { email: 'empleado@lavanderia.com', rol: 'EMPLEADO' };
    superAdminAuth(mockReq, mockRes, mockNext);
    const errorPassed = mockNext.mock.calls[0][0];
    expect(errorPassed.statusCode).toBe(403);
  });
});
