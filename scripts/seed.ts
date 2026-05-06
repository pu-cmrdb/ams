import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { nanoid } from 'nanoid';

import { relations } from '@/server/database/relations';
import { schema } from '@/server/database';
import {
  AssetStatus,
  BorrowRule,
  OwnershipType,
} from '@/lib/enums';

const MOCK_USER_ID = 'seed-user-' + nanoid(8);

async function seed() {
  console.log('🌱 開始建立假資料...');

  const client = new Database('./data/db.sqlite');
  const db = drizzle({ client, relations });

  // 執行遷移
  console.log('📦 執行資料庫遷移...');
  migrate(db, { migrationsFolder: './drizzle' });

  try {
    // 1. 建立資產類別
    console.log('📂 建立資產類別...');
    const categories_data = [
      { id: nanoid(), name: '電子設備', createdAt: new Date(), updatedAt: new Date() },
      { id: nanoid(), name: '傢具', createdAt: new Date(), updatedAt: new Date() },
      { id: nanoid(), name: '運動器材', createdAt: new Date(), updatedAt: new Date() },
      { id: nanoid(), name: '圖書', createdAt: new Date(), updatedAt: new Date() },
    ];

    const categoryIds: Record<string, string> = {};
    for (const category of categories_data) {
      categoryIds[category.name] = category.id;
      try {
        db.insert(schema.categories).values(category).run();
      } catch (e) {
        console.log(`  └─ ${category.name} (已存在)`);
        continue;
      }
      console.log(`  ✓ ${category.name}`);
    }

    // 2. 建立資產
    console.log('📦 建立資產...');
    const assets_data = [
      {
        id: nanoid(),
        name: '投影機',
        description: '用於會議和展示的高亮度投影機',
        location: '主顧 301',
        custodian: 'CMRDB',
        ownershipType: OwnershipType.Cmrdb,
        borrowRule: BorrowRule.Restricted,
        categoryId: categoryIds['電子設備'],
        createdById: MOCK_USER_ID,
        updatedById: MOCK_USER_ID,
        purchaseDate: new Date('2024-01-15'),
        schoolAssetNumber: null,
        imageHash: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: nanoid(),
        name: '會議桌',
        description: '可容納 10 人的大型會議桌',
        location: '主顧 304',
        custodian: 'CMRDB',
        ownershipType: OwnershipType.Cmrdb,
        borrowRule: BorrowRule.None,
        categoryId: categoryIds['傢具'],
        createdById: MOCK_USER_ID,
        updatedById: MOCK_USER_ID,
        purchaseDate: new Date('2023-06-20'),
        schoolAssetNumber: null,
        imageHash: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: nanoid(),
        name: '瑜伽墊組',
        description: '高級防滑瑜伽墊 5 張',
        location: '活動室',
        custodian: 'CMRDB',
        ownershipType: OwnershipType.Cmrdb,
        borrowRule: BorrowRule.Public,
        categoryId: categoryIds['運動器材'],
        createdById: MOCK_USER_ID,
        updatedById: MOCK_USER_ID,
        purchaseDate: new Date('2025-02-10'),
        schoolAssetNumber: null,
        imageHash: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: nanoid(),
        name: '鋼琴',
        description: '88 鍵電子鋼琴',
        location: '音樂室',
        custodian: '學校',
        ownershipType: OwnershipType.School,
        borrowRule: BorrowRule.None,
        categoryId: categoryIds['電子設備'],
        createdById: MOCK_USER_ID,
        updatedById: MOCK_USER_ID,
        purchaseDate: new Date('2022-09-01'),
        schoolAssetNumber: 'SCHOOL-2022-001',
        imageHash: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const assetIds: string[] = [];
    for (const asset of assets_data) {
      try {
        db.insert(schema.assets).values(asset).run();
        assetIds.push(asset.id);
        console.log(`  ✓ ${asset.name}`);
      } catch (e) {
        console.log(`  └─ ${asset.name} (已存在)`);
      }
    }

    // 3. 建立資產記錄
    console.log('📊 建立資產記錄...');
    const assetRecords_data = [
      { assetId: assetIds[0], status: AssetStatus.Normal, quantity: 1 },
      { assetId: assetIds[0], status: AssetStatus.Repairing, quantity: 0 },
      { assetId: assetIds[1], status: AssetStatus.Normal, quantity: 1 },
      { assetId: assetIds[2], status: AssetStatus.Normal, quantity: 5 },
      { assetId: assetIds[3], status: AssetStatus.Normal, quantity: 1 },
    ];

    for (const record of assetRecords_data) {
      try {
        db.insert(schema.assetRecords).values(record).run();
        console.log(`  ✓ ${record.assetId.substring(0, 8)}... (${record.status})`);
      } catch (e) {
        console.log(`  └─ ${record.assetId.substring(0, 8)}... (已存在)`);
      }
    }

    // 4. 建立盤點計畫
    console.log('📋 建立盤點計畫...');
    const now = new Date();
    const inProgressPlanId = nanoid();
    const completedPlanId = nanoid();

    const plans = [
      {
        id: inProgressPlanId,
        name: '2026年6月財產盤點',
        description: '對所有 CMRDB 社團資產進行全面盤點，確認數量和狀況',
        createdById: MOCK_USER_ID,
        startAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 天前開始
        dueAt: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000), // 20 天後截止
        completedAt: null,
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: completedPlanId,
        name: '2026年3月財產盤點',
        description: '上季度的例行財產盤點已完成',
        createdById: MOCK_USER_ID,
        startAt: new Date('2026-03-01'),
        dueAt: new Date('2026-03-31'),
        completedAt: new Date('2026-03-28'),
        status: 'completed' as const,
        createdAt: new Date('2026-03-01'),
        updatedAt: new Date('2026-03-28'),
      },
    ];

    for (const plan of plans) {
      try {
        db.insert(schema.inventoryPlans).values(plan).run();
        console.log(`  ✓ ${plan.name}`);
      } catch (e) {
        console.log(`  └─ ${plan.name} (已存在)`);
      }
    }

    // 5. 建立盤點計畫指派者
    console.log('👥 建立盤點計畫指派者...');
    const assignees = [
      { planId: inProgressPlanId, userId: MOCK_USER_ID },
      { planId: inProgressPlanId, userId: 'user-' + nanoid(8) },
      { planId: completedPlanId, userId: MOCK_USER_ID },
    ];

    for (const assignee of assignees) {
      try {
        db.insert(schema.inventoryPlanAssignees).values(assignee).run();
        console.log(`  ✓ 計畫 ${assignee.planId.substring(0, 8)}... 指派給 ${assignee.userId.substring(0, 12)}...`);
      } catch (e) {
        console.log(`  └─ 已存在`);
      }
    }

    // 6. 建立盤點計畫資產
    console.log('🎯 建立盤點計畫資產...');
    const planAssets = [
      { planId: inProgressPlanId, assetId: assetIds[0] },
      { planId: inProgressPlanId, assetId: assetIds[1] },
      { planId: inProgressPlanId, assetId: assetIds[2] },
      { planId: completedPlanId, assetId: assetIds[0] },
      { planId: completedPlanId, assetId: assetIds[1] },
      { planId: completedPlanId, assetId: assetIds[3] },
    ];

    for (const pa of planAssets) {
      try {
        db.insert(schema.inventoryPlanAssets).values(pa).run();
        console.log(`  ✓ 計畫 ${pa.planId.substring(0, 8)}... 包含資產 ${pa.assetId.substring(0, 8)}...`);
      } catch (e) {
        console.log(`  └─ 已存在`);
      }
    }

    console.log('\n✅ 假資料建立完成！');
    console.log(`\n📊 統計：`);
    console.log(`  • 資產類別: ${categories_data.length}`);
    console.log(`  • 資產: ${assetIds.length}`);
    console.log(`  • 盤點計畫: ${plans.length}`);
    console.log(`    - 進行中: 1 個`);
    console.log(`    - 已完成: 1 個`);
    console.log(`\n💡 測試用戶 ID: ${MOCK_USER_ID}`);
  } catch (error) {
    console.error('❌ 建立假資料時出現錯誤:', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

seed();
