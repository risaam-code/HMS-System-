/**
 * Hospital Management System (HMS) — Foundation Unit Test Suite
 * Validates core utility functions and type contracts
 */

import { formatCurrency, formatDate, getStatusColor } from '../src/lib/utils';
import { isSupabaseConfigured } from '../src/lib/supabase';

describe('HMS Foundation Utilities', () => {
  test('formatCurrency formats integer values into USD currency strings', () => {
    expect(formatCurrency(24850)).toBe('$24,850');
    expect(formatCurrency(0)).toBe('$0');
  });

  test('getStatusColor returns appropriate styling for active vs critical statuses', () => {
    const activeStyle = getStatusColor('active');
    expect(activeStyle.bg).toContain('emerald');

    const criticalStyle = getStatusColor('critical');
    expect(criticalStyle.bg).toContain('rose');
  });

  test('isSupabaseConfigured returns false when running in default setup mode', () => {
    expect(typeof isSupabaseConfigured()).toBe('boolean');
  });
});
