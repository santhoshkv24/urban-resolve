// ===========================================
// Admin Routes — Master Data Management
// CRUD for Departments and Users
// All routes require ADMIN role
// ===========================================

const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { requireFields } = require('../middleware/validate');
const { encrypt, decrypt } = require('../services/crypto.service');
const { sendSuccess, sendError, getPagination } = require('../utils/helpers');

// All admin routes require authentication + ADMIN role
router.use(authenticate, requireRole('ADMIN'));

// ===========================
//  DEPARTMENT CRUD
// ===========================

// ---- GET /api/admin/departments ----
// List all departments
router.get('/departments', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { workers: true, assignedTickets: true },
        },
      },
    });

    return sendSuccess(res, { departments });
  } catch (error) {
    console.error('List departments error:', error);
    return sendError(res, 'Failed to fetch departments.');
  }
});

// ---- GET /api/admin/departments/:id ----
// Get a single department by ID
router.get('/departments/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        workers: {
          select: { id: true, name: true, email: true, isActive: true },
        },
        _count: {
          select: { assignedTickets: true, recommendedTickets: true },
        },
      },
    });

    if (!department) {
      return sendError(res, 'Department not found.', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, { department });
  } catch (error) {
    console.error('Get department error:', error);
    return sendError(res, 'Failed to fetch department.');
  }
});

// ---- POST /api/admin/departments ----
// Create a new department
router.post('/departments', requireFields('name'), async (req, res) => {
  try {
    const { name, description, aiLabel } = req.body;

    // Check for duplicate name
    const existing = await prisma.department.findUnique({ where: { name } });
    if (existing) {
      return sendError(res, 'A department with this name already exists.', 409, 'DUPLICATE_NAME');
    }

    const department = await prisma.department.create({
      data: {
        name,
        description: description || null,
        aiLabel: aiLabel || null,
      },
    });

    return sendSuccess(res, { department }, 201, 'Department created successfully');
  } catch (error) {
    console.error('Create department error:', error);
    return sendError(res, 'Failed to create department.');
  }
});

// ---- PUT /api/admin/departments/:id ----
// Update department details
router.put('/departments/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, aiLabel, isActive } = req.body;

    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Department not found.', 404, 'NOT_FOUND');
    }

    // Check for name conflict if changing name
    if (name && name !== existing.name) {
      const nameConflict = await prisma.department.findUnique({ where: { name } });
      if (nameConflict) {
        return sendError(res, 'A department with this name already exists.', 409, 'DUPLICATE_NAME');
      }
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(aiLabel !== undefined && { aiLabel }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return sendSuccess(res, { department }, 200, 'Department updated successfully');
  } catch (error) {
    console.error('Update department error:', error);
    return sendError(res, 'Failed to update department.');
  }
});

// ---- DELETE /api/admin/departments/:id ----
// Delete a department (guarded — fails if active tickets reference it)
router.delete('/departments/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Department not found.', 404, 'NOT_FOUND');
    }

    // Guard: Check for active tickets assigned to this department
    const activeTickets = await prisma.ticket.count({
      where: {
        assignedDepartmentId: id,
        status: { in: ['PENDING_ADMIN', 'ASSIGNED', 'ESCALATED_TO_ADMIN'] },
      },
    });

    if (activeTickets > 0) {
      return sendError(
        res,
        `Cannot delete department — ${activeTickets} active ticket(s) are assigned to it.`,
        400,
        'DEPARTMENT_IN_USE'
      );
    }

    await prisma.department.delete({ where: { id } });
    return sendSuccess(res, null, 200, 'Department deleted successfully');
  } catch (error) {
    console.error('Delete department error:', error);
    return sendError(res, 'Failed to delete department.');
  }
});

// ===========================
//  USER / EMPLOYEE CRUD
// ===========================

// ---- GET /api/admin/users ----
// List all users with optional role and department filters
router.get('/users', async (req, res) => {
  try {
    const { role, departmentId, page, limit } = req.query;

    // Build filter
    const where = {};
    if (role) where.role = role;
    if (departmentId) where.departmentId = parseInt(departmentId);

    const total = await prisma.user.count({ where });
    const pagination = getPagination(page, limit, total);

    const users = await prisma.user.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
        emailVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    return sendSuccess(res, { users, pagination });
  } catch (error) {
    console.error('List users error:', error);
    return sendError(res, 'Failed to fetch users.');
  }
});

