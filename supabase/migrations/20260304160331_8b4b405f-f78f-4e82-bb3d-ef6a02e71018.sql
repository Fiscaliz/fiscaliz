
-- Delete 10 duplicate fiscal documents from February 2026
-- Keeping the best version for each group (sent > archived > draft, lowest number)
DELETE FROM fiscal_documents WHERE id IN (
  -- PANIFICADORA COLUTE: 2 extra VF drafts (keeping archived c556f6f3)
  '50ad67b3-a0e6-4a44-952e-d5a37f6a2fab',
  '7ff184e6-8404-4d8c-9f04-b549334378e8',
  -- PANIFICADORA COLUTE: 1 extra ADV draft (keeping ADV-000001)
  'a52fedda-5db9-4cc3-bdb0-492b6a7e5af8',
  -- SUPER QUALITY: 1 extra VF draft (keeping VF-000021)
  '82ea15db-88dd-4ee4-85e0-e989b9e1f834',
  -- SENDAS RT: 1 extra draft (keeping 3323c740)
  '1820d4b9-dd9c-4bbd-bfd3-3fddc45780e3',
  -- VF 622297e7: 2 extra drafts (keeping VF-000026)
  '489b332c-df5b-4a00-86fa-58d802ac6601',
  'f9309ed3-7176-402a-9814-54d274ebea04',
  -- TI CANTINHO FRIO: 1 extra sent (keeping TI-000005)
  '4449f147-2950-4959-9fa4-306618b0825a',
  -- TI 9be8e9da: 1 draft (keeping sent TI-000010)
  'f24bbb5a-62d1-47ad-b142-023fd942079f',
  -- TI b1009bc9: 1 draft (keeping sent TI-000008)
  '5f06bc88-301e-40bb-a72c-faa8c5fc4f91'
);
