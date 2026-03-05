import { db } from '../packages/lib-server/src/database';

async function checkDuplicates() {
  console.log('Checking for duplicate wechatUnionId...');
  const duplicateUnionIds = await db.user.groupBy({
    by: ['wechatUnionId'],
    where: {
      wechatUnionId: { not: null }
    },
    having: {
      wechatUnionId: {
        _count: {
          gt: 1
        }
      }
    },
    _count: true
  });

  if (duplicateUnionIds.length > 0) {
    console.log('Found duplicate wechatUnionId:', duplicateUnionIds);
    for (const dup of duplicateUnionIds) {
      const users = await db.user.findMany({
        where: { wechatUnionId: dup.wechatUnionId },
        include: { accounts: true }
      });
      console.log(`\nUsers with wechatUnionId ${dup.wechatUnionId}:`);
      users.forEach(u => {
        console.log(`  - User ${u.id}: ${u.email}, accounts: ${u.accounts.length}`);
      });
    }
  } else {
    console.log('✓ No duplicate wechatUnionId found');
  }

  console.log('\nChecking for duplicate (accountId, providerId)...');
  const duplicateAccounts = await db.account.groupBy({
    by: ['accountId', 'providerId'],
    having: {
      accountId: {
        _count: {
          gt: 1
        }
      }
    },
    _count: true
  });

  if (duplicateAccounts.length > 0) {
    console.log('Found duplicate (accountId, providerId):', duplicateAccounts);
    for (const dup of duplicateAccounts) {
      const accounts = await db.account.findMany({
        where: {
          accountId: dup.accountId,
          providerId: dup.providerId
        },
        include: { user: true }
      });
      console.log(`\nAccounts with (${dup.accountId}, ${dup.providerId}):`);
      accounts.forEach(a => {
        console.log(`  - Account ${a.id}: User ${a.userId} (${a.user.email})`);
      });
    }
  } else {
    console.log('✓ No duplicate (accountId, providerId) found');
  }

  await db.$disconnect();
}

checkDuplicates().catch(console.error);