// ---- GET /api/admin/users/:id ----
// Get a single user by ID (with decrypted PII)
router.get('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneEncrypted: true,
        addressEncrypted: true,
        role: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return sendError(res, 'User not found.', 404, 'NOT_FOUND');
    }

    // Decrypt sensitive fields for admin view
    const userData = {
      ...user,
      phone: decrypt(user.phoneEncrypted),
      address: decrypt(user.addressEncrypted),
    };
    delete userData.phoneEncrypted;
    delete userData.addressEncrypted;

    return sendSuccess(res, { user: userData });
  } catch (error) {
    console.error('Get user error:', error);
    return sendError(res, 'Failed to fetch user.');
  }
});

// ---- POST /api/admin/users ----
// Create worker or officer accounts (Admin-only)
router.post('/users', requireFields('name', 'email', 'password', 'role'), async (req, res) => {
  try {
    const { name, email, password, phone, address, role, departmentId } = req.body;

    // Validate role — Admin can only create DEPT_WORKER or OFFICER accounts
    if (!['DEPT_WORKER', 'OFFICER'].includes(role)) {
      return sendError(res, 'Admin can only create DEPT_WORKER or OFFICER accounts.', 400, 'INVALID_ROLE');
    }

    // DEPT_WORKER must have a departmentId
    if (role === 'DEPT_WORKER' && !departmentId) {
      return sendError(res, 'Department ID is required for DEPT_WORKER accounts.', 400, 'VALIDATION_ERROR');
    }

    // Verify department exists if provided
    if (departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: parseInt(departmentId) } });
      if (!dept) {
        return sendError(res, 'Specified department does not exist.', 404, 'DEPARTMENT_NOT_FOUND');
      }
    }

    // Check for duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return sendError(res, 'An account with this email already exists.', 409, 'DUPLICATE_EMAIL');
    }

    // Hash password and encrypt sensitive fields
    const passwordHash = await bcrypt.hash(password, 10);
    const phoneEncrypted = phone ? encrypt(phone) : null;
    const addressEncrypted = address ? encrypt(address) : null;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phoneEncrypted,
        addressEncrypted,
        role,
        departmentId: departmentId ? parseInt(departmentId) : null,
        emailVerified: true, // Admin-created accounts are pre-verified
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    return sendSuccess(res, { user }, 201, 'User account created successfully');
  } catch (error) {
    console.error('Create user error:', error);
    return sendError(res, 'Failed to create user account.');
  }
});

// ---- PUT /api/admin/users/:id ----
// Update user details (name, department mapping, active status)
router.put('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, departmentId, isActive, phone, address } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'User not found.', 404, 'NOT_FOUND');
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (departmentId !== undefined) {
      if (departmentId !== null) {
        const dept = await prisma.department.findUnique({ where: { id: parseInt(departmentId) } });
        if (!dept) {
          return sendError(res, 'Specified department does not exist.', 404, 'DEPARTMENT_NOT_FOUND');
        }
      }
      updateData.departmentId = departmentId ? parseInt(departmentId) : null;
    }
    if (phone !== undefined) updateData.phoneEncrypted = phone ? encrypt(phone) : null;
    if (address !== undefined) updateData.addressEncrypted = address ? encrypt(address) : null;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return sendSuccess(res, { user }, 200, 'User updated successfully');
  } catch (error) {
    console.error('Update user error:', error);
    return sendError(res, 'Failed to update user.');
  }
});

// ---- DELETE /api/admin/users/:id ----
// Soft-delete (deactivate) a user account
router.delete('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'User not found.', 404, 'NOT_FOUND');
    }

    // Prevent self-deactivation
    if (id === req.user.userId) {
      return sendError(res, 'Cannot deactivate your own account.', 400, 'SELF_DEACTIVATION');
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return sendSuccess(res, null, 200, 'User account deactivated successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    return sendError(res, 'Failed to deactivate user.');
  }
});

module.exports = router;
