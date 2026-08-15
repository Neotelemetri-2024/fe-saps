export interface Account {
  role: string;
  email: string;
  password: string;
  expectedPathPrefix: string;
}

// Seeded accounts from be-saps/prisma/seed-*.ts. Password is 'password123' for all.
export const ACCOUNTS: Account[] = [
  {
    role: 'mahasiswa',
    email: 'budi.mahasiswa@unand.ac.id',
    password: 'password123',
    expectedPathPrefix: '/mahasiswa/dashboard',
  },
  {
    role: 'dosen',
    email: 'ahmad.rivai@unand.ac.id',
    password: 'password123',
    expectedPathPrefix: '/dosen/dashboard',
  },
  {
    role: 'pimpinan_ditmawa',
    email: 'pimpinan.ditmawa@unand.ac.id',
    password: 'password123',
    expectedPathPrefix: '/pimpinan_ditmawa/dashboard',
  },
  {
    role: 'admin_ditmawa',
    email: 'admin.ditmawa@unand.ac.id',
    password: 'password123',
    expectedPathPrefix: '/admin_ditmawa/dashboard',
  },
  {
    role: 'admin_fakultas',
    email: 'admin.fti@unand.ac.id',
    password: 'password123',
    expectedPathPrefix: '/admin_fakultas/dashboard',
  },
  {
    role: 'pimpinan_fakultas',
    email: 'pimpinan.fti@unand.ac.id',
    password: 'password123',
    expectedPathPrefix: '/pimpinan_fakultas/dashboard',
  },
  {
    role: 'operator_ukm',
    email: 'operator.debat@unand.ac.id',
    password: 'password123',
    expectedPathPrefix: '/operator_ukm/dashboard',
  },
  {
    role: 'operator_ukmf',
    email: 'operator.ukmf@unand.ac.id',
    password: 'password123',
    expectedPathPrefix: '/operator_ukmf/dashboard',
  },
  {
    role: 'pimpinan_utama',
    email: 'pimpinan.utama@unand.ac.id',
    password: 'password123',
    expectedPathPrefix: '/pimpinan_utama/dashboard',
  },
];

export const ACCOUNTS_BY_ROLE = Object.fromEntries(
  ACCOUNTS.map((a) => [a.role, a])
) as Record<string, Account>;
