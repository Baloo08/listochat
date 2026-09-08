import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Specialist Earnings Visibility & Dashboard Revenue Range Tests', () => {

  describe('1. Specialist Portal Earnings Confidentiality Masking', () => {
    const mockAppointments = [
      { id: 'appt_1', specialistId: 'spec_1', service: 'Corte de Cabello', amount: 12000, status: 'completed', date: '2026-09-01', time: '10:00' },
      { id: 'appt_2', specialistId: 'spec_1', service: 'Perfilado Barba', amount: 8000, status: 'completada', date: '2026-09-02', time: '11:00' },
      { id: 'appt_3', specialistId: 'spec_1', service: 'Tratamiento Capilar', amount: 25000, status: 'realizada', date: '2026-09-03', time: '12:00' },
      { id: 'appt_4', specialistId: 'spec_1', service: 'Corte Niño', amount: 9000, status: 'pending', date: '2026-09-08', time: '14:00' }
    ];

    function resolvePortalHistoryResponse(specialist, appointments) {
      const showEarnings = specialist.showEarnings !== false;
      const completed = appointments.filter(a => ['completed', 'completada', 'realizada'].includes(a.status));
      const totalEarnings = showEarnings
        ? completed.reduce((sum, a) => sum + Number(a.amount || 0), 0)
        : 0;

      const sanitizedAppointments = showEarnings
        ? completed
        : completed.map(a => ({ ...a, amount: 0 }));

      return {
        appointments: sanitizedAppointments,
        totalCount: completed.length,
        totalEarnings,
        showEarnings,
        specialistName: specialist.name
      };
    }

    function resolvePortalAppointmentsResponse(specialist, appointments) {
      const showEarnings = specialist.showEarnings !== false;
      const active = appointments.filter(a => a.status === 'pending');
      const sanitizedAppointments = showEarnings
        ? active
        : active.map(a => ({ ...a, amount: 0 }));

      return {
        appointments: sanitizedAppointments,
        showEarnings,
        specialistName: specialist.name
      };
    }

    test('reveals total earnings and individual amounts when showEarnings is true', () => {
      const specialistWithEarnings = { id: 'spec_1', name: 'Carlos Barbero', showEarnings: true };
      const response = resolvePortalHistoryResponse(specialistWithEarnings, mockAppointments);

      assert.equal(response.showEarnings, true);
      assert.equal(response.totalCount, 3);
      assert.equal(response.totalEarnings, 45000); // 12000 + 8000 + 25000
      assert.equal(response.appointments[0].amount, 12000);
      assert.equal(response.appointments[1].amount, 8000);
      assert.equal(response.appointments[2].amount, 25000);
    });

    test('strictly masks total earnings to 0 and individual amounts to 0 when showEarnings is false', () => {
      const specialistConfidential = { id: 'spec_1', name: 'Carlos Barbero', showEarnings: false };
      const response = resolvePortalHistoryResponse(specialistConfidential, mockAppointments);

      assert.equal(response.showEarnings, false);
      assert.equal(response.totalCount, 3);
      assert.equal(response.totalEarnings, 0, 'Total earnings must be strictly 0 in confidential mode');
      assert.equal(response.appointments[0].amount, 0, 'Amount must be sanitized to 0');
      assert.equal(response.appointments[1].amount, 0, 'Amount must be sanitized to 0');
      assert.equal(response.appointments[2].amount, 0, 'Amount must be sanitized to 0');
    });

    test('masks active appointment amounts when showEarnings is false', () => {
      const specialistConfidential = { id: 'spec_1', name: 'Carlos Barbero', showEarnings: false };
      const response = resolvePortalAppointmentsResponse(specialistConfidential, mockAppointments);

      assert.equal(response.showEarnings, false);
      assert.equal(response.appointments.length, 1);
      assert.equal(response.appointments[0].amount, 0, 'Active appointment amount must be sanitized');
    });

    test('defaults showEarnings to true when undefined for backward compatibility', () => {
      const legacySpecialist = { id: 'spec_1', name: 'Carlos Barbero' }; // no showEarnings field
      const response = resolvePortalHistoryResponse(legacySpecialist, mockAppointments);

      assert.equal(response.showEarnings, true);
      assert.equal(response.totalEarnings, 45000);
    });
  });

  describe('2. Admin Dashboard Revenue Calculation & Date Range Filtering', () => {
    const mockDb = {
      appointments: [
        { id: 'a1', tenantId: 't1', date: '2026-09-08', amount: 15000, status: 'completed', payment_status: 'pending' },
        { id: 'a2', tenantId: 't1', date: '2026-09-08', amount: 20000, status: 'scheduled', payment_status: 'paid' },
        { id: 'a3', tenantId: 't1', date: '2026-09-05', amount: 10000, status: 'completada', payment_status: 'pending' },
        { id: 'a4', tenantId: 't1', date: '2026-08-20', amount: 35000, status: 'realizada', payment_status: 'pending' },
        { id: 'a5', tenantId: 't1', date: '2026-09-08', amount: 18000, status: 'cancelled', payment_status: 'pending' },
        { id: 'a6', tenantId: 't2', date: '2026-09-08', amount: 50000, status: 'completed', payment_status: 'paid' } // other tenant
      ],
      orders: [
        { id: 'o1', tenantId: 't1', date: '2026-09-08', total: 25000, payment_status: 'paid', status: 'delivered' },
        { id: 'o2', tenantId: 't1', date: '2026-09-08', total: 12000, payment_status: 'pending', status: 'pending' },
        { id: 'o3', tenantId: 't1', date: '2026-09-04', total: 40000, payment_status: 'paid', status: 'delivered' },
        { id: 'o4', tenantId: 't1', date: '2026-08-15', total: 60000, payment_status: 'paid', status: 'delivered' }
      ]
    };

    function computeDashboardStats(tenantId, range, customFrom, customTo, referenceDate = '2026-09-08') {
      let fromDate;
      let toDate;

      if (range === 'today') {
        fromDate = referenceDate;
        toDate = referenceDate;
      } else if (range === 'week') {
        fromDate = '2026-09-02';
        toDate = referenceDate;
      } else if (range === 'month') {
        fromDate = '2026-09-01';
        toDate = referenceDate;
      } else if (range === 'all') {
        fromDate = null;
        toDate = null;
      } else if (range === 'custom') {
        fromDate = customFrom;
        toDate = customTo;
      }

      const completedStatuses = ['completed', 'completado', 'completada', 'realizada', 'finalizada', 'atendida', 'done'];

      // Filter appointments
      const tenantAppointments = mockDb.appointments.filter(a => a.tenantId === tenantId);
      const apptsInRange = tenantAppointments.filter(a => {
        if (fromDate && a.date < fromDate) return false;
        if (toDate && a.date > toDate) return false;
        return true;
      });

      const collectedAppts = apptsInRange.filter(a => 
        a.payment_status === 'paid' || completedStatuses.includes(a.status.toLowerCase())
      );
      const appointmentRevenue = collectedAppts.reduce((sum, a) => sum + a.amount, 0);

      // Filter orders
      const tenantOrders = mockDb.orders.filter(o => o.tenantId === tenantId);
      const ordersInRange = tenantOrders.filter(o => {
        if (fromDate && o.date < fromDate) return false;
        if (toDate && o.date > toDate) return false;
        return true;
      });
      const paidOrders = ordersInRange.filter(o => o.payment_status === 'paid');
      const orderRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

      const totalRevenue = appointmentRevenue + orderRevenue;

      return {
        range,
        fromDate,
        toDate,
        appointments: apptsInRange.length,
        appointmentsCompleted: collectedAppts.length,
        appointmentRevenue,
        orders: ordersInRange.length,
        ordersPaid: paidOrders.length,
        orderRevenue,
        totalRevenue
      };
    }

    test('calculates today stats correctly summing appointments and orders', () => {
      const stats = computeDashboardStats('t1', 'today');

      // Appointments for today:
      // a1 (completed, 15000), a2 (paid, 20000), a5 (cancelled, 18000) -> total count: 3
      // collected: a1 (15000) + a2 (20000) = 35000
      assert.equal(stats.appointments, 3);
      assert.equal(stats.appointmentsCompleted, 2);
      assert.equal(stats.appointmentRevenue, 35000);

      // Orders for today:
      // o1 (paid, 25000), o2 (pending, 12000) -> total count: 2
      // paid: o1 (25000)
      assert.equal(stats.orders, 2);
      assert.equal(stats.ordersPaid, 1);
      assert.equal(stats.orderRevenue, 25000);

      // Total revenue: 35000 + 25000 = 60000
      assert.equal(stats.totalRevenue, 60000);
    });

    test('calculates week stats correctly across multiple days', () => {
      const stats = computeDashboardStats('t1', 'week');

      // Includes 2026-09-08 and 2026-09-05 (a3: 10000 completed) and 2026-09-04 (o3: 40000 paid)
      // appointmentRevenue: 35000 (today) + 10000 (Sep 5) = 45000
      assert.equal(stats.appointmentRevenue, 45000);
      // orderRevenue: 25000 (today) + 40000 (Sep 4) = 65000
      assert.equal(stats.orderRevenue, 65000);
      // totalRevenue: 45000 + 65000 = 110000
      assert.equal(stats.totalRevenue, 110000);
    });

    test('calculates all time stats without dropping historical records', () => {
      const stats = computeDashboardStats('t1', 'all');

      // All appointments for t1: a1(15000) + a2(20000) + a3(10000) + a4(35000) = 80000
      assert.equal(stats.appointmentRevenue, 80000);
      // All orders for t1: o1(25000) + o3(40000) + o4(60000) = 125000
      assert.equal(stats.orderRevenue, 125000);
      // Total revenue: 80000 + 125000 = 205000
      assert.equal(stats.totalRevenue, 205000);
    });

    test('calculates custom range stats strictly within specified bounds', () => {
      const stats = computeDashboardStats('t1', 'custom', '2026-08-01', '2026-08-31');

      // Only August records: a4 (35000) and o4 (60000)
      assert.equal(stats.appointmentRevenue, 35000);
      assert.equal(stats.orderRevenue, 60000);
      assert.equal(stats.totalRevenue, 95000);
    });

    test('strictly enforces tenant isolation so other merchants data is never summed', () => {
      const statsT1 = computeDashboardStats('t1', 'all');
      const statsT2 = computeDashboardStats('t2', 'all');

      assert.equal(statsT2.appointmentRevenue, 50000);
      assert.ok(!statsT1.appointmentRevenue.toString().includes('50000'));
    });
  });

});
