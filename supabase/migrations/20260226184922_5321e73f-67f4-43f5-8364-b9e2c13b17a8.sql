-- Fix existing attachments: convert signed/public URLs to raw storage paths
UPDATE fiscal_documents
SET attachments = (
  SELECT jsonb_agg(
    jsonb_set(
      elem,
      '{url}',
      to_jsonb(
        CASE
          -- Extract path from signed URLs
          WHEN elem->>'url' LIKE '%/storage/v1/object/sign/fiscal-photos/%' THEN
            split_part(
              substring(elem->>'url' from '/storage/v1/object/sign/fiscal-photos/(.*)'),
              '?', 1
            )
          -- Extract path from public URLs
          WHEN elem->>'url' LIKE '%/storage/v1/object/public/fiscal-photos/%' THEN
            split_part(
              substring(elem->>'url' from '/storage/v1/object/public/fiscal-photos/(.*)'),
              '?', 1
            )
          ELSE elem->>'url'
        END
      )
    )
  )
  FROM jsonb_array_elements(attachments::jsonb) AS elem
)
WHERE attachments IS NOT NULL
  AND attachments::text LIKE '%/storage/v1/object/%'